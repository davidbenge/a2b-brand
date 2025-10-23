/**
 * Delete Agency Routing Rule
 * 
 * Deletes a routing rule for a specific app event code and agency.
 * 
 * @param agencyId - The agency ID
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.assetsync.new")
 * @param ruleId - The ID of the rule to delete
 * 
 * @returns {
 *   agencyId: string,
 *   eventCode: string,
 *   ruleId: string,
 *   deleted: boolean,
 *   remainingCount: number  // Number of rules remaining for this event
 * }
 */

import { AgencyManager } from '../../../../classes/AgencyManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { agencyId, eventCode, ruleId } = params;

        if (!agencyId) {
            return errorResponse(400, 'Missing required parameter: agencyId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        logger.info(`delete-agency-routing-rule: Deleting routing rule ${ruleId} for agency: ${agencyId}, event: ${eventCode}`);

        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
        
        // Verify agency exists
        const agency = await agencyManager.getAgency(agencyId);
        if (!agency) {
            return errorResponse(404, `Agency with ID ${agencyId} not found`, logger);
        }

        await agencyManager.deleteAgencyRoutingRule(agencyId, eventCode, ruleId);

        // Get remaining rules count
        const remainingRules = await agencyManager.getAgencyRoutingRules(agencyId, eventCode);

        logger.info(`delete-agency-routing-rule: Deleted routing rule ${ruleId} for agency: ${agencyId}, event: ${eventCode}. ${remainingRules.length} rules remaining.`);

        return {
            statusCode: 200,
            body: {
                agencyId,
                eventCode,
                ruleId,
                deleted: true,
                remainingCount: remainingRules.length
            }
        };
    } catch (error: unknown) {
        logger.error('delete-agency-routing-rule: Error:', error);
        return errorResponse(500, 'Failed to delete agency routing rule', logger);
    }
}

