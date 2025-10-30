/**
 * Routing Rules Manager
 * 
 * Manages global routing rules for Product Events and App Events.
 * Stores IRoutingRule[] with persistence to App Builder State Store and File Store.
 * 
 * Storage Structure:
 * - Product Event Rules: PRODUCT_ROUTING_RULE_{eventCode}
 * - App Event Rules: APP_ROUTING_RULE_{eventCode}
 * 
 * Note: Brand/Agency-specific rules are stored in BrandManager/AgencyManager
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { IRoutingRule } from '../../shared/types/rules-types';

// Storage key prefixes
export const PRODUCT_ROUTING_RULE_PREFIX = 'PRODUCT_ROUTING_RULE_';
export const APP_ROUTING_RULE_PREFIX = 'APP_ROUTING_RULE_';
const ROUTING_RULES_FILE_STORE_DIR = 'routing-rules';

export class RoutingRulesManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string = 'info') {
        this.logger = aioLogger('routing-rules-manager', { level: logLevel });
    }

    /**
     * Get State Store instance
     */
    private async getStateStore(): Promise<any> {
        if (!this.stateStore) {
            const stateLib = require('@adobe/aio-lib-state');
            this.stateStore = await stateLib.init();
        }
        return this.stateStore;
    }

    /**
     * Get File Store instance
     */
    private async getFileStore(): Promise<any> {
        if (!this.fileStore) {
            const filesLib = require('@adobe/aio-lib-files');
            this.fileStore = await filesLib.init();
        }
        return this.fileStore;
    }

    // ============================================================================
    // PRODUCT EVENT ROUTING RULES
    // ============================================================================

    /**
     * Get routing rules for a product event
     */
    async getProductEventRules(eventCode: string): Promise<IRoutingRule[]> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${PRODUCT_ROUTING_RULE_PREFIX}${eventCode}`;
            
            const result = await stateStore.get(key);
            
            if (!result || !result.value) {
                this.logger.debug(`No routing rules found for product event: ${eventCode}`);
                return [];
            }

            const rules = JSON.parse(result.value);
            this.logger.debug(`Retrieved ${rules.length} routing rules for product event: ${eventCode}`);
            return rules;
        } catch (error: unknown) {
            this.logger.error(`Error getting product event rules for ${eventCode}:`, error);
            return [];
        }
    }

    /**
     * Save routing rules for a product event
     */
    async saveProductEventRules(eventCode: string, rules: IRoutingRule[]): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            const key = `${PRODUCT_ROUTING_RULE_PREFIX}${eventCode}`;
            
            // Save to state store
            await stateStore.put(key, JSON.stringify(rules), { ttl: -1 });
            
            // Save to file store for backup
            const filePath = `${ROUTING_RULES_FILE_STORE_DIR}/product/${eventCode}.json`;
            await fileStore.write(filePath, JSON.stringify(rules, null, 2));
            
            this.logger.info(`Saved ${rules.length} routing rules for product event: ${eventCode}`);
        } catch (error: unknown) {
            this.logger.error(`Error saving product event rules for ${eventCode}:`, error);
            throw error;
        }
    }

    /**
     * Delete routing rules for a product event
     */
    async deleteProductEventRules(eventCode: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${PRODUCT_ROUTING_RULE_PREFIX}${eventCode}`;
            
            await stateStore.delete(key);
            
            this.logger.info(`Deleted routing rules for product event: ${eventCode}`);
        } catch (error: unknown) {
            this.logger.error(`Error deleting product event rules for ${eventCode}:`, error);
            throw error;
        }
    }

    /**
     * Get all product event codes that have routing rules
     */
    async getAllProductEventCodesWithRules(): Promise<string[]> {
        try {
            const stateStore = await this.getStateStore();
            const keys = await stateStore.list();
            
            const productEventCodes = keys
                .filter((key: string) => key.startsWith(PRODUCT_ROUTING_RULE_PREFIX))
                .map((key: string) => key.replace(PRODUCT_ROUTING_RULE_PREFIX, ''));
            
            this.logger.debug(`Found ${productEventCodes.length} product events with routing rules`);
            return productEventCodes;
        } catch (error: unknown) {
            this.logger.error('Error listing product event codes with rules:', error);
            return [];
        }
    }

    // ============================================================================
    // APP EVENT ROUTING RULES
    // ============================================================================

    /**
     * Get routing rules for an app event
     */
    async getAppEventRules(eventCode: string): Promise<IRoutingRule[]> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${APP_ROUTING_RULE_PREFIX}${eventCode}`;
            
            const result = await stateStore.get(key);
            
            if (!result || !result.value) {
                this.logger.debug(`No routing rules found for app event: ${eventCode}`);
                return [];
            }

            const rules = JSON.parse(result.value);
            this.logger.debug(`Retrieved ${rules.length} routing rules for app event: ${eventCode}`);
            return rules;
        } catch (error: unknown) {
            this.logger.error(`Error getting app event rules for ${eventCode}:`, error);
            return [];
        }
    }

    /**
     * Save routing rules for an app event
     */
    async saveAppEventRules(eventCode: string, rules: IRoutingRule[]): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            const key = `${APP_ROUTING_RULE_PREFIX}${eventCode}`;
            
            // Save to state store
            await stateStore.put(key, JSON.stringify(rules), { ttl: -1 });
            
            // Save to file store for backup
            const filePath = `${ROUTING_RULES_FILE_STORE_DIR}/app/${eventCode}.json`;
            await fileStore.write(filePath, JSON.stringify(rules, null, 2));
            
            this.logger.info(`Saved ${rules.length} routing rules for app event: ${eventCode}`);
        } catch (error: unknown) {
            this.logger.error(`Error saving app event rules for ${eventCode}:`, error);
            throw error;
        }
    }

    /**
     * Delete routing rules for an app event
     */
    async deleteAppEventRules(eventCode: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${APP_ROUTING_RULE_PREFIX}${eventCode}`;
            
            await stateStore.delete(key);
            
            this.logger.info(`Deleted routing rules for app event: ${eventCode}`);
        } catch (error: unknown) {
            this.logger.error(`Error deleting app event rules for ${eventCode}:`, error);
            throw error;
        }
    }

    /**
     * Get all app event codes that have routing rules
     */
    async getAllAppEventCodesWithRules(): Promise<string[]> {
        try {
            const stateStore = await this.getStateStore();
            const keys = await stateStore.list();
            
            const appEventCodes = keys
                .filter((key: string) => key.startsWith(APP_ROUTING_RULE_PREFIX))
                .map((key: string) => key.replace(APP_ROUTING_RULE_PREFIX, ''));
            
            this.logger.debug(`Found ${appEventCodes.length} app events with routing rules`);
            return appEventCodes;
        } catch (error: unknown) {
            this.logger.error('Error listing app event codes with rules:', error);
            return [];
        }
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Add a single routing rule to an event
     */
    async addRuleToEvent(eventCode: string, rule: IRoutingRule, isProductEvent: boolean): Promise<void> {
        const existingRules = isProductEvent 
            ? await this.getProductEventRules(eventCode)
            : await this.getAppEventRules(eventCode);
        
        // Check if rule with same ID already exists
        const existingIndex = existingRules.findIndex(r => r.id === rule.id);
        if (existingIndex >= 0) {
            throw new Error(`Rule with ID ${rule.id} already exists for event ${eventCode}`);
        }

        existingRules.push(rule);

        if (isProductEvent) {
            await this.saveProductEventRules(eventCode, existingRules);
        } else {
            await this.saveAppEventRules(eventCode, existingRules);
        }

        this.logger.info(`Added rule ${rule.id} to ${isProductEvent ? 'product' : 'app'} event ${eventCode}`);
    }

    /**
     * Update a routing rule for an event
     */
    async updateRuleForEvent(eventCode: string, ruleId: string, updates: Partial<IRoutingRule>, isProductEvent: boolean): Promise<void> {
        const existingRules = isProductEvent 
            ? await this.getProductEventRules(eventCode)
            : await this.getAppEventRules(eventCode);
        
        const ruleIndex = existingRules.findIndex(r => r.id === ruleId);
        if (ruleIndex < 0) {
            throw new Error(`Rule with ID ${ruleId} not found for event ${eventCode}`);
        }

        existingRules[ruleIndex] = {
            ...existingRules[ruleIndex],
            ...updates,
            id: ruleId, // Ensure ID doesn't change
            updatedAt: new Date()
        };

        if (isProductEvent) {
            await this.saveProductEventRules(eventCode, existingRules);
        } else {
            await this.saveAppEventRules(eventCode, existingRules);
        }

        this.logger.info(`Updated rule ${ruleId} for ${isProductEvent ? 'product' : 'app'} event ${eventCode}`);
    }

    /**
     * Delete a routing rule from an event
     */
    async deleteRuleFromEvent(eventCode: string, ruleId: string, isProductEvent: boolean): Promise<void> {
        const existingRules = isProductEvent 
            ? await this.getProductEventRules(eventCode)
            : await this.getAppEventRules(eventCode);
        
        const filteredRules = existingRules.filter(r => r.id !== ruleId);

        if (filteredRules.length === existingRules.length) {
            throw new Error(`Rule with ID ${ruleId} not found for event ${eventCode}`);
        }

        if (isProductEvent) {
            await this.saveProductEventRules(eventCode, filteredRules);
        } else {
            await this.saveAppEventRules(eventCode, filteredRules);
        }

        this.logger.info(`Deleted rule ${ruleId} from ${isProductEvent ? 'product' : 'app'} event ${eventCode}`);
    }

    /**
     * Get a specific routing rule by ID
     */
    async getRuleById(eventCode: string, ruleId: string, isProductEvent: boolean): Promise<IRoutingRule | null> {
        const rules = isProductEvent 
            ? await this.getProductEventRules(eventCode)
            : await this.getAppEventRules(eventCode);
        
        return rules.find(r => r.id === ruleId) || null;
    }
}

