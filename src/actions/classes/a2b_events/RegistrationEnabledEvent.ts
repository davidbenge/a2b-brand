import { A2bEvent } from '../A2bEvent';
import { IValidationResult } from '../../types';

/**
 * RegistrationEnabledEvent
 * 
 * Event sent to a brand when the agency administrator enables the brand.
 * This event includes the secret that the brand will use for future authenticated communication.
 * 
 * Event Type: com.adobe.a2b.registration.enabled
 * 
 * Required Fields in data:
 * - brandId: The unique identifier for the brand
 * - secret: The shared secret for authenticated communication
 * - enabled: Always true for this event
 * - name: The brand's name
 * - endPointUrl: The brand's endpoint URL
 * - enabledAt: Timestamp when the brand was enabled
 */
export class RegistrationEnabledEvent extends A2bEvent {
    constructor(
        brandId: string,
        secret: string,
        name: string,
        endPointUrl: string,
        enabledAt: Date
    ) {
        super();
        this.type = 'com.adobe.a2b.registration.enabled';
        this.data = {
            brandId,
            secret,
            enabled: true,
            name,
            endPointUrl,
            enabledAt: enabledAt.toISOString()
        };
    }

    /**
     * Validate the event data
     * @returns IValidationResult - validation result
     */
    validate(): IValidationResult {
        const missing: string[] = [];
        if (!this.data.brandId) missing.push('brandId');
        if (!this.data.secret) missing.push('secret');
        if (this.data.enabled !== true) missing.push('enabled (must be true)');
        if (!this.data.name) missing.push('name');
        if (!this.data.endPointUrl) missing.push('endPointUrl');
        if (!this.data.enabledAt) missing.push('enabledAt');

        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `Missing or invalid required field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }
}

