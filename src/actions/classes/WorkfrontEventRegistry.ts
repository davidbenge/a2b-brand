/**
 * Workfront Event Registry - Single Source of Truth for Workfront Event Subscriptions
 * 
 * Provides default Workfront event subscription definitions for seeding and convenience functions
 * for accessing persisted event definitions via EventRegistryManager.
 * 
 * NOTE: This file uses Node.js modules (require) and is NOT browser-safe.
 * It should only be imported by actions, not web frontend.
 * 
 * Workfront Object Codes (objCode):
 * - PROJ: Project
 * - TASK: Task
 * - COMPNY: Company
 * - NOTE: Note
 * - OPTASK: Issue (Operational Task)
 * - DOCU: Document
 * 
 * Workfront Event Types:
 * - CREATE: Object was created
 * - UPDATE: Object was updated
 * - DELETE: Object was deleted
 */

/**
 * Workfront event definition structure
 */
export interface IWorkfrontEventDefinition {
    code: string;
    category: string;
    name: string;
    description: string;
    version: string;
    eventBodyexample: any;
    routingRules: string[];
    requiredFields: string[];
    handlerActionName: string;
    callBlocking: boolean;
    
    /** Workfront object code (PROJ, TASK, COMPNY, NOTE, OPTASK, DOCU) */
    workfrontObjCode: string;
    
    /** Workfront event type (CREATE, UPDATE, DELETE) */
    workfrontEventType: 'CREATE' | 'UPDATE' | 'DELETE';
}

/**
 * Default Workfront event subscription definitions
 * These represent the Workfront events that will be registered for event subscriptions
 */
export const DEFAULT_WORKFRONT_EVENTS: Record<string, IWorkfrontEventDefinition> = {
    // ============================================================================
    // PROJECT Events
    // ============================================================================
    'workfront.project.created': {
        code: 'workfront.project.created',
        category: 'product',
        name: 'Workfront Project Created',
        description: 'Emitted when a Workfront project is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'PROJ',
        workfrontEventType: 'CREATE'
    },
    'workfront.project.updated': {
        code: 'workfront.project.updated',
        category: 'product',
        name: 'Workfront Project Updated',
        description: 'Emitted when a Workfront project is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'PROJ',
        workfrontEventType: 'UPDATE'
    },
    'workfront.project.deleted': {
        code: 'workfront.project.deleted',
        category: 'product',
        name: 'Workfront Project Deleted',
        description: 'Emitted when a Workfront project is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'PROJ',
        workfrontEventType: 'DELETE'
    },

    // ============================================================================
    // TASK Events
    // ============================================================================
    'workfront.task.created': {
        code: 'workfront.task.created',
        category: 'product',
        name: 'Workfront Task Created',
        description: 'Emitted when a Workfront task is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'TASK',
        workfrontEventType: 'CREATE'
    },
    'workfront.task.updated': {
        code: 'workfront.task.updated',
        category: 'product',
        name: 'Workfront Task Updated',
        description: 'Emitted when a Workfront task is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'TASK',
        workfrontEventType: 'UPDATE'
    },
    'workfront.task.deleted': {
        code: 'workfront.task.deleted',
        category: 'product',
        name: 'Workfront Task Deleted',
        description: 'Emitted when a Workfront task is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'TASK',
        workfrontEventType: 'DELETE'
    },

    // ============================================================================
    // COMPANY Events
    // ============================================================================
    'workfront.company.created': {
        code: 'workfront.company.created',
        category: 'product',
        name: 'Workfront Company Created',
        description: 'Emitted when a Workfront company is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'COMPNY',
        workfrontEventType: 'CREATE'
    },
    'workfront.company.updated': {
        code: 'workfront.company.updated',
        category: 'product',
        name: 'Workfront Company Updated',
        description: 'Emitted when a Workfront company is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'COMPNY',
        workfrontEventType: 'UPDATE'
    },
    'workfront.company.deleted': {
        code: 'workfront.company.deleted',
        category: 'product',
        name: 'Workfront Company Deleted',
        description: 'Emitted when a Workfront company is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'COMPNY',
        workfrontEventType: 'DELETE'
    },

    // ============================================================================
    // NOTE Events
    // ============================================================================
    'workfront.note.created': {
        code: 'workfront.note.created',
        category: 'product',
        name: 'Workfront Note Created',
        description: 'Emitted when a Workfront note is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'NOTE',
        workfrontEventType: 'CREATE'
    },
    'workfront.note.updated': {
        code: 'workfront.note.updated',
        category: 'product',
        name: 'Workfront Note Updated',
        description: 'Emitted when a Workfront note is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'NOTE',
        workfrontEventType: 'UPDATE'
    },
    'workfront.note.deleted': {
        code: 'workfront.note.deleted',
        category: 'product',
        name: 'Workfront Note Deleted',
        description: 'Emitted when a Workfront note is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'NOTE',
        workfrontEventType: 'DELETE'
    },

    // ============================================================================
    // ISSUE Events (Workfront uses OPTASK for Issues)
    // ============================================================================
    'workfront.issue.created': {
        code: 'workfront.issue.created',
        category: 'product',
        name: 'Workfront Issue Created',
        description: 'Emitted when a Workfront issue is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'OPTASK',
        workfrontEventType: 'CREATE'
    },
    'workfront.issue.updated': {
        code: 'workfront.issue.updated',
        category: 'product',
        name: 'Workfront Issue Updated',
        description: 'Emitted when a Workfront issue is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'OPTASK',
        workfrontEventType: 'UPDATE'
    },
    'workfront.issue.deleted': {
        code: 'workfront.issue.deleted',
        category: 'product',
        name: 'Workfront Issue Deleted',
        description: 'Emitted when a Workfront issue is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'OPTASK',
        workfrontEventType: 'DELETE'
    },

    // ============================================================================
    // DOCUMENT Events
    // ============================================================================
    'workfront.document.created': {
        code: 'workfront.document.created',
        category: 'product',
        name: 'Workfront Document Created',
        description: 'Emitted when a Workfront document is created',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'DOCU',
        workfrontEventType: 'CREATE'
    },
    'workfront.document.updated': {
        code: 'workfront.document.updated',
        category: 'product',
        name: 'Workfront Document Updated',
        description: 'Emitted when a Workfront document is updated',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID', 'name'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'DOCU',
        workfrontEventType: 'UPDATE'
    },
    'workfront.document.deleted': {
        code: 'workfront.document.deleted',
        category: 'product',
        name: 'Workfront Document Deleted',
        description: 'Emitted when a Workfront document is deleted',
        version: '1.0.0',
        eventBodyexample: {},
        routingRules: [],
        requiredFields: ['objCode', 'ID'],
        handlerActionName: 'a2b-brand/adobe-product-event-handler',
        callBlocking: false,
        workfrontObjCode: 'DOCU',
        workfrontEventType: 'DELETE'
    }
};

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get all Workfront events for a specific object type
 * @param objCode Workfront object code (PROJ, TASK, COMPNY, NOTE, OPTASK, DOCU)
 */
export const getWorkfrontEventsByObjCode = (objCode: string): IWorkfrontEventDefinition[] => {
    return Object.values(DEFAULT_WORKFRONT_EVENTS).filter(e => e.workfrontObjCode === objCode);
};

/**
 * Get all Workfront events for a specific event type
 * @param eventType Workfront event type (CREATE, UPDATE, DELETE)
 */
export const getWorkfrontEventsByType = (eventType: 'CREATE' | 'UPDATE' | 'DELETE'): IWorkfrontEventDefinition[] => {
    return Object.values(DEFAULT_WORKFRONT_EVENTS).filter(e => e.workfrontEventType === eventType);
};

/**
 * Get all Workfront event codes
 */
export const getAllWorkfrontEventCodes = (): string[] => {
    return Object.keys(DEFAULT_WORKFRONT_EVENTS);
};

/**
 * Get a specific Workfront event definition by code
 */
export const getWorkfrontEventDefinition = (code: string): IWorkfrontEventDefinition | undefined => {
    return DEFAULT_WORKFRONT_EVENTS[code];
};

/**
 * Get Workfront event definition by objCode and eventType
 * @param objCode Workfront object code (PROJ, TASK, etc.)
 * @param eventType Event type (CREATE, UPDATE, DELETE)
 */
export const getWorkfrontEventByObjCodeAndType = (
    objCode: string, 
    eventType: 'CREATE' | 'UPDATE' | 'DELETE'
): IWorkfrontEventDefinition | undefined => {
    return Object.values(DEFAULT_WORKFRONT_EVENTS).find(
        e => e.workfrontObjCode === objCode && e.workfrontEventType === eventType
    );
};

/**
 * Check if a Workfront event code exists in the registry
 */
export const isValidWorkfrontEventCode = (code: string): boolean => {
    return code in DEFAULT_WORKFRONT_EVENTS;
};

/**
 * Get all supported Workfront object codes
 */
export const getSupportedWorkfrontObjCodes = (): string[] => {
    return [...new Set(Object.values(DEFAULT_WORKFRONT_EVENTS).map(e => e.workfrontObjCode))];
};

/**
 * Get count of events by object code
 */
export const getWorkfrontEventCountByObjCode = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(DEFAULT_WORKFRONT_EVENTS).forEach(event => {
        counts[event.workfrontObjCode] = (counts[event.workfrontObjCode] || 0) + 1;
    });
    return counts;
};

/**
 * Get count of events by event type
 */
export const getWorkfrontEventCountByType = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(DEFAULT_WORKFRONT_EVENTS).forEach(event => {
        counts[event.workfrontEventType] = (counts[event.workfrontEventType] || 0) + 1;
    });
    return counts;
};

