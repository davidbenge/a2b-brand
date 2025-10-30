# Legacy Event Classes Migration

## Overview
Successfully migrated `a2b-brand` project from legacy `io_events/` structure to the new synchronized `a2b_events/` and `b2a_events/` architecture.

## What Was Done

### 1. Created New Event Infrastructure ✅
- **`A2bEvent`**: Base class for agency-to-brand events (copied from agency)
- **`B2aEvent`**: Base class for brand-to-agency events (copied from agency)
- **`a2b_events/`**: 7 event classes for agency-published events
- **`b2a_events/`**: 1 event class for brand-published events

### 2. Migrated Code ✅
Updated three action files to use new utilities:

#### `agency-event-handler/index.ts`
- **Before**: `import { EventManager } from "../classes/EventManager"`
- **After**: `import { getApplicationRuntimeInfo } from "../utils/applicationRuntimeInfo"`
- **Change**: Replaced `EventManager.getApplicationRuntimeInfo()` with standalone utility function

#### `adobe-product-event-handler/index.ts`
- **Before**: `import { EventManager } from "../classes/EventManager"`
- **After**: Removed unused import
- **Change**: EventManager was imported but never used

#### `agency-assetsync-internal-handler/index.ts`
- **Before**: 
  ```ts
  import { EventManager } from "../classes/EventManager";
  import { AssetSyncNewEvent } from "../classes/io_events/AssetSyncNewEvent";
  import { AssetSyncUpdateEvent } from "../classes/io_events/AssetSyncUpdateEvent";
  import { AssetSyncDeleteEvent } from "../classes/io_events/AssetSyncDeleteEvent";
  ```
- **After**: All imports removed (were unused)
- **Change**: Event classes were imported but never instantiated or used

### 3. Created New Utility ✅
**File**: `src/actions/utils/applicationRuntimeInfo.ts`

Extracted static utility methods from EventManager into standalone functions:
- `getApplicationRuntimeInfo(params)`: Parse APPLICATION_RUNTIME_INFO from action params
- `getAppRuntimeInfoFromEventData(eventData)`: Extract app_runtime_info from event data

### 4. Removed Legacy Files ✅

#### Deleted Classes
- ❌ `EventManager.ts` - Replaced with applicationRuntimeInfo utility
- ❌ `IoCustomEventManager.ts` - Not needed (brand receives events, doesn't publish to Adobe I/O)
- ❌ `IoEvent.ts` - Replaced with A2bEvent/B2aEvent

#### Deleted Directory
- ❌ `io_events/` - Entire folder with 7 legacy event classes
  - `AssetSyncDeleteEvent.ts` (duplicate)
  - `AssetSynchDeleteEvent.ts` (typo variant)
  - `AssetSyncNewEvent.ts` (duplicate)
  - `AssetSynchNewEvent.ts` (typo variant)
  - `AssetSyncUpdateEvent.ts` (duplicate)
  - `AssetSynchUpdateEvent.ts` (typo variant)
  - `NewBrandRegistrationEvent.ts` (duplicate)

## File Structure Comparison

### Before Migration
```
src/actions/classes/
├── EventManager.ts           ❌ Legacy
├── IoCustomEventManager.ts   ❌ Legacy
├── IoEvent.ts                ❌ Legacy
├── io_events/                ❌ Legacy folder
│   ├── AssetSyncDeleteEvent.ts
│   ├── AssetSynchDeleteEvent.ts
│   ├── AssetSyncNewEvent.ts
│   ├── AssetSynchNewEvent.ts
│   ├── AssetSyncUpdateEvent.ts
│   ├── AssetSynchUpdateEvent.ts
│   └── NewBrandRegistrationEvent.ts
├── Agency.ts
└── AgencyManager.ts
```

### After Migration
```
src/actions/classes/
├── A2bEvent.ts              ✅ New base class
├── B2aEvent.ts              ✅ New base class
├── Agency.ts                ✅ Agency management
├── AgencyManager.ts         ✅ Agency CRUD
├── a2b_events/              ✅ Synced from agency
│   ├── AssetSyncDeleteEvent.ts
│   ├── AssetSyncNewEvent.ts
│   ├── AssetSyncUpdateEvent.ts
│   ├── NewBrandRegistrationEvent.ts
│   ├── WorkfrontTaskCompletedEvent.ts
│   ├── WorkfrontTaskCreatedEvent.ts
│   └── WorkfrontTaskUpdatedEvent.ts
└── b2a_events/              ✅ Synced from agency
    └── BrandRegistrationRequestEvent.ts

src/actions/utils/
└── applicationRuntimeInfo.ts ✅ New utility
```

## Type Definitions Updated

Updated `src/actions/types/index.ts` to include:
```typescript
export interface Ia2bEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface Ib2aEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

export interface IValidationResult {
    valid: boolean;
    message?: string;
    missing?: string[];
}

export interface IApplicationRuntimeInfo {
    consoleId: string;
    projectName: string;
    workspace: string;
    actionPackageName?: string;
    appName?: string;
}
```

## Test Results

### Before Migration
```
Test Suites: 1 failed, 2 passed, 3 total
Tests:       6 failed, 63 passed, 69 total
```

### After Migration
```
Test Suites: 1 failed, 2 passed, 3 total
Tests:       6 failed, 63 passed, 69 total
```

✅ **Same results** - No regressions introduced by migration!

The 6 failing tests are pre-existing issues in `agency-event-handler.test.ts` unrelated to this migration.

## Validation

### Linter Check ✅
```bash
# No TypeScript errors
No linter errors found.
```

### File Count Verification ✅
```bash
# Event classes synchronized with agency
ls src/actions/classes/a2b_events/ | wc -l  # 7 files
ls src/actions/classes/b2a_events/ | wc -l  # 1 file

# Matches agency project structure
```

### Import Check ✅
```bash
# No references to legacy classes remain
grep -r "io_events" src/actions/          # No matches
grep -r "IoEvent" src/actions/            # Only in old comments
grep -r "EventManager" src/actions/       # No matches
grep -r "IoCustomEventManager" src/      # No matches
```

## Benefits of Migration

### 1. **Consistency with Agency App**
- Both apps now use the same event class structure
- Easy to synchronize changes
- Shared naming conventions

### 2. **Clear Event Direction**
- `a2b_events/` - Events FROM agency TO brand
- `b2a_events/` - Events FROM brand TO agency
- No more ambiguous "IoEvent" naming

### 3. **Removed Dead Code**
- Eliminated unused EventManager
- Removed duplicate event classes (typo variants)
- Cleaned up unnecessary IoCustomEventManager (brand doesn't publish to Adobe I/O)

### 4. **Better Organization**
- Standalone utility for runtime info parsing
- Event classes grouped by direction
- Base classes clearly defined

### 5. **Type Safety**
- Proper interfaces for a2b and b2a events
- Validation result types
- No implicit any types

## Future Maintenance

### Adding New a2b Events
1. Agency creates event in `src/actions/classes/a2b_events/`
2. Copy to brand: `cp a2b-agency/src/actions/classes/a2b_events/NewEvent.ts a2b-brand/src/actions/classes/a2b_events/`
3. Update event registry in both projects

### Adding New b2a Events
1. Brand creates event in `src/actions/classes/b2a_events/`
2. Copy to agency: `cp a2b-brand/src/actions/classes/b2a_events/NewEvent.ts a2b-agency/src/actions/classes/b2a_events/`
3. Update event registry in both projects

### Utility Updates
If `applicationRuntimeInfo.ts` needs updates:
1. Update in brand project
2. Consider if agency needs same utility
3. Keep documentation in sync

## Related Documentation

- [Event Classes Synchronization](./EVENT_CLASSES_SYNCHRONIZATION.md)
- [Event Naming Conventions](../../.cursor/rules/event-naming-conventions.mdc)
- [Brand Registration Flow](./BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md)

## Migration Checklist

- [x] Create new event infrastructure (A2bEvent, B2aEvent, directories)
- [x] Copy event classes from agency
- [x] Create applicationRuntimeInfo utility
- [x] Update agency-event-handler imports
- [x] Update adobe-product-event-handler imports
- [x] Update agency-assetsync-internal-handler imports
- [x] Update type definitions
- [x] Delete EventManager.ts
- [x] Delete IoCustomEventManager.ts
- [x] Delete IoEvent.ts
- [x] Delete io_events/ directory
- [x] Run linter checks
- [x] Run test suite
- [x] Document changes
- [x] Verify no regressions

## Summary

✅ **Migration Successful!**

- Removed 4 legacy files (3 classes + 1 directory with 7 duplicate files)
- Added 2 base classes (A2bEvent, B2aEvent)
- Added 8 synchronized event classes
- Added 1 utility file
- Updated 3 action files
- Updated type definitions
- Zero regressions in tests
- Zero linter errors

The `a2b-brand` project is now fully aligned with the agency project's event architecture and ready for bidirectional event communication.

