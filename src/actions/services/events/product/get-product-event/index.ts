/**
 * Get Product Event Action
 * 
 * Returns a specific product event definition by event code
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IProductEventDefinition } from '../../shared/types';

interface GetProductEventParams {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: GetProductEventParams) {
    const logger = aioLogger('get-product-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Get product event action invoked');

    try {
        if (!params.eventCode) {
            return {
                statusCode: 400,
                body: { success: false, error: 'Missing required parameter: eventCode' }
            };
        }
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        await registryManager.seedIfNeeded();
        
        const event = await registryManager.getProductEventDefinition(params.eventCode);
        
        if (!event) {
            const allEvents = await registryManager.getAllProductEventDefinitions();
            const availableCodes = allEvents.map(e => e.code);
            
            return {
                statusCode: 404,
                body: {
                    success: false,
                    error: `Event not found: ${params.eventCode}`,
                    details: { requestedEventCode: params.eventCode, availableEventCodes: availableCodes }
                }
            };
        }
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: { event: event, timestamp: new Date().toISOString() }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error getting product event:', error as any);
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

