/**
 * Create Agency Routing Rule
 * 
 * Creates a new routing rule for a specific app event code and agency.
 * 
 * @param agencyId - The agency ID
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.assetsync.new")
 * @param rule - The routing rule to create (without id, createdAt, updatedAt)
 * 
 * @returns {
 *   agencyId: string,
 *   eventCode: string,
 *   rule: IRoutingRule  // The created rule with id and timestamps
 * }
 */

import { AgencyManager } from '../../../../classes/AgencyManager';
import { errorResponse } from "../../../../utils/common";
import { v4 as uuidv4 } from 'uuid';

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { agencyId, eventCode, rule } = params;

        if (!agencyId) {
            return errorResponse(400, 'Missing required parameter: agencyId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!rule) {
            return errorResponse(400, 'Missing required parameter: rule', logger);
        }

        // Validate required rule fields
        if (!rule.name) {
            return errorResponse(400, 'Rule must have a name', logger);
        }

        if (!rule.conditions || !Array.isArray(rule.conditions)) {
            return errorResponse(400, 'Rule must have conditions array', logger);
        }

        if (!rule.actions || !Array.isArray(rule.actions)) {
            return errorResponse(400, 'Rule must have actions array', logger);
        }

        logger.info(`create-agency-routing-rule: Creating routing rule for agency: ${agencyId}, event: ${eventCode}`);

        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
        
        // Verify agency exists
        const agency = await agencyManager.getAgency(agencyId);
        if (!agency) {
            return errorResponse(404, `Agency with ID ${agencyId} not found`, logger);
        }

        // Add timestamps and ID
        const ruleWithTimestamps = {
            ...rule,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await agencyManager.addAgencyRoutingRule(agencyId, eventCode, ruleWithTimestamps);

        logger.info(`create-agency-routing-rule: Created routing rule ${ruleWithTimestamps.id} for agency: ${agencyId}, event: ${eventCode}`);

        return {
            statusCode: 201,
            body: {
                agencyId,
                eventCode,
                rule: ruleWithTimestamps
            }
        };
    } catch (error: unknown) {
        logger.error('create-agency-routing-rule: Error:', error);
        return errorResponse(500, 'Failed to create agency routing rule', logger);
    }
}

