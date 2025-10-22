/**
 * Event Registry - Single Source of Truth for A2B Events
 * 
 * This file is browser-safe and can be imported by both actions and web frontend.
 * Do not import Node-only modules here.
 */

import { ProductEventDefinition } from "../types";
import { EventCategory } from "../constants";

// Import event body examples from docs/events
const aemAssetsMetadataUpdatedBody = require('../../../docs/events/product/aem/aem-assets-asset-metadata-updated-event.json');
const aemAssetsProcessingCompletedBody = require('../../../docs/events/product/aem/aem-assets-asset-processing-complete.json');
/**
 * Central registry of all A2B events with metadata
 */
export const EVENT_REGISTRY: Record<string, ProductEventDefinition> = {};

/**
 * Get all events for a specific category
 */
export const getProductEventsByCategory = (category: ProductEventDefinition['category']): ProductEventDefinition[] => {
    return Object.values(EVENT_REGISTRY).filter(e => e.category === category);
};

/**
 * Get all event codes
 */
export const getAllProductEventCodes = (): string[] => {
    return Object.keys(EVENT_REGISTRY);
};

/**
 * Get a specific event definition by code
 */
export const getProductEventDefinition = (code: string): ProductEventDefinition | undefined => {
    return EVENT_REGISTRY[code];
};

/**
 * Get all available event categories
 */
export const getProductEventCategories = (): Array<ProductEventDefinition['category']> => {
    return [...new Set(Object.values(EVENT_REGISTRY).map(e => e.category))];
};

/**
 * Check if an event code exists in the registry
 */
export const isValidProductEventCode = (code: string): boolean => {
    return code in EVENT_REGISTRY;
};

/**
 * Get event count by category
 */
export const getProductEventCountByCategory = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(EVENT_REGISTRY).forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
};

