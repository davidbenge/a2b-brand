import { A2bEvent } from '../A2bEvent';
import { IValidationResult } from '../../types';

/**
 * RegistrationDisabledEvent
 * 
 * Event sent to a brand when the agency administrator disables the brand.
 * This notifies the brand that it should no longer expect to receive events from this agency.
 * 
 * Event Type: com.adobe.a2b.registration.disabled
 * 
 * Required Fields in data:
 * - brandId: The unique identifier for the brand
 * - enabled: Always false for this event
 * - name: The brand's name
 * - endPointUrl: The brand's endpoint URL
 */
export class RegistrationDisabledEvent extends A2bEvent {
    constructor(
        brandId: string,
        name: string,
        endPointUrl: string
    ) {
        super();
        this.type = 'com.adobe.a2b.registration.disabled';
        this.data = {
            brandId,
            enabled: false,
            name,
            endPointUrl,
            disabledAt: new Date().toISOString()
        };
    }

    /**
     * Validate the event data
     * @returns IValidationResult - validation result
     */
    validate(): IValidationResult {
        const missing: string[] = [];
        if (!this.data.brandId) missing.push('brandId');
        if (this.data.enabled !== false) missing.push('enabled (must be false)');
        if (!this.data.name) missing.push('name');
        if (!this.data.endPointUrl) missing.push('endPointUrl');

        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `Missing or invalid required field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }
}

