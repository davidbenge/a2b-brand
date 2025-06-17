import { IoEvent } from '../IoEvent';

export class AssetSynchDeleteEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.delete';
        this.data = assetData;
    }
} 