# Registration Disabled Event Implementation

## Overview

Implemented support for the `com.adobe.a2b.registration.disabled` event in the a2b-brand application. This event allows agencies to disable brand registrations while preserving the secret for potential future re-enablement.

## Date
October 30, 2025

## Changes Made

### 1. Event Registry (`src/actions/classes/AppEventRegistry.ts`)

Added new event definition for `com.adobe.a2b.registration.disabled`:

```typescript
'com.adobe.a2b.registration.disabled': {
    code: 'com.adobe.a2b.registration.disabled',
    category: EventCategory.REGISTRATION,
    name: 'Brand Registration Disabled',
    description: 'Emitted when a brand registration is disabled by the agency',
    version: '1.0.0',
    sendSecretHeader: false,
    sendSignedKey: true,
    eventBodyexample: registrationDisabledBody,
    routingRules: [],
    requiredFields: ['brandId', 'enabled', 'name', 'endPointUrl', 'disabledAt','app_runtime_info','agency_identification'],
    optionalFields: ['agencyName'],
    injectedObjects: [],
    ioProviderIdEnvVariable: 'AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID',
    handlerActionName: 'a2b-brand/agency-registration-internal-handler',
    callBlocking: true
}
```

**Key Features:**
- Uses existing `agency-registration-internal-handler` (no new action needed)
- Requires `brandId`, `enabled`, `name`, `endPointUrl`, `disabledAt`, `app_runtime_info`, `agency_identification`
- No secret validation (handled by existing registration event logic in `agency-event-handler`)

### 2. Event Documentation (`docs/events/registration/com-adobe-a2b-registration-disabled.json`)

Created CloudEvents-compliant event example:

```json
{
    "id": "urn:uuid:12345678-1234-1234-1234-123456789abc",
    "source": "urn:uuid:5c3431a2-bd91-4eff-a356-26b747d0aad4",
    "type": "com.adobe.a2b.registration.disabled",
    "datacontenttype": "application/json",
    "time": "2025-10-30T07:29:29.728Z",
    "specversion": "1.0",
    "data": {
        "app_runtime_info": {
            "actionPackageName": "a2b-agency",
            "appName": "agency",
            "consoleId": "27200",
            "projectName": "a2b",
            "workspace": "benge"
        },
        "agency_identification": {
            "agencyId": "2ff22120-d393-4743-afdd-0d4b2038d2be",
            "orgId": "33C1401053CF76370A490D4C@AdobeOrg"
        },
        "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
        "name": "Brand Name",
        "endPointUrl": "https://example.com/webhook",
        "agencyName": "ACME Agency",
        "enabled": false,
        "disabledAt": "2025-10-30T07:29:29.728Z"
    }
}
```

### 3. Agency Event Handler Extension (`src/actions/event-handlers/agency-registration-internal-handler/index.ts`)

Extended the existing handler to process `registration.disabled` events:

**Handler Logic:**
1. Validates required fields: `brandId`, `enabled`, `agency_identification`
2. Extracts `agencyId` and `orgId` from `agency_identification`
3. Checks if agency exists (returns 404 if not found)
4. Updates agency with:
   - `enabled: false`
   - `disabledAt: <timestamp from event or now>`
   - Preserves existing `secret` for potential re-enablement
   - Updates `name`, `endPointUrl`, `agencyName` if provided

**Key Design Decisions:**
- **Secret Preservation**: The secret is NOT cleared when disabling, allowing for future re-enablement without resending credentials
- **404 on Non-Existent**: Returns 404 if trying to disable an agency that doesn't exist
- **Timestamp Tracking**: Stores `disabledAt` timestamp for audit purposes

### 4. Type Updates

#### IAgency Interface (`src/actions/types/index.ts`)
```typescript
export interface IAgency {
    // ... existing fields ...
    disabledAt?: Date | null;
}
```

#### Agency Class (`src/actions/classes/Agency.ts`)
- Added `readonly disabledAt?: Date | null` property
- Updated constructor to accept `disabledAt`
- Updated `toJSON()` to include `disabledAt`
- Updated `toSafeJSON()` to include `disabledAt`

#### AgencyManager (`src/actions/classes/AgencyManager.ts`)
- Updated `getAgencyFromJson()` to parse `disabledAt` field
- No other changes needed - existing `updateAgency()` method handles the disabled state

### 5. Test Suite (`src/actions/test/agency-registration-internal-handler.test.ts`)

Added comprehensive tests for `registration.disabled` event:

**Test Cases:**
1. ✅ Should process valid registration.disabled event
2. ✅ Should reject without brandId
3. ✅ Should reject without enabled field
4. ✅ Should reject without agency_identification
5. ✅ Should return 404 when trying to disable non-existent agency
6. ✅ Should process event from example file
7. ✅ Should preserve secret when disabling (for potential re-enablement)
8. ✅ Should update disabledAt timestamp

**Mock Improvements:**
- Updated mocks to use actual in-memory storage
- Allows multiple operations (enable → disable) in same test
- Properly clears storage between tests

**Test Results:**
```
Test Suites: 4 passed, 4 total
Tests:       68 passed, 68 total
```

## Event Flow

```
Agency App → Brand App
      ↓
com.adobe.a2b.registration.disabled
      ↓
agency-event-handler (validates structure)
      ↓
agency-registration-internal-handler
      ↓
AgencyManager.updateAgency()
      ↓
Agency stored with enabled=false, disabledAt=timestamp
```

## Configuration

No changes to `app.config.yaml` were required since we reused the existing `agency-registration-internal-handler` action.

## Security Considerations

1. **Secret Preservation**: Secrets are intentionally preserved when disabling to allow re-enablement
2. **No Secret Validation**: Like other registration events, disabled events bypass secret validation in `agency-event-handler`
3. **Audit Trail**: `disabledAt` timestamp provides audit capability

## Future Enhancements

Potential future improvements:
1. Add `disabledBy` field to track who disabled the registration
2. Add `disabledReason` field for audit purposes
3. Consider adding a `registration.re-enabled` event for explicit re-enablement
4. Add UI support for viewing disabled agencies and re-enabling them

## Related Files

**Modified:**
- `src/actions/classes/AppEventRegistry.ts`
- `src/actions/event-handlers/agency-registration-internal-handler/index.ts`
- `src/actions/classes/Agency.ts`
- `src/actions/classes/AgencyManager.ts`
- `src/actions/types/index.ts`
- `src/actions/test/agency-registration-internal-handler.test.ts`

**Created:**
- `docs/events/registration/com-adobe-a2b-registration-disabled.json`
- `docs/cursor/REGISTRATION_DISABLED_IMPLEMENTATION.md`

## Deployment Notes

1. Build and test locally:
   ```bash
   cd /Users/dbenge/code_2/a2b/a2b-brand
   npm test
   aio app build
   ```

2. Deploy to Adobe I/O Runtime:
   ```bash
   cd /Users/dbenge/code_2/a2b/a2b-brand
   aio app use ../brand.json -m
   aio app deploy
   ```

3. Verify event is registered in AppEventRegistry:
   - Call `list-app-events` action
   - Confirm `com.adobe.a2b.registration.disabled` is present

## Testing in Production

To test the disabled event:

1. **Setup**: Create and enable an agency registration
2. **Disable**: Send `com.adobe.a2b.registration.disabled` event from agency
3. **Verify**: Check that agency is marked as `enabled: false` and has `disabledAt` timestamp
4. **Secret Preservation**: Confirm secret is still stored (use internal debugging)
5. **Re-enable**: Send `com.adobe.a2b.registration.enabled` event to re-enable

## Notes

- This implementation follows the existing pattern for registration events
- No breaking changes to existing functionality
- Backward compatible with existing agency storage
- Secret preservation allows for graceful re-enablement workflow

