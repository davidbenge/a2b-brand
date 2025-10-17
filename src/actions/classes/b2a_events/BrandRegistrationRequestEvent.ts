import { B2aEvent } from '../B2aEvent';
import { IValidationResult } from '../../types/index';

/**
 * BrandRegistrationRequestEvent
 * Event code: com.adobe.b2a.registration.request
 * 
 * Published BY brand when requesting registration WITH agency
 * Consumed BY agency
 */
export class BrandRegistrationRequestEvent extends B2aEvent {
    constructor() {
        super();
        this.type = 'com.adobe.b2a.registration.request';
    }

    /**
     * Validate registration request event
     * Required fields: name, endPointUrl, app_runtime_info
     */
    validate(): IValidationResult {
        const missing: string[] = [];
        
        if (!this.data.name) missing.push('name');
        if (!this.data.endPointUrl) missing.push('endPointUrl');
        if (!this.data.app_runtime_info) missing.push('app_runtime_info');
        
        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `Missing or invalid required field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }
}

