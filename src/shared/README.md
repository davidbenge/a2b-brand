# Shared Code

This directory contains browser-safe code that can be imported by both **actions** (Node.js/OpenWhisk) and **web frontend** (browser).

## Guidelines

- ✅ **Do**: Use standard JavaScript/TypeScript features
- ✅ **Do**: Import shared types and utilities
- ❌ **Don't**: Import Node.js-only modules (fs, path, @adobe/aio-lib-*, etc.)
- ❌ **Don't**: Import action-specific code
- ❌ **Don't**: Import web-specific code (React, DOM APIs)

## Constants

The **Constants** (`constants.ts`) file contains browser-safe constants used across the application.

### EventCategory Enum

Defines the categories for A2B events:

```typescript
import { EventCategory } from '../shared/constants';

// Available categories:
EventCategory.AGENCY       // 'agency' - Events from agency operations (asset sync)
EventCategory.BRAND        // 'brand' - Events from brand operations
EventCategory.PRODUCT      // 'product' - Events from Adobe products (Workfront)
EventCategory.REGISTRATION // 'registration' - Brand registration events
```

**Type Helper:**
```typescript
import { EventCategoryValue } from '../shared/constants';

// EventCategoryValue is: 'agency' | 'brand' | 'product' | 'registration'
const category: EventCategoryValue = 'agency';
```

## Event Registry

The **Event Registry** (`classes/EventRegistry.ts`) is the single source of truth for all A2B events.

### Features

- Centralized event definitions with metadata
- Type-safe event codes and categories
- Helper functions for filtering and querying events
- Shared between actions and web frontend
- Event body examples loaded from `docs/events/` folder structure

### Event Body Examples

Event body examples are stored as JSON files in the `docs/events/` directory and imported into the EventRegistry:

```
docs/events/
├── registration/ # Registration events (com-adobe-a2b-registration-*.json)
├── agency/       # Asset sync events (com-adobe-a2b-assetsync-*.json)
├── product/      # Product events (com-adobe-a2b-workfront-*.json, aem-*.json)
└── brand/        # Brand-specific events
```

**File Naming**: Event codes with `.` → `-` (e.g., `com.adobe.a2b.assetsync.new` → `com-adobe-a2b-assetsync-new.json`)

Each event definition references its example file:
```typescript
const assetsyncNewBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-new.json');

'com.adobe.a2b.assetsync.new': {
    eventBodyexample: assetsyncNewBody,
    // ... other properties
}
```

See `docs/events/README.md` for details on adding new event examples.

### Usage in Actions

```typescript
import { EVENT_REGISTRY, getEventsByCategory } from '../../shared/classes/EventRegistry';

// Get all asset sync events
const assetSyncEvents = getEventsByCategory('agency');

// Check if event code exists
const eventDef = EVENT_REGISTRY['com.adobe.a2b.assetsync.new'];
console.log(eventDef.name); // "Asset Sync New"
console.log(eventDef.requiredFields); // ['asset_id', 'asset_path', ...]
```

### Usage in Web Frontend

```typescript
import { EVENT_REGISTRY, getEventCategories } from '../../../../shared/classes/EventRegistry';

function EventList() {
  const categories = getEventCategories();
  
  return (
    <div>
      {categories.map(category => (
        <EventCategorySection key={category} category={category} />
      ))}
    </div>
  );
}
```

### Available Helper Functions

- `getEventsByCategory(category)` - Get all events for a specific category
- `getAllEventCodes()` - Get array of all event codes
- `getEventDefinition(code)` - Get event definition by code
- `getEventCategories()` - Get all available categories
- `isValidEventCode(code)` - Check if event code exists
- `getEventCountByCategory()` - Get count of events per category

## Adding New Events

To add a new event:

1. Add the event definition to `EVENT_REGISTRY` in `event-registry.ts`
2. Add the event code constant to `src/actions/constants.ts` (for backward compatibility)
3. Create the event class in `src/actions/classes/a2b_events/`
4. The event will automatically be available in the `list-events` action and web frontend

### Example

```typescript
// In event-registry.ts
export const EVENT_REGISTRY: Record<string, EventDefinition> = {
  // ... existing events ...
  
  'com.adobe.a2b.mynew.event': {
    code: 'com.adobe.a2b.mynew.event',
    category: 'asset-sync', // or new category
    name: 'My New Event',
    description: 'Description of what this event does',
    eventClass: 'MyNewEvent',
    version: '1.0.0',
    requiredFields: ['field1', 'field2'],
    optionalFields: ['field3']
  }
};
```

## Testing

The event registry can be tested independently:

```typescript
import { isValidEventCode, getEventDefinition } from './event-registry';

// Test event lookup
console.assert(isValidEventCode('com.adobe.a2b.assetsync.new'));
console.assert(!isValidEventCode('invalid.event.code'));

// Test event details
const event = getEventDefinition('com.adobe.a2b.assetsync.new');
console.assert(event?.category === 'asset-sync');
console.assert(event?.requiredFields.includes('asset_id'));
```

## Rules Manager

The **Rules Manager** (`RulesManager.ts`) provides a browser-safe rules processing engine for managing routing rules and event processing.

### Features

- ✅ **Browser-safe**: No Node.js dependencies
- ✅ **Logger abstraction**: Works with aioLogger (Node) or console (browser)
- ✅ **Flexible validation**: Optional event type validation
- ✅ **Rule evaluation**: Condition-based routing with priority support
- ✅ **Brand targeting**: Multi-brand rule management

### Usage in Actions (Node.js)

```typescript
import aioLogger from '@adobe/aio-lib-core-logging';
import { RulesManager } from '../../shared/RulesManager';
import { EVENT_REGISTRY, getAllEventCodes } from '../../shared/event-registry';

// Create with aioLogger
const logger = aioLogger('my-action', { level: 'info' });
const rulesManager = new RulesManager(
    logger,
    (eventType) => getAllEventCodes().includes(eventType), // validator
    Object.values(EVENT_REGISTRY) // event types
);

// Add a rule
rulesManager.addRule({
    id: 'rule-1',
    name: 'Route asset sync events',
    eventType: 'com.adobe.a2b.assetsync.new',
    direction: 'inbound',
    targetBrands: ['brand-123'],
    conditions: [{
        field: 'metadata.sync_enabled',
        operator: 'equals',
        value: true
    }],
    actions: [{
        type: 'route',
        target: 'asset-sync-handler'
    }],
    enabled: true,
    priority: 10,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Evaluate rules
const results = rulesManager.evaluateRules(
    'com.adobe.a2b.assetsync.new',
    { metadata: { sync_enabled: true } },
    'inbound',
    'brand-123'
);
```

### Usage in Web Frontend (Browser)

```typescript
import { RulesManager } from '../../../../shared/RulesManager';
import { consoleLogger } from '../../../../shared/rules-types';
import { EVENT_REGISTRY } from '../../../../shared/event-registry';

// Create with console logger
const rulesManager = new RulesManager(
    consoleLogger, // Uses console.log, console.error, etc.
    undefined, // No validation in browser
    Object.values(EVENT_REGISTRY)
);

// Get all event types with their rules
const eventTypesWithRules = rulesManager.getEventTypesWithRules();

function RulesConfiguration() {
    return (
        <div>
            {eventTypesWithRules.map(eventType => (
                <EventRulesPanel 
                    key={eventType.code} 
                    eventType={eventType}
                    rules={eventType.rules}
                />
            ))}
        </div>
    );
}
```

### Rule Types

See `rules-types.ts` for complete type definitions:

- **`RoutingRule`**: Complete rule definition with conditions and actions
- **`RuleCondition`**: Field-based conditions with operators (equals, contains, regex, etc.)
- **`RuleAction`**: Actions to perform when rule matches (route, transform, filter, log)
- **`RuleEvaluationResult`**: Result of rule evaluation with matched status
- **`Logger`**: Logger interface compatible with aioLogger and console
- **`EventTypeMetadata`**: Generic event metadata interface

### Logger Options

Three logger options are available:

```typescript
import { noOpLogger, consoleLogger } from '../../shared/rules-types';

// 1. No-op logger (silent)
const manager1 = new RulesManager(noOpLogger);

// 2. Console logger (browser)
const manager2 = new RulesManager(consoleLogger);

// 3. aioLogger (Node.js/actions)
import aioLogger from '@adobe/aio-lib-core-logging';
const logger = aioLogger('my-action', { level: 'info' });
const manager3 = new RulesManager(logger);
```

### Rule Conditions

Supported operators:

- `equals`: Exact match
- `contains`: String contains substring
- `startsWith`: String starts with
- `endsWith`: String ends with
- `regex`: Regular expression match
- `exists`: Field exists and is not null
- `notExists`: Field doesn't exist or is null

### Nested Field Access

Use dot notation for nested fields:

```typescript
{
    field: 'metadata.brand.name',
    operator: 'equals',
    value: 'Acme Corp'
}
```

