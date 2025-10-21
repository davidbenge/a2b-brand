/**
 * Shared TypeScript type definitions
 * 
 * This module exports all shared types that can be safely used in:
 * - Backend OpenWhisk actions (Node.js environment)
 * - Frontend React application (Browser environment)
 * - Both a2b-agency and a2b-brand projects
 * 
 * RULES:
 * - NO Node-only modules (fs, path, openwhisk, etc.)
 * - NO browser-only APIs (window, document, etc.)
 * - Keep interfaces pure and serializable
 * - Support both Date objects and string timestamps for JSON compatibility
 * 
 * @module shared/types
 */

import { EventCategoryValue } from '../constants';

// ============================================================================
// Re-export all shared types from submodules
// ============================================================================

// Brand types
export * from './brand';

// Event types
export * from './events';

// API response types
export * from './api';

// Runtime and environment types
export * from './runtime';

// ============================================================================
// Event Registry Types (Backend-specific but need to be here for web display)
// ============================================================================

/**
 * Application event definition
 * Defines events that the application can publish
 */
export interface AppEventDefinition {
    code: string;
    category: EventCategoryValue;
    name: string;
    description: string;
    version: string;
    sendSecretHeader: boolean;
    sendSignedKey: boolean;
    eventBodyexample: any;
    routingRules: string[];
    requiredFields: string[];
    optionalFields?: string[];
    injectedObjects?: string[];
    ioProviderIdEnvVariable: string;
}

/**
 * Product event definition
 * Defines events from Adobe products that the application handles
 */
export interface ProductEventDefinition {
    code: string;
    category: EventCategoryValue;
    name: string;
    description: string;
    version: string;
    eventBodyexample: any;
    routingRules: string[];
    requiredFields: string[];
    optionalFields?: string[];
    handlerActionName: string;
    callBlocking: boolean;
}

// ============================================================================
// Backward Compatibility Aliases
// ============================================================================

import { ILogger } from './runtime';

/**
 * @deprecated Use ILogger from runtime types instead
 * Kept for backward compatibility
 */
export type Logger = ILogger;