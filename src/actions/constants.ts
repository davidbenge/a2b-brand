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