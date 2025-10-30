# AssetSync Detailed Instructions

> 📖 **This is the detailed guide for AssetSync. For project overview and setup, see the [main README.md](../../../README.md)**

## Overview

AssetSync is a comprehensive system that handles synchronization of AEM assets between Adobe Experience Manager (AEM) and brand systems. It processes asset events, validates metadata, and distributes asset data to registered brands.

## 🏗️ Architecture

### **Core Components**

1. **`agency-assetsync-internal-handler`** - Main event processor
2. **AssetSync Events** - Event classes for different sync operations
3. **AEM Utilities** - Authentication and data retrieval utilities
4. **Brand Manager** - Brand registration and endpoint management

### **Event Flow**
```
AEM Asset Event → agency-assetsync-internal-handler → AssetSync Event → Brand Endpoint
```

## ⚙️ Prerequisites

### **Required Environment Variables**
```bash
# AEM Authentication
AEM_AUTH_TYPE=service_account
AEM_AUTH_CLIENT_ID=your_client_id
AEM_AUTH_CLIENT_SECRET=your_client_secret
AEM_AUTH_TECH_ACCOUNT_ID=your_tech_account_id
AEM_AUTH_SCOPES=your_scopes
AEM_AUTH_PRIVATE_KEY=your_private_key

# Adobe Internal Services
ADOBE_INTERNAL_URL_ENDPOINT=https://your-internal-endpoint.com
AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID=your_provider_id

# Application Runtime
APPLICATION_RUNTIME_INFO={"namespace":"your_namespace","app_name":"agency","action_package_name":"your_package"}
```

### **AEM Asset Metadata Requirements**
Assets must have specific metadata properties:
- `a2b__sync_on_change`: Boolean flag to enable sync
- `a2b__customers`: Array of brand IDs to sync with
- `a2b__last_sync`: Timestamp of last sync (optional)

## 🔧 Configuration

### **1. AEM Asset Setup**

#### **Enable Asset Sync**
```json
{
  "jcr:content": {
    "metadata": {
      "a2b__sync_on_change": true,
      "a2b__customers": ["brand1", "brand2"],
      "a2b__last_sync": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### **Asset Path Structure**
```
/content/dam/your-asset-path/asset-name.jpg
```

### **2. Brand Registration**
Brands must be registered with:
- Valid `brandId` matching the customers array
- Enabled status (`enabled: true`)
- Valid `endPointUrl` for receiving events

## 🚀 Usage Instructions

### **1. Deploy the Action**

```bash
# Build actions
npm run build-actions

# Deploy to Adobe App Builder
aio app deploy
```

### **2. Configure AEM Webhooks**

Set up AEM webhooks to trigger the action on asset events:

```json
{
  "webhook_url": "https://your-runtime-url/api/v1/web/your-namespace/agency-assetsync-internal-handler",
  "events": [
    "aem.assets.asset.metadata_updated",
    "aem.assets.asset.processing_completed",
    "aem.assets.asset.deleted"
  ]
}
```

### **3. Monitor Event Processing**

#### **Event Types Handled**
- `aem.assets.asset.metadata_updated` - Asset metadata changes
- `aem.assets.asset.processing_completed` - Asset processing finished
- `aem.assets.asset.deleted` - Asset deletion (TODO: implement)

#### **Processing Logic**
1. **Event Validation** - Check if event type is supported
2. **Asset Data Retrieval** - Fetch asset data from AEM
3. **Metadata Validation** - Verify sync flags and customers
4. **Brand Lookup** - Find registered brands for customers
5. **Event Creation** - Generate appropriate AssetSync event
6. **Event Distribution** - Send to brand endpoints
7. **Event Publishing** - Publish to Adobe Event Hub

## 📊 Event Types

### **AssetSyncNewEvent**
```typescript
{
  type: "com.adobe.a2b.assetsync.new",
  data: {
    app_runtime_info: {...},
    asset_id: "uuid",
    asset_path: "/content/dam/...",
    metadata: {...},
    brandId: "brand1",
    asset_presigned_url: "https://..."
  }
}
```

### **AssetSyncUpdateEvent**
```typescript
{
  type: "com.adobe.a2b.assetsync.update",
  data: {
    asset_id: "uuid",
    asset_path: "/content/dam/...",
    metadata: {...},
    brandId: "brand1"
  }
}
```

### **AssetSyncDeleteEvent**
```typescript
{
  type: "com.adobe.a2b.assetsync.delete",
  data: {
    asset_id: "uuid",
    asset_path: "/content/dam/..."
  }
}
```

## 🔍 Debugging and Monitoring

### **Log Levels**
```bash
LOG_LEVEL=debug  # Detailed debugging
LOG_LEVEL=info   # Standard information
LOG_LEVEL=warn   # Warnings only
LOG_LEVEL=error  # Errors only
```

### **Key Log Messages**
- `Asset Sync Event Handler called` - Action started
- `Asset metadata updated event` - Processing metadata event
- `aemAssetData from aemCscUtils getAemAssetData` - Asset data retrieved
- `sending event to brand url` - Event sent to brand
- `assetSyncEventNew complete` - Event processing complete

### **Error Handling**
- **400 Bad Request** - Invalid customers format
- **500 Internal Error** - Processing errors
- **Brand not enabled** - Warning for disabled brands
- **Asset metadata not found** - Warning for missing metadata

## 🛠️ Development

### **Testing Locally**

1. **Set up environment variables**
2. **Create test asset with metadata**
3. **Register test brand**
4. **Trigger asset event**
5. **Monitor logs and responses**

### **Mock Data Example**
```json
{
  "type": "aem.assets.asset.metadata_updated",
  "data": {
    "repositoryMetadata": {
      "repo:repositoryId": "your-aem-host.adobeaemcloud.com",
      "repo:path": "/content/dam/test-asset.jpg"
    }
  }
}
```

## 🔒 Security Considerations

### **Authentication**
- AEM authentication via service account
- Adobe internal endpoint authentication
- Brand endpoint authentication (brand responsibility)

### **Data Protection**
- Presigned URLs for secure asset access
- No asset data stored in action state
- Secure credential management

### **Validation**
- Input parameter validation
- Event data validation
- Brand status validation
- Asset metadata validation

## 📈 Performance Optimization

### **Lazy Loading**
- Credentials loaded only when needed
- Event manager instantiated on demand
- Asset data fetched only for valid events

### **Error Recovery**
- Graceful handling of brand failures
- Continue processing other brands on single failure
- Comprehensive error logging

### **Scalability**
- Stateless action design
- No persistent storage requirements
- Horizontal scaling support

## 🚨 Troubleshooting

### **Common Issues**

1. **Asset Not Syncing**
   - Check `a2b__sync_on_change` is true
   - Verify `a2b__customers` array contains valid brand IDs
   - Ensure brand is enabled and registered

2. **Authentication Errors**
   - Verify AEM credentials are correct
   - Check Adobe internal endpoint access
   - Validate brand endpoint URLs

3. **Event Not Received by Brand**
   - Check brand endpoint is accessible
   - Verify brand is enabled
   - Monitor brand endpoint logs

### **Debug Steps**
1. Enable debug logging
2. Check action logs for errors
3. Verify asset metadata structure
4. Test brand endpoint connectivity
5. Validate event format

## 📋 Implementation Details

### **Core Handler Logic**

The `agency-assetsync-internal-handler` processes events in the following sequence:

1. **Event Type Detection**
   ```typescript
   if (params.type === 'aem.assets.asset.metadata_updated' || 
       params.type === 'aem.assets.asset.processing_completed') {
     // Process asset update
   } else if (params.type === 'aem.assets.asset.deleted') {
     // Process asset deletion (TODO)
   }
   ```

2. **Asset Data Retrieval**
   ```typescript
   const aemAssetData = await getAemAssetData(aemHostUrl, aemAssetPath, params, logger);
   ```

3. **Metadata Validation**
   ```typescript
   if (metadata["a2b__sync_on_change"] && 
       (metadata["a2b__sync_on_change"] === true || 
        metadata["a2b__sync_on_change"] === "true") && 
       metadata["a2b__customers"]) {
     // Process sync
   }
   ```

4. **Brand Processing**
   ```typescript
   for (const customer of customersArray) {
     const brand = await brandManager.getBrand(customer);
     if (brand && brand.enabled) {
       // Send event to brand
     }
   }
   ```

### **Presigned URL Generation**

The system generates presigned URLs for secure asset access:

```typescript
const presignedUrl = await fetchPresignedReadUrl(
  aemHostHostOnly, 
  aemAssetPath, 
  params, 
  logger, 
  ACTION_NAME
);
```

### **Event Publishing**

Events are published to both brand endpoints and Adobe Event Hub:

```typescript
// Send to brand endpoint
brandSendResponse = await brand.sendCloudEventToEndpoint(assetSyncEventNew);

// Publish to Event Hub
await getEventManager().publishEvent(assetSyncEventNew);
```

## 🎯 Best Practices

### **Asset Metadata**
- Use consistent naming for sync properties
- Validate customer arrays before processing
- Include last sync timestamps for tracking

### **Error Handling**
- Implement comprehensive logging
- Graceful degradation on brand failures
- Clear error messages for debugging

### **Performance**
- Use lazy loading for expensive operations
- Implement proper timeout handling
- Monitor action execution times

### **Security**
- Validate all input parameters
- Use secure authentication methods
- Implement proper access controls

## 📚 Related Documentation

- [Project Overview & Setup](../../../README.md) - Main project documentation
- [Brand Manager Documentation](../../../BRANDMANAGER_DEMO_MODE.md)
- [Demo Mode Instructions](../../../DEMO_MODE_INSTRUCTIONS.md)
- [Event Handler Architecture](../../brand-event-handler-architecture.md)

---

This comprehensive guide covers all aspects of the AssetSync system, from setup and configuration to monitoring and troubleshooting. For additional support, refer to the related documentation or contact the development team.
