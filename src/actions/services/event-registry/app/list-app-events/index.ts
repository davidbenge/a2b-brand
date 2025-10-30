/**
 * List App Events Action
 * 
 * Returns global app event definitions from AppEventRegistry
 * Supports filtering by category
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import * as AppEventRegistry from '../../../../classes/AppEventRegistry';
import { IAppEventDefinition } from '../../../../../shared/types';
import { EventCategory } from '../../../../../shared/constants';

interface ListAppEventsParams {
    LOG_LEVEL?: string;
    category?: string;
    __ow_headers?: Record<string, string>;
}

interface ListAppEventsResponse {
    statusCode: number;
    body: {
        success: boolean;
        data?: {
            events: Record<string, IAppEventDefinition>;
            summary: {
                totalEvents: number;
                categories: string[];
                eventCounts: Record<string, number>;
            };
            timestamp: string;
        };
        error?: string;
        details?: any;
    };
}

/**
 * Main function - Lists global app event definitions
 * @param params Action parameters
 * @returns Response with event definitions
 */
async function main(params: ListAppEventsParams): Promise<ListAppEventsResponse> {
    const logger = aioLogger('list-app-events', { level: params.LOG_LEVEL || 'info' });
    logger.info('List app events action invoked');

    try {
        // Get events (filtered or all)
        let events: IAppEventDefinition[];
        
        if (params.category) {
            logger.info(`Filtering events by category: ${params.category}`);
            
            // Validate category
            const validCategories = Object.values(EventCategory);
            if (!validCategories.includes(params.category as EventCategory)) {
                return {
                    statusCode: 400,
                    body: {
                        success: false,
                        error: `Invalid category: ${params.category}`,
                        details: {
                            providedCategory: params.category,
                            validCategories: validCategories
                        }
                    }
                };
            }
            
            events = AppEventRegistry.getEventsByCategory(params.category as EventCategory);
        } else {
            logger.info('Retrieving all app events');
            events = Object.values(AppEventRegistry.DEFAULT_APP_EVENTS);
        }
        
        // Convert array to object keyed by event code
        const eventsMap: Record<string, IAppEventDefinition> = {};
        events.forEach((event: IAppEventDefinition) => {
            eventsMap[event.code] = event;
        });
        
        // Calculate summary
        const categories = [...new Set(events.map((e: IAppEventDefinition) => e.category))];
        const eventCounts: Record<string, number> = {};
        events.forEach((event: IAppEventDefinition) => {
            eventCounts[event.category] = (eventCounts[event.category] || 0) + 1;
        });
        
        logger.info(`Returning ${events.length} app events`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    events: eventsMap,
                    summary: {
                        totalEvents: events.length,
                        categories: categories,
                        eventCounts: eventCounts
                    },
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error listing app events:', error instanceof Error ? error.message : String(error));
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
