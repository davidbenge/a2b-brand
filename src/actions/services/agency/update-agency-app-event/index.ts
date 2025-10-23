/**
 * Update Agency App Event Action
 * 
 * Updates an existing agency-specific app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';
import { IAppEventDefinition } from '../../shared/types';

interface UpdateAgencyAppEventParams extends Partial<IAppEventDefinition> {
    LOG_LEVEL?: string;
    agencyId: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: UpdateAgencyAppEventParams) {
    const logger = aioLogger('update-agency-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Update agency app event action invoked');

    try {
        if (!params.agencyId || !params.eventCode) {
            return {
                statusCode: 400,
                body: { success: false, error: 'Missing required parameters: agencyId, eventCode' }
            };
        }
        
        const registryManager = new EventRegistryManager(params.LOG_LEVEL || 'info');
        
        const existing = await registryManager.getAgencyAppEventDefinition(params.agencyId, params.eventCode);
        if (!existing) {
            return {
                statusCode: 404,
                body: {
                    success: false,
                    error: `Agency event not found: ${params.eventCode}`,
                    details: { agencyId: params.agencyId, eventCode: params.eventCode }
                }
            };
        }
        
        const { LOG_LEVEL, agencyId, eventCode, __ow_headers, ...updates } = params;
        
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
        
        const updatedEvent = await registryManager.updateAgencyAppEventDefinition(
            params.agencyId,
            params.eventCode,
            updates
        );
        
        logger.info(`Updated agency app event: ${params.eventCode} for agency: ${params.agencyId}`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    agencyId: params.agencyId,
                    event: updatedEvent,
                    message: `Agency event updated successfully: ${params.eventCode}`,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error updating agency app event:', error as any);
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

