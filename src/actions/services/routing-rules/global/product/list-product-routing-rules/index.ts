/**
 * List Product Event Routing Rules
 * 
 * Returns a list of all product event codes that have routing rules configured.
 * 
 * @returns {
 *   eventCodes: string[],  // Array of event codes with routing rules
 *   count: number          // Total count
 * }
 */

import { RoutingRulesManager } from '../../../../../classes/RoutingRulesManager';
import { errorResponse } from "../../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        logger.info('list-product-routing-rules: Starting');

        const rulesManager = new RoutingRulesManager(params.LOG_LEVEL || 'info');
        const eventCodes = await rulesManager.getAllProductEventCodesWithRules();

        logger.info(`list-product-routing-rules: Found ${eventCodes.length} product events with routing rules`);

        return {
            statusCode: 200,
            body: {
                eventCodes,
                count: eventCodes.length
            }
        };
    } catch (error: unknown) {
        logger.error('list-product-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to list product event routing rules', logger);
    }
}

