# Asset Import from URL Requirement

## Overview

This document defines the requirements for enhancing the A2B Brand application to handle `com.adobe.a2b.assetsync.new` events by importing assets from a source URL into a target AEM (Adobe Experience Manager) environment using the Adobe Experience Manager Assets Author API.

## Current Architecture Analysis

### Existing Event Flow
1. **agency-event-handler** receives `com.adobe.a2b.assetsync.new` events
2. Routes events that start with `com.adobe.a2b.assetsync` to **agency-assetsync-internal-handler**
3. **agency-assetsync-internal-handler** currently only publishes the event to Adobe I/O Events
4. No actual asset synchronization or import occurs

### Event Structure
The incoming event contains (see also `docs/events/custom/com_adobe_a2b_assetsync_new.json`):
```json
{
  "source": "urn:uuid:af5c4d93-e1e0-4985-ad33-80fde3837aaa",
  "S2S_API_KEY": "5cd2e1d50176486a8521d82da35f504c",
  "S2S_CLIENT_SECRET": "p8e-WsYCHx1jaXJe82sH5L34A--hVJHl77ZQ",
  "data": {
    "app_runtime_info": {
      "action_package_name": "a2b-agency",
      "app_name": "agency",
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "benge"
    },
    "asset_id": "e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
    "asset_path": "/content/dam/benge/sad_elmo.webp",
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
    "metadata": {
      "Iptc4xmpCore:CreatorContactInfo": {
        "jcr:primaryType": "nt:unstructured"
      },
      "a2b__customers": [
        "c6409c52-9295-4d15-94e6-7bd39d04360c"
      ],
      "a2b__sync_on_change": true,
      "a2b__synch_on_change": true,
      "a2d__customers": [
        "4312f812-55e9-414b-8344-334b1f6201db"
      ],
      "cq:tags": [
        "properties:orientation/square"
      ],
      "dam:activationTarget": "delivery",
      "dam:colorDistribution": {
        "jcr:primaryType": "nt:unstructured"
      },
      "dam:extracted": "Fri Oct 25 2024 18:11:57 GMT+0000",
      "dam:hasC2PAManifest": true,
      "dam:isAiGenerated": true,
      "dam:predictedColors": [
        16035,
        12022,
        15019,
        25015,
        40010
      ],
      "dam:sha1": "035e7a2fdff69cb94ce651d92e7625d80a749795",
      "dam:size": 268812,
      "dam:status": "approved",
      "dc:description": "sad elmo 53",
      "dc:format": "image/webp",
      "imageFeatures": {
        ":haystack0": 8192,
        "jcr:lastModified": "Fri Oct 25 2024 18:11:51 GMT+0000",
        "jcr:primaryType": "nt:unstructured"
      },
      "jcr:mixinTypes": [
        "cq:Taggable"
      ],
      "jcr:primaryType": "nt:unstructured",
      "monkey_test": "test monkey 1",
      "predictedTags": {
        "jcr:primaryType": "nt:unstructured"
      },
      "tiff:ImageLength": 1024,
      "tiff:ImageWidth": 1024
    }
  },
  "__ow_method": "post",
  "AIO_runtime_namespace": "",
  "id": "277022fd-13de-4589-8391-0f01c03e8cd7",
  "__ow_headers": {
    "accept-encoding": "br, gzip, deflate",
    "connection": "close",
    "content-type": "application/json",
    "host": "controller-ns-team-ethos651prodva6-runtime-prod-a",
    "perf-br-req-in": "1755147444.513",
    "sec-fetch-mode": "cors",
    "user-agent": "Amazon CloudFront",
    "via": "1.1 61296aba80c2d50aaa865cf5dbceff6c.cloudfront.net (CloudFront), 1.1 4d455abe9c408ddc198b94f7ff4a91ea.cloudfront.net (CloudFront)",
    "x-amz-cf-id": "HH9a5vFmN4xa89KQmyf_D8URBPqbZ9RAubH1SOH4lL_us8DxzzZKBw==",
    "x-envoy-external-address": "130.176.179.210",
    "x-forwarded-for": "44.207.149.158, 44.198.186.150, 130.176.179.210, 10.152.173.127",
    "x-forwarded-host": "27200-brand2agency-benge.adobeioruntime.net",
    "x-forwarded-port": "80",
    "x-forwarded-proto": "https",
    "x-real-ip": "10.152.173.127",
    "x-request-id": "ZQl3q8uPlhpNjb2OjEQhUTvcPVLFpBKa"
  },
  "AIO_runtime_auth": "",
  "AIO_runtime_apihost": "",
  "type": "com.adobe.a2b.assetsync.new",
  "S2S_SCOPES": "[\"AdobeID\",\"openid\",\"read_organizations\",\"additional_info.projectedProductContext\",\"additional_info.roles\",\"adobeio_api\",\"read_client_secret\",\"manage_client_secrets\",\"event_receiver_api\"]",
  "LOG_LEVEL": "debug",
  "datacontenttype": "application/json",
  "__ow_path": "",
  "ORG_ID": "33C1401053CF76370A490D4C@AdobeOrg",
  "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"\",\"app_name\":\"brand\",\"action_package_name\":\"a2b-brand\"}"
}
```

## Requirements

### 1. Environment Configuration Enhancement

#### Required New Environment Variables
Add to `.env` file the following configuration for the target AEM environment:

```bash
# =============================================================================
# TARGET AEM ENVIRONMENT CONFIGURATION
# =============================================================================
# Target AEM server host (e.g., https://author-p12345-e67890.adobeaemcloud.com)
SYNC_TARGET_AEM_HOST=https://your-target-aem-author-server.com

# Target AEM authentication configuration
SYNC_TARGET_AEM_AUTH_TYPE=jwt
SYNC_TARGET_AEM_AUTH_CLIENT_ID=cm-your-target-client-id-integration
SYNC_TARGET_AEM_AUTH_CLIENT_SECRET=your-target-client-secret
SYNC_TARGET_AEM_AUTH_TECH_ACCOUNT_ID=YOUR_TARGET_TECH_ACCOUNT@techacct.adobe.com
SYNC_TARGET_AEM_AUTH_SCOPES=ent_aem_cloud_api
SYNC_TARGET_AEM_AUTH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Target AEM destination path configuration
SYNC_TARGET_AEM_BASE_PATH=/content/dam/synced-assets
```

#### Configuration Validation
- All target AEM configuration variables must be present
- Authentication credentials must be valid for the target AEM environment
- Target AEM server must be accessible from Adobe I/O Runtime

### 2. Enhanced agency-assetsync-internal-handler

#### Current Functionality
- Validates incoming event parameters
- Creates appropriate event objects (AssetSyncNewEvent, AssetSyncUpdateEvent, AssetSyncDeleteEvent)
- Publishes events to Adobe I/O Events

#### Required Enhancements

##### 2.1 Asset Import Logic for `com.adobe.a2b.assetsync.new`
When processing `com.adobe.a2b.assetsync.new` events:

1. **Extract asset information** from event data:
   - Source asset path from `data.asset_path`
   - Asset metadata from `data.metadata`
   - Brand ID from `data.brandId`
   - Asset ID from `data.asset_id`

2. **Construct source asset URL**:
   - Use source AEM host + asset path to build download URL
   - Generate presigned download URL using existing `getAemAssetPresignedDownloadUrl()` utility

3. **Prepare target asset path**:
   - Combine `SYNC_TARGET_AEM_BASE_PATH` with organized folder structure
   - Use brand ID to create brand-specific folders: `${SYNC_TARGET_AEM_BASE_PATH}/${brandId}/`
   - Preserve original filename from source path

4. **Import asset to target AEM**:
   - Use Adobe Experience Manager Assets Author API
   - Endpoint: `POST /adobe/assets`
   - Call `importFromUrl` operation
   - Include metadata in import request

##### 2.2 API Integration Requirements

**Adobe Experience Manager Assets Author API Integration**
- **Endpoint**: [Import from URL](http://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/author/#operation/importFromUrl)
- **Method**: POST
- **URL**: `{SYNC_TARGET_AEM_HOST}/adobe/assets`
- **Authentication**: Bearer token for target AEM environment
- **Headers**:
  ```
  Authorization: Bearer {target_aem_access_token}
  Content-Type: application/json
  x-api-key: {SYNC_TARGET_AEM_AUTH_CLIENT_ID}
  ```

**Request Payload Structure**:
```json
{
  "urls": [
    {
      "sourceUrl": "{presigned_download_url}",
      "destinationPath": "{target_path}",
      "name": "{asset_filename}",
      "metadata": {
        "dc:description": "{asset_description}",
        "a2b:brandId": "{brandId}",
        "a2b:originalAssetId": "{asset_id}",
        "a2b:originalAssetPath": "{asset_path}",
        "a2b:syncDate": "{current_timestamp}",
        ... // additional metadata from source
      }
    }
  ]
}
```

##### 2.3 Metadata Handling
- **Preserve source metadata**: Include relevant metadata from source asset
- **Add sync metadata**: Add A2B-specific metadata for tracking
- **Brand association**: Ensure assets are properly tagged with brand information
- **Compliance metadata**: Preserve any compliance-related metadata (e.g., IPTC, XMP)

##### 2.4 Error Handling
- **Authentication failures**: Log and retry with fresh token
- **Network timeouts**: Implement retry logic with exponential backoff
- **Invalid URLs**: Validate source URLs before attempting import
- **Target path conflicts**: Handle existing assets (skip, overwrite, or version)
- **Insufficient permissions**: Clear error messages for permission issues

##### 2.5 Logging and Monitoring
- **Detailed logging**: Log all import attempts, successes, and failures
- **Performance metrics**: Track import times and success rates
- **Asset tracking**: Log asset IDs and paths for audit trail

### 3. Implementation Flow

```mermaid
graph TD
    A[agency-event-handler receives com.adobe.a2b.assetsync.new] 
    A --> B[Route to agency-assetsync-internal-handler]
    B --> C[Validate event and extract asset info]
    C --> D[Get source asset presigned URL]
    D --> E[Authenticate with target AEM]
    E --> F[Prepare import request with metadata]
    F --> G[Call AEM Assets Author API - importFromUrl]
    G --> H{Import successful?}
    H -->|Yes| I[Log success and publish completion event]
    H -->|No| J[Log error and implement retry logic]
    J --> K{Retry attempts < 3?}
    K -->|Yes| E
    K -->|No| L[Log failure and alert]
    I --> M[Return success response]
    L --> N[Return error response]
```

### 4. Acceptance Criteria


### 6. Acceptance Criteria

#### 6.1 Functional Requirements
- [ ] `com.adobe.a2b.assetsync.new` events trigger asset import to target AEM
- [ ] Assets are imported with complete metadata
- [ ] Assets are organized in brand-specific folder structure
- [ ] Source presigned URLs are generated correctly
- [ ] Target AEM authentication works reliably
- [ ] Error scenarios are handled gracefully

#### 4.2 Non-Functional Requirements
- [ ] Import operations complete within 30 seconds for typical assets
- [ ] 99.5% success rate for valid import requests
- [ ] Comprehensive logging for troubleshooting
- [ ] No memory leaks during continuous operations
- [ ] Secure credential handling

### 5. Dependencies

#### 5.1 External Services
- Source AEM environment (for asset download)
- Target AEM environment (for asset import)
- Adobe Experience Manager Assets Author API
- Adobe I/O Runtime platform

#### 5.2 Internal Dependencies
- Existing authentication utilities (`aemCscUtils.js`, `adobeAuthUtils.js`)
- Event management classes (`EventManager`, `AssetSyncNewEvent`)
- Common utilities (`common.js`)

## Conclusion

This enhancement will enable the A2B Brand application to automatically import assets from source AEM environments to target AEM environments when `com.adobe.a2b.assetsync.new` events are received. The implementation leverages existing authentication and utility infrastructure while adding robust error handling and monitoring capabilities.
