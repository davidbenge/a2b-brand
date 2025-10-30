/**
 * Create Product Event Routing Rule
 * 
 * Adds a new routing rule to a product event.
 * 
 * @param eventCode - The product event code
 * @param rule - The routing rule to add (IRoutingRule)
 * 
 * @returns {
 *   message: string,
 *   eventCode: string,
 *   ruleId: string,
 *   totalRules: number
 * }
 */

import { RoutingRulesManager } from '../../../../../classes/RoutingRulesManager';
import { errorResponse } from "../../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { eventCode, rule } = params;

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!rule) {
            return errorResponse(400, 'Missing required parameter: rule', logger);
        }

        // Validate rule structure
        if (!rule.id || !rule.name || rule.priority === undefined || rule.enabled === undefined || !rule.actions) {
            return errorResponse(400, 'Invalid rule: must include id, name, priority, enabled, and actions', logger);
        }

        if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
            return errorResponse(400, 'Invalid rule: actions must be a non-empty array', logger);
        }

        logger.info(`create-product-routing-rule: Adding rule ${rule.id} to event: ${eventCode}`);

        const rulesManager = new RoutingRulesManager(params.LOG_LEVEL || 'info');
        
        // Add timestamps if not present
        const ruleWithTimestamps = {
            ...rule,
            createdAt: rule.createdAt || new Date(),
            updatedAt: rule.updatedAt || new Date()
        };

        await rulesManager.addRuleToEvent(eventCode, ruleWithTimestamps, true); // true = isProductEvent

        // Get updated count
        const allRules = await rulesManager.getProductEventRules(eventCode);

        logger.info(`create-product-routing-rule: Successfully added rule ${rule.id} to event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${rule.id} added successfully to product event ${eventCode}`,
                eventCode,
                ruleId: rule.id,
                totalRules: allRules.length
            }
        };
    } catch (error: unknown) {
        logger.error('create-product-routing-rule: Error:', error);
        
        // Check for duplicate rule error
        if (error instanceof Error && error.message.includes('already exists')) {
            return errorResponse(409, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to create product event routing rule', logger);
    }
}

