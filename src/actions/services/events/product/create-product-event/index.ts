/**
 * Create Product Event Action
 * 
 * Creates a new product event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IProductEventDefinition } from '../../shared/types';

interface CreateProductEventParams extends Partial<IProductEventDefinition> {
    LOG_LEVEL?: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: CreateProductEventParams) {
    const logger = aioLogger('create-product-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Create product event action invoked');

    try {
        const requiredFields: (keyof IProductEventDefinition)[] = [
            'code', 'category', 'name', 'description', 'version',
            'requiredFields', 'handlerActionName', 'callBlocking'
        ];
        
        const missingFields = requiredFields.filter(field => params[field] === undefined);
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
        
        const eventDefinition: IProductEventDefinition = {
            code: params.code!,
            category: params.category!,
            name: params.name!,
            description: params.description!,
            version: params.version!,
            eventBodyexample: params.eventBodyexample || {},
            routingRules: params.routingRules || [],
            requiredFields: params.requiredFields!,
            optionalFields: params.optionalFields,
            handlerActionName: params.handlerActionName!,
            callBlocking: params.callBlocking!
        };
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        const existing = await registryManager.getProductEventDefinition(eventDefinition.code);
        if (existing) {
            return {
                statusCode: 409,
                body: {
                    success: false,
                    error: `Event already exists: ${eventDefinition.code}`,
                    details: { eventCode: eventDefinition.code, existingEvent: existing }
                }
            };
        }
        
        await registryManager.saveProductEventDefinition(eventDefinition);
        
        logger.info(`Created product event: ${eventDefinition.code}`);
        
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
        logger.error('Error creating product event:', error as any);
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

