/**
 * Brand-related type definitions
 * 
 * These types are shared across:
 * - Backend OpenWhisk actions (src/actions/)
 * - Frontend React app (src/dx-excshell-1/web-src/)
 * - Both a2b-agency and a2b-brand projects
 * 
 * @module shared/types/brand
 */

/**
 * Brand interface representing a registered brand/customer
 * 
 * Used for:
 * - API responses (secret excluded for security)
 * - Database storage (full data including secret)
 * - Frontend display and forms
 * - Backend business logic
 */
export interface IBrand {
    /** Unique identifier for the brand */
    brandId: string;
    
    /** 
     * Shared secret for authenticating webhooks
     * Optional in API responses for security - only included in specific contexts
     */
    secret?: string;
    
    /** Display name of the brand */
    name: string;
    
    /** Webhook endpoint URL where events are sent */
    endPointUrl: string;
    
    /** Whether the brand is currently enabled to receive events */
    enabled: boolean;
    
    /** Base64 encoded logo image (optional) */
    logo?: string;
    
    /** 
     * Timestamp when brand was created
     * Supports both Date object (backend) and string (JSON/API)
     */
    createdAt: Date | string;
    
    /** 
     * Timestamp when brand was last updated
     * Supports both Date object (backend) and string (JSON/API)
     */
    updatedAt: Date | string;
    
    /** 
     * Timestamp when brand was enabled (null if never enabled or currently disabled)
     * Supports both Date object (backend) and string (JSON/API)
     */
    enabledAt: Date | string | null;
}

/**
 * Response structure when posting events to a brand's endpoint
 */
export interface IBrandEventPostResponse {
    /** The type of event that was sent */
    eventType: string;
    
    /** Response message from the brand's webhook endpoint */
    message: string;
}

/**
 * Data structure for creating a new brand
 * All fields required except logo
 */
export interface IBrandCreateData {
    name: string;
    endPointUrl: string;
    secret: string;
    logo?: string;
}

/**
 * Data structure for updating an existing brand
 * All fields optional - only provided fields will be updated
 */
export interface IBrandUpdateData {
    name?: string;
    endPointUrl?: string;
    secret?: string;
    enabled?: boolean;
    logo?: string;
}

/**
 * Simplified brand data for list views (excludes sensitive fields)
 */
export interface IBrandListItem {
    brandId: string;
    name: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}

