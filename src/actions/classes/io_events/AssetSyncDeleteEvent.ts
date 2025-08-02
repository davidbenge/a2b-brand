import { IoEvent } from '../IoEvent';

export class AssetSyncDeleteEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsync.delete';
        this.data = assetData;
    }
} 