/**
 * List Agency Routing Rules
 * 
 * Returns a list of all app event codes that have agency-specific routing rules configured.
 * 
 * @param agencyId - The agency ID
 * 
 * @returns {
 *   agencyId: string,
 *   eventCodes: string[],  // Array of event codes with routing rules
 *   count: number          // Total count
 * }
 */

import { AgencyManager } from '../../../../classes/AgencyManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { agencyId } = params;

        if (!agencyId) {
            return errorResponse(400, 'Missing required parameter: agencyId', logger);
        }

        logger.info(`list-agency-routing-rules: Getting event codes for agency: ${agencyId}`);

        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
        
        // Verify agency exists
        const agency = await agencyManager.getAgency(agencyId);
        if (!agency) {
            return errorResponse(404, `Agency with ID ${agencyId} not found`, logger);
        }

        const eventCodes = await agencyManager.getAgencyEventCodesWithRoutingRules(agencyId);

        logger.info(`list-agency-routing-rules: Found ${eventCodes.length} app events with routing rules for agency: ${agencyId}`);

        return {
            statusCode: 200,
            body: {
                agencyId,
                eventCodes,
                count: eventCodes.length
            }
        };
    } catch (error: unknown) {
        logger.error('list-agency-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to list agency routing rules', logger);
    }
}

