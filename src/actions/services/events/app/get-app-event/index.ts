/**
 * Get App Event Action
 * 
 * Returns a specific global app event definition by event code
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface GetAppEventParams {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

interface GetAppEventResponse {
    statusCode: number;
    body: {
        success: boolean;
        data?: {
            event: IAppEventDefinition;
            timestamp: string;
        };
        error?: string;
        details?: any;
    };
}

/**
 * Main function - Gets a specific global app event definition
 * @param params Action parameters
 * @returns Response with event definition
 */
async function main(params: GetAppEventParams): Promise<GetAppEventResponse> {
    const logger = aioLogger('get-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Get app event action invoked');

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
        
        // Initialize EventRegistryManager
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        // Ensure registries are seeded
        await registryManager.seedIfNeeded();
        
        // Get event definition
        const event = await registryManager.getGlobalAppEventDefinition(params.eventCode);
        
        if (!event) {
            // Get all available event codes for error response
            const allEvents = await registryManager.getAllGlobalAppEventDefinitions();
            const availableCodes = allEvents.map(e => e.code);
            
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
        logger.error('Error getting app event:', error as any);
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

