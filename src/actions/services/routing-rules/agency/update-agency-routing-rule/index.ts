/**
 * Update Agency Routing Rule
 * 
 * Updates an existing routing rule for a specific app event code and agency.
 * 
 * @param agencyId - The agency ID
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.assetsync.new")
 * @param ruleId - The ID of the rule to update
 * @param updates - The fields to update (partial rule object)
 * 
 * @returns {
 *   agencyId: string,
 *   eventCode: string,
 *   ruleId: string,
 *   rule: IRoutingRule  // The updated rule
 * }
 */

import { AgencyManager } from '../../../../classes/AgencyManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { agencyId, eventCode, ruleId, updates } = params;

        if (!agencyId) {
            return errorResponse(400, 'Missing required parameter: agencyId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        if (!updates) {
            return errorResponse(400, 'Missing required parameter: updates', logger);
        }

        logger.info(`update-agency-routing-rule: Updating routing rule ${ruleId} for agency: ${agencyId}, event: ${eventCode}`);

        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
        
        // Verify agency exists
        const agency = await agencyManager.getAgency(agencyId);
        if (!agency) {
            return errorResponse(404, `Agency with ID ${agencyId} not found`, logger);
        }

        // Add updated timestamp
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await agencyManager.updateAgencyRoutingRule(agencyId, eventCode, ruleId, updatesWithTimestamp);

        // Get the updated rule
        const allRules = await agencyManager.getAgencyRoutingRules(agencyId, eventCode);
        const updatedRule = allRules.find(r => r.id === ruleId);

        if (!updatedRule) {
            return errorResponse(404, `Rule with ID ${ruleId} not found after update`, logger);
        }

        logger.info(`update-agency-routing-rule: Updated routing rule ${ruleId} for agency: ${agencyId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                agencyId,
                eventCode,
                ruleId,
                rule: updatedRule
            }
        };
    } catch (error: unknown) {
        logger.error('update-agency-routing-rule: Error:', error);
        return errorResponse(500, 'Failed to update agency routing rule', logger);
    }
}

