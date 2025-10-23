/**
 * Delete Product Event Action
 * 
 * Deletes a product event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';

interface DeleteProductEventParams {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: DeleteProductEventParams) {
    const logger = aioLogger('delete-product-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Delete product event action invoked');

    try {
        if (!params.eventCode) {
            return {
                statusCode: 400,
                body: { success: false, error: 'Missing required parameter: eventCode' }
            };
        }
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        const existing = await registryManager.getProductEventDefinition(params.eventCode);
        if (!existing) {
            return {
                statusCode: 404,
                body: {
                    success: false,
                    error: `Event not found: ${params.eventCode}`,
                    details: { eventCode: params.eventCode }
                }
            };
        }
        
        await registryManager.deleteProductEventDefinition(params.eventCode);
        
        logger.info(`Deleted product event: ${params.eventCode}`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    message: `Event deleted successfully: ${params.eventCode}`,
                    eventCode: params.eventCode,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error deleting product event:', error as any);
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

