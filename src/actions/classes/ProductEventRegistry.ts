/**
 * Product Event Registry - Single Source of Truth for Adobe Product Events
 * 
 * Provides default product event definitions for seeding and convenience functions
 * for accessing persisted event definitions via EventRegistryManager.
 * 
 * NOTE: This file now uses Node.js modules (require) and is NOT browser-safe.
 * It should only be imported by actions, not web frontend.
 */

import { IProductEventDefinition } from "../types";
import { EventCategory } from "../../shared/constants";

// Import event body examples from docs/events
const aemAssetsMetadataUpdatedBody = require('../../../docs/events/product/aem/aem-assets-asset-metadata-updated-event.json');
const aemAssetsProcessingCompletedBody = require('../../../docs/events/product/aem/aem-assets-asset-processing-complete.json');

/**
 * Default product event definitions used for seeding EventRegistryManager on first run
 * These represent the initial/default product event configurations
 */
export const DEFAULT_PRODUCT_EVENTS: Record<string, IProductEventDefinition> = {
    // Product Events
    'aem.assets.asset.metadata_updated': {
        code: 'aem.assets.asset.metadata_updated',
        category: EventCategory.PRODUCT,
        name: 'AEM Asset Metadata Updated',
        description: 'Emitted when the metadata of an AEM asset is updated',
        version: '1.0.0',
        eventBodyexample: aemAssetsMetadataUpdatedBody,
        routingRules: [],
        requiredFields: ['assetId,repositoryMetadata'],
        handlerActionName: 'a2b-agency/agency-assetsync-internal-handler-metadata-updated',
        callBlocking: true
    },
    'aem.assets.asset.processing_completed': {
        code: 'aem.assets.asset.processing_completed',
        category: EventCategory.PRODUCT,
        name: 'AEM Assets Processing Completed',
        description: 'Emitted when the processing of an AEM asset is completed',
        version: '1.0.0',
        eventBodyexample: aemAssetsProcessingCompletedBody,
        routingRules: [],
        requiredFields: ['assetId,repositoryMetadata'],
        handlerActionName: 'a2b-agency/agency-assetsync-internal-handler-process-complete',
        callBlocking: true
    }
};

// ============================================================================
// Convenience Functions - Will use EventRegistryManager for persistence
// ============================================================================
// NOTE: These functions are synchronous for now but will become async
// when EventRegistryManager is integrated. Keeping sync for backward compatibility
// during migration.

/**
 * Get all events for a specific category
 * TODO: Make async and use EventRegistryManager
 */
export const getProductEventsByCategory = (category: IProductEventDefinition['category']): IProductEventDefinition[] => {
    return Object.values(DEFAULT_PRODUCT_EVENTS).filter(e => e.category === category);
};

/**
 * Get all event codes
 * TODO: Make async and use EventRegistryManager
 */
export const getAllProductEventCodes = (): string[] => {
    return Object.keys(DEFAULT_PRODUCT_EVENTS);
};

/**
 * Get a specific event definition by code
 * TODO: Make async and use EventRegistryManager
 */
export const getProductEventDefinition = (code: string): IProductEventDefinition | undefined => {
    return DEFAULT_PRODUCT_EVENTS[code];
};

/**
 * Get all available event categories
 * TODO: Make async and use EventRegistryManager
 */
export const getProductEventCategories = (): Array<IProductEventDefinition['category']> => {
    return [...new Set(Object.values(DEFAULT_PRODUCT_EVENTS).map(e => e.category))];
};

/**
 * Check if an event code exists in the registry
 * TODO: Make async and use EventRegistryManager
 */
export const isValidProductEventCode = (code: string): boolean => {
    return code in DEFAULT_PRODUCT_EVENTS;
};

/**
 * Get event count by category
 * TODO: Make async and use EventRegistryManager
 */
export const getProductEventCountByCategory = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(DEFAULT_PRODUCT_EVENTS).forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
};

