# Runtime Information Pattern

## Critical Rule: Two Formats, Two Purposes

The A2B system uses runtime information in **TWO DISTINCT FORMATS** for **TWO DIFFERENT PURPOSES**. These are **NOT interchangeable**.

---

## `APPLICATION_RUNTIME_INFO` (JSON String)

### Purpose
Internal OpenWhisk action configuration for runtime isolation.

### Format
```json
"{\"namespace\":\"27200-a2b-benge\",\"app_name\":\"a2b-agency\",\"action_package_name\":\"a2b-agency\"}"
```

### Where It's Used
✅ **ONLY in these places:**
1. `.env` file configuration
2. `app.config.yaml` action inputs
3. OpenWhisk action params (automatically injected by platform)
4. Internal action-to-action communication via OpenWhisk

❌ **NEVER in these places:**
- API call payloads
- Event payloads
- HTTP request bodies
- CloudEvents data

### Example Usage
```yaml
# app.config.yaml
inputs:
  LOG_LEVEL: debug
  APPLICATION_RUNTIME_INFO: '{"namespace":"${AIO_runtime_namespace}","app_name":"agency","action_package_name":"${AIO_ACTION_PACKAGE_NAME}"}'
```

```typescript
// Inside an action
const runtimeInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
// Returns: ApplicationRuntimeInfo instance parsed from params.APPLICATION_RUNTIME_INFO
```

---

## `app_runtime_info` (Object)

### Purpose
Runtime information for event publishing, API calls, and cross-application communication.

### Format
```typescript
{
  "actionPackageName": "a2b-brand",
  "appName": "brand",
  "consoleId": "27200",
  "projectName": "brand2agency",
  "workspace": "benge"
}
```

### Where It's Used
✅ **ALWAYS in these places:**
1. API call request bodies (inside `data` property)
2. CloudEvent payloads (inside `data` property)
3. Any cross-application communication
4. Event publishing for isolation

❌ **NEVER in these places:**
- `.env` files
- `app.config.yaml` configuration
- OpenWhisk action params

### Example Usage

**API Call Payload:**
```json
{
  "data": {
    "name": "Brand Name",
    "endPointUrl": "https://...",
    "app_runtime_info": {
      "actionPackageName": "a2b-brand",
      "appName": "brand",
      "consoleId": "27200",
      "projectName": "brand2agency",
      "workspace": "benge"
    }
  }
}
```

**CloudEvent Payload:**
```json
{
  "type": "com.adobe.a2b.registration.received",
  "data": {
    "brandId": "...",
    "name": "...",
    "app_runtime_info": {
      "actionPackageName": "a2b-agency",
      "appName": "agency",
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "benge"
    }
  }
}
```

**Code:**
```typescript
// Inside an event handler or after receiving API call
const runtimeInfo = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(params);
// Returns: ApplicationRuntimeInfo instance parsed from params.data.app_runtime_info
```

---

## Pattern Summary

| Aspect | `APPLICATION_RUNTIME_INFO` | `app_runtime_info` |
|--------|----------------------------|-------------------|
| **Format** | JSON string | Object |
| **Location** | Action params (top level) | data property |
| **Source** | `.env` → `app.config.yaml` | API/Event payload |
| **Purpose** | Action configuration | Event/API communication |
| **Parser** | `getApplicationRuntimeInfoFromActionParams()` | `getAppRuntimeInfoFromEventData()` |
| **Used in** | OpenWhisk internals | External communication |

---

## Implementation Pattern

### In Actions

Every action typically needs BOTH:

```typescript
// Get runtime info from action config (for this action)
const applicationRuntimeInfoLocal = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);

// Get runtime info from event/API data (from sender)
const applicationRuntimeInfoEvent = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(params);

if (!applicationRuntimeInfoLocal) {
  throw new Error('Missing APPLICATION_RUNTIME_INFO (from action config)');
}

if (!applicationRuntimeInfoEvent) {
  throw new Error('Missing app_runtime_info in event data (from sender)');
}
```

### When Sending API Calls

```typescript
// Construct runtime info object (NOT JSON string)
const app_runtime_info = {
  actionPackageName: viewProps.aioActionPackageName,
  appName: "brand",
  consoleId: "27200",
  projectName: "brand2agency",
  workspace: "benge"
};

// Include in data property
const payload = {
  data: {
    ...formData,
    app_runtime_info: app_runtime_info  // Object, not JSON string!
  }
};
```

### When Publishing Events

```typescript
// Event data automatically includes app_runtime_info from EventManager
const event = new MyEvent(data);
event.data.app_runtime_info = applicationRuntimeInfo.serialize();
```

---

## Common Mistakes to Avoid

### ❌ WRONG: Sending APPLICATION_RUNTIME_INFO in API call
```typescript
// DON'T DO THIS
const payload = {
  APPLICATION_RUNTIME_INFO: JSON.stringify(runtimeInfo),  // ❌ Wrong!
  data: { ... }
};
```

### ✅ CORRECT: Send app_runtime_info object in data
```typescript
// DO THIS
const payload = {
  data: {
    ...myData,
    app_runtime_info: runtimeInfo  // ✅ Correct! Object, not string
  }
};
```

### ❌ WRONG: Looking for app_runtime_info in action params
```typescript
// DON'T DO THIS
const runtimeInfo = params.app_runtime_info;  // ❌ Won't exist at top level
```

### ✅ CORRECT: Use the right parser for the right source
```typescript
// DO THIS
const localInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);  // From config
const eventInfo = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(params);  // From data
```

---

## Why Two Formats?

1. **`APPLICATION_RUNTIME_INFO`** (JSON string)
   - OpenWhisk platform requirement
   - Injected by infrastructure
   - Not meant for external consumption
   - Optimized for config files

2. **`app_runtime_info`** (object)
   - Standard event/API payload format
   - Easy to work with in code
   - Consistent with CloudEvents spec
   - Human-readable in logs

---

## Quick Reference

**Need to configure an action?** → Use `APPLICATION_RUNTIME_INFO` in `app.config.yaml`

**Need to send an API call?** → Use `app_runtime_info` object in `data`

**Need to publish an event?** → Use `app_runtime_info` object in `data`

**Need to parse incoming event?** → Use `getAppRuntimeInfoFromEventData(params)`

**Need action's own runtime info?** → Use `getApplicationRuntimeInfoFromActionParams(params)`

---

## Related Files

- `src/actions/classes/ApplicationRuntimeInfo.ts` - Parser class with both methods
- `src/shared/types/index.ts` - `IApplicationRuntimeInfo` interface
- `app.config.yaml` - Action configuration with `APPLICATION_RUNTIME_INFO`
- `.env` - Environment variables used in action configuration

---

## Last Updated

2025-10-17 - Documented the critical distinction between the two runtime info formats

