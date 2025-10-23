/**
 * Delete Product Event Routing Rule
 * 
 * Deletes a routing rule from a product event.
 * 
 * @param eventCode - The product event code
 * @param ruleId - The ID of the rule to delete
 * 
 * @returns {
 *   message: string,
 *   eventCode: string,
 *   ruleId: string,
 *   remainingRules: number
 * }
 */

import { RoutingRulesManager } from '../../../../../classes/RoutingRulesManager';
import { errorResponse } from "../../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { eventCode, ruleId } = params;

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        logger.info(`delete-product-routing-rule: Deleting rule ${ruleId} from event: ${eventCode}`);

        const rulesManager = new RoutingRulesManager(params.LOG_LEVEL || 'info');
        
        await rulesManager.deleteRuleFromEvent(eventCode, ruleId, true); // true = isProductEvent

        // Get remaining count
        const remainingRules = await rulesManager.getProductEventRules(eventCode);

        logger.info(`delete-product-routing-rule: Successfully deleted rule ${ruleId} from event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${ruleId} deleted successfully from product event ${eventCode}`,
                eventCode,
                ruleId,
                remainingRules: remainingRules.length
            }
        };
    } catch (error: unknown) {
        logger.error('delete-product-routing-rule: Error:', error);
        
        // Check for not found error
        if (error instanceof Error && error.message.includes('not found')) {
            return errorResponse(404, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to delete product event routing rule', logger);
    }
}

