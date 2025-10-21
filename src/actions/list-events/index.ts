/**
 * list-events action
 * 
 * This action lists all supported A2B events with their metadata.
 * It provides an API endpoint for discovering available events.
 * 
 * Query parameters:
 * - category: Filter by event category (brand-registration, asset-sync, workfront)
 * - eventCode: Get details for a specific event code
 */

import { 
    getAllEventCodes, 
    getEventsByCategory, 
    getEventDefinition, 
    getEventCategories, 
    EVENT_REGISTRY,
    getEventCountByCategory,
    isValidEventCode
} from '../../shared/classes/AppEventRegistry';
import { AppEventDefinition } from '../../shared/types';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import aioLogger from '@adobe/aio-lib-core-logging';

interface ListEventsParams {
    category?: AppEventDefinition['category'];
    eventCode?: string;
    LOG_LEVEL?: string;
}

interface SuccessResponse {
    statusCode: number;
    body: {
        success: true;
        data: any;
    };
}

interface ErrorResponse {
    statusCode: number;
    body: {
        success: false;
        error: string;
        details?: any;
    };
}

type ActionResponse = SuccessResponse | ErrorResponse;

/**
 * Main action handler
 */
async function main(params: ListEventsParams): Promise<ActionResponse> {
    const logger = aioLogger('list-events', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('List events action called', { 
            category: params.category, 
            eventCode: params.eventCode 
        });

        const { category, eventCode } = params;

        // Handle specific event lookup
        if (eventCode) {
            logger.debug(`Looking up event: ${eventCode}`);
            
            if (!isValidEventCode(eventCode)) {
                logger.warn(`Event code not found: ${eventCode}`);
                return {
                    statusCode: HTTP_STATUS.NOT_FOUND,
                    body: {
                        success: false,
                        error: `Event code '${eventCode}' not found in registry`,
                        details: {
                            availableEventCodes: getAllEventCodes()
                        }
                    }
                };
            }

            const event = getEventDefinition(eventCode);
            return {
                statusCode: HTTP_STATUS.OK,
                body: {
                    success: true,
                    data: {
                        event,
                        timestamp: new Date().toISOString()
                    }
                }
            };
        }

        // Handle category filter
        if (category) {
            logger.debug(`Filtering by category: ${category}`);
            
            const validCategories = getEventCategories();
            if (!validCategories.includes(category)) {
                logger.warn(`Invalid category: ${category}`);
                return {
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                    body: {
                        success: false,
                        error: `Invalid category '${category}'`,
                        details: {
                            validCategories
                        }
                    }
                };
            }

            const events = getEventsByCategory(category);
            return {
                statusCode: HTTP_STATUS.OK,
                body: {
                    success: true,
                    data: {
                        category,
                        count: events.length,
                        events,
                        timestamp: new Date().toISOString()
                    }
                }
            };
        }

        // Return all events with summary
        logger.debug('Returning all events');
        const categories = getEventCategories();
        const eventCounts = getEventCountByCategory();
        
        return {
            statusCode: HTTP_STATUS.OK,
            body: {
                success: true,
                data: {
                    summary: {
                        totalEvents: getAllEventCodes().length,
                        categories,
                        eventCounts
                    },
                    events: EVENT_REGISTRY,
                    timestamp: new Date().toISOString()
                }
            }
        };

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Error in list-events action', { 
            error: err.message, 
            stack: err.stack 
        });
        
        return {
            statusCode: HTTP_STATUS.INTERNAL_ERROR,
            body: {
                success: false,
                error: ERROR_MESSAGES.PROCESSING_ERROR,
                details: {
                    message: err.message
                }
            }
        };
    }
}

exports.main = main;

