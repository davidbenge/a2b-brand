/**
 * Update App Event Routing Rule
 * 
 * Updates an existing routing rule for an app event.
 * 
 * @param eventCode - The app event code
 * @param ruleId - The ID of the rule to update
 * @param updates - Partial updates to apply (Partial<IRoutingRule>)
 * 
 * @returns {
 *   message: string,
 *   eventCode: string,
 *   ruleId: string
 * }
 */

import { RoutingRulesManager } from '../../../../../classes/RoutingRulesManager';
import { errorResponse } from "../../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { eventCode, ruleId, updates } = params;

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        if (!updates || typeof updates !== 'object') {
            return errorResponse(400, 'Missing or invalid parameter: updates', logger);
        }

        // Prevent changing the rule ID
        if (updates.id && updates.id !== ruleId) {
            return errorResponse(400, 'Cannot change rule ID', logger);
        }

        logger.info(`update-app-routing-rule: Updating rule ${ruleId} for event: ${eventCode}`);

        const rulesManager = new RoutingRulesManager(params.LOG_LEVEL || 'info');
        
        // Add updatedAt timestamp
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date()
        };

        await rulesManager.updateRuleForEvent(eventCode, ruleId, updatesWithTimestamp, false); // false = isProductEvent (it's an app event)

        logger.info(`update-app-routing-rule: Successfully updated rule ${ruleId} for event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${ruleId} updated successfully for app event ${eventCode}`,
                eventCode,
                ruleId
            }
        };
    } catch (error: unknown) {
        logger.error('update-app-routing-rule: Error:', error);
        
        // Check for not found error
        if (error instanceof Error && error.message.includes('not found')) {
            return errorResponse(404, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to update app event routing rule', logger);
    }
}

