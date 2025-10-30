/**
 * Get Agency Routing Rules
 * 
 * Returns all routing rules for a specific app event code and agency.
 * 
 * @param agencyId - The agency ID
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.assetsync.new")
 * 
 * @returns {
 *   agencyId: string,
 *   eventCode: string,
 *   rules: IRoutingRule[],  // Array of routing rules
 *   count: number           // Total count
 * }
 */

import { AgencyManager } from '../../../../classes/AgencyManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { agencyId, eventCode } = params;

        if (!agencyId) {
            return errorResponse(400, 'Missing required parameter: agencyId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        logger.info(`get-agency-routing-rules: Getting routing rules for agency: ${agencyId}, event: ${eventCode}`);

        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
        
        // Verify agency exists
        const agency = await agencyManager.getAgency(agencyId);
        if (!agency) {
            return errorResponse(404, `Agency with ID ${agencyId} not found`, logger);
        }

        const rules = await agencyManager.getAgencyRoutingRules(agencyId, eventCode);

        logger.info(`get-agency-routing-rules: Found ${rules.length} routing rules for agency: ${agencyId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                agencyId,
                eventCode,
                rules,
                count: rules.length
            }
        };
    } catch (error: unknown) {
        logger.error('get-agency-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to get agency routing rules', logger);
    }
}

