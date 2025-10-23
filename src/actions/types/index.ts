import { CloudEvent } from "cloudevents";

// ============================================================================
// Re-export shared types for backward compatibility
// ============================================================================

export {
    // Event registry types
    IAppEventDefinition,
    IProductEventDefinition,
} from '../../shared/types';

export interface IIoEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
}

export interface IBrand {
    bid: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date;
}

export interface IAgency {
    agencyId: string; // Agency identifier (from agency_identification)
    orgId: string; // Agency's organization ID (from agency_identification)
    brandId: string; // This brand's ID at the agency
    secret: string; // Secret to use when calling this agency
    name: string; // This brand's name as registered with the agency
    endPointUrl: string; // This brand's endpoint URL
    enabled: boolean; // Whether this brand is enabled at the agency
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date | null;
}

export interface IApplicationRuntimeInfo {
    consoleId: string;
    projectName: string;
    workspace: string;
    actionPackageName?: string;
    appName?: string;
}

export interface IValidationResult {
    valid: boolean;
    message?: string;
    missing?: string[];
}

export interface IIoEvent {
    source: string;
    type: string;
    brandId: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): boolean;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface Ia2bEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface Ib2aEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface IS2SAuthenticationCredentials {
    clientId: string;
    clientSecret: string;
    scopes: string;
    orgId: string;
}