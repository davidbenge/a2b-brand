# Brand Event Handler Architecture

## Overview

The brand event handler (`brand-event-handler`) is a routing mechanism that receives incoming events from the agency and delegates them to appropriate internal OpenWhisk actions based on the event type.

## Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────────────┐
│   External      │───▶│  brand-event-handler │───▶│  agency-assetsync-internal- │
│   Event Source  │    │  (Router)            │    │  handler                     │
└─────────────────┘    └──────────────────────┘    └─────────────────────────────┘
                                │
                                ▼
                       ┌──────────────────────┐
                       │  Future Internal     │
                       │  Handlers            │
                       └──────────────────────┘
```

## Event Structure

All incoming events must follow this structure:

```json
{
  "id": "urn:uuid:12345678-1234-1234-1234-123456789abc",
  "source": "urn:uuid:5c3431a2-bd91-4eff-a356-26b747d0aad4",
  "type": "com.adobe.b2a.registration.new",
  "datacontenttype": "application/json",
  "time": "2025-08-28T07:29:29.728Z",
  "specversion": "1.0",
  "data": {
    "app_runtime_info": {
      "actionPackageName": "a2b-agency",
      "appName": "agency",
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "benge"
    },
    "name": "Brand Name",
    "endPointUrl": "https://example.com/webhook"
  }
}
```

### Required Fields

- **`type`**: The event type that determines routing
- **`data.app_runtime_info`**: Runtime configuration for the internal action
- **`data`**: Event-specific data payload

## Supported Event Types

### Brand Registration Events

| Event Type | Description | Internal Handler |
|------------|-------------|------------------|
| `com.adobe.b2a.registration.new` | New brand registration request | `brand-registration-handler` |

### Asset Sync Events

| Event Type | Description | Internal Handler |
|------------|-------------|------------------|
| `com.adobe.b2a.assetsync.new` | New asset created | `agency-assetsync-internal-handler` |
| `com.adobe.b2a.assetsync.updated` | Asset updated | `agency-assetsync-internal-handler` |
| `com.adobe.b2a.assetsync.deleted` | Asset deleted | `agency-assetsync-internal-handler` |

## Internal Handlers

### agency-assetsync-internal-handler

Processes asset sync events and handles:
- Asset metadata processing
- Brand-specific asset operations
- Downstream workflow triggers

#### Processing Functions

- `processAssetSyncNew()`: Handles new asset creation
- `processAssetSyncUpdated()`: Handles asset updates
- `processAssetSyncDeleted()`: Handles asset deletion

## Deployment

### Actions

1. **brand-event-handler**: Main routing action
   - Web-enabled for external event reception
   - Requires runtime configuration for internal action invocation

2. **agency-assetsync-internal-handler**: Internal asset sync processor
   - Web-enabled for direct invocation (if needed)
   - Processes asset sync events

### Configuration

Both actions are configured in `app.config.yaml`:

```yaml
brand-event-handler:
  function: src/actions/brand-event-handler/index.ts
  web: 'yes'
  runtime: nodejs:20
  inputs:
    LOG_LEVEL: debug
    AIO_runtime_apihost: $AIO_runtime_apihost
    AIO_runtime_auth: $AIO_runtime_auth
    AIO_runtime_namespace: $AIO_runtime_namespace

agency-assetsync-internal-handler:
  function: src/actions/agency-assetsync-internal-handler/index.ts
  web: 'yes'
  runtime: nodejs:20
  inputs:
    LOG_LEVEL: debug
```

## Testing

### Sample Event

Use the sample event in `docs/events/brand/com-adobe-b2a-registration-new.json` for testing.

### Invocation

```bash
# Test the brand event handler with a registration event
curl -X POST https://your-runtime-host/api/v1/web/your-namespace/a2b-agency/brand-event-handler \
  -H "Content-Type: application/json" \
  -d @docs/events/brand/com-adobe-b2a-registration-new.json
```

## Future Extensions

The architecture is designed to easily add new event types and internal handlers:

1. Add new event type cases to the switch statement in `brand-event-handler`
2. Create new internal handler actions
3. Update routing logic to delegate to new handlers
4. Add configuration to `app.config.yaml`

## Error Handling

- Missing required parameters return 400 errors
- Unsupported event types return 400 errors with descriptive messages
- Internal action failures are logged and propagated
- All errors include appropriate HTTP status codes and error messages 