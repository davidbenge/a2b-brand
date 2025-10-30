/**
 * API response type definitions
 * 
 * These types are shared across:
 * - Backend OpenWhisk actions (src/actions/)
 * - Frontend React app (src/dx-excshell-1/web-src/)
 * - Both a2b-agency and a2b-brand projects
 * 
 * Standard response formats for all API actions
 * 
 * @module shared/types/api
 */

import { IBrand, IBrandListItem } from './brand';
import { IEventMetadata } from './events';

/**
 * Standard success response structure for all API actions
 */
export interface ApiSuccessResponse<T = any> {
    statusCode: number;
    body: {
        success: true;
        message: string;
        data: T;
        timestamp?: string;
    };
}

/**
 * Standard error response structure for all API actions
 */
export interface ApiErrorResponse {
    statusCode: number;
    body: {
        success: false;
        error: string;
        details?: any;
        timestamp?: string;
    };
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Alternative error response format (used by errorResponse utility)
 * Some actions return errors in this format for compatibility
 */
export interface ApiErrorResponseAlt {
    error: {
        statusCode: number;
        body: {
            error: string;
            details?: any;
        };
    };
}

// ============================================================================
// Brand Management API Response Types
// ============================================================================

/**
 * Response from GET /get-brands action
 */
export interface GetBrandsResponse {
    brands: IBrandListItem[];
    count: number;
}

/**
 * Response from POST /update-brand action (create or update)
 */
export interface UpdateBrandResponse {
    brand: IBrand;
    message: string;
    created?: boolean;
}

/**
 * Response from DELETE /delete-brand action
 */
export interface DeleteBrandResponse {
    message: string;
    brandId: string;
}

// ============================================================================
// Event Registry API Response Types
// ============================================================================

/**
 * Response from GET /list-events action (all events)
 */
export interface ListEventsResponse {
    events: Record<string, IEventMetadata>;
    summary: {
        totalEvents: number;
        categories: string[];
        eventCounts: Record<string, number>;
    };
    timestamp: string;
}

/**
 * Response from GET /list-events?eventCode=X action (specific event)
 */
export interface GetEventResponse {
    event: IEventMetadata;
    timestamp: string;
}

/**
 * Response from GET /list-events?category=X action (filtered by category)
 */
export interface ListEventsByCategoryResponse {
    events: IEventMetadata[];
    category: string;
    count: number;
    timestamp: string;
}

/**
 * Response from GET /list-product-events action
 */
export interface ListProductEventsResponse {
    events: Record<string, IEventMetadata>;
    summary: {
        totalEvents: number;
        categories: string[];
        eventCounts: Record<string, number>;
    };
    timestamp: string;
}

// ============================================================================
// Adobe Product Event Handler Response Types
// ============================================================================

/**
 * Response from POST /adobe-product-event-handler action
 */
export interface ProductEventHandlerResponse {
    message: string;
    eventType: string;
    handler: string;
    result: any;
}

// ============================================================================
// Registration API Response Types (a2b-brand specific)
// ============================================================================

/**
 * Response from brand registration request
 */
export interface BrandRegistrationResponse {
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    registrationId?: string;
}

/**
 * Agency information response (for brand app)
 */
export interface AgencyInfoResponse {
    agencyId: string;
    agencyName: string;
    enabled: boolean;
    registeredAt: Date | string;
    enabledAt: Date | string | null;
}

