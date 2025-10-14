# Shared Code

This directory contains browser-safe code that can be imported by both **actions** (Node.js/OpenWhisk) and **web frontend** (browser).

## Guidelines

- ✅ **Do**: Use standard JavaScript/TypeScript features
- ✅ **Do**: Import shared types and utilities
- ❌ **Don't**: Import Node.js-only modules (fs, path, @adobe/aio-lib-*, etc.)
- ❌ **Don't**: Import action-specific code
- ❌ **Don't**: Import web-specific code (React, DOM APIs)

## Event Registry

The **Event Registry** (`event-registry.ts`) is the single source of truth for all A2B events.

### Features

- Centralized event definitions with metadata
- Type-safe event codes and categories
- Helper functions for filtering and querying events
- Shared between actions and web frontend

### Usage in Actions

```typescript
import { EVENT_REGISTRY, getEventsByCategory } from '../../shared/event-registry';

// Get all asset sync events
const assetSyncEvents = getEventsByCategory('asset-sync');

// Check if event code exists
const eventDef = EVENT_REGISTRY['com.adobe.a2b.assetsync.new'];
console.log(eventDef.name); // "Asset Sync New"
console.log(eventDef.requiredFields); // ['asset_id', 'asset_path', ...]
```

### Usage in Web Frontend

```typescript
import { EVENT_REGISTRY, getEventCategories } from '../../../../shared/event-registry';

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

