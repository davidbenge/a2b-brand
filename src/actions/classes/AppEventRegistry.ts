/**
 * Event Registry - Single Source of Truth for A2B Events
 * 
 * Provides default event definitions for seeding and convenience functions
 * for accessing persisted event definitions via EventRegistryManager.
 * 
 * NOTE: This file now uses Node.js modules (require) and is NOT browser-safe.
 * It should only be imported by actions, not web frontend.
 */

import { IAppEventDefinition } from "../types";
import { EventCategory } from "../../shared/constants";

// Import event body examples from docs/events
const registrationReceivedBody = require('../../../docs/events/registration/com-adobe-a2b-registration-received.json');
const registrationEnabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-enabled.json');
const registrationDisabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-disabled.json');
const assetsyncNewBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-new.json');
const assetsyncUpdateBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-update.json');

/**
 * Default event definitions used for seeding EventRegistryManager on first run
 * These represent the initial/default event configurations
 */
export const DEFAULT_APP_EVENTS: Record<string, IAppEventDefinition> = {
    // Brand Registration Events
    'com.adobe.a2b.registration.received': {
        code: 'com.adobe.a2b.registration.received',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Received',
        description: 'Emitted when a new brand registration is received',
        version: '1.0.0',
        sendSecretHeader: false,
        sendSignedKey: true,
        eventBodyexample: registrationReceivedBody,
        routingRules: [],
        requiredFields: ['name','endPointUrl','app_runtime_info','agency_identification'],
        optionalFields: [],
        injectedObjects: [],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID',
        handlerActionName: 'a2b-brand/agency-registration-internal-handler',
        callBlocking: true
    },
    'com.adobe.a2b.registration.enabled': {
        code: 'com.adobe.a2b.registration.enabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Enabled',
        description: 'Emitted when a brand registration is enabled and secret is provided',
        version: '1.0.0',
        sendSecretHeader: false,
        sendSignedKey: true,
        eventBodyexample: registrationEnabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'secret', 'enabled','name', 'endPointUrl', 'enabledAt','app_runtime_info','agency_identification'],
        optionalFields: [],
        injectedObjects: [],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID',
        handlerActionName: 'a2b-brand/agency-registration-internal-handler',
        callBlocking: true
    },
    'com.adobe.a2b.registration.disabled': {
        code: 'com.adobe.a2b.registration.disabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Disabled',
        description: 'Emitted when a brand registration is disabled by the agency',
        version: '1.0.0',
        sendSecretHeader: false,
        sendSignedKey: true,
        eventBodyexample: registrationDisabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'enabled', 'name', 'endPointUrl', 'disabledAt','app_runtime_info','agency_identification'],
        optionalFields: ['agencyName'],
        injectedObjects: [],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID',
        handlerActionName: 'a2b-brand/agency-registration-internal-handler',
        callBlocking: true
    },

    // Asset Sync Events
    'com.adobe.a2b.assetsync.new': {
        code: 'com.adobe.a2b.assetsync.new',
        category: EventCategory.AGENCY,
        name: 'Asset Sync New',
        description: 'Emitted when a new asset is synced from AEM',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: false,
        eventBodyexample: assetsyncNewBody,
        routingRules: [],
        requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
        optionalFields: [],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID',
        handlerActionName: 'a2b-brand/agency-assetsync-internal-handler',
        callBlocking: true

    },
    'com.adobe.a2b.assetsync.update': {
        code: 'com.adobe.a2b.assetsync.update',
        category: EventCategory.AGENCY,
        name: 'Asset Sync Update',
        description: 'Emitted when an asset is updated in AEM',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: false,
        eventBodyexample: assetsyncUpdateBody,
        routingRules: [],
        requiredFields: ['asset_id', 'brandId','asset_path', 'metadata','app_runtime_info','agency_identification'],
        optionalFields: [],
        injectedObjects: [],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID',
        handlerActionName: 'a2b-brand/agency-assetsync-internal-handler',
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
export const getEventsByCategory = (category: IAppEventDefinition['category']): IAppEventDefinition[] => {
    return Object.values(DEFAULT_APP_EVENTS).filter(e => e.category === category);
};

/**
 * Get all event codes
 * TODO: Make async and use EventRegistryManager
 */
export const getAllEventCodes = (): string[] => {
    return Object.keys(DEFAULT_APP_EVENTS);
};

/**
 * Get a specific event definition by code
 * TODO: Make async and use EventRegistryManager
 */
export const getEventDefinition = (code: string): IAppEventDefinition | undefined => {
    return DEFAULT_APP_EVENTS[code];
};

/**
 * Get all available event categories
 * TODO: Make async and use EventRegistryManager
 */
export const getEventCategories = (): Array<IAppEventDefinition['category']> => {
    return [...new Set(Object.values(DEFAULT_APP_EVENTS).map(e => e.category))];
};

/**
 * Check if an event code exists in the registry
 * TODO: Make async and use EventRegistryManager
 */
export const isValidEventCode = (code: string): boolean => {
    return code in DEFAULT_APP_EVENTS;
};

/**
 * Get event count by category
 * TODO: Make async and use EventRegistryManager
 */
export const getEventCountByCategory = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(DEFAULT_APP_EVENTS).forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
};

