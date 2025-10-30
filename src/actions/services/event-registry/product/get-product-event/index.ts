/**
 * Get Product Event Action
 * 
 * Returns a specific product event definition by event code
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import * as ProductEventRegistry from '../../../../classes/ProductEventRegistry';
import { IProductEventDefinition } from '../../../../../shared/types';

interface GetProductEventParams {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: GetProductEventParams) {
    const logger = aioLogger('get-product-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Get product event action invoked');

    try {
        // Validate required parameters
        if (!params.eventCode) {
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'Missing required parameter: eventCode'
                }
            };
        }
        
        // Get event definition from registry
        const event = ProductEventRegistry.getProductEventDefinition(params.eventCode);
        
        if (!event) {
            // Get all available event codes for error response
            const availableCodes = ProductEventRegistry.getAllProductEventCodes();
            
            return {
                statusCode: 404,
                body: {
                    success: false,
                    error: `Event not found: ${params.eventCode}`,
                    details: {
                        requestedEventCode: params.eventCode,
                        availableEventCodes: availableCodes
                    }
                }
            };
        }
        
        logger.info(`Returning event: ${params.eventCode}`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    event: event,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error getting product event:', error instanceof Error ? error.message : String(error));
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
