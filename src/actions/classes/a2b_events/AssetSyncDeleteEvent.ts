import { A2bEvent } from '../A2bEvent';
import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';
import { IValidationResult } from '../../types';

export class AssetSyncDeleteEvent extends A2bEvent {
    constructor(assetData: any) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.DELETE;
        this.data = assetData;
    }

    validate(): IValidationResult {
        console.log(`AssetSyncNewEvent: validate: assetData`, JSON.stringify(this, null, 2));
        const missing: string[] = [];
        if (this.data.asset_id === undefined) missing.push('asset_id');
        if (this.data.asset_path === undefined) missing.push('asset_path');
        if (this.data.metadata === undefined) missing.push('metadata');
        if (this.data.brandId === undefined) missing.push('brandId');
        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `AssetSyncNewEvent validation failed: missing field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }
}
