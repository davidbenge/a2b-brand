/**
 * Update App Event Action
 * 
 * Updates an existing global app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface UpdateAppEventParams extends Partial<IAppEventDefinition> {
    LOG_LEVEL?: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

interface UpdateAppEventResponse {
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
 * Main function - Updates a global app event definition
 * @param params Action parameters including eventCode and fields to update
 * @returns Response with updated event
 */
async function main(params: UpdateAppEventParams): Promise<UpdateAppEventResponse> {
    const logger = aioLogger('update-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Update app event action invoked');

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
        
        // Build updates object (exclude LOG_LEVEL, eventCode, and __ow_headers)
        const { LOG_LEVEL, eventCode, __ow_headers, ...updates } = params;
        
        // Ensure code cannot be changed
        if (updates.code && updates.code !== params.eventCode) {
            return {
                statusCode: 400,
                body: {
                    success: false,
                    error: 'Event code cannot be changed',
                    details: {
                        originalCode: params.eventCode,
                        attemptedCode: updates.code
                    }
                }
            };
        }
        
        // Update event definition
        const updatedEvent = await registryManager.updateGlobalAppEventDefinition(
            params.eventCode,
            updates
        );
        
        logger.info(`Updated global app event: ${params.eventCode}`);
        
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
        logger.error('Error updating app event:', error as any);
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

