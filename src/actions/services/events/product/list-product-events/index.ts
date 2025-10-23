/**
 * List Product Events Action
 * 
 * Returns product event definitions from EventRegistryManager
 * Supports filtering by category
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IProductEventDefinition } from '../../shared/types';

interface ListProductEventsParams {
    LOG_LEVEL?: string;
    category?: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: ListProductEventsParams) {
    const logger = aioLogger('list-product-events', { level: params.LOG_LEVEL || 'info' });
    logger.info('List product events action invoked');

    try {
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        await registryManager.seedIfNeeded();
        
        let events: IProductEventDefinition[];
        
        if (params.category) {
            events = await registryManager.getProductEventsByCategory(params.category);
        } else {
            events = await registryManager.getAllProductEventDefinitions();
        }
        
        const eventsMap: Record<string, IProductEventDefinition> = {};
        events.forEach(event => {
            eventsMap[event.code] = event;
        });
        
        const categories = [...new Set(events.map(e => e.category))];
        const eventCounts: Record<string, number> = {};
        events.forEach(event => {
            eventCounts[event.category] = (eventCounts[event.category] || 0) + 1;
        });
        
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
        logger.error('Error listing product events:', error as any);
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
