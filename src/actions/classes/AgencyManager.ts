import aioLogger from "@adobe/aio-lib-core-logging";
import { Agency } from "./Agency";
import { IAgency } from "../types";
import { AGENCY_STATE_PREFIX, AGENCY_FILE_STORE_DIR, AGENCY_SECRET_INDEX_PREFIX } from "../constants";

/**
 * AgencyManager handles CRUD operations for agencies in the brand application
 * Manages agency storage in both state store and file store
 */
export class AgencyManager {
    private logger: any;
    private stateStore: any;
    private fileStore: any;

    constructor(logLevel: string) {
        this.logger = aioLogger("AgencyManager", { level: logLevel || "info" });
    }

    /**
     * Factory method to create an Agency from JSON data
     * @param json JSON object containing agency data
     * @returns new Agency instance
     * @throws Error if JSON is invalid or missing required properties
     */
    static getAgencyFromJson(json: any): Agency {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid JSON: Input must be a valid JSON object');
        }

        const missingProps: string[] = [];
        if (!json.agencyId) missingProps.push('agencyId');
        if (!json.brandId) missingProps.push('brandId');
        if (!json.name) missingProps.push('name');
        if (!json.endPointUrl) missingProps.push('endPointUrl');
        // Note: secret is NOT required initially (only provided on registration.enabled)

        if (missingProps.length > 0) {
            throw new Error(`Invalid Agency data: Missing required properties: ${missingProps.join(', ')}`);
        }

        return new Agency({
            agencyId: json.agencyId,
            orgId: json.orgId || '', // May not be present in older data
            agencyName: json.agencyName,
            brandId: json.brandId,
            secret: json.secret || '',
            name: json.name,
            endPointUrl: json.endPointUrl,
            agencyEndPointUrl: json.agencyEndPointUrl,
            enabled: json.enabled ?? false,
            logo: json.logo,
            createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
            updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
            enabledAt: json.enabledAt ? new Date(json.enabledAt) : null,
            disabledAt: json.disabledAt ? new Date(json.disabledAt) : null
        });
    }

    /**
     * Factory method to create a new Agency
     * @param data Partial agency data
     * @returns new Agency instance
     */
    static createAgency(data: Partial<IAgency>): Agency {
        const now = new Date();
        return new Agency({
            agencyId: data.agencyId || this.generateAgencyId(),
            orgId: data.orgId || '', // Will be populated from agency_identification
            agencyName: data.agencyName,
            brandId: data.brandId || this.generateBrandId(),
            secret: data.secret || '', // Empty until registration.enabled
            name: data.name || '',
            endPointUrl: data.endPointUrl || '',
            agencyEndPointUrl: data.agencyEndPointUrl,
            enabled: data.enabled ?? false,
            logo: data.logo,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
            enabledAt: data.enabledAt ?? null
        });
    }

    private static generateBrandId(): string {
        return `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private static generateAgencyId(): string {
        return `agency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get the state store
     * @returns Promise<any> - The state store
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
        } else {
            this.logger.debug('State store already initialized');
            return this.stateStore;
        }
    }

    /**
     * Get the file store
     * @returns Promise<any> - The file store
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
        } else {
            this.logger.debug('File store already initialized');
            return this.fileStore;
        }
    }

    /**
     * Get an agency by its ID
     * @param agencyId : string - The agency id to get
     * @returns Promise<Agency | undefined> - The agency
     */
    async getAgency(agencyId: string): Promise<Agency | undefined> {
        let agencyStateFetch: any = undefined;
        
        try {
            agencyStateFetch = await this.getAgencyFromStateStore(agencyId);
        } catch (error) {
            // That's ok, we will check the file store for the agency
            this.logger.info(`Error getting agency from state store ${agencyId}.`);
        }

        if (!agencyStateFetch) {
            this.logger.debug(`agency ${agencyId} not found in state store, checking file store`);
            // Let's check the file store for the agency
            try {
                const agency = await this.getAgencyFromFileStoreByAgencyId(agencyId);

                if (agency) {
                    this.logger.debug(`agency ${agencyId} found in file store, storing in state store`);
                    await this.storeAgencyInStateStore(agency);
                    return agency;
                } else {
                    this.logger.debug(`Agency not found in state store or file store for agencyId ${agencyId}`);
                    return undefined;
                }
            } catch (error) {
                this.logger.error(`Agency not found in state store or file store for agencyId ${agencyId}: ${error}`);
                return undefined;
            }
        } else {
            return agencyStateFetch;
        }
    }

    /**
     * Save the agency to the state store and file store
     * 
     * @param agency - The agency to save
     * 
     * @returns agency : Agency
     */
    async saveAgency(agency: Agency): Promise<Agency> {
        this.logger.debug(`Saving agency ${agency.agencyId} to state store and file store`);
        // Save to state store
        const stateStore = await this.getStateStore();
        const stateStoreKey = `${AGENCY_STATE_PREFIX}${agency.agencyId}`;
        this.logger.debug(`Saving agency ${agency.agencyId} to state store with key ${stateStoreKey}`);
        
        await stateStore.put(stateStoreKey, agency.toJSONString());
        this.logger.debug(`Saved agency ${agency.agencyId} to state store`);

        // Save to file store
        const fileStore = await this.getFileStore();
        await fileStore.write(`${AGENCY_FILE_STORE_DIR}/${agency.agencyId}.json`, agency.toJSONString());
        this.logger.debug(`Saving agency ${agency.agencyId} to file store`);

        // Save secret index if secret exists
        if (agency.hasSecret()) {
            await this.saveSecretIndex(agency.secret, agency.agencyId);
        }

        return agency;
    }

    /**
     * Update an existing agency
     * 
     * @param agencyId - The agency ID to update
     * @param updates - Partial agency data to update
     * @returns Promise<Agency | undefined> - The updated agency
     */
    async updateAgency(agencyId: string, updates: Partial<IAgency>): Promise<Agency | undefined> {
        const existingAgency = await this.getAgency(agencyId);
        
        if (!existingAgency) {
            this.logger.warn(`Agency ${agencyId} not found for update`);
            return undefined;
        }

        // Create updated agency with merged data
        const updatedAgency = new Agency({
            ...existingAgency.toJSON(),
            ...updates,
            agencyId: existingAgency.agencyId, // Never allow agencyId to change
            updatedAt: new Date()
        });

        return await this.saveAgency(updatedAgency);
    }

    /**
     * Delete the agency from the state store and file store
     * 
     * @param agencyId : string - The agency id to delete
     */
    async deleteAgency(agencyId: string): Promise<void> {
        // Get the agency first to get the secret for index cleanup
        const agency = await this.getAgency(agencyId);
        
        // Delete from state store
        try {
            const stateStore = await this.getStateStore();
            await stateStore.delete(`${AGENCY_STATE_PREFIX}${agencyId}`);
        } catch (error) {
            this.logger.warn(`Error deleting agency ${agencyId} from state store: ${error}`);
        }

        // Delete from file store
        try {
            const fileStore = await this.getFileStore();
            await fileStore.delete(`${AGENCY_FILE_STORE_DIR}/${agencyId}.json`);
        } catch (error) {
            this.logger.error(`Error deleting agency ${agencyId} from file store: ${error}`);
        }

        // Delete secret index if agency had a secret
        if (agency && agency.hasSecret()) {
            await this.deleteSecretIndex(agency.secret);
        }
    }

    /**
     * Get all agencies from the file store
     * 
     * @returns Promise<Agency[]> - The agencies
     */
    async getAllAgencies(): Promise<Agency[]> {
        const fileStore = await this.getFileStore();
        const agencyList: Agency[] = [];
        const agencies = await fileStore.list(`${AGENCY_FILE_STORE_DIR}/`);
        this.logger.debug(`Found ${agencies.length} agencies in file store at path ${AGENCY_FILE_STORE_DIR}/`);

        for (const fileData of agencies) {
            this.logger.debug(`Reading agency from file store`, fileData);

            try {
                let agency = await this.getAgencyFromStateStoreByFileName(fileData.name);
                if (!agency) {
                    this.logger.warn(`Agency not found in state store ${fileData.name}`);
                    agency = await this.getAgencyFromFileStoreByFileName(fileData.name);
                    if (agency) {
                        await this.storeAgencyInStateStore(agency);
                        agencyList.push(agency);
                    } else {
                        this.logger.warn(`Agency not found in file store ${fileData.name}`);
                    }
                } else {
                    agencyList.push(agency);
                }
            } catch (error) {
                this.logger.warn(`Error parsing agency from file store ${fileData.name}: ${error}`);
            }
        }
        return agencyList;
    }

    /**
     * Get an agency from the file store by agency id
     * @param agencyId - The agency id to get
     * @returns Promise<Agency> - The agency
     */
    async getAgencyFromFileStoreByAgencyId(agencyId: string): Promise<Agency | undefined> {
        const fileDataName = `${AGENCY_FILE_STORE_DIR}/${agencyId}.json`;
        const agency = await this.getAgencyFromFileStoreByFileName(fileDataName);
        return agency;
    }

    /**
     * Get an agency from the file store by file name
     * @param fileDataName - The file name to get
     * @returns Promise<Agency> - The agency
     */
    async getAgencyFromFileStoreByFileName(fileDataName: string): Promise<Agency | undefined> {
        const fileStore = await this.getFileStore();
        const agencyData = await fileStore.read(fileDataName);
        
        if (!agencyData) {
            this.logger.warn(`Agency not found in file store ${fileDataName}`);
            return undefined;
        }

        const agencyJson = JSON.parse(agencyData);
        const agency = AgencyManager.getAgencyFromJson(agencyJson);
        return agency;
    }

    /**
     * Get an agency from the state store by file name
     * @param fileName - The file name to get
     * @returns Promise<Agency> - The agency
     */
    async getAgencyFromStateStoreByFileName(fileName: string): Promise<Agency | undefined> {
        const agencyId = fileName.replace(`${AGENCY_FILE_STORE_DIR}/`, '').replace('.json', '');
        const agency = await this.getAgencyFromStateStore(agencyId);
        return agency;
    }

    /**
     * Get an agency from the state store
     * @param agencyId - The agency id to get
     * @returns Promise<Agency> - The agency
     */
    async getAgencyFromStateStore(agencyId: string): Promise<Agency | undefined> {
        const stateStore = await this.getStateStore();
        const stateStoreKey = `${AGENCY_STATE_PREFIX}${agencyId}`;
        const agencyData = await stateStore.get(stateStoreKey);

        if (!agencyData || !agencyData.value) {
            this.logger.debug(`Agency not found in state store ${stateStoreKey}`);
            return undefined;
        }

        const agencyJson = JSON.parse(agencyData.value);
        const agency = AgencyManager.getAgencyFromJson(agencyJson);
        return agency;
    }

    /**
     * Store an agency in the state store
     * @param agency - The agency to store
     */
    async storeAgencyInStateStore(agency: Agency): Promise<void> {
        const stateStore = await this.getStateStore();
        const stateStoreKey = `${AGENCY_STATE_PREFIX}${agency.agencyId}`;
        await stateStore.put(stateStoreKey, agency.toJSONString());
        this.logger.debug(`Stored agency ${agency.agencyId} in state store`);
    }

    /**
     * Validate an agency secret
     * @param agencyId - The agency ID
     * @param secret - The secret to validate
     * @returns Promise<boolean> - True if the secret is valid
     */
    async validateAgencySecret(agencyId: string, secret: string): Promise<boolean> {
        const agency = await this.getAgency(agencyId);
        
        if (!agency) {
            this.logger.warn(`Agency ${agencyId} not found for secret validation`);
            return false;
        }

        if (!agency.isEnabled()) {
            this.logger.warn(`Agency ${agencyId} is disabled`);
            return false;
        }

        return agency.validateSecret(secret);
    }

    /**
     * Save a secret index entry mapping secret to agency ID
     * @param secret - The secret to index
     * @param agencyId - The agency ID
     */
    private async saveSecretIndex(secret: string, agencyId: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${AGENCY_SECRET_INDEX_PREFIX}${secret}`;
            await stateStore.put(indexKey, agencyId);
            this.logger.debug(`Saved secret index for agency ${agencyId}`);
        } catch (error) {
            this.logger.error(`Error saving secret index for agency ${agencyId}: ${error}`);
            throw error;
        }
    }

    /**
     * Get agency ID by secret from the index
     * @param secret - The secret to look up
     * @returns Promise<string | undefined> - The agency ID or undefined if not found
     */
    private async getAgencyIdBySecret(secret: string): Promise<string | undefined> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${AGENCY_SECRET_INDEX_PREFIX}${secret}`;
            const result = await stateStore.get(indexKey);
            
            if (!result || !result.value) {
                this.logger.debug(`No agency found for secret in index`);
                return undefined;
            }

            return result.value as string;
        } catch (error) {
            this.logger.error(`Error getting agency ID by secret: ${error}`);
            return undefined;
        }
    }

    /**
     * Delete a secret index entry
     * @param secret - The secret to remove from index
     */
    private async deleteSecretIndex(secret: string): Promise<void> {
        try {
            const stateStore = await this.getStateStore();
            const indexKey = `${AGENCY_SECRET_INDEX_PREFIX}${secret}`;
            await stateStore.delete(indexKey);
            this.logger.debug(`Deleted secret index for secret`);
        } catch (error) {
            this.logger.warn(`Error deleting secret index: ${error}`);
        }
    }

    /**
     * Get an agency by its secret (fast lookup using index)
     * @param secret - The secret to look up
     * @returns Promise<Agency | undefined> - The agency or undefined if not found
     */
    async getAgencyBySecret(secret: string): Promise<Agency | undefined> {
        // Use the secret index to find the agency ID
        const agencyId = await this.getAgencyIdBySecret(secret);
        
        if (!agencyId) {
            this.logger.debug(`No agency found for provided secret`);
            return undefined;
        }

        // Get the full agency object
        const agency = await this.getAgency(agencyId);
        
        if (!agency) {
            this.logger.warn(`Agency ${agencyId} found in index but not in storage`);
            return undefined;
        }

        // Validate that the secret actually matches (double-check)
        if (!agency.validateSecret(secret)) {
            this.logger.warn(`Secret mismatch for agency ${agencyId}`);
            return undefined;
        }

        return agency;
    }

    // ============================================================================
    // Agency-Specific Event Definition Management
    // ============================================================================

    // ============================================================================
    // AGENCY-SPECIFIC ROUTING RULES (App Events Only)
    // OPTIMIZED: Embedded in agency object to reduce state store reads/writes
    // ============================================================================

    /**
     * Get routing rules for an agency-specific app event
     * OPTIMIZED: Rules are embedded in agency object (single read vs. N+1 reads)
     * @param agencyId - The agency ID
     * @param eventCode - The app event code
     * @returns Promise<IRoutingRule[]>
     */
    async getAgencyRoutingRules(agencyId: string, eventCode: string): Promise<any[]> {
        try {
            const agency = await this.getAgency(agencyId);
            if (!agency) {
                this.logger.debug(`Agency ${agencyId} not found`);
                return [];
            }

            const rules = agency.routingRules?.[eventCode] || [];
            this.logger.debug(`Retrieved ${rules.length} routing rules for agency ${agencyId}, event: ${eventCode}`);
            return rules;
        } catch (error: unknown) {
            this.logger.error(`Error getting agency routing rules for ${agencyId}, event ${eventCode}:`, error as any);
            return [];
        }
    }

    /**
     * Add a single routing rule to an agency-specific app event
     * OPTIMIZED: Updates agency object (single write vs. separate write)
     * @param agencyId - The agency ID
     * @param eventCode - The app event code
     * @param rule - The routing rule to add
     * @returns Promise<void>
     */
    async addAgencyRoutingRule(agencyId: string, eventCode: string, rule: any): Promise<void> {
        const agency = await this.getAgency(agencyId);
        if (!agency) {
            throw new Error(`Agency with ID ${agencyId} not found`);
        }

        const routingRules = { ...agency.routingRules };
        const existingRules = routingRules[eventCode] || [];
        
        // Check if rule with same ID already exists
        const existingIndex = existingRules.findIndex((r: any) => r.id === rule.id);
        if (existingIndex >= 0) {
            throw new Error(`Rule with ID ${rule.id} already exists for agency ${agencyId}, event ${eventCode}`);
        }

        existingRules.push(rule);
        routingRules[eventCode] = existingRules;

        // Update agency with new routing rules
        const updatedAgency = AgencyManager.createAgency({
            ...agency.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveAgency(updatedAgency);
        
        this.logger.info(`Added routing rule ${rule.id} for agency ${agencyId}, event: ${eventCode}`);
    }

    /**
     * Update a routing rule for an agency-specific app event
     * OPTIMIZED: Updates agency object (single write vs. separate write)
     * @param agencyId - The agency ID
     * @param eventCode - The app event code
     * @param ruleId - The rule ID to update
     * @param updates - Partial updates to apply
     * @returns Promise<void>
     */
    async updateAgencyRoutingRule(agencyId: string, eventCode: string, ruleId: string, updates: any): Promise<void> {
        const agency = await this.getAgency(agencyId);
        if (!agency) {
            throw new Error(`Agency with ID ${agencyId} not found`);
        }

        const routingRules = { ...agency.routingRules };
        const existingRules = [...(routingRules[eventCode] || [])];
        
        const ruleIndex = existingRules.findIndex((r: any) => r.id === ruleId);
        if (ruleIndex < 0) {
            throw new Error(`Rule with ID ${ruleId} not found for agency ${agencyId}, event ${eventCode}`);
        }

        existingRules[ruleIndex] = {
            ...existingRules[ruleIndex],
            ...updates,
            id: ruleId, // Ensure ID doesn't change
            updatedAt: new Date()
        };

        routingRules[eventCode] = existingRules;

        // Update agency with modified routing rules
        const updatedAgency = AgencyManager.createAgency({
            ...agency.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveAgency(updatedAgency);
        
        this.logger.info(`Updated routing rule ${ruleId} for agency ${agencyId}, event: ${eventCode}`);
    }

    /**
     * Delete a routing rule from an agency-specific app event
     * OPTIMIZED: Updates agency object (single write vs. separate write)
     * @param agencyId - The agency ID
     * @param eventCode - The app event code
     * @param ruleId - The rule ID to delete
     * @returns Promise<void>
     */
    async deleteAgencyRoutingRule(agencyId: string, eventCode: string, ruleId: string): Promise<void> {
        const agency = await this.getAgency(agencyId);
        if (!agency) {
            throw new Error(`Agency with ID ${agencyId} not found`);
        }

        const routingRules = { ...agency.routingRules };
        const existingRules = routingRules[eventCode] || [];
        
        const filteredRules = existingRules.filter((r: any) => r.id !== ruleId);

        if (filteredRules.length === existingRules.length) {
            throw new Error(`Rule with ID ${ruleId} not found for agency ${agencyId}, event ${eventCode}`);
        }

        if (filteredRules.length === 0) {
            // Remove the event code key if no rules left
            delete routingRules[eventCode];
        } else {
            routingRules[eventCode] = filteredRules;
        }

        // Update agency with modified routing rules
        const updatedAgency = AgencyManager.createAgency({
            ...agency.toJSON(),
            routingRules,
            updatedAt: new Date()
        });

        await this.saveAgency(updatedAgency);
        
        this.logger.info(`Deleted routing rule ${ruleId} for agency ${agencyId}, event: ${eventCode}`);
    }

    /**
     * Get all app event codes that have agency-specific routing rules
     * OPTIMIZED: Reads from agency object (single read vs. listing all keys)
     * @param agencyId - The agency ID
     * @returns Promise<string[]>
     */
    async getAgencyEventCodesWithRoutingRules(agencyId: string): Promise<string[]> {
        try {
            const agency = await this.getAgency(agencyId);
            if (!agency) {
                this.logger.debug(`Agency ${agencyId} not found`);
                return [];
            }

            const eventCodes = Object.keys(agency.routingRules || {});
            this.logger.debug(`Found ${eventCodes.length} app events with routing rules for agency ${agencyId}`);
            return eventCodes;
        } catch (error: unknown) {
            this.logger.error(`Error listing agency event codes with routing rules for ${agencyId}:`, error as any);
            return [];
        }
    }
}

