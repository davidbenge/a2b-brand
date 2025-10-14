/**
 * Global constants for the actions
 */

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
    INVALID_JSON: 'Invalid JSON: Input must be a valid JSON object',
    MISSING_PROPERTIES: (props: string[]) => `Invalid data: Missing required properties: ${props.join(', ')}`,
    INVALID_BRAND: 'Invalid brand data provided',
    INVALID_EVENT: 'Invalid event data provided',
    PROCESSING_ERROR: 'Error processing request'
};

// Log Levels
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};

export const BRAND_STATE_PREFIX = 'BRAND_';
export const BRAND_FILE_STORE_DIR = 'brand';

/**
 * Event codes - maintained for backward compatibility
 * Source of truth is now in src/shared/event-registry.ts
 */
export const AGENCY_BRAND_REGISTRATION_EVENT_CODE = {
    DISABLED: 'com.adobe.a2b.registration.disabled',
    RECEIVED: 'com.adobe.a2b.registration.received',
    ENABLED: 'com.adobe.a2b.registration.enabled'
} as const;

export const AEM_ASSET_SYNC_EVENT_CODE = {
    NEW: 'com.adobe.a2b.assetsync.new',
    UPDATE: 'com.adobe.a2b.assetsync.update',
    DELETE: 'com.adobe.a2b.assetsync.delete'
} as const;

export const WORKFRONT_EVENT_CODE = {
    TASK_CREATED: 'com.adobe.a2b.workfront.task.created',
    TASK_UPDATED: 'com.adobe.a2b.workfront.task.updated',
    TASK_COMPLETED: 'com.adobe.a2b.workfront.task.completed'
} as const;