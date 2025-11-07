# A2B Event Examples

This directory contains example event JSON files following the [CloudEvents specification](https://cloudevents.io/).

## CloudEvents Structure

All events in this directory follow the **CloudEvents v1.0 specification** (CNCF standard). CloudEvents provides a standardized way to describe event data, ensuring consistency and interoperability.

**Key Concepts**:
- **Top-level properties** (`source`, `type`, `id`, `datacontenttype`, etc.) are part of the CloudEvents spec
- **`data` property** contains the application-specific event payload
- All events include `app_runtime_info` in the `data` for routing and isolation

For detailed information about CloudEvents structure, see [`.cursor/rules/cloudevents-structure.mdc`](../.cursor/rules/cloudevents-structure.mdc).

**CloudEvents Resources**:
- CloudEvents Website: https://cloudevents.io/
- CloudEvents Spec: https://github.com/cloudevents/spec
- Adobe I/O Events: https://developer.adobe.com/events/

## Directory Structure

```
docs/events/
├── registration/    # Brand registration events (EventCategory.REGISTRATION)
├── agency/          # Agency-published events (EventCategory.AGENCY) - asset sync, workfront
├── product/         # Adobe product events (AEM, etc.) consumed by agency
└── brand/           # Brand-published events (EventCategory.BRAND)
```

## File Naming Convention

Event body example files follow the event code pattern with `.` replaced by `-`:

**Pattern**: `[event-code-with-dashes].json`

Examples:
- `com.adobe.a2b.registration.disabled` → `com-adobe-a2b-registration-disabled.json`
- `com.adobe.a2b.assetsync.new` → `com-adobe-a2b-assetsync-new.json`

**Test Variants**: Use underscore `_` for test modifiers:
- `com-adobe-a2b-assetsync-new.json` (base example)
- `com-adobe-a2b-assetsync-new_with-metadata.json` (test variant)
- `com-adobe-a2b-assetsync-new_minimal.json` (test variant)

## Event Body Example Files

### Registration Events
- `registration/com-adobe-a2b-registration-disabled.json`
- `registration/com-adobe-a2b-registration-received.json`
- `registration/com-adobe-a2b-registration-enabled.json`

### Agency Events (Asset Sync & Workfront)
- `agency/com-adobe-a2b-assetsync-new.json`
- `agency/com-adobe-a2b-assetsync-update.json`
- `agency/com-adobe-a2b-assetsync-delete.json`
- `agency/com-adobe-a2b-workfront-task-created.json`
- `agency/com-adobe-a2b-workfront-task-updated.json`
- `agency/com-adobe-a2b-workfront-task-completed.json`

### Brand Events (Brand-to-Agency)
- `brand/com-adobe-b2a-registration-new.json`

### Product Events (AEM)
- `../apis/aem/asset_metadata/aem-assets-asset-metadata_with-sync-on.json`
- `product/aem/aem-assets-asset-processing-complete.json`
- `product/aem/aem-assets-metadata-change.json`
- `product/aem/com-adobe-a2b-assetsync-update_metadata-only.json` (test variant)
- ... and more AEM event examples

See [product/aem/README.md](product/aem/README.md) for detailed documentation of AEM events.

## Usage

These JSON files are imported by `src/shared/classes/EventRegistry.ts` and used as the `eventBodyexample` property for each event definition.

```typescript
// EventRegistry.ts
const assetsyncNewBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-new.json');

'com.adobe.a2b.assetsync.new': {
    // ... other properties
    eventBodyexample: assetsyncNewBody,
    // ... other properties
}
```

## Adding New Events

When adding a new event:

1. **Create the event body example JSON** in the appropriate category folder with the naming pattern:
   ```bash
   # Convert event code: com.adobe.a2b.myevent.new → com-adobe-a2b-myevent-new.json
   docs/events/[category]/com-adobe-a2b-[event-name].json
   ```

2. **Import it in EventRegistry.ts**:
   ```typescript
   const myNewEventBody = require('../../../docs/events/category/com-adobe-a2b-myevent-new.json');
   ```

3. **Reference it in the event definition**:
   ```typescript
   'com.adobe.a2b.myevent.new': {
       eventBodyexample: myNewEventBody,
       // ... other properties
   }
   ```

## Example Structure

Each JSON file contains a complete CloudEvent with both the CloudEvents envelope and the event payload:

```json
{
  "source": "urn:uuid:...",           // CloudEvents: Event source
  "type": "com.adobe.a2b.event.type", // CloudEvents: Event type
  "id": "uuid",                       // CloudEvents: Unique ID
  "datacontenttype": "application/json", // CloudEvents: Content type
  "time": "2025-08-28T07:29:29.728Z", // CloudEvents: Timestamp (optional)
  "specversion": "1.0",               // CloudEvents: Spec version (optional)
  "data": {                           // Event payload (application-specific)
    "app_runtime_info": {             // Required: Runtime context
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "production"
    },
    "field1": "value1",               // Event-specific fields
    "field2": "value2"
  }
}
```

**Important**: The top-level properties are CloudEvents standard fields. The `data` property contains your application-specific event payload.

The required and optional fields in the `data` payload should match the `requiredFields` and `optionalFields` arrays in the EventRegistry definition.

