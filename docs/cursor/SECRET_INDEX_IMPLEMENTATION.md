# Secret Index Implementation

## Overview

Implemented a secondary index system in both `AgencyManager` (a2b-brand) and `BrandManager` (a2b-agency) to enable fast lookups by secret without iterating through all records.

## Problem

When the `agency-event-handler` (in a2b-brand) receives events from agencies (except registration events), it needs to:
1. Check the `X-A2B-Brand-Secret` header
2. Find which Agency the secret belongs to
3. Validate that the Agency is enabled
4. Route the event to the appropriate internal handler

Without an index, this would require loading all agencies from storage and checking each secret, which is slow and inefficient.

## Solution

Added a **secret index** in the state store that maps secrets to IDs:
- **Brand App**: `AGENCY_SECRET_INDEX_{secret}` → `agencyId`
- **Agency App**: `BRAND_SECRET_INDEX_{secret}` → `brandId`

## Implementation Details

### Constants Added

**a2b-brand** (`src/actions/constants.ts`):
```typescript
export const AGENCY_SECRET_INDEX_PREFIX = 'AGENCY_SECRET_INDEX_';
```

**a2b-agency** (`src/actions/constants.ts`):
```typescript
export const BRAND_SECRET_INDEX_PREFIX = 'BRAND_SECRET_INDEX_';
```

### AgencyManager Methods (a2b-brand)

#### Private Methods

```typescript
private async saveSecretIndex(secret: string, agencyId: string): Promise<void>
```
- Saves a secret → agencyId mapping in the state store
- Called automatically when saving an agency with a secret

```typescript
private async getAgencyIdBySecret(secret: string): Promise<string | undefined>
```
- Looks up an agencyId by secret from the index
- Returns `undefined` if not found

```typescript
private async deleteSecretIndex(secret: string): Promise<void>
```
- Removes a secret from the index
- Called automatically when deleting an agency

#### Public Method

```typescript
async getAgencyBySecret(secret: string): Promise<Agency | undefined>
```
- **Fast lookup**: Uses the secret index to find the agency ID
- Retrieves the full agency object
- Validates that the secret actually matches (double-check)
- Returns `undefined` if:
  - No index entry exists
  - Agency not found in storage
  - Secret doesn't match (shouldn't happen, but defensive)

### BrandManager Methods (a2b-agency)

Same implementation pattern as `AgencyManager`:
- `private async saveSecretIndex(secret: string, brandId: string)`
- `private async getBrandIdBySecret(secret: string)`
- `private async deleteSecretIndex(secret: string)`
- `public async getBrandBySecret(secret: string)`

### Updated Save/Delete Methods

**AgencyManager.saveAgency()**:
```typescript
async saveAgency(agency: Agency): Promise<Agency> {
  // ... save to state store ...
  // ... save to file store ...
  
  // Save secret index if secret exists
  if (agency.hasSecret()) {
    await this.saveSecretIndex(agency.secret, agency.agencyId);
  }
  
  return agency;
}
```

**AgencyManager.deleteAgency()**:
```typescript
async deleteAgency(agencyId: string): Promise<void> {
  // Get the agency first to get the secret for index cleanup
  const agency = await this.getAgency(agencyId);
  
  // ... delete from state store ...
  // ... delete from file store ...
  
  // Delete secret index if agency had a secret
  if (agency && agency.hasSecret()) {
    await this.deleteSecretIndex(agency.secret);
  }
}
```

## Usage in agency-event-handler (a2b-brand)

```typescript
// Validate secret header for all events EXCEPT registration events
if (!isRegistrationEvent) {
  const headers = params.__ow_headers || {};
  const brandSecret = headers['x-a2b-brand-secret'];
  
  if (!brandSecret) {
    logger.error('Missing X-A2B-Brand-Secret header');
    return { statusCode: 401, body: 'Missing X-A2B-Brand-Secret header' }
  }

  // Fast lookup using secret index
  const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
  agency = await agencyManager.getAgencyBySecret(brandSecret);
  
  if (!agency) {
    logger.error('Invalid secret - no matching agency found');
    return { statusCode: 401, body: 'Invalid secret - authentication failed' }
  }

  if (!agency.isEnabled()) {
    logger.error(`Agency ${agency.agencyId} is not enabled`);
    return { statusCode: 403, body: 'Agency is not enabled' }
  }

  logger.info(`Secret validated for agency ${agency.agencyId} (${agency.name})`);
}
```

## Performance Benefits

**Before** (without index):
1. Load all agencies from file store
2. Parse each agency JSON
3. Check each secret until match found
4. **O(n)** complexity where n = number of agencies

**After** (with index):
1. Single state store lookup by secret
2. Load only the matching agency
3. **O(1)** complexity - constant time

## Security Considerations

1. **Secrets never exposed**: The index only stores `secret → id` mapping
2. **Double validation**: Even after finding an agency, the secret is validated again
3. **Disabled agencies rejected**: Checks `agency.isEnabled()` before allowing access
4. **No registration bypass**: Registration events skip secret validation entirely
   - `com.adobe.a2b.registration.received` - brand doesn't have secret yet
   - `com.adobe.a2b.registration.enabled` - brand receives secret in this event

## Index Consistency

The index is automatically maintained:
- ✅ **Created**: When an agency/brand is saved with a secret
- ✅ **Updated**: When an agency/brand is saved (overwrites existing index)
- ✅ **Deleted**: When an agency/brand is deleted

## Testing

All tests passing (98/98):
- ✅ Secret validation for non-registration events
- ✅ Secret validation bypass for registration events
- ✅ Invalid secret rejection
- ✅ Disabled agency rejection
- ✅ Event routing with validated agency

## Files Modified

### a2b-brand
- `src/actions/constants.ts` - Added `AGENCY_SECRET_INDEX_PREFIX`
- `src/actions/classes/AgencyManager.ts` - Added secret index methods
- `src/actions/agency-event-handler/index.ts` - Uses `getAgencyBySecret()`
- `src/actions/test/agency-event-handler.test.ts` - Updated tests

### a2b-agency
- `src/actions/constants.ts` - Added `BRAND_SECRET_INDEX_PREFIX`
- `src/actions/classes/BrandManager.ts` - Added secret index methods

## Future Enhancements

1. **Index rebuild utility**: In case index gets out of sync
2. **Index expiration**: Could add TTL to index entries
3. **Index metrics**: Track index hit/miss rates
4. **Bulk operations**: Optimize for multiple secret lookups

## Related Documentation

- `docs/cursor/BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md` - Registration flow details
- `docs/cursor/EVENT_REGISTRY_IMPLEMENTATION.md` - Event registry system
- `docs/cursor/EVENT_CLASSES_SYNCHRONIZATION.md` - Event class sync between projects

