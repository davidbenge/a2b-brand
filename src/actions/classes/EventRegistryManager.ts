/**
 * EventRegistryManager - Persistence layer for event definitions
 * 
 * Manages storage and retrieval of event definitions using App Builder State + File Store.
 * Follows the BrandManager pattern for consistency.
 * 
 * Storage Strategy:
 * - State Store: Fast access for recent/active definitions
 * - File Store: Persistent backup and bulk storage
 * 
 * Multi-Level Support:
 * - Global App Event Definitions (A-EVENT-GLOBAL-DEF_)
 * - Product Event Definitions (P-EVENT-DEF_)
 * - Brand/Agency-Specific App Event Definitions (A-EVENT-BRAND-DEF_ / A-EVENT-AGENCY-DEF_)
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import { IAppEventDefinition, IProductEventDefinition } from "../types";
import { 
    APP_EVENT_GLOBAL_DEF_PREFIX, 
    PRODUCT_EVENT_DEF_PREFIX, 
    APP_EVENT_AGENCY_DEF_PREFIX,
    EVENT_REGISTRY_SEEDED_KEY 
} from "../../shared/constants";
import { DEFAULT_APP_EVENTS } from "./AppEventRegistry";
import { DEFAULT_PRODUCT_EVENTS } from "./ProductEventRegistry";

// File store directories
const EVENT_REGISTRY_FILE_STORE_DIR = 'event-registries';

export class EventRegistryManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string = 'info') {
        this.logger = aioLogger("EventRegistryManager", { level: logLevel });
    }

    // ============================================================================
    // State and File Store Initialization
    // ============================================================================

    /**
     * Get the state store
     */
    async getStateStore(): Promise<any> {
        if (!this.stateStore) {
            try {
                const stateLib = require('@adobe/aio-lib-state');
                this.logger.debug('State store imported');
                this.stateStore = await stateLib.init();
                this.logger.debug('State store initialized');
                return this.stateStore;
            } catch (error) {
                this.logger.error(`Error initializing state store: ${error}`);
                throw new Error(`Error initializing state store: ${error}`);
            }
        }
        this.logger.debug('State store already initialized');
        return this.stateStore;
    }

    /**
     * Get the file store
     */
    async getFileStore(): Promise<any> {
        if (!this.fileStore) {
            try {
                const filesLib = require('@adobe/aio-lib-files');
                this.logger.debug('File store not initialized');
                this.fileStore = await filesLib.init();
                this.logger.debug('File store initialized');
                return this.fileStore;
            } catch (error) {
                this.logger.error(`Error initializing file store: ${error}`);
                throw new Error(`Error initializing file store: ${error}`);
            }
        }
        this.logger.debug('File store already initialized');
        return this.fileStore;
    }

    // ============================================================================
    // Seeding Logic
    // ============================================================================

    /**
     * Check if event registries have been seeded
     */
    async isSeeded(): Promise<boolean> {
        try {
            const stateStore = await this.getStateStore();
            const result = await stateStore.get(EVENT_REGISTRY_SEEDED_KEY);
            return result?.value === true;
        } catch (error) {
            this.logger.error(`Error checking seeded status: ${error}`);
            return false;
        }
    }

    /**
     * Mark event registries as seeded
     */
    private async markAsSeeded(): Promise<void> {
        const stateStore = await this.getStateStore();
        await stateStore.put(EVENT_REGISTRY_SEEDED_KEY, { value: true }, { ttl: -1 }); // Never expire
        this.logger.info('Event registries marked as seeded');
    }

    /**
     * Seed all event registries from default definitions
     */
    async seedIfNeeded(): Promise<void> {
        if (await this.isSeeded()) {
            this.logger.info('Event registries already seeded');
            return;
        }

        this.logger.info('Seeding event registries...');

        // Seed Product Events
        await this.seedProductEventDefinitions();

        // Seed Global App Events
        await this.seedGlobalAppEventDefinitions();

        // Mark as seeded
        await this.markAsSeeded();

        this.logger.info('Event registries seeded successfully');
    }

    /**
     * Seed product event definitions from defaults
     */
    async seedProductEventDefinitions(): Promise<void> {
        this.logger.info('Seeding product event definitions...');
        let count = 0;
        
        for (const [eventCode, definition] of Object.entries(DEFAULT_PRODUCT_EVENTS)) {
            await this.saveProductEventDefinition(definition);
            count++;
        }
        
        this.logger.info(`Seeded ${count} product event definitions`);
    }

    /**
     * Seed global app event definitions from defaults
     */
    async seedGlobalAppEventDefinitions(): Promise<void> {
        this.logger.info('Seeding global app event definitions...');
        let count = 0;
        
        for (const [eventCode, definition] of Object.entries(DEFAULT_APP_EVENTS)) {
            await this.saveGlobalAppEventDefinition(definition);
            count++;
        }
        
        this.logger.info(`Seeded ${count} global app event definitions`);
    }

    // ============================================================================
    // Product Event Definitions - CRUD Operations
    // ============================================================================

    /**
     * Get a product event definition by event code
     */
    async getProductEventDefinition(eventCode: string): Promise<IProductEventDefinition | null> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${PRODUCT_EVENT_DEF_PREFIX}${eventCode}`;
            const result = await stateStore.get(key);
            
            if (result?.value) {
                this.logger.debug(`Product event definition found in state store: ${eventCode}`);
                return result.value as IProductEventDefinition;
            }

            // Try file store
            const fileStore = await this.getFileStore();
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/product/${eventCode}.json`;
            
            try {
                const fileContent = await fileStore.read(filePath);
                const definition = JSON.parse(fileContent.toString());
                
                // Cache in state store
                await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
                
                this.logger.debug(`Product event definition found in file store: ${eventCode}`);
                return definition as IProductEventDefinition;
            } catch (fileError) {
                this.logger.debug(`Product event definition not found: ${eventCode}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`Error getting product event definition ${eventCode}: ${error}`);
            throw error;
        }
    }

    /**
     * Get all product event definitions
     */
    async getAllProductEventDefinitions(): Promise<IProductEventDefinition[]> {
        try {
            const fileStore = await this.getFileStore();
            const dirPath = `${EVENT_REGISTRY_FILE_STORE_DIR}/product/`;
            
            try {
                const files = await fileStore.list(dirPath);
                const definitions: IProductEventDefinition[] = [];
                
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        const eventCode = file.name.replace('.json', '');
                        const definition = await this.getProductEventDefinition(eventCode);
                        if (definition) {
                            definitions.push(definition);
                        }
                    }
                }
                
                return definitions;
            } catch (listError) {
                this.logger.debug('No product event definitions found in file store');
                return [];
            }
        } catch (error) {
            this.logger.error(`Error getting all product event definitions: ${error}`);
            throw error;
        }
    }

    /**
     * Save a product event definition
     */
    async saveProductEventDefinition(definition: IProductEventDefinition): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${PRODUCT_EVENT_DEF_PREFIX}${definition.code}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/product/${definition.code}.json`;
            
            // Save to state store (with TTL)
            await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
            
            // Save to file store (persistent)
            await fileStore.write(filePath, JSON.stringify(definition, null, 2));
            
            this.logger.info(`Product event definition saved: ${definition.code}`);
        } catch (error) {
            this.logger.error(`Error saving product event definition ${definition.code}: ${error}`);
            throw error;
        }
    }

    /**
     * Update a product event definition
     */
    async updateProductEventDefinition(
        eventCode: string, 
        updates: Partial<IProductEventDefinition>
    ): Promise<IProductEventDefinition> {
        const existing = await this.getProductEventDefinition(eventCode);
        
        if (!existing) {
            throw new Error(`Product event definition not found: ${eventCode}`);
        }
        
        const updated: IProductEventDefinition = {
            ...existing,
            ...updates,
            code: eventCode // Ensure code doesn't change
        };
        
        await this.saveProductEventDefinition(updated);
        return updated;
    }

    /**
     * Delete a product event definition
     */
    async deleteProductEventDefinition(eventCode: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${PRODUCT_EVENT_DEF_PREFIX}${eventCode}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/product/${eventCode}.json`;
            
            // Delete from state store
            await stateStore.delete(key);
            
            // Delete from file store
            try {
                await fileStore.delete(filePath);
            } catch (fileError) {
                this.logger.debug(`File not found in file store: ${filePath}`);
            }
            
            this.logger.info(`Product event definition deleted: ${eventCode}`);
        } catch (error) {
            this.logger.error(`Error deleting product event definition ${eventCode}: ${error}`);
            throw error;
        }
    }

    /**
     * Get product events by category
     */
    async getProductEventsByCategory(category: string): Promise<IProductEventDefinition[]> {
        const allDefinitions = await this.getAllProductEventDefinitions();
        return allDefinitions.filter(def => def.category === category);
    }

    // ============================================================================
    // Global App Event Definitions - CRUD Operations
    // ============================================================================

    /**
     * Get a global app event definition by event code
     */
    async getGlobalAppEventDefinition(eventCode: string): Promise<IAppEventDefinition | null> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${APP_EVENT_GLOBAL_DEF_PREFIX}${eventCode}`;
            const result = await stateStore.get(key);
            
            if (result?.value) {
                this.logger.debug(`Global app event definition found in state store: ${eventCode}`);
                return result.value as IAppEventDefinition;
            }

            // Try file store
            const fileStore = await this.getFileStore();
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-global/${eventCode}.json`;
            
            try {
                const fileContent = await fileStore.read(filePath);
                const definition = JSON.parse(fileContent.toString());
                
                // Cache in state store
                await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
                
                this.logger.debug(`Global app event definition found in file store: ${eventCode}`);
                return definition as IAppEventDefinition;
            } catch (fileError) {
                this.logger.debug(`Global app event definition not found: ${eventCode}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`Error getting global app event definition ${eventCode}: ${error}`);
            throw error;
        }
    }

    /**
     * Get all global app event definitions
     */
    async getAllGlobalAppEventDefinitions(): Promise<IAppEventDefinition[]> {
        try {
            const fileStore = await this.getFileStore();
            const dirPath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-global/`;
            
            try {
                const files = await fileStore.list(dirPath);
                const definitions: IAppEventDefinition[] = [];
                
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        const eventCode = file.name.replace('.json', '');
                        const definition = await this.getGlobalAppEventDefinition(eventCode);
                        if (definition) {
                            definitions.push(definition);
                        }
                    }
                }
                
                return definitions;
            } catch (listError) {
                this.logger.debug('No global app event definitions found in file store');
                return [];
            }
        } catch (error) {
            this.logger.error(`Error getting all global app event definitions: ${error}`);
            throw error;
        }
    }

    /**
     * Save a global app event definition
     */
    async saveGlobalAppEventDefinition(definition: IAppEventDefinition): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${APP_EVENT_GLOBAL_DEF_PREFIX}${definition.code}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-global/${definition.code}.json`;
            
            // Save to state store (with TTL)
            await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
            
            // Save to file store (persistent)
            await fileStore.write(filePath, JSON.stringify(definition, null, 2));
            
            this.logger.info(`Global app event definition saved: ${definition.code}`);
        } catch (error) {
            this.logger.error(`Error saving global app event definition ${definition.code}: ${error}`);
            throw error;
        }
    }

    /**
     * Update a global app event definition
     */
    async updateGlobalAppEventDefinition(
        eventCode: string, 
        updates: Partial<IAppEventDefinition>
    ): Promise<IAppEventDefinition> {
        const existing = await this.getGlobalAppEventDefinition(eventCode);
        
        if (!existing) {
            throw new Error(`Global app event definition not found: ${eventCode}`);
        }
        
        const updated: IAppEventDefinition = {
            ...existing,
            ...updates,
            code: eventCode // Ensure code doesn't change
        };
        
        await this.saveGlobalAppEventDefinition(updated);
        return updated;
    }

    /**
     * Delete a global app event definition
     */
    async deleteGlobalAppEventDefinition(eventCode: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${APP_EVENT_GLOBAL_DEF_PREFIX}${eventCode}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-global/${eventCode}.json`;
            
            // Delete from state store
            await stateStore.delete(key);
            
            // Delete from file store
            try {
                await fileStore.delete(filePath);
            } catch (fileError) {
                this.logger.debug(`File not found in file store: ${filePath}`);
            }
            
            this.logger.info(`Global app event definition deleted: ${eventCode}`);
        } catch (error) {
            this.logger.error(`Error deleting global app event definition ${eventCode}: ${error}`);
            throw error;
        }
    }

    /**
     * Get global app events by category
     */
    async getGlobalAppEventsByCategory(category: string): Promise<IAppEventDefinition[]> {
        const allDefinitions = await this.getAllGlobalAppEventDefinitions();
        return allDefinitions.filter(def => def.category === category);
    }

    // ============================================================================
    // Agency-Specific App Event Definitions - CRUD Operations
    // ============================================================================

    /**
     * Get an agency-specific app event definition
     */
    async getAgencyAppEventDefinition(agencyId: string, eventCode: string): Promise<IAppEventDefinition | null> {
        try {
            const stateStore = await this.getStateStore();
            const key = `${APP_EVENT_AGENCY_DEF_PREFIX}${agencyId}_${eventCode}`;
            const result = await stateStore.get(key);
            
            if (result?.value) {
                this.logger.debug(`Agency app event definition found in state store: ${agencyId}/${eventCode}`);
                return result.value as IAppEventDefinition;
            }

            // Try file store
            const fileStore = await this.getFileStore();
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-agency/${agencyId}/${eventCode}.json`;
            
            try {
                const fileContent = await fileStore.read(filePath);
                const definition = JSON.parse(fileContent.toString());
                
                // Cache in state store
                await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
                
                this.logger.debug(`Agency app event definition found in file store: ${agencyId}/${eventCode}`);
                return definition as IAppEventDefinition;
            } catch (fileError) {
                this.logger.debug(`Agency app event definition not found: ${agencyId}/${eventCode}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`Error getting agency app event definition ${agencyId}/${eventCode}: ${error}`);
            throw error;
        }
    }

    /**
     * Get all agency-specific app event definitions for an agency
     */
    async getAllAgencyAppEventDefinitions(agencyId: string): Promise<IAppEventDefinition[]> {
        try {
            const fileStore = await this.getFileStore();
            const dirPath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-agency/${agencyId}/`;
            
            try {
                const files = await fileStore.list(dirPath);
                const definitions: IAppEventDefinition[] = [];
                
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        const eventCode = file.name.replace('.json', '');
                        const definition = await this.getAgencyAppEventDefinition(agencyId, eventCode);
                        if (definition) {
                            definitions.push(definition);
                        }
                    }
                }
                
                return definitions;
            } catch (listError) {
                this.logger.debug(`No agency app event definitions found for agency: ${agencyId}`);
                return [];
            }
        } catch (error) {
            this.logger.error(`Error getting all agency app event definitions for ${agencyId}: ${error}`);
            throw error;
        }
    }

    /**
     * Save an agency-specific app event definition
     */
    async saveAgencyAppEventDefinition(agencyId: string, definition: IAppEventDefinition): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${APP_EVENT_AGENCY_DEF_PREFIX}${agencyId}_${definition.code}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-agency/${agencyId}/${definition.code}.json`;
            
            // Save to state store (with TTL)
            await stateStore.put(key, definition, { ttl: 3600 }); // 1 hour cache
            
            // Save to file store (persistent)
            await fileStore.write(filePath, JSON.stringify(definition, null, 2));
            
            this.logger.info(`Agency app event definition saved: ${agencyId}/${definition.code}`);
        } catch (error) {
            this.logger.error(`Error saving agency app event definition ${agencyId}/${definition.code}: ${error}`);
            throw error;
        }
    }

    /**
     * Update an agency-specific app event definition
     */
    async updateAgencyAppEventDefinition(
        agencyId: string,
        eventCode: string, 
        updates: Partial<IAppEventDefinition>
    ): Promise<IAppEventDefinition> {
        const existing = await this.getAgencyAppEventDefinition(agencyId, eventCode);
        
        if (!existing) {
            throw new Error(`Agency app event definition not found: ${agencyId}/${eventCode}`);
        }
        
        const updated: IAppEventDefinition = {
            ...existing,
            ...updates,
            code: eventCode // Ensure code doesn't change
        };
        
        await this.saveAgencyAppEventDefinition(agencyId, updated);
        return updated;
    }

    /**
     * Delete an agency-specific app event definition
     */
    async deleteAgencyAppEventDefinition(agencyId: string, eventCode: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const fileStore = await this.getFileStore();
            
            const key = `${APP_EVENT_AGENCY_DEF_PREFIX}${agencyId}_${eventCode}`;
            const filePath = `${EVENT_REGISTRY_FILE_STORE_DIR}/app-agency/${agencyId}/${eventCode}.json`;
            
            // Delete from state store
            await stateStore.delete(key);
            
            // Delete from file store
            try {
                await fileStore.delete(filePath);
            } catch (fileError) {
                this.logger.debug(`File not found in file store: ${filePath}`);
            }
            
            this.logger.info(`Agency app event definition deleted: ${agencyId}/${eventCode}`);
        } catch (error) {
            this.logger.error(`Error deleting agency app event definition ${agencyId}/${eventCode}: ${error}`);
            throw error;
        }
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Get event count by category for product events
     */
    async getProductEventCountByCategory(): Promise<Record<string, number>> {
        const allDefinitions = await this.getAllProductEventDefinitions();
        const counts: Record<string, number> = {};
        
        allDefinitions.forEach(def => {
            counts[def.category] = (counts[def.category] || 0) + 1;
        });
        
        return counts;
    }

    /**
     * Get event count by category for global app events
     */
    async getGlobalAppEventCountByCategory(): Promise<Record<string, number>> {
        const allDefinitions = await this.getAllGlobalAppEventDefinitions();
        const counts: Record<string, number> = {};
        
        allDefinitions.forEach(def => {
            counts[def.category] = (counts[def.category] || 0) + 1;
        });
        
        return counts;
    }

    /**
     * Get all product event categories
     */
    async getProductEventCategories(): Promise<string[]> {
        const allDefinitions = await this.getAllProductEventDefinitions();
        return [...new Set(allDefinitions.map(def => def.category))];
    }

    /**
     * Get all global app event categories
     */
    async getGlobalAppEventCategories(): Promise<string[]> {
        const allDefinitions = await this.getAllGlobalAppEventDefinitions();
        return [...new Set(allDefinitions.map(def => def.category))];
    }
}

