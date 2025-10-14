/**
 * Event Registry - Single Source of Truth for A2B Events
 * 
 * This file is browser-safe and can be imported by both actions and web frontend.
 * Do not import Node-only modules here.
 */

export interface EventDefinition {
    code: string;
    category: 'brand-registration' | 'asset-sync' | 'workfront';
    name: string;
    description: string;
    eventClass: string;
    version: string;
    requiredFields: string[];
    optionalFields?: string[];
}

/**
 * Central registry of all A2B events with metadata
 */
export const EVENT_REGISTRY: Record<string, EventDefinition> = {
    // Brand Registration Events
    'com.adobe.a2b.registration.disabled': {
        code: 'com.adobe.a2b.registration.disabled',
        category: 'brand-registration',
        name: 'Brand Registration Disabled',
        description: 'Emitted when a brand registration is disabled',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        requiredFields: ['brandId', 'enabled'],
        optionalFields: ['name', 'endPointUrl', 'secret']
    },
    'com.adobe.a2b.registration.received': {
        code: 'com.adobe.a2b.registration.received',
        category: 'brand-registration',
        name: 'Brand Registration Received',
        description: 'Emitted when a new brand registration is received',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        requiredFields: ['brandId', 'name', 'endPointUrl', 'enabled'],
        optionalFields: ['secret']
    },
    'com.adobe.a2b.registration.enabled': {
        code: 'com.adobe.a2b.registration.enabled',
        category: 'brand-registration',
        name: 'Brand Registration Enabled',
        description: 'Emitted when a brand registration is enabled',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        requiredFields: ['brandId', 'enabled'],
        optionalFields: ['name', 'endPointUrl', 'secret']
    },

    // Asset Sync Events
    'com.adobe.a2b.assetsync.new': {
        code: 'com.adobe.a2b.assetsync.new',
        category: 'asset-sync',
        name: 'Asset Sync New',
        description: 'Emitted when a new asset is synced from AEM',
        eventClass: 'AssetSyncNewEvent',
        version: '1.0.0',
        requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
        optionalFields: ['app_runtime_info']
    },
    'com.adobe.a2b.assetsync.update': {
        code: 'com.adobe.a2b.assetsync.update',
        category: 'asset-sync',
        name: 'Asset Sync Update',
        description: 'Emitted when an asset is updated in AEM',
        eventClass: 'AssetSyncUpdateEvent',
        version: '1.0.0',
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path', 'metadata', 'app_runtime_info']
    },
    'com.adobe.a2b.assetsync.delete': {
        code: 'com.adobe.a2b.assetsync.delete',
        category: 'asset-sync',
        name: 'Asset Sync Delete',
        description: 'Emitted when an asset is deleted in AEM',
        eventClass: 'AssetSyncDeleteEvent',
        version: '1.0.0',
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path', 'app_runtime_info']
    },

    // Workfront Events
    'com.adobe.a2b.workfront.task.created': {
        code: 'com.adobe.a2b.workfront.task.created',
        category: 'workfront',
        name: 'Workfront Task Created',
        description: 'Emitted when a task is created in Workfront',
        eventClass: 'WorkfrontTaskCreatedEvent',
        version: '1.0.0',
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate']
    },
    'com.adobe.a2b.workfront.task.updated': {
        code: 'com.adobe.a2b.workfront.task.updated',
        category: 'workfront',
        name: 'Workfront Task Updated',
        description: 'Emitted when a task is updated in Workfront',
        eventClass: 'WorkfrontTaskUpdatedEvent',
        version: '1.0.0',
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate', 'status']
    },
    'com.adobe.a2b.workfront.task.completed': {
        code: 'com.adobe.a2b.workfront.task.completed',
        category: 'workfront',
        name: 'Workfront Task Completed',
        description: 'Emitted when a task is completed in Workfront',
        eventClass: 'WorkfrontTaskCompletedEvent',
        version: '1.0.0',
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'completedDate', 'completedBy']
    }
};

/**
 * Get all events for a specific category
 */
export const getEventsByCategory = (category: EventDefinition['category']): EventDefinition[] => {
    return Object.values(EVENT_REGISTRY).filter(e => e.category === category);
};

/**
 * Get all event codes
 */
export const getAllEventCodes = (): string[] => {
    return Object.keys(EVENT_REGISTRY);
};

/**
 * Get a specific event definition by code
 */
export const getEventDefinition = (code: string): EventDefinition | undefined => {
    return EVENT_REGISTRY[code];
};

/**
 * Get all available event categories
 */
export const getEventCategories = (): Array<EventDefinition['category']> => {
    return [...new Set(Object.values(EVENT_REGISTRY).map(e => e.category))];
};

/**
 * Check if an event code exists in the registry
 */
export const isValidEventCode = (code: string): boolean => {
    return code in EVENT_REGISTRY;
};

/**
 * Get event count by category
 */
export const getEventCountByCategory = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(EVENT_REGISTRY).forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
};

