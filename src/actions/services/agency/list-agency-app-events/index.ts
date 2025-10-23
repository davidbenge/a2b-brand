/**
 * List Agency App Events Action
 * 
 * Returns agency-specific app event definitions
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface ListAgencyAppEventsParams {
    LOG_LEVEL?: string;
    agencyId: string;
    category?: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: ListAgencyAppEventsParams) {
    const logger = aioLogger('list-agency-app-events', { level: params.LOG_LEVEL || 'info' });
    logger.info('List agency app events action invoked');

    try {
        if (!params.agencyId) {
            return {
                statusCode: 400,
                body: { success: false, error: 'Missing required parameter: agencyId' }
            };
        }
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        await registryManager.seedIfNeeded();
        
        let events = await registryManager.getAllAgencyAppEventDefinitions(params.agencyId);
        
        if (params.category) {
            events = events.filter(e => e.category === params.category);
        }
        
        const eventsMap: Record<string, IAppEventDefinition> = {};
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
                    agencyId: params.agencyId,
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
        logger.error('Error listing agency app events:', error as any);
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

