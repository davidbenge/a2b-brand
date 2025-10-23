/**
 * Delete App Event Action
 * 
 * Deletes a global app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';

interface DeleteAppEventParams {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

interface DeleteAppEventResponse {
    statusCode: number;
    body: {
        success: boolean;
        data?: {
            message: string;
            eventCode: string;
            timestamp: string;
        };
        error?: string;
        details?: any;
    };
}

/**
 * Main function - Deletes a global app event definition
 * @param params Action parameters
 * @returns Response confirming deletion
 */
async function main(params: DeleteAppEventParams): Promise<DeleteAppEventResponse> {
    const logger = aioLogger('delete-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Delete app event action invoked');

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
        
        // Check if event exists
        const existing = await registryManager.getGlobalAppEventDefinition(params.eventCode);
        if (!existing) {
            return {
                statusCode: 404,
                body: {
                    success: false,
                    error: `Event not found: ${params.eventCode}`,
                    details: {
                        eventCode: params.eventCode
                    }
                }
            };
        }
        
        // Delete event definition
        await registryManager.deleteGlobalAppEventDefinition(params.eventCode);
        
        logger.info(`Deleted global app event: ${params.eventCode}`);
        
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
        logger.error('Error deleting app event:', error as any);
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

