/**
 * Create Agency App Event Action
 * 
 * Creates a new agency-specific app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface CreateAgencyAppEventParams extends Partial<IAppEventDefinition> {
    LOG_LEVEL?: string;
    agencyId: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: CreateAgencyAppEventParams) {
    const logger = aioLogger('create-agency-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Create agency app event action invoked');

    try {
        if (!params.agencyId) {
            return {
                statusCode: 400,
                body: { success: false, error: 'Missing required parameter: agencyId' }
            };
        }
        
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
                    details: { missingFields, requiredFields }
                }
            };
        }
        
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
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        const existing = await registryManager.getAgencyAppEventDefinition(params.agencyId, eventDefinition.code);
        if (existing) {
            return {
                statusCode: 409,
                body: {
                    success: false,
                    error: `Agency event already exists: ${eventDefinition.code}`,
                    details: { agencyId: params.agencyId, eventCode: eventDefinition.code, existingEvent: existing }
                }
            };
        }
        
        await registryManager.saveAgencyAppEventDefinition(params.agencyId, eventDefinition);
        
        logger.info(`Created agency app event: ${eventDefinition.code} for agency: ${params.agencyId}`);
        
        return {
            statusCode: 201,
            body: {
                success: true,
                data: {
                    agencyId: params.agencyId,
                    event: eventDefinition,
                    message: `Agency event created successfully: ${eventDefinition.code}`,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error creating agency app event:', error as any);
        return {
            statusCode: 500,
            body: {
                success: false,
                error: 'Internal server error',
                details: { message: error instanceof Error ? error.message : 'Unknown error' }
            }
        };
    }
}

exports.main = main;

