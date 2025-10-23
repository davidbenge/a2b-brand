/**
 * Delete Agency App Event Action
 * 
 * Deletes an agency-specific app event definition
 * Protected by Adobe IMS authentication
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { EventRegistryManager } from '../classes/EventRegistryManager';

interface DeleteAgencyAppEventParams {
    LOG_LEVEL?: string;
    agencyId: string;
    eventCode: string;
    __ow_headers?: Record<string, string>;
}

async function main(params: DeleteAgencyAppEventParams) {
    const logger = aioLogger('delete-agency-app-event', { level: params.LOG_LEVEL || 'info' });
    logger.info('Delete agency app event action invoked');

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
        
        await registryManager.deleteAgencyAppEventDefinition(params.agencyId, params.eventCode);
        
        logger.info(`Deleted agency app event: ${params.eventCode} for agency: ${params.agencyId}`);
        
        return {
            statusCode: 200,
            body: {
                success: true,
                data: {
                    agencyId: params.agencyId,
                    message: `Agency event deleted successfully: ${params.eventCode}`,
                    eventCode: params.eventCode,
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error: unknown) {
        logger.error('Error deleting agency app event:', error as any);
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

