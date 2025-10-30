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
    REGISTRATION = 'registration',
    ASSET_SYNC = 'asset_sync',
    WORKFRONT = 'workfront'
}


/**
 * Type helper for event category values
 */
export type EventCategoryValue = `${EventCategory}`;

/**
 * Event Registry Storage Prefixes
 * Used for storing event definitions in App Builder State
 */
export const APP_EVENT_GLOBAL_DEF_PREFIX = 'A-EVENT-GLOBAL-DEF_';
export const PRODUCT_EVENT_DEF_PREFIX = 'P-EVENT-DEF_';
export const APP_EVENT_AGENCY_DEF_PREFIX = 'A-EVENT-AGENCY-DEF_';

/**
 * Event Registry Seeding Key
 */
export const EVENT_REGISTRY_SEEDED_KEY = 'EVENT_REGISTRY_SEEDED';
