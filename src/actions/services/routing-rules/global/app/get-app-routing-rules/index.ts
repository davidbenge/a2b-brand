/**
 * Get App Event Routing Rules
 * 
 * Returns all routing rules for a specific app event.
 * 
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.registration.enabled")
 * 
 * @returns {
 *   eventCode: string,
 *   rules: IRoutingRule[],
 *   count: number
 * }
 */

import { RoutingRulesManager } from '../../../../../classes/RoutingRulesManager';
import { errorResponse } from "../../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { eventCode } = params;

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        logger.info(`get-app-routing-rules: Getting rules for event: ${eventCode}`);

        const rulesManager = new RoutingRulesManager(params.LOG_LEVEL || 'info');
        const rules = await rulesManager.getAppEventRules(eventCode);

        logger.info(`get-app-routing-rules: Found ${rules.length} rules for event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                eventCode,
                rules,
                count: rules.length
            }
        };
    } catch (error: unknown) {
        logger.error('get-app-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to get app event routing rules', logger);
    }
}

