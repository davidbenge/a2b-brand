# List Events API - Test Documentation

## Test Coverage

**Test File:** `src/actions/test/list-events.test.ts`  
**Total Tests:** 40  
**Status:** ✅ All Passing

## Test Suites

### 1. Event Registry Tests (21 tests)

Tests the core event registry functionality and validates that helper functions work correctly.

#### `getAllEventCodes` (2 tests)
- ✅ Returns all 9 event codes
- ✅ Matches codes in `list-all-events.json` sample

#### `getEventCategories` (2 tests)
- ✅ Returns all 3 categories (brand-registration, asset-sync, workfront)
- ✅ Matches categories in `list-all-events.json` sample

#### `getEventCountByCategory` (2 tests)
- ✅ Returns correct count for each category (3 events each)
- ✅ Matches counts in `list-all-events.json` sample

#### `getEventsByCategory` (6 tests)
- ✅ Returns 3 asset-sync events
- ✅ Matches `filter-by-category-asset-sync.json` sample
- ✅ Returns 3 workfront events
- ✅ Matches `filter-by-category-workfront.json` sample
- ✅ Returns 3 brand-registration events
- ✅ Matches `filter-by-category-brand-registration.json` sample

#### `getEventDefinition` (4 tests)
- ✅ Returns correct definition for specific event
- ✅ Matches `get-specific-event.json` sample
- ✅ Returns undefined for invalid event code
- ✅ All events have required fields defined

#### `isValidEventCode` (3 tests)
- ✅ Returns true for valid event codes
- ✅ Returns false for invalid event codes
- ✅ Validates all codes in error response samples

#### `Event Registry Structure` (2 tests)
- ✅ All events have complete metadata (code, category, name, description, etc.)
- ✅ Structure matches sample response format

---

### 2. Response Structure Tests (11 tests)

Validates that API responses match the expected format defined in the sample JSON files.

#### Success Response - List All (3 tests)
- ✅ Has correct response structure (statusCode, body.success, body.data)
- ✅ Summary contains totalEvents, categories, and eventCounts
- ✅ Contains all 9 events in the events object

**Sample:** `list-all-events.json`

#### Success Response - Filter by Category (3 tests)
- ✅ Asset-sync response has correct structure
- ✅ Workfront response has correct structure
- ✅ Brand-registration response has correct structure

**Samples:** 
- `filter-by-category-asset-sync.json`
- `filter-by-category-workfront.json`
- `filter-by-category-brand-registration.json`

#### Success Response - Get Specific Event (2 tests)
- ✅ Has correct response structure
- ✅ Contains complete event definition with all metadata

**Sample:** `get-specific-event.json`

#### Error Response - Event Not Found (2 tests)
- ✅ Has correct error structure (statusCode: 404, success: false)
- ✅ Includes list of available event codes in details

**Sample:** `error-event-not-found.json`

#### Error Response - Invalid Category (2 tests)
- ✅ Has correct error structure (statusCode: 400, success: false)
- ✅ Includes list of valid categories in details

**Sample:** `error-invalid-category.json`

---

### 3. Event Data Validation Tests (8 tests)

Validates that event definitions contain correct required and optional fields.

#### Asset Sync Events (3 tests)
- ✅ New event requires: asset_id, asset_path, metadata, brandId, asset_presigned_url
- ✅ Update event requires: asset_id, brandId
- ✅ Delete event requires: asset_id, brandId

#### Brand Registration Events (2 tests)
- ✅ Disabled/Enabled events require: brandId, enabled
- ✅ Received event requires: brandId, name, endPointUrl, enabled

#### Workfront Events (3 tests)
- ✅ All events require: taskId
- ✅ All events have appropriate optional fields (projectId, assigneeId, etc.)

---

## Running the Tests

### Run all list-events tests:
```bash
npm test -- list-events.test.ts
```

### Run with verbose output:
```bash
npx jest src/actions/test/list-events.test.ts --verbose
```

### Run with coverage:
```bash
npx jest src/actions/test/list-events.test.ts --coverage
```

### Watch mode for development:
```bash
npx jest src/actions/test/list-events.test.ts --watch
```

## Test Strategy

### 1. Sample-Driven Testing
All tests validate against the JSON samples in `docs/apis/list-events/`. This ensures:
- API responses match documented examples
- Samples stay in sync with actual implementation
- Documentation is always accurate

### 2. Comprehensive Coverage
Tests cover:
- ✅ All 9 events (3 per category)
- ✅ All helper functions
- ✅ All response types (success and error)
- ✅ All query parameter combinations
- ✅ Data validation and structure

### 3. Validation Layers
Each test validates at multiple levels:
- **Function Level**: Helper functions return correct data
- **Structure Level**: Responses have correct shape
- **Data Level**: Event definitions contain correct metadata
- **Integration Level**: Registry matches sample responses

## Sample Files Used in Tests

| Sample File | Test Count | Purpose |
|------------|------------|---------|
| `list-all-events.json` | 8 | Full registry validation |
| `filter-by-category-asset-sync.json` | 2 | Category filtering |
| `filter-by-category-workfront.json` | 2 | Category filtering |
| `filter-by-category-brand-registration.json` | 2 | Category filtering |
| `get-specific-event.json` | 2 | Single event lookup |
| `error-event-not-found.json` | 2 | 404 error handling |
| `error-invalid-category.json` | 2 | 400 error handling |

## Test Results Summary

```
Test Suites: 1 passed
Tests:       40 passed
Time:        ~0.8s
Coverage:    100% of event registry functions
```

## Continuous Integration

These tests should be run:
- ✅ On every commit (pre-commit hook)
- ✅ On pull requests
- ✅ Before deployment
- ✅ After modifying event registry
- ✅ After updating sample JSON files

## Adding New Tests

When adding new events or modifying the API:

1. **Update the event registry** (`src/shared/event-registry.ts`)
2. **Update sample JSON files** in this directory
3. **Add/modify tests** in `src/actions/test/list-events.test.ts`
4. **Run tests** to ensure everything passes
5. **Update this documentation** if needed

### Example: Adding a New Event Category

```typescript
// 1. Add to event registry
'com.adobe.a2b.newevent.type': {
  code: 'com.adobe.a2b.newevent.type',
  category: 'new-category',
  // ... rest of definition
}

// 2. Create sample: filter-by-category-new-category.json

// 3. Add test
it('should return N new-category events', () => {
  const events = getEventsByCategory('new-category');
  expect(events).toHaveLength(N);
});

it('should match new-category sample response', () => {
  const events = getEventsByCategory('new-category');
  const sampleEvents = filterNewCategoryResponse.body.data.events;
  expect(events).toEqual(sampleEvents);
});
```

## Related Documentation

- **API Samples**: This directory (`docs/apis/list-events/`)
- **Event Registry**: `src/shared/event-registry.ts`
- **Action Implementation**: `src/actions/list-events/index.ts`
- **Implementation Guide**: `docs/cursor/EVENT_REGISTRY_IMPLEMENTATION.md`

