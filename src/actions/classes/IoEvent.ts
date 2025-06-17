import { CloudEvent } from 'cloudevents';
import { IIoEvent } from '../types/index';

export abstract class IoEvent implements IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    brandId: string;

    constructor() {
        // Abstract class constructor
        this.datacontenttype = 'application/json';
    }

    validate(): boolean {
        return (
            this.data.bid !== undefined &&
            this.data.brandId !== undefined &&
            this.data.secret !== undefined &&
            this.data.name !== undefined &&
            this.data.endPointUrl !== undefined &&
            typeof this.data.enabled === 'boolean'
        );
    }

    toJSON(): any {
        var returnJson = {
            source: this.source,
            type: this.type,
            datacontenttype: this.datacontenttype,
            id: this.id,
            data: {} as any
        };

        // if the data is an object and has a toJSON function, use it
        if (typeof this.data.toJSON === 'function') {
            returnJson.data = this.data.toJSON();
            returnJson.data.brandId = this.brandId;
        }else{
            returnJson.data = this.data;
            returnJson.data.brandId = this.brandId;
        }
        
        return returnJson;
    }

    setSource(sourceProviderId: string): void {
        this.source = sourceProviderId = `urn:uuid:${sourceProviderId}`;
    }

    toCloudEvent(): CloudEvent {
        const cloudEvent = new CloudEvent(this.toJSON());
        return cloudEvent;
    }

    setBrandId(brandId: string): void {
        this.brandId = brandId;
    }
} 