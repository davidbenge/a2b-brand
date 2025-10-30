/**
 * Event-related type definitions
 * 
 * These types are shared across:
 * - Backend OpenWhisk actions (src/actions/)
 * - Frontend React app (src/dx-excshell-1/web-src/)
 * - Both a2b-agency and a2b-brand projects
 * 
 * @module shared/types/events
 */

/**
 * Validation result returned by event validation methods
 */
export interface IValidationResult {
    /** Whether the validation passed */
    valid: boolean;
    
    /** Optional error message if validation failed */
    message?: string;
    
    /** Array of missing required field names */
    missing?: string[];
}

/**
 * Base event structure following CloudEvents specification
 * Compatible with both a2b (agency-to-brand) and b2a (brand-to-agency) events
 */
export interface IEventBase {
    /** Event source URI (typically the application URL) */
    source: string;
    
    /** Event type in reverse-DNS format (e.g., com.adobe.a2b.assetsync.new) */
    type: string;
    
    /** Content type of the data payload (typically application/json) */
    datacontenttype: string;
    
    /** Event payload data */
    data: any;
    
    /** Unique event identifier (UUID) */
    id: string;
}

/**
 * Agency-to-Brand event data structure
 * Events published BY the agency application TO brand applications
 */
export interface IA2bEventData extends IEventBase {
    /** Event type must start with com.adobe.a2b.* */
    type: `com.adobe.a2b.${string}`;
    
    data: {
        /** Most a2b events include brandId in the data payload */
        brandId?: string;
        
        /** Application runtime context (injected by EventManager) */
        app_runtime_info?: {
            consoleId: string;
            projectName: string;
            workspace: string;
            app_name: string;
            action_package_name: string;
        };
        
        /** Agency identification (injected by EventManager) */
        agency_identification?: {
            agency_id: string;
            org_id: string;
        };
        
        /** Additional event-specific data */
        [key: string]: any;
    };
}

/**
 * Brand-to-Agency event data structure
 * Events published BY brand applications TO the agency application
 */
export interface IB2aEventData extends IEventBase {
    /** Event type must start with com.adobe.b2a.* */
    type: `com.adobe.b2a.${string}`;
    
    data: {
        /** Most b2a events include brandId in the data payload */
        brandId?: string;
        
        /** Additional event-specific data */
        [key: string]: any;
    };
}

/**
 * Event metadata for displaying event information in UI
 */
export interface IEventMetadata {
    /** Event code/type */
    code: string;
    
    /** Category (agency, brand, registration, product) */
    category: string;
    
    /** Display name */
    name: string;
    
    /** Description of what the event represents */
    description: string;
    
    /** Version string (e.g., "1.0.0") */
    version: string;
    
    /** Required fields in the event data */
    requiredFields: string[];
    
    /** Optional fields in the event data */
    optionalFields?: string[];
}

/**
 * Event history entry for tracking sent/received events
 */
export interface IEventHistoryEntry {
    /** Unique identifier for this history entry */
    id: string;
    
    /** Event type */
    eventType: string;
    
    /** Direction: sent or received */
    direction: 'sent' | 'received';
    
    /** Timestamp when event was sent/received */
    timestamp: Date | string;
    
    /** Associated brand ID (if applicable) */
    brandId?: string;
    
    /** Event status */
    status: 'success' | 'failed' | 'pending';
    
    /** Status message or error description */
    message?: string;
    
    /** Full event data (optional, may be excluded for size) */
    eventData?: any;
}

