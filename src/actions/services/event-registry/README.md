# Event Registry Service

The Event Registry Service provides READ-ONLY APIs for querying event definitions. Event registries are static and defined in code, not stored in the database.

## Architecture

### Static Event Registries

Event definitions are maintained in two static registries:

- **AppEventRegistry** (`src/shared/classes/AppEventRegistry.ts`)
  - Defines all application events (agency ↔ brand communication)
  - Includes registration events, asset sync events, etc.
  - Event codes: `com.adobe.a2b.*` and `com.adobe.b2a.*`

- **ProductEventRegistry** (`src/shared/classes/ProductEventRegistry.ts`)
  - Defines all Adobe product events (AEM, Workfront, etc.)
  - Event codes: Product-specific (e.g., `aem-assets-*`, `workfront-*`)

### Read-Only Design

Event registries are **read-only** because:
1. Event definitions are part of the application contract
2. Changing event schemas requires code changes
3. Both agency and brand must agree on event structures
4. Event definitions must be synchronized across projects

For **dynamic routing behavior**, use the [Routing Rules Service](../routing-rules/README.md).

## API Endpoints

### App Event Registry

Located in: `services/event-registry/`

- **List App Events**: `GET /list-app-events`
  - Lists all app event definitions
  - Optional params: `category` (filter by event category)
  - Returns: Array of `IAppEventDefinition`

- **Get App Event**: `GET /get-app-event`
  - Gets a specific app event definition
  - Params: `eventCode`
  - Returns: Single `IAppEventDefinition`

### Product Event Registry

Located in: `services/event-registry/`

- **List Product Events**: `GET /list-product-events`
  - Lists all product event definitions
  - Optional params: `category` (filter by product category)
  - Returns: Array of `IProductEventDefinition`

- **Get Product Event**: `GET /get-product-event`
  - Gets a specific product event definition
  - Params: `eventCode`
  - Returns: Single `IProductEventDefinition`

## Event Definition Structure

### App Event Definition

```typescript
interface IAppEventDefinition {
  code: string;                  // Event code (e.g., "com.adobe.a2b.assetsync.new")
  name: string;                  // Human-readable name
  description: string;           // Event description
  category: EventCategory;       // AGENCY | BRAND | REGISTRATION
  direction: 'a2b' | 'b2a';     // Agency-to-Brand or Brand-to-Agency
  version: string;               // Schema version
  schema?: object;               // JSON schema for validation
  examplePayload?: object;       // Example event payload
}
```

### Product Event Definition

```typescript
interface IProductEventDefinition {
  code: string;                  // Event code (e.g., "aem-assets-metadata-updated")
  name: string;                  // Human-readable name
  description: string;           // Event description
  product: string;               // Product name (e.g., "AEM", "Workfront")
  category: string;              // Product-specific category
  version: string;               // Schema version
  schema?: object;               // JSON schema for validation
  examplePayload?: object;       // Example event payload
}
```

## Authentication

All event registry APIs are protected with Adobe authentication:

```yaml
annotations:
  require-adobe-auth: true
```

## Usage Examples

### List All App Events

```bash
curl -X GET https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-app-events \
  -H "Authorization: Bearer $ADOBE_TOKEN"
```

Response:
```json
{
  "statusCode": 200,
  "body": {
    "events": [
      {
        "code": "com.adobe.a2b.assetsync.new",
        "name": "Asset Sync New",
        "description": "Emitted when a new asset is synced to a brand",
        "category": "AGENCY",
        "direction": "a2b",
        "version": "1.0.0"
      },
      ...
    ],
    "count": 9
  }
}
```

### Get Specific App Event

```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/get-app-event?eventCode=com.adobe.a2b.assetsync.new" \
  -H "Authorization: Bearer $ADOBE_TOKEN"
```

### List Product Events by Category

```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events?category=aem" \
  -H "Authorization: Bearer $ADOBE_TOKEN"
```

## Event Categories

### App Event Categories

- **AGENCY**: Events published by the agency to brands
  - `com.adobe.a2b.assetsync.*`
  - `com.adobe.a2b.workfront.*`
  
- **BRAND**: Events published by brands to the agency
  - `com.adobe.b2a.*`
  
- **REGISTRATION**: Brand registration lifecycle events
  - `com.adobe.a2b.registration.*`
  - `com.adobe.b2a.registration.*`

### Product Event Categories

- **AEM**: Adobe Experience Manager events
  - `aem-assets-metadata-updated`
  - `aem-assets-processing-complete`
  
- **Workfront**: Adobe Workfront events
  - `workfront-task-created`
  - `workfront-task-updated`

## Relationship to Routing Rules

Event registries and routing rules serve different purposes:

| Aspect | Event Registry | Routing Rules |
|--------|---------------|---------------|
| **Purpose** | Define event schemas | Define routing behavior |
| **Mutability** | Read-only (code) | CRUD (database) |
| **Scope** | Global | Global + Brand/Agency-specific |
| **Content** | Event structure | Routing logic |

**Example Workflow:**

1. **Event Registry** defines that `com.adobe.a2b.assetsync.new` exists and its schema
2. **Routing Rules** define which brands receive this event and under what conditions

## Synchronization

Event registries must be synchronized between `a2b-agency` and `a2b-brand` projects:

- Both projects share the same event codes
- Both projects must understand the same event schemas
- Changes to event registries require updates in both projects

See: `.cursor/rules/event-registry-sync.mdc`

## Related Documentation

- `src/shared/classes/AppEventRegistry.ts` - App event definitions
- `src/shared/classes/ProductEventRegistry.ts` - Product event definitions
- `src/shared/types/event-types.ts` - Type definitions
- `docs/events/` - Event payload examples
- `docs/cursor/EVENT_NAMING_CONVENTIONS.md` - Event naming standards
- `../routing-rules/README.md` - Dynamic routing rules

## Adding New Events

To add a new event:

1. **Update the registry** in `src/shared/classes/AppEventRegistry.ts` or `ProductEventRegistry.ts`
2. **Create event payload example** in `docs/events/`
3. **Sync to other project** (agency ↔ brand)
4. **Run tests** in both projects
5. **Deploy** both projects

**Note**: You do NOT need to call any API to "create" an event. Events are defined in code.

## Testing

Run tests with:

```bash
npm test -- AppEventRegistry.test.ts
npm test -- ProductEventRegistry.test.ts
```

## Migration from Old System

The old `EventRegistryManager` has been removed. Key changes:

- **Before**: Event definitions were stored in State Store (CRUD)
- **After**: Event definitions are in code (READ-only)
- **Routing behavior** moved to separate Routing Rules Service
- **Dynamic rules** now use `RoutingRulesManager` and brand/agency-specific rules

