/**
 * Shared Rules Types
 * 
 * Type definitions for routing rules used by both actions and web frontend.
 * These types are browser-safe and can be imported anywhere.
 */

import { Logger } from ".";

/**
 * No-op logger for when logging is not needed
 */
export const noOpLogger: Logger = {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {}
};

/**
 * Console logger for browser environments
 */
export const consoleLogger: Logger = {
    info: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    debug: console.debug.bind(console)
};

/**
 * Generic event type metadata interface
 * Can be satisfied by EventDefinition or EventTypeMetadata from different systems
 */
export interface IEventTypeMetadata {
    type?: string;          // Event type identifier (e.g., 'aem.assets.asset.created')
    code?: string;          // Event code (e.g., 'com.adobe.a2b.registration.disabled')
    category: string;       // Event category
    name?: string;          // Display name
    description: string;    // Event description
    handler?: string;       // Handler name
    [key: string]: any;     // Allow additional properties
}


export interface IRoutingRule {
    id: string;
    name: string;
    description: string;
    eventType: string;
    direction: 'inbound' | 'outbound' | 'both';
    targetBrands: string[]; // Array of brand IDs this rule applies to
    conditions: IRuleCondition[];
    actions: IRuleAction[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IRuleCondition {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists' | 'notExists';
    value: any;
    logicalOperator?: 'AND' | 'OR';
}

export interface IRuleAction {
    type: 'route' | 'transform' | 'filter' | 'log';
    target?: string;
    parameters?: Record<string, any>;
}

export interface IRuleEvaluationResult {
    ruleId: string;
    matched: boolean;
    actions: IRuleAction[];
    executionTime: number;
}
