/**
 * Shared Constants
 * 
 * Constants that can be used by both actions and web frontend.
 * Browser-safe - no Node.js dependencies.
 */

/**
 * Event categories for A2B events
 */
export enum EventCategory {
    AGENCY = 'agency',
    BRAND = 'brand',
    PRODUCT = 'product',
    REGISTRATION = 'registration'
}

/**
 * Type helper for event category values
 */
export type EventCategoryValue = `${EventCategory}`;

