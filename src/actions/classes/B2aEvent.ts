import { CloudEvent } from 'cloudevents';
import { Ib2aEvent, IValidationResult } from '../types/index';
import { v4 as uuidv4 } from 'uuid';
import { IApplicationRuntimeInfo } from '../types/index';

/**
 * B2aEvent - Base class for Brand-to-Agency events
 * Events published BY brands, consumed by the agency
 */
export abstract class B2aEvent implements Ib2aEvent {
    source!: string;
    type!: string;
    datacontenttype: string;
    data: any;
    id: string;

    constructor() {
        // Abstract class constructor
        this.datacontenttype = 'application/json';
        this.id = uuidv4(); // set the id
        this.data = {};
    }

    /**
     * Default validation for b2a events
     * Subclasses can override this for specific validation rules
     */
    validate(): IValidationResult {
        const missing: string[] = [];
        // Basic validation - most b2a events will have app_runtime_info
        if (!this.data.app_runtime_info) missing.push('app_runtime_info');
        
        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `Missing or invalid required field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }

    /****
     * toJSON - convert the event to a JSON object
     * 
     * @returns any
     *******/
    toJSON(): any {
        var returnJson = {
            source: `${this.source}`,
            type: `${this.type}`,
            datacontenttype: `${this.datacontenttype}`,
            id: `${this.id}`,
            data: this.data
        };
        
        return JSON.stringify(returnJson);
    }

    setSource(sourceInput: string): void {
        const isUrnUuid = (v: string) => /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
        const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
        const isHttpUrl = (v: string) => {
            try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
        };

        const sanitize = (v: unknown): string => {
            let s = String(v ?? '');
            // strip angle brackets and zero-width/BOM
            s = s.replace(/^<|>$/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
            return s;
        };

        const input = sanitize(sourceInput);
        if (input.length === 0) {
            this.source = input;
            return;
        }

        if (isUrnUuid(input) || isHttpUrl(input)) {
            this.source = input;
        } else if (isUuid(input)) {
            this.source = `urn:uuid:${input}`;
        } else {
            // fallback: assign as-is to comply with CloudEvents URI-reference flexibility
            this.source = input;
        }
    }

    setSourceUri(applicationRuntimeInfo: IApplicationRuntimeInfo): void {
         this.setSource(`https://${applicationRuntimeInfo.consoleId}-${applicationRuntimeInfo.projectName}-${applicationRuntimeInfo.workspace}.adobeio-static.net`);
    }

    toCloudEvent(): CloudEvent {
        const cloudEvent = new CloudEvent({"type": this.type, "source": this.source, "data": this.data ,"datacontenttype": this.datacontenttype, "id": this.id});
        return cloudEvent;
    }

}

