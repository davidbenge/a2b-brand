# Event Classes Synchronization

## Overview
Event classes have been synchronized between `a2b-agency` and `a2b-brand` projects to support bidirectional event communication.

## Event Direction Naming Convention

### a2b Events (Agency-to-Brand)
- **Publisher**: Agency application
- **Consumer**: Brand applications
- **Event code pattern**: `com.adobe.a2b.*`
- **Examples**:
  - `com.adobe.a2b.assetsync.new`
  - `com.adobe.a2b.registration.enabled`
  - `com.adobe.a2b.workfront.task.created`

### b2a Events (Brand-to-Agency)
- **Publisher**: Brand applications  
- **Consumer**: Agency application
- **Event code pattern**: `com.adobe.b2a.*`
- **Examples**:
  - `com.adobe.b2a.registration.request`
  - `com.adobe.b2a.asset.updated` (future)

## File Structure

### a2b-agency Project
```
src/actions/classes/
├── A2bEvent.ts              # Base class for agency-published events
├── B2aEvent.ts              # Base class for brand-published events
├── a2b_events/              # Agency publishes these
│   ├── AssetSyncNewEvent.ts
│   ├── AssetSyncUpdateEvent.ts
│   ├── AssetSyncDeleteEvent.ts
│   ├── NewBrandRegistrationEvent.ts
│   ├── WorkfrontTaskCreatedEvent.ts
│   ├── WorkfrontTaskUpdatedEvent.ts
│   └── WorkfrontTaskCompletedEvent.ts
└── b2a_events/              # Brands publish these (agency consumes)
    └── BrandRegistrationRequestEvent.ts
```

### a2b-brand Project
```
src/actions/classes/
├── A2bEvent.ts              # Base class for agency-published events
├── B2aEvent.ts              # Base class for brand-published events
├── Agency.ts                # Agency configuration management
├── AgencyManager.ts         # Agency CRUD operations
├── a2b_events/              # Agency publishes these (brand consumes)
│   ├── AssetSyncNewEvent.ts
│   ├── AssetSyncUpdateEvent.ts
│   ├── AssetSyncDeleteEvent.ts
│   ├── NewBrandRegistrationEvent.ts
│   ├── WorkfrontTaskCreatedEvent.ts
│   ├── WorkfrontTaskUpdatedEvent.ts
│   └── WorkfrontTaskCompletedEvent.ts
└── b2a_events/              # Brands publish these
    └── BrandRegistrationRequestEvent.ts
```

## Base Event Classes

### A2bEvent
Base class for all agency-to-brand events.

**Properties:**
- `source`: Event source URI
- `type`: Event type (e.g., `com.adobe.a2b.assetsync.new`)
- `datacontenttype`: Content type (default: `application/json`)
- `data`: Event payload
- `id`: Unique event identifier (UUID)

**Methods:**
- `validate()`: Validates required fields
- `toJSON()`: Converts to JSON string
- `setSource(sourceInput)`: Sets event source
- `setSourceUri(applicationRuntimeInfo)`: Sets source from runtime info
- `toCloudEvent()`: Converts to CloudEvents format

### B2aEvent
Base class for all brand-to-agency events.

**Properties:** Same as A2bEvent
**Methods:** Same as A2bEvent

**Key Difference:** Validation logic is tailored for brand-published events (typically requires `app_runtime_info`).

## Event Classes

### a2b_events (Agency publishes, Brand consumes)

#### AssetSyncNewEvent
- **Code**: `com.adobe.a2b.assetsync.new`
- **Purpose**: Notify brand of new asset available for sync
- **Required fields**: Asset metadata, sync information

#### AssetSyncUpdateEvent
- **Code**: `com.adobe.a2b.assetsync.update`
- **Purpose**: Notify brand of asset updates
- **Required fields**: Asset ID, updated fields

#### AssetSyncDeleteEvent
- **Code**: `com.adobe.a2b.assetsync.delete`
- **Purpose**: Notify brand of asset deletion
- **Required fields**: Asset ID

#### NewBrandRegistrationEvent
- **Code**: `com.adobe.a2b.registration.received`
- **Purpose**: Confirm brand registration received by agency
- **Required fields**: `brandId`, `name`, `endPointUrl`
- **Note**: Does NOT include secret

#### WorkfrontTaskCreatedEvent
- **Code**: `com.adobe.a2b.workfront.task.created`
- **Purpose**: Notify brand of new Workfront task
- **Required fields**: Task details

#### WorkfrontTaskUpdatedEvent
- **Code**: `com.adobe.a2b.workfront.task.updated`
- **Purpose**: Notify brand of Workfront task updates
- **Required fields**: Task ID, updated fields

#### WorkfrontTaskCompletedEvent
- **Code**: `com.adobe.a2b.workfront.task.completed`
- **Purpose**: Notify brand of completed Workfront task
- **Required fields**: Task ID, completion status

### b2a_events (Brand publishes, Agency consumes)

#### BrandRegistrationRequestEvent
- **Code**: `com.adobe.b2a.registration.request`
- **Purpose**: Brand requests registration with agency
- **Required fields**: `name`, `endPointUrl`, `app_runtime_info`
- **Note**: Agency responds with `com.adobe.a2b.registration.received`

## Type Definitions

Both projects now include these interfaces:

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
```

## Synchronization Rules

### When to Sync
Event classes should be synchronized between projects when:

1. **Adding new a2b events**: Create in agency, copy to brand
2. **Adding new b2a events**: Create in brand, copy to agency  
3. **Modifying base classes** (`A2bEvent`, `B2aEvent`): Update in both
4. **Changing validation logic**: Update in both

### Sync Process

**For a2b events (agency → brand):**
```bash
cd a2b-agency
cp src/actions/classes/a2b_events/* ../a2b-brand/src/actions/classes/a2b_events/
```

**For b2a events (brand → agency):**
```bash
cd a2b-brand
cp src/actions/classes/b2a_events/* ../a2b-agency/src/actions/classes/b2a_events/
```

**For base classes:**
```bash
# From agency to brand
cd a2b-agency
cp src/actions/classes/A2bEvent.ts ../a2b-brand/src/actions/classes/
cp src/actions/classes/B2aEvent.ts ../a2b-brand/src/actions/classes/
```

### Testing After Sync
After synchronizing event classes:

1. **Agency app tests**:
   ```bash
   cd a2b-agency
   npm test
   ```

2. **Brand app tests**:
   ```bash
   cd a2b-brand
   npm test
   ```

3. Verify no TypeScript compilation errors:
   ```bash
   npm run build-actions
   ```

## Migration Notes

### Legacy io_events Folder
The `a2b-brand` project still contains a legacy `io_events/` folder with old event classes. This can remain for backward compatibility but should not be used for new development.

**Action Items:**
- [ ] Audit usage of old `io_events` classes
- [ ] Migrate any remaining code to use new `a2b_events` classes
- [ ] Remove `io_events/` folder once migration is complete

## Adding New Events

### Creating a New a2b Event (Agency publishes)

1. **Create in agency project**:
   ```typescript
   // src/actions/classes/a2b_events/MyNewEvent.ts
   import { A2bEvent } from '../A2bEvent';
   import { IValidationResult } from '../../types/index';

   export class MyNewEvent extends A2bEvent {
       constructor() {
           super();
           this.type = 'com.adobe.a2b.mynew.event';
       }

       validate(): IValidationResult {
           // Custom validation
       }
   }
   ```

2. **Copy to brand project**:
   ```bash
   cp a2b-agency/src/actions/classes/a2b_events/MyNewEvent.ts \
      a2b-brand/src/actions/classes/a2b_events/
   ```

3. **Register in event registry** (`src/shared/event-registry.ts`) in BOTH projects

### Creating a New b2a Event (Brand publishes)

1. **Create in brand project**:
   ```typescript
   // src/actions/classes/b2a_events/MyNewEvent.ts
   import { B2aEvent } from '../B2aEvent';
   import { IValidationResult } from '../../types/index';

   export class MyNewEvent extends B2aEvent {
       constructor() {
           super();
           this.type = 'com.adobe.b2a.mynew.event';
       }

       validate(): IValidationResult {
           // Custom validation
       }
   }
   ```

2. **Copy to agency project**:
   ```bash
   cp a2b-brand/src/actions/classes/b2a_events/MyNewEvent.ts \
      a2b-agency/src/actions/classes/b2a_events/
   ```

3. **Register in event registry** (`src/shared/event-registry.ts`) in BOTH projects

## Related Documentation

- [Event Naming Conventions](./.cursor/rules/event-naming-conventions.mdc)
- [Event Registry Synchronization Rule](./.cursor/rules/event-registry-sync.mdc)
- [Event Registry Implementation](./EVENT_REGISTRY_IMPLEMENTATION.md)
- [Brand Registration Flow](./BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md)

## Validation

To ensure event classes are properly synchronized:

```bash
# Check file counts match
cd a2b-agency && ls src/actions/classes/a2b_events/ | wc -l
cd a2b-brand && ls src/actions/classes/a2b_events/ | wc -l

cd a2b-agency && ls src/actions/classes/b2a_events/ | wc -l  
cd a2b-brand && ls src/actions/classes/b2a_events/ | wc -l

# Verify no TypeScript errors
cd a2b-agency && npx tsc --noEmit -p tsconfig.actions.json
cd a2b-brand && npx tsc --noEmit -p tsconfig.actions.json
```

## Status

✅ **Completed**:
- A2bEvent base class in both projects
- B2aEvent base class in both projects
- 7 a2b event classes synchronized
- 1 b2a event class synchronized
- Type definitions updated in both projects
- No linter errors in event classes

📋 **TODO**:
- Audit and migrate legacy io_events usage
- Create additional b2a events as needed
- Update event registry with new b2a events
- Create comprehensive event class tests

