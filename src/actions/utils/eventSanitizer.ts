/**
 * Event Sanitizer Utility
 * 
 * Provides functions to sanitize event data before logging to ensure
 * no sensitive information (secrets, tokens, credentials) is exposed in logs.
 */

/**
 * List of sensitive field names to redact (case-insensitive)
 */
const SENSITIVE_FIELD_PATTERNS = [
  // Secrets and credentials
  /secret/i,
  /password/i,
  /credential/i,
  /token/i,
  /key/i,
  /auth/i,
  
  // Specific field names
  /^x-api-key$/i,
  /^authorization$/i,
  /^x-a2b-agency-secret$/i,
  /^x-a2b-brand-secret$/i,
  /client_secret/i,
  /access_token/i,
  /refresh_token/i,
  /bearer/i,
];

/**
 * Fields that should be partially redacted (show structure but hide sensitive parts)
 */
const PARTIAL_REDACT_PATTERNS = [
  /presigned.*url/i,
  /endpoint.*url/i,
];

/**
 * Check if a field name matches any sensitive pattern
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Check if a field should be partially redacted
 */
function isPartialRedactField(fieldName: string): boolean {
  return PARTIAL_REDACT_PATTERNS.some(pattern => pattern.test(fieldName));
}

/**
 * Partially redact a URL to show structure but hide sensitive query params
 */
function partialRedactUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const hasQueryParams = urlObj.search.length > 0;
    return `${urlObj.protocol}//${urlObj.host}${path}${hasQueryParams ? '?[REDACTED_QUERY_PARAMS]' : ''}`;
  } catch {
    // If URL parsing fails, just show prefix
    return url.substring(0, Math.min(50, url.length)) + '...[REDACTED]';
  }
}

/**
 * Recursively sanitize an object by redacting sensitive fields
 */
function sanitizeObject(obj: any, depth: number = 0, maxDepth: number = 10): any {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1, maxDepth));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this field should be fully redacted
      if (isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      }
      // Check if this field should be partially redacted
      else if (isPartialRedactField(key) && typeof value === 'string') {
        sanitized[key] = partialRedactUrl(value);
      }
      // Recursively sanitize nested objects
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value, depth + 1, maxDepth);
      }
      // Keep primitive values as-is
      else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Sanitize event parameters before logging
 * 
 * This function removes or redacts sensitive information from event data
 * including secrets, tokens, authorization headers, and credentials.
 * 
 * @param params - The event parameters to sanitize
 * @returns Sanitized copy of the parameters safe for logging
 */
export function sanitizeEventForLogging(params: any): any {
  if (!params) {
    return params;
  }

  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(params));

  // Sanitize the entire object recursively
  return sanitizeObject(sanitized);
}

/**
 * Create a log-safe summary of an event
 * 
 * Returns a concise object with key event information safe for logging
 */
export function createEventLogSummary(params: any): any {
  if (!params) {
    return null;
  }

  const summary: any = {
    type: params.type || 'unknown',
    source: params.source || 'unknown',
    id: params.id || 'unknown',
  };

  // Add safe data fields if present
  if (params.data) {
    summary.data = {
      app_runtime_info: params.data.app_runtime_info ? {
        consoleId: params.data.app_runtime_info.consoleId || 'unknown',
        projectName: params.data.app_runtime_info.projectName || 'unknown',
        workspace: params.data.app_runtime_info.workspace || 'unknown',
      } : 'missing',
      brandId: params.data.brandId || 'not_present',
      agencyId: params.data.agencyId || 'not_present',
      asset_id: params.data.asset_id || 'not_present',
      asset_path: params.data.asset_path || 'not_present',
    };
  }

  // Add header info (but sanitized)
  if (params.__ow_headers) {
    summary.headers = {
      'content-type': params.__ow_headers['content-type'] || 'not_present',
      'has_secret_header': !!(
        params.__ow_headers['x-a2b-agency-secret'] || 
        params.__ow_headers['x-a2b-brand-secret']
      ),
    };
  }

  return summary;
}

