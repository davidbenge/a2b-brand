# Agency URL Configuration Guide

## Overview

When the Brand application needs to register with an Agency, **two URLs are involved**:

1. **Agency Registration Endpoint** - Where the brand SENDS the registration request
2. **Brand Callback URL** - Where the agency will SEND events back to the brand

### The Two URLs Explained

| URL Purpose | Direction | Who Uses It | Example |
|------------|-----------|-------------|---------|
| **Agency Registration Endpoint** | Brand → Agency | Brand submits registration | `https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration` |
| **Brand Callback URL** | Agency → Brand | Agency sends events back | `https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler` |

**In the registration flow:**
1. Brand constructs BOTH URLs
2. Brand POSTs to the **Agency Registration Endpoint**
3. In the request payload, brand includes its own **Brand Callback URL** as `endPointUrl`
4. Agency stores the brand's callback URL for future event delivery

## Environment Configuration

### `.env` File

The `AGENCY_BASE_URL` should contain ONLY the base domain URL (without any paths). The application will append the full action path as needed.

**Format**:
```
https://{namespace}.{domain}
```

**Examples**:

✅ **Correct**:
```bash
AGENCY_BASE_URL=https://27200-a2b-benge.adobeio-static.net
```

✅ **Also Correct**:
```bash
AGENCY_BASE_URL=https://27200-a2b-benge.adobeioruntime.net
```

❌ **Wrong** (includes path):
```bash
AGENCY_BASE_URL=https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency
```

❌ **Wrong** (includes action name):
```bash
AGENCY_BASE_URL=https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration
```

**Why this matters**: The application constructs the full endpoint URL in code. Keeping only the base domain in the environment variable makes the configuration simpler, more portable, and easier to understand.

## URL Construction

The `AgencyRegistrationView` component constructs **both URLs**:

### 1. Brand Callback URL (endPointUrl)

**Built from runtime configuration:**
```typescript
const brandBaseUrl = `https://${safeViewProps.aioRuntimeNamespace}.adobeioruntime.net/api/v1/web/${safeViewProps.aioActionPackageName}/agency-event-handler`;
```

**Example values:**
- `aioRuntimeNamespace` = `27200-brand2agency-benge` (from runtime)
- `aioActionPackageName` = `a2b-brand` (from app.config.yaml)

**Results in:**
```
https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler
```

This URL is sent in the registration payload as `endPointUrl` for the agency to call back.

### 2. Agency Registration Endpoint

**Built from environment variable:**
```typescript
const agencyBaseUrl = `${safeViewProps.agencyBaseUrl}/api/v1/web/a2b-agency/new-brand-registration`;
```

**Given:**
```bash
AGENCY_BASE_URL=https://27200-a2b-benge.adobeio-static.net
```

**Results in:**
```
https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration
```

This is where the registration POST request is sent.

### Complete Registration Flow

**What actually happens when you submit the form:**

1. Component constructs both URLs:
   ```typescript
   brandBaseUrl = "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler"
   agencyBaseUrl = "https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration"
   ```

2. Brand sends POST request TO the agency:
   ```javascript
   POST https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration
   
   Payload:
   {
     "data": {
       "name": "My Brand Name",
       "primaryContact": "John Doe",
       "phoneNumber": "555-1234",
       "endPointUrl": "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
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
   
   **Note**: 
   - All brand data is wrapped in a `data` property (consistent with event structure)
   - `app_runtime_info` (object) is included for event publishing and isolation
   - `APPLICATION_RUNTIME_INFO` (JSON string) is ONLY used internally in OpenWhisk action config, never in API calls or events

3. Agency receives the request and stores the brand's `endPointUrl`

4. Agency responds with ONLY a success message (no brand data/secret for security):
   ```json
   {
     "message": "Brand registration processed successfully for brand id 24316544-aacc-4494-8c96-2a354c60cf01"
   }
   ```
   
   **Note**: The brand credentials (including secret) are NOT returned in the response for security reasons. They will be delivered later via CloudEvent when the agency admin enables the registration.

5. Later, when the agency needs to send events to the brand, it uses the stored `endPointUrl`:
   ```javascript
   POST https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler
   
   Payload:
   {
     "type": "com.adobe.a2b.registration.enabled",
     "data": { 
       "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
       "secret": "xCZpPrN1rhUVFPyWdRndqyGjDTGuoMJh",
       ...
     }
   }
   ```

### ❌ Old Approach (Before Refactor)

The previous implementation stored the full path in the environment variable:

```bash
# OLD - Not recommended
AGENCY_BASE_URL=https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency
```

```typescript
// OLD - Not recommended
const agencyBaseUrl = `${safeViewProps.agencyBaseUrl}/new-brand-registration`;
```

This approach was less portable and made it harder to understand the full endpoint URL being called.

## Implementation Details

### AgencyRegistrationView Component

**Location**: `src/dx-excshell-1/web-src/src/components/layout/AgencyRegistrationView.tsx`

The component:
1. Reads `agencyBaseUrl` from `ViewPropsBase` (populated from env var - base domain only)
2. Appends the full action path: `/api/v1/web/a2b-agency/new-brand-registration`
3. Constructs `APPLICATION_RUNTIME_INFO` from brand's runtime namespace and app name
4. Makes a direct axios POST request to the constructed URL with all required data

```typescript
const agencyBaseUrl = `${safeViewProps.agencyBaseUrl}/api/v1/web/a2b-agency/new-brand-registration`;

// Construct APPLICATION_RUNTIME_INFO for the agency action
// Parse namespace: "27200-brand2agency-benge" -> consoleId: 27200, projectName: brand2agency, workspace: benge
const namespaceParts = safeViewProps.aioRuntimeNamespace.split('-');
const applicationRuntimeInfo = JSON.stringify({
    actionPackageName: safeViewProps.aioActionPackageName,
    appName: "brand",
    consoleId: namespaceParts[0] || "",
    projectName: namespaceParts.slice(1, -1).join('-') || "",
    workspace: namespaceParts[namespaceParts.length - 1] || ""
});

const payload = {
    data: {
        ...formData,
        app_runtime_info: applicationRuntimeInfo
    }
};

const response = await axios.post(
    agencyBaseUrl,
    payload,
    {
        headers: {
            'Content-Type': 'application/json',
            'x-gw-ims-org-id': imsOrg
        }
    }
);
```

**Benefits of this approach:**
- The environment variable is simple (just the domain)
- The full endpoint path is visible in the code
- Easy to add new agency endpoints in the future
- More portable across different agency deployments

### API Service (Deprecated)

**Location**: `src/dx-excshell-1/web-src/src/services/api.ts`

The `ApiService.registerCompany()` method is **deprecated** and should not be used. It has been marked with `@deprecated` JSDoc annotations.

**Why it's deprecated:**
- The service was designed for calling BRAND actions (same project)
- Agency registration calls AGENCY actions (different project)
- The URL construction pattern doesn't work for cross-project calls

## Best Practices

1. **Store only the base domain** in `AGENCY_BASE_URL` environment variable - never include paths
2. **Construct full paths in code** where they are used - this makes the endpoint clear and explicit
3. **Never hardcode URLs** - always use environment variables for the base domain
4. **Use direct axios calls** from components when calling external (agency) actions
5. **Use ApiService** only for same-project (brand) actions
6. **Document endpoint construction** in comments when adding new agency endpoint calls

## Testing

To verify the correct URL is being used:

1. Check browser DevTools Network tab
2. Look for POST requests to agency
3. Verify URL format:
   ```
   https://{namespace}.adobeioruntime.net/api/v1/web/{package}/{action}
   ```

## Related Files

- `src/dx-excshell-1/web-src/src/components/layout/AgencyRegistrationView.tsx` - ✅ Correct implementation
- `src/dx-excshell-1/web-src/src/services/api.ts` - ⚠️ Contains deprecated method
- `src/dx-excshell-1/web-src/src/index.js` - Reads env vars and passes to ViewPropsBase
- `.env` - Contains `AGENCY_BASE_URL` configuration

## Debugging

When testing the registration form, check the browser console for these log messages:

```
Constructed URLs:
  Brand callback URL (endPointUrl): https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler
  Agency registration endpoint: https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration

Submitting brand registration:
  POST to agency endpoint: https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration
  Brand callback URL (in data.endPointUrl): https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler
  Full payload: {
    "data": {
      "name": "...",
      "primaryContact": "...",
      "phoneNumber": "...",
      "endPointUrl": "...",
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

These logs help verify:
- ✅ Both URLs are constructed correctly
- ✅ The POST goes to the right agency endpoint
- ✅ The brand's callback URL is included in data.endPointUrl
- ✅ `app_runtime_info` (object) is included in the data for event publishing
- ✅ All brand data is properly wrapped in the `data` property
- ✅ NO `APPLICATION_RUNTIME_INFO` in the payload (that's only for OpenWhisk config)

## Changelog

**2025-10-17 (v8)**: **SECURITY UPDATE**: Agency `new-brand-registration` action now returns only a success message. Brand data (including secret) is NOT returned in the response for security reasons. Credentials are delivered via CloudEvent after admin approval.

**2025-10-17 (v7)**: **CORRECTED**: Removed `APPLICATION_RUNTIME_INFO` from API payload. This JSON string format is ONLY for internal OpenWhisk action configuration, never sent in API calls or events. Only `app_runtime_info` (object) is sent in the `data` property.

**2025-10-17 (v6)**: ~~Updated payload structure to wrap brand data in `data` property. `APPLICATION_RUNTIME_INFO` (JSON string) at top level for action, `app_runtime_info` (object) in data for events.~~ **INCORRECT - see v7**. Improved error handling with better error message extraction.

**2025-10-17 (v5)**: Fixed `APPLICATION_RUNTIME_INFO` format to match expected structure with parsed namespace components (actionPackageName, appName, consoleId, projectName, workspace).

**2025-10-17 (v4)**: Added `APPLICATION_RUNTIME_INFO` to brand registration request payload. This is required by all agency actions for runtime isolation.

**2025-10-17 (v3)**: Added comprehensive documentation explaining the two-URL registration flow, with examples and debugging guidance.

**2025-10-17 (v2)**: Refactored to store only base domain in `AGENCY_BASE_URL` environment variable. Full action paths are now constructed in code for clarity and portability.

**2025-10-17 (v1)**: Fixed URL duplication bug in `AgencyRegistrationView` and deprecated `ApiService.registerCompany()` method.

