/**
 * Runtime and environment type definitions
 * 
 * These types are shared across:
 * - Backend OpenWhisk actions (src/actions/)
 * - Frontend React app (src/dx-excshell-1/web-src/)
 * - Both a2b-agency and a2b-brand projects
 * 
 * @module shared/types/runtime
 */

/**
 * Application runtime information
 * 
 * Provides context about the Adobe App Builder environment
 * where the application is running. This information is:
 * - Passed to actions via APPLICATION_RUNTIME_INFO parameter
 * - Injected into events for tracing and isolation
 * - Used for setting event source URIs
 */
export interface IApplicationRuntimeInfo {
    /** Adobe I/O Runtime namespace/console ID (e.g., "27200") */
    consoleId: string;
    
    /** Project name in Adobe Developer Console (e.g., "a2b") */
    projectName: string;
    
    /** Workspace name (e.g., "benge", "prod", "stage") */
    workspace: string;
    
    /** Action package name (e.g., "a2b-agency") */
    actionPackageName: string;
    
    /** Application name (e.g., "agency", "brand") */
    appName: string;
}

/**
 * Agency identification information
 * 
 * Provides agency-specific identification that gets injected
 * into events for correlation and tracking across the system.
 */
export interface IAgencyIdentification {
    /** Unique agency identifier (UUID) */
    agency_id: string;
    
    /** Adobe organization ID */
    org_id: string;
}

/**
 * Environment configuration flags
 * 
 * Feature flags and environment-specific settings
 * exposed via AIO_* environment variables
 */
export interface IEnvironmentConfig {
    /** Enable demo mode with mock data */
    DEMO_MODE?: boolean;
    
    /** Log level (debug, info, warn, error) */
    LOG_LEVEL?: string;
    
    /** Enable verbose logging */
    VERBOSE?: boolean;
}

/**
 * Logger interface that works with both Node (aioLogger) and browser (console)
 * 
 * Provides a consistent logging interface across backend and frontend
 */
export interface ILogger {
    /** Log informational messages */
    info(message: string, ...args: any[]): void;
    
    /** Log error messages */
    error(message: string, ...args: any[]): void;
    
    /** Log warning messages */
    warn(message: string, ...args: any[]): void;
    
    /** Log debug messages (optional - may not be available in production) */
    debug?(message: string, ...args: any[]): void;
}

