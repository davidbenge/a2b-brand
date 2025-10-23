/**
 * Update Product Event Action
 * 
 * Updates an existing product event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IProductEventDefinition } from '../../shared/types';

interface UpdateProductEventParams extends Partial<IProductEventDefinition> {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: UpdateProductEventParams) {
    const logger = aioLogger('update-product-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Update product event action invoked');

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
        
        const { LOG_LEVEL, eventCode, __ow_headers, ...updates } = params;
        
        if (updates.code && updates.code !== params.eventCode) {
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'Event code cannot be changed',
                    details: { originalCode: params.eventCode, attemptedCode: updates.code }
                }
            };
        }
        
        const updatedEvent = await registryManager.updateProductEventDefinition(params.eventCode, updates);
        
        logger.info(`Updated product event: ${params.eventCode}`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    event: updatedEvent,
                    message: `Event updated successfully: ${params.eventCode}`,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error updating product event:', error as any);
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

