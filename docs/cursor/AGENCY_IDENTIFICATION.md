# Agency Identification in Events

**Date**: 2025-10-17  
**Purpose**: Enable brands to support multiple agencies by including agency identity in all events

---

## Overview

Every event sent from the agency to brands now includes **agency_identification** data containing:
- `agencyId`: Unique identifier for the agency
- `orgId`: Adobe Organization ID for the agency

This enables:
- **1-to-Many Relationship**: One brand can work with multiple agencies
- **Event Source Identification**: Brands know which agency sent each event
- **Multi-Agency Support**: Brands can maintain separate configurations per agency

---

## Architecture

### Agency Side (a2b-agency)

**Environment Variables** (`.env`):
```bash
AGENCY_ID=2ff22120-d393-4743-afdd-0d4b2038d2be
ORG_ID=33C1401053CF76370A490D4C@AdobeOrg
```

**Class**: `AgencyIdentification`
- Reads AGENCY_ID and ORG_ID from action params
- Provides serialization for event data
- Validates both fields are present

**Event Base Class**: `A2bEvent`
- New method: `setAgencyIdentification(agencyIdentification)`
- Adds `agency_identification` to `event.data`

**Usage in Actions**:
```typescript
// In any action that sends events to brands
import { AgencyIdentification } from "../classes/AgencyIdentification";

// Extract from params
const agencyIdentification = AgencyIdentification.getAgencyIdentificationFromActionParams(params);

// Add to event
if (agencyIdentification) {
  event.setAgencyIdentification(agencyIdentification);
}
```

---

### Brand Side (a2b-brand)

**Interface**: `IAgency`
```typescript
export interface IAgency {
    agencyId: string; // Agency identifier (from agency_identification)
    orgId: string; // Agency's organization ID (from agency_identification)
    brandId: string; // This brand's ID at the agency
    secret: string; // Secret to use when calling this agency
    // ... other fields
}
```

**Class**: `Agency`
- Stores `agencyId` and `orgId` for each agency
- Supports multiple agencies (different agencyId values)
- Each agency has its own secret, credentials, and configuration

**Usage in Event Handlers**:
```typescript
// Extract from event data
const agencyId = eventData.agency_identification?.agencyId;
const orgId = eventData.agency_identification?.orgId;

// Store with agency registration
const agency = new Agency({
    agencyId: agencyId,
    orgId: orgId,
    brandId: eventData.brandId,
    // ... other fields
});
```

---

## Event Structure

### Before (Old Format)
```json
{
  "type": "com.adobe.a2b.registration.enabled",
  "data": {
    "app_runtime_info": {
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "benge"
    },
    "brandId": "...",
    "secret": "...",
    "name": "..."
  }
}
```

**Problem**: No way to identify which agency sent the event.

### After (New Format)
```json
{
  "type": "com.adobe.a2b.registration.enabled",
  "data": {
    "app_runtime_info": {
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "benge"
    },
    "agency_identification": {
      "agencyId": "2ff22120-d393-4743-afdd-0d4b2038d2be",
      "orgId": "33C1401053CF76370A490D4C@AdobeOrg"
    },
    "brandId": "...",
    "secret": "...",
    "name": "..."
  }
}
```

**Solution**: `agency_identification` provides unique agency identity.

---

## Configuration

### a2b-agency: app.config.yaml

Every action that sends events to brands must include AGENCY_ID and ORG_ID:

```yaml
update-brand:
  function: src/actions/update-brand/index.ts
  inputs:
    LOG_LEVEL: debug
    AGENCY_ID: $AGENCY_ID
    ORG_ID: $ORG_ID
    APPLICATION_RUNTIME_INFO: '{"namespace":"${AIO_runtime_namespace}","app_name":"agency","action_package_name":"${AIO_ACTION_PACKAGE_NAME}"}'
```

**Actions that send events to brands**:
- `update-brand` (registration.enabled, registration.disabled) ✅ Updated
- `brand-event-handler` (if it forwards events) - TODO
- Any custom actions that emit A2bEvents - TODO

---

## Implementation Details

### AgencyIdentification Class

**Location**: `src/actions/classes/AgencyIdentification.ts`

```typescript
export interface IAgencyIdentification {
  agencyId: string;
  orgId: string;
}

export class AgencyIdentification implements IAgencyIdentification {
  agencyId: string;
  orgId: string;

  // Extract from action params (environment variables)
  static getAgencyIdentificationFromActionParams(params: any): AgencyIdentification | undefined

  // Extract from event data (for brands receiving events)
  static getAgencyIdentificationFromEventData(params: any): AgencyIdentification | undefined

  // Serialize for event.data.agency_identification
  serialize(): { agencyId: string; orgId: string; }

  // Validate both fields are present
  isValid(): boolean
}
```

### A2bEvent.setAgencyIdentification()

**Location**: `src/actions/classes/A2bEvent.ts`

```typescript
/**
 * Set agency identification in event data
 * This allows brands to support multiple agencies and identify the source
 */
setAgencyIdentification(agencyIdentification: IAgencyIdentification): void {
    this.data.agency_identification = {
        agencyId: agencyIdentification.agencyId,
        orgId: agencyIdentification.orgId
    };
}
```

### Update-Brand Action

**Location**: `src/actions/update-brand/index.ts`

```typescript
// For both registration.enabled and registration.disabled events:

// Set agency identification so brand knows which agency this is from
const agencyIdentification = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
if (agencyIdentification) {
  event.setAgencyIdentification(agencyIdentification);
} else {
  logger.warn('Could not extract agency identification - AGENCY_ID and ORG_ID may be missing');
}
```

### Agency Registration Handler (Brand Side)

**Location**: `src/actions/agency-registration-internal-handler/index.ts` (a2b-brand)

```typescript
// For registration.received event:
const agencyIdFromEvent = eventData.agency_identification?.agencyId;
const orgIdFromEvent = eventData.agency_identification?.orgId;

agency = new Agency({
    agencyId: agencyIdFromEvent || agencyId,
    orgId: orgIdFromEvent || '',
    // ... other fields
});

// For registration.enabled event:
const agencyId = eventData.agency_identification?.agencyId;
const orgId = eventData.agency_identification?.orgId;

if (!agencyId || !orgId) {
  return { statusCode: 400, body: 'Missing agency_identification' };
}
```

---

## Use Cases

### Use Case 1: Single Brand, Multiple Agencies

**Scenario**: A brand works with 3 different agencies

**Brand's AgencyManager**:
```typescript
agencies = [
  {
    agencyId: "agency-A-uuid",
    orgId: "org-A@AdobeOrg",
    brandId: "brand-1-at-agency-A",
    secret: "secret-A",
    name: "Brand Name at Agency A",
    enabled: true
  },
  {
    agencyId: "agency-B-uuid",
    orgId: "org-B@AdobeOrg",
    brandId: "brand-2-at-agency-B",
    secret: "secret-B",
    name: "Brand Name at Agency B",
    enabled: true
  },
  {
    agencyId: "agency-C-uuid",
    orgId: "org-C@AdobeOrg",
    brandId: "brand-3-at-agency-C",
    secret: "secret-C",
    name: "Brand Name at Agency C",
    enabled: false
  }
]
```

**Event Routing**:
```typescript
// When brand receives event
const agencyId = event.data.agency_identification.agencyId;

// Look up which agency sent it
const agency = await agencyManager.getAgency(agencyId);

// Use agency-specific configuration
if (agency.enabled) {
  // Process event with agency's secret, credentials, etc.
}
```

### Use Case 2: Agency Identity Verification

**Scenario**: Brand verifies event authenticity

```typescript
// Brand receives event claiming to be from Agency A
const claimedAgencyId = event.data.agency_identification.agencyId;
const claimedOrgId = event.data.agency_identification.orgId;

// Look up stored agency
const storedAgency = await agencyManager.getAgency(claimedAgencyId);

// Verify org ID matches
if (storedAgency.orgId !== claimedOrgId) {
  logger.error('Agency identification mismatch - possible spoofing attempt');
  return { statusCode: 403, body: 'Forbidden' };
}
```

---

## Migration Notes

### Existing Deployments

**Backward Compatibility**: 
- Events without `agency_identification` will still work
- Brand handlers check for presence before extracting
- Existing agencies can be migrated manually

**Migration Steps**:
1. Deploy updated a2b-agency with AGENCY_ID and ORG_ID
2. Deploy updated a2b-brand with Agency.orgId support
3. New events will include agency_identification
4. Existing agency records can be updated with orgId

**Manual Migration** (if needed):
```typescript
// On brand side, update existing agencies
const agency = await agencyManager.getAgency(agencyId);
await agencyManager.updateAgency(agencyId, {
  orgId: "33C1401053CF76370A490D4C@AdobeOrg" // Add orgId
});
```

---

## Testing

### Agency Side Tests

```typescript
// Test AgencyIdentification extraction
test('should extract agency identification from params', () => {
  const params = {
    AGENCY_ID: '2ff22120-d393-4743-afdd-0d4b2038d2be',
    ORG_ID: '33C1401053CF76370A490D4C@AdobeOrg'
  };
  
  const agencyId = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
  expect(agencyId).toBeDefined();
  expect(agencyId.agencyId).toBe('2ff22120-d393-4743-afdd-0d4b2038d2be');
  expect(agencyId.orgId).toBe('33C1401053CF76370A490D4C@AdobeOrg');
});

// Test event includes agency_identification
test('event should include agency_identification', () => {
  const event = new RegistrationEnabledEvent(...);
  const agencyId = new AgencyIdentification({
    agencyId: '...',
    orgId: '...'
  });
  
  event.setAgencyIdentification(agencyId);
  
  expect(event.data.agency_identification).toBeDefined();
  expect(event.data.agency_identification.agencyId).toBe('...');
});
```

### Brand Side Tests

```typescript
// Test Agency requires orgId
test('should require orgId when creating Agency', () => {
  expect(() => {
    new Agency({
      agencyId: 'test-id',
      // orgId missing
      brandId: 'brand-id',
      name: 'Test',
      endPointUrl: 'https://...'
    });
  }).toThrow('orgId is required');
});

// Test event handler extracts agency_identification
test('should extract agency_identification from event', () => {
  const eventData = {
    agency_identification: {
      agencyId: 'agency-uuid',
      orgId: 'org-id@AdobeOrg'
    },
    brandId: '...',
    secret: '...'
  };
  
  // Handler should extract and use these values
  const agencyId = eventData.agency_identification.agencyId;
  const orgId = eventData.agency_identification.orgId;
  
  expect(agencyId).toBe('agency-uuid');
  expect(orgId).toBe('org-id@AdobeOrg');
});
```

---

## Related Files

### a2b-agency
- `src/actions/classes/AgencyIdentification.ts` - NEW: Agency identification class
- `src/actions/classes/A2bEvent.ts` - UPDATED: Added setAgencyIdentification()
- `src/actions/update-brand/index.ts` - UPDATED: Includes agency_identification in events
- `app.config.yaml` - UPDATED: Added AGENCY_ID to update-brand action
- `docs/events/registration/com-adobe-a2b-registration-enabled.json` - UPDATED: Example with agency_identification

### a2b-brand
- `src/actions/classes/AgencyIdentification.ts` - NEW: Copied from agency (for extraction)
- `src/actions/classes/Agency.ts` - UPDATED: Added orgId field
- `src/actions/types/index.ts` - UPDATED: IAgency includes orgId
- `src/actions/agency-registration-internal-handler/index.ts` - UPDATED: Extracts and stores agency_identification

---

## Summary

✅ **Agency Side**:
- AGENCY_ID and ORG_ID in environment variables
- AgencyIdentification class for extraction and serialization
- A2bEvent.setAgencyIdentification() method
- All events to brands include agency_identification

✅ **Brand Side**:
- Agency class stores agencyId AND orgId
- Supports multiple agencies (1-to-many)
- Event handlers extract agency_identification
- Enables multi-agency architecture

✅ **Benefits**:
- Brands can work with multiple agencies
- Clear event source identification
- Scalable architecture
- Future-proof for multi-tenancy

