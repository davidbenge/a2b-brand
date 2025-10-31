/**
 * Manage Workfront Event Subscriptions Action
 * 
 * Registers or unregisters Workfront event subscriptions for a Brand
 * Creates subscriptions for all events in WorkfrontEventRegistry
 * 
 * Authentication: Uses Adobe IMS S2S credentials which work for Workfront API
 * (S2S token is cached for 21 hours to reduce IMS calls)
 * 
 * Input params:
 * - agencyId: Brand ID to manage subscriptions for
 * - action: 'register' or 'unregister'
 * - workfrontServerUrl: Base URL of Workfront instance (required for register)
 * - eventHandlerUrl: Callback URL for Workfront events (required for register)
 * - S2S_CLIENT_ID: S2S client ID
 * - S2S_CLIENT_SECRET: S2S client secret
 * - S2S_SCOPES: S2S scopes (JSON array)
 * - ORG_ID: Organization ID
 * - APPLICATION_RUNTIME_INFO: Runtime info (JSON string)
 * - LOG_LEVEL: Logging level (optional)
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { WorkfrontClient } from '../WorkfrontClient';
import { AgencyManager } from '../../../classes/AgencyManager';
import { ApplicationRuntimeInfo } from '../../../classes/ApplicationRuntimeInfo';
import { DEFAULT_WORKFRONT_EVENTS } from '../../../classes/WorkfrontEventRegistry';

interface ActionParams {
    agencyId: string;
    action: 'register' | 'unregister';
    workfrontServerUrl?: string;
    eventHandlerUrl?: string;
    S2S_CLIENT_ID: string;
    S2S_CLIENT_SECRET: string;
    S2S_SCOPES: string;
    ORG_ID: string;
    APPLICATION_RUNTIME_INFO: string;
    LOG_LEVEL?: string;
}

/**
 * Main action handler
 */
export async function main(params: ActionParams): Promise<any> {
    const logger = aioLogger('manage-workfront-subscriptions', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('Managing Workfront subscriptions', { 
            agencyId: params.agencyId,
            action: params.action
        });

        // Validate required parameters
        const missing: string[] = [];
        if (!params.agencyId) missing.push('agencyId');
        if (!params.action) missing.push('action');
        if (!params.S2S_CLIENT_ID) missing.push('S2S_CLIENT_ID');
        if (!params.S2S_CLIENT_SECRET) missing.push('S2S_CLIENT_SECRET');
        if (!params.S2S_SCOPES) missing.push('S2S_SCOPES');
        if (!params.ORG_ID) missing.push('ORG_ID');
        if (!params.APPLICATION_RUNTIME_INFO) missing.push('APPLICATION_RUNTIME_INFO');

        if (params.action === 'register') {
            if (!params.workfrontServerUrl) missing.push('workfrontServerUrl');
            if (!params.eventHandlerUrl) missing.push('eventHandlerUrl');
        }

        if (missing.length > 0) {
            return {
                statusCode: 400,
                body: {
                    error: 'Missing required parameters',
                    missing
                }
            };
        }

        // Parse runtime info
        const runtimeInfo = new ApplicationRuntimeInfo(
            JSON.parse(params.APPLICATION_RUNTIME_INFO)
        );

        // Initialize Agency Manager
        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');

        // Get existing agency
        const agency = await agencyManager.getAgency(params.agencyId);
        if (!agency) {
            return {
                statusCode: 404,
                body: {
                    error: 'Agency not found',
                    agencyId: params.agencyId
                }
            };
        }

        // Prepare S2S credentials
        const scopesCleaned = JSON.parse(params.S2S_SCOPES);
        const scopes = scopesCleaned.join(',');
        
        const s2sCredentials = {
            clientId: params.S2S_CLIENT_ID,
            clientSecret: params.S2S_CLIENT_SECRET,
            scopes,
            orgId: params.ORG_ID
        };

        if (params.action === 'register') {
            // Register all Workfront event subscriptions
            const wfClient = new WorkfrontClient(
                params.workfrontServerUrl!,
                s2sCredentials,
                params.LOG_LEVEL || 'info'
            );

            const subscriptionIds: string[] = [];
            const results = [];

            // Register each event from the registry
            for (const eventDef of Object.values(DEFAULT_WORKFRONT_EVENTS)) {
                try {
                    logger.debug(`Registering subscription for ${eventDef.code}`);
                    
                    const subscription = await wfClient.createEventSubscription({
                        objCode: eventDef.workfrontObjCode,
                        eventType: eventDef.workfrontEventType,
                        url: params.eventHandlerUrl!
                    });

                    subscriptionIds.push(subscription.ID);
                    results.push({
                        eventCode: eventDef.code,
                        objCode: eventDef.workfrontObjCode,
                        eventType: eventDef.workfrontEventType,
                        subscriptionId: subscription.ID,
                        success: true
                    });

                    logger.info(`Registered subscription ${subscription.ID} for ${eventDef.code}`);
                } catch (error) {
                    const errorObj = error instanceof Error ? error : new Error(String(error));
                    logger.error(`Failed to register subscription for ${eventDef.code}`, errorObj);
                    results.push({
                        eventCode: eventDef.code,
                        objCode: eventDef.workfrontObjCode,
                        eventType: eventDef.workfrontEventType,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            // Update brand with subscription IDs
            (agency as any).workfrontEventSubscriptions = subscriptionIds;
            const updatedAgency = await agencyManager.saveAgency(agency);

            logger.info(`Registered ${subscriptionIds.length} Workfront subscriptions for brand`, {
                agencyId: params.agencyId,
                subscriptionCount: subscriptionIds.length
            });

            return {
                statusCode: 200,
                body: {
                    success: true,
                    action: 'register',
                    subscriptions: results,
                    totalRegistered: subscriptionIds.length,
                    agency: updatedAgency.toSafeJSON()
                }
            };

        } else if (params.action === 'unregister') {
            // Unregister all existing subscriptions
            const subscriptionIds = agency.workfrontEventSubscriptions || [];

            if (subscriptionIds.length === 0) {
                return {
                    statusCode: 200,
                    body: {
                        success: true,
                        action: 'unregister',
                        message: 'No subscriptions to unregister'
                    }
                };
            }

            // Use Workfront server URL from brand config
            if (!agency.workfrontServerUrl) {
                return {
                    statusCode: 400,
                    body: {
                        error: 'Brand does not have Workfront configured',
                        agencyId: params.agencyId
                    }
                };
            }

            const wfClient = new WorkfrontClient(
                agency.workfrontServerUrl,
                s2sCredentials,
                params.LOG_LEVEL || 'info'
            );

            const results = [];

            for (const subscriptionId of subscriptionIds) {
                try {
                    await wfClient.deleteEventSubscription(subscriptionId);
                    results.push({
                        subscriptionId,
                        success: true
                    });
                    logger.info(`Unregistered subscription ${subscriptionId}`);
                } catch (error) {
                    const errorObj = error instanceof Error ? error : new Error(String(error));
                    logger.error(`Failed to unregister subscription ${subscriptionId}`, errorObj);
                    results.push({
                        subscriptionId,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            // Clear subscription IDs from brand
            (agency as any).workfrontEventSubscriptions = [];
            const updatedAgency = await agencyManager.saveAgency(agency);

            logger.info(`Unregistered Workfront subscriptions for brand`, {
                agencyId: params.agencyId,
                subscriptionCount: subscriptionIds.length
            });

            return {
                statusCode: 200,
                body: {
                    success: true,
                    action: 'unregister',
                    subscriptions: results,
                    totalUnregistered: subscriptionIds.length,
                    agency: updatedAgency.toSafeJSON()
                }
            };
        } else {
            return {
                statusCode: 400,
                body: {
                    error: 'Invalid action',
                    message: 'Action must be either "register" or "unregister"'
                }
            };
        }

    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Error managing Workfront subscriptions', errorObj);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            statusCode: 500,
            body: {
                error: 'Failed to manage Workfront subscriptions',
                message: errorMessage
            }
        };
    }
}

