import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';
import { IValidationResult, IApplicationRuntimeInfo } from '../../types';
import { A2bEvent } from '../A2bEvent';

export class AssetSyncNewEvent extends A2bEvent {
    private _assetId!: string;
    private _assetPath!: string;
    private _metadata!: any;
    private _brandId!: string;
    private _assetPresignedUrl!: string;

    get assetId(): string { return this._assetId; }
    set assetId(value: string) { this._assetId = value; if (this.data) this.data.asset_id = value; }

    get assetPath(): string { return this._assetPath; }
    set assetPath(value: string) { this._assetPath = value; if (this.data) this.data.asset_path = value; }

    get metadata(): any { return this._metadata; }
    set metadata(value: any) { this._metadata = value; if (this.data) this.data.metadata = value; }

    get brandId(): string { return this._brandId; }
    set brandId(value: string) { this._brandId = value; if (this.data) this.data.brandId = value; }

    get assetPresignedUrl(): string { return this._assetPresignedUrl; }
    set assetPresignedUrl(value: string) { this._assetPresignedUrl = value; if (this.data) this.data.asset_presigned_url = value; }

    /****
     * constructor
     * 
     * @param assetId - the asset id
     * @param assetPath - the asset path
     * @param metadata - the metadata
     * @param brandId - the brand id    
     * @param assetPresignedUrl - the asset presigned url
     * @param sourceProviderId - the source provider id
     * 
     * @returns void
     *******/
    constructor(app_runtime_info: IApplicationRuntimeInfo, assetId: string, assetPath: string, metadata: any, assetPresignedUrl: string, brandId: string, sourceProviderId: string) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.NEW;
        // check for missing params and throw an descriptive error
        if (!app_runtime_info || typeof app_runtime_info !== 'object') {
            throw new Error('AssetSyncNewEvent: constructor: app_runtime_info is required');
        }
        if (!assetId || assetId.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: assetId is required');
        }
        if (!assetPath || assetPath.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: assetPath is required');
        }
        if (!metadata || typeof metadata !== 'object') {
            throw new Error('AssetSyncNewEvent: constructor: metadata is required');
        }
        if (!assetPresignedUrl || assetPresignedUrl.trim().length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: assetPresignedUrl is required');
        }
        if (!brandId || brandId.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: brandId is required');
        }
        if (!sourceProviderId || sourceProviderId.length === 0) {
            this.setSourceUri(app_runtime_info);
        }else{
            // set the event provider source id
            super.setSource(sourceProviderId);
        }

        this._assetId = assetId;
        this._assetPath = assetPath;
        this._metadata = metadata;
        this._assetPresignedUrl = assetPresignedUrl;
        this._brandId = brandId;

        this.data = {
            app_runtime_info: app_runtime_info,
            asset_id: this._assetId,
            asset_path: this._assetPath,
            metadata: this._metadata,
            brandId: this._brandId,
            asset_presigned_url: this._assetPresignedUrl
        };
    }

    /****
     * validate - validate the event
     * 
     * @returns IValidationResult   
     */
    validate(): IValidationResult {
        const ev = this.toJSON();
      
        const missing: string[] = [];
        const isPlainObject = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v);
        const isNonEmptyString = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
        
        // Treat data as present if it's an object or a non-empty JSON string
        let d: any = ev.data;
        if (typeof d === 'string') {
          try { d = JSON.parse(d); } catch { /* leave as string */ }
        }

        if (d && typeof d === 'object' && !Array.isArray(d)) {
          // Relaxed presence-only validation
          if (!isNonEmptyString(d.asset_id)) missing.push('asset_id');
          if (!isNonEmptyString(d.asset_path)) missing.push('asset_path');
          if (!isPlainObject(d.metadata)) missing.push('metadata');
          if (!isNonEmptyString(d.brandId)) missing.push('brandId');
          if (!isNonEmptyString(d.asset_presigned_url)) missing.push('asset_presigned_url');
        }
      
        const valid = missing.length === 0;
        return {
          valid,
          message: valid ? undefined : `AssetSyncNewEvent validation failed: ${missing.join(', ')}`,
          missing: valid ? undefined : missing
        };
    }
}
