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
const registrationDisabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-disabled.json');
const registrationReceivedBody = require('../../../docs/events/registration/com-adobe-a2b-registration-received.json');
const registrationEnabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-enabled.json');
const assetsyncNewBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-new.json');
const assetsyncUpdateBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-update.json');
const assetsyncDeleteBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-delete.json');
const workfrontTaskCreatedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-created.json');
const workfrontTaskUpdatedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-updated.json');
const workfrontTaskCompletedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-completed.json');
const aemAssetsMetadataUpdatedBody = require('../../../docs/events/product/aem/aem-assets-asset-metadata-updated-event.json');

/**
 * Default event definitions used for seeding EventRegistryManager on first run
 * These represent the initial/default event configurations
 */
export const DEFAULT_APP_EVENTS: Record<string, IAppEventDefinition> = {
    // Brand Registration Events
    'com.adobe.a2b.registration.disabled': {
        code: 'com.adobe.a2b.registration.disabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Disabled',
        description: 'Emitted when a brand registration is disabled',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: registrationDisabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'enabled','endPointUrl'],
        optionalFields: [],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID'
    },
    'com.adobe.a2b.registration.received': {
        code: 'com.adobe.a2b.registration.received',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Received',
        description: 'Emitted when a new brand registration is received',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: registrationReceivedBody,
        routingRules: [],
        requiredFields: ['name', 'endPointUrl'],
        optionalFields: [],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID'
    },
    'com.adobe.a2b.registration.enabled': {
        code: 'com.adobe.a2b.registration.enabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Enabled',
        description: 'Emitted when a brand registration is enabled and secret is provided',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: registrationEnabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'secret', 'enabled'],
        optionalFields: ['name', 'endPointUrl', 'enabledAt'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID'
    },

    // Asset Sync Events
    'com.adobe.a2b.assetsync.new': {
        code: 'com.adobe.a2b.assetsync.new',
        category: EventCategory.AGENCY,
        name: 'Asset Sync New',
        description: 'Emitted when a new asset is synced from AEM',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: assetsyncNewBody,
        routingRules: [],
        requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
        optionalFields: [],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID'
    },
    'com.adobe.a2b.assetsync.update': {
        code: 'com.adobe.a2b.assetsync.update',
        category: EventCategory.AGENCY,
        name: 'Asset Sync Update',
        description: 'Emitted when an asset is updated in AEM',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: assetsyncUpdateBody,
        routingRules: [],
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path', 'metadata'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID'   
    },
    'com.adobe.a2b.assetsync.delete': {
        code: 'com.adobe.a2b.assetsync.delete',
        category: EventCategory.AGENCY,
        name: 'Asset Sync Delete',
        description: 'Emitted when an asset is deleted in AEM',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: assetsyncDeleteBody,
        routingRules: [],
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID'
    },

    // Workfront Events (Agency events - com.adobe.a2b.* = agency-published)
    'com.adobe.a2b.workfront.task.created': {
        code: 'com.adobe.a2b.workfront.task.created',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Created',
        description: 'Emitted when a task is created in Workfront',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: workfrontTaskCreatedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_WORKFRONT_SYNC_PROVIDER_ID'
    },
    'com.adobe.a2b.workfront.task.updated': {
        code: 'com.adobe.a2b.workfront.task.updated',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Updated',
        description: 'Emitted when a task is updated in Workfront',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: workfrontTaskUpdatedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate', 'status'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_WORKFRONT_SYNC_PROVIDER_ID'
    },
    'com.adobe.a2b.workfront.task.completed': {
        code: 'com.adobe.a2b.workfront.task.completed',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Completed',
        description: 'Emitted when a task is completed in Workfront',
        version: '1.0.0',
        sendSecretHeader: true,
        sendSignedKey: true,
        eventBodyexample: workfrontTaskCompletedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'completedDate', 'completedBy'],
        injectedObjects: ['app_runtime_info','agency_identification'],
        ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_WORKFRONT_SYNC_PROVIDER_ID'
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

