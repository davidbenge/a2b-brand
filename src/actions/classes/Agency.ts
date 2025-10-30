import { IAgency } from '../types';

/**
 * Agency class represents a brand's registration with an agency
 * Stores the brand's identity at the agency and authentication credentials
 * 
 * Supports 1-to-many relationship: One brand can work with multiple agencies
 * Each agency is identified by agencyId and orgId from agency_identification
 */
export class Agency implements IAgency {
    readonly agencyId: string; // Agency identifier (from agency_identification)
    readonly orgId: string; // Agency's organization ID (from agency_identification)
    readonly brandId: string; // This brand's ID at the agency
    readonly secret: string; // Secret to use when calling this agency
    readonly name: string; // This brand's name as registered with the agency
    readonly endPointUrl: string; // This brand's endpoint URL
    readonly enabled: boolean; // Whether this brand is enabled at the agency
    readonly logo?: string;
    readonly routingRules?: { [eventCode: string]: any[] };
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly enabledAt: Date | null;

    constructor(params: IAgency) {
        // Validate required fields
        if (!params.agencyId) throw new Error('agencyId is required');
        if (!params.orgId) throw new Error('orgId is required');
        if (!params.brandId) throw new Error('brandId is required');
        if (!params.name) throw new Error('name is required');
        if (!params.endPointUrl) throw new Error('endPointUrl is required');
        // Note: secret is NOT required initially (only provided on registration.enabled)

        this.agencyId = params.agencyId;
        this.orgId = params.orgId;
        this.brandId = params.brandId;
        this.secret = params.secret || ''; // Empty until registration.enabled
        this.name = params.name;
        this.endPointUrl = params.endPointUrl;
        this.enabled = params.enabled ?? false;
        this.logo = params.logo;
        this.routingRules = params.routingRules || {};
        this.createdAt = params.createdAt ?? new Date();
        this.updatedAt = params.updatedAt ?? new Date();
        this.enabledAt = params.enabledAt ?? null;
    }

    /**
     * Convert the instance to a JSON object
     * @returns JSON representation of the agency
     */
    toJSON(): IAgency {
        return {
            agencyId: this.agencyId,
            orgId: this.orgId,
            brandId: this.brandId,
            secret: this.secret,
            name: this.name,
            endPointUrl: this.endPointUrl,
            enabled: this.enabled,
            logo: this.logo,
            routingRules: this.routingRules,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            enabledAt: this.enabledAt
        };
    }

    /**
     * Convert the instance to a JSON string
     * @returns JSON string representation of the agency
     */
    toJSONString(): string {
        return JSON.stringify(this.toJSON());
    }

    /**
     * Validate if all required fields are present
     * @returns true if all required fields are filled
     */
    isValid(): boolean {
        return Boolean(
            this.agencyId &&
            this.orgId &&
            this.brandId &&
            this.name &&
            this.endPointUrl
        );
    }

    /**
     * Check if the agency has a secret (i.e., registration.enabled has been received)
     * @returns true if the secret is present
     */
    hasSecret(): boolean {
        return Boolean(this.secret && this.secret.length > 0);
    }

    /**
     * Validate incoming request secret against stored secret
     * @param requestSecret The secret from the incoming request header
     * @returns true if the secrets match
     */
    validateSecret(requestSecret: string): boolean {
        return this.secret === requestSecret;
    }

    /**
     * Check if this agency is enabled
     * @returns true if the agency is enabled
     */
    isEnabled(): boolean {
        return this.enabled === true;
    }

    /**
     * Get a safe representation without exposing the secret
     * @returns Agency object with redacted secret
     */
    toSafeJSON(): Partial<IAgency> {
        return {
            agencyId: this.agencyId,
            orgId: this.orgId,
            brandId: this.brandId,
            name: this.name,
            endPointUrl: this.endPointUrl,
            enabled: this.enabled,
            logo: this.logo,
            routingRules: this.routingRules,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            enabledAt: this.enabledAt
            // secret is intentionally omitted
        };
    }
}

