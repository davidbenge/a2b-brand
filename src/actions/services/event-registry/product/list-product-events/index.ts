/**
 * List Product Events Action
 * 
 * Returns product event definitions from ProductEventRegistry
 * Supports filtering by category
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import * as ProductEventRegistry from '../../../../classes/ProductEventRegistry';
import { IProductEventDefinition } from '../../../../../shared/types';
import { EventCategory } from '../../../../../shared/constants';

interface ListProductEventsParams {
    LOG_LEVEL?: string;
    category?: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: ListProductEventsParams) {
    const logger = aioLogger('list-product-events', { level: params.LOG_LEVEL || 'info' });
    logger.info('List product events action invoked');

    try {
        let events: IProductEventDefinition[];
        
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
            
            events = ProductEventRegistry.getProductEventsByCategory(params.category as EventCategory);
        } else {
            logger.info('Retrieving all product events');
            events = Object.values(ProductEventRegistry.DEFAULT_PRODUCT_EVENTS);
        }
        
        // Convert array to map
        const eventsMap: Record<string, IProductEventDefinition> = {};
        events.forEach((event: IProductEventDefinition) => {
            eventsMap[event.code] = event;
        });
        
        // Calculate summary
        const categories = [...new Set(events.map((e: IProductEventDefinition) => e.category))];
        const eventCounts: Record<string, number> = {};
        events.forEach((event: IProductEventDefinition) => {
            eventCounts[event.category] = (eventCounts[event.category] || 0) + 1;
        });
        
        logger.info(`Returning ${events.length} product events`);
        
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
        logger.error('Error listing product events:', error instanceof Error ? error.message : String(error));
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
