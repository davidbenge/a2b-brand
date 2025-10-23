/**
 * Create App Event Action
 * 
 * Creates a new global app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface CreateAppEventParams extends Partial<IAppEventDefinition> {
    LOG_LEVEL?: string;
    __ow_headers?: Record<string, string>;
}

interface CreateAppEventResponse {
    statusCode: number;
    body: {
        success: boolean;
        data?: {
            event: IAppEventDefinition;
            message: string;
            timestamp: string;
        };
        error?: string;
        details?: any;
    };
}

/**
 * Main function - Creates a new global app event definition
 * @param params Action parameters including event definition fields
 * @returns Response with created event
 */
async function main(params: CreateAppEventParams): Promise<CreateAppEventResponse> {
    const logger = aioLogger('create-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Create app event action invoked');

    try {
        // Validate required fields
        const requiredFields: (keyof IAppEventDefinition)[] = [
            'code', 'category', 'name', 'description', 'version',
            'sendSecretHeader', 'sendSignedKey', 'requiredFields', 'ioProviderIdEnvVariable'
        ];
        
        const missingFields = requiredFields.filter(field => !params[field]);
        if (missingFields.length > 0) {
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        missingFields: missingFields,
                        requiredFields: requiredFields
                    }
                }
            };
        }
        
        // Build event definition
        const eventDefinition: IAppEventDefinition = {
            code: params.code!,
            category: params.category!,
            name: params.name!,
            description: params.description!,
            version: params.version!,
            sendSecretHeader: params.sendSecretHeader!,
            sendSignedKey: params.sendSignedKey!,
            eventBodyexample: params.eventBodyexample || {},
            routingRules: params.routingRules || [],
            requiredFields: params.requiredFields!,
            optionalFields: params.optionalFields,
            injectedObjects: params.injectedObjects,
            ioProviderIdEnvVariable: params.ioProviderIdEnvVariable!
        };
        
        // Initialize EventRegistryManager
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        // Check if event already exists
        const existing = await registryManager.getGlobalAppEventDefinition(eventDefinition.code);
        if (existing) {
            return {
                statusCode: 409,
                body: {
                    success: false,
                    error: `Event already exists: ${eventDefinition.code}`,
                    details: {
                        eventCode: eventDefinition.code,
                        existingEvent: existing
                    }
                }
            };
        }
        
        // Save event definition
        await registryManager.saveGlobalAppEventDefinition(eventDefinition);
        
        logger.info(`Created global app event: ${eventDefinition.code}`);
        
        return {
            statusCode: 201,
            body: {
                success: true,
                data: {
                    event: eventDefinition,
                    message: `Event created successfully: ${eventDefinition.code}`,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error creating app event:', error as any);
        return {
            statusCode: 500,
            body: {
                success: false,
                error: 'Internal server error',
                details: {
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            }
        };
    }
}

exports.main = main;

