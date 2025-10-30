# Event Registry Implementation

**Date:** October 14, 2024  
**Feature:** Centralized A2B Event Registry  
**Project:** a2b-brand

## Overview

Implemented a centralized event registry system that serves as the single source of truth for all A2B events. The registry is shared between actions (Node.js/OpenWhisk) and the web frontend (browser), eliminating code duplication and ensuring consistency.

**⚠️ IMPORTANT:** This event registry is **shared between a2b-agency and a2b-brand projects**. See the [Synchronization](#synchronization-with-a2b-agency) section below.

## Problem Solved

Previously, event codes were scattered across different constants or missing entirely:
- Event codes needed to be defined in multiple places
- No single source of truth for event metadata
- Difficult to share event information with web frontend
- No API endpoint to discover available events

## Solution Architecture

### 1. Shared Event Registry (`src/shared/event-registry.ts`)

Created a browser-safe TypeScript module that defines all events with rich metadata:

```typescript
export interface EventDefinition {
  code: string;                    // Event code (e.g., 'com.adobe.a2b.assetsync.new')
  category: string;                // Category (brand-registration, asset-sync, workfront)
  name: string;                    // Human-readable name
  description: string;             // What the event does
  eventClass: string;              // Corresponding event class name
  version: string;                 // Version for future compatibility
  requiredFields: string[];        // Required data fields
  optionalFields?: string[];       // Optional data fields
}
```

**All 9 A2B Events Registered:**
- 3 Brand Registration events (disabled, received, enabled)
- 3 Asset Sync events (new, update, delete)
- 3 Workfront events (task.created, task.updated, task.completed)

### 2. Helper Functions

Provided convenient functions for working with events:
- `getEventsByCategory(category)` - Filter by category
- `getAllEventCodes()` - Get all event codes
- `getEventDefinition(code)` - Lookup specific event
- `getEventCategories()` - Get available categories
- `isValidEventCode(code)` - Validate event code
- `getEventCountByCategory()` - Get counts per category

### 3. Updated Constants (`src/actions/constants.ts`)

- Added all event code constant groups
- Maintained backward compatibility with existing code
- Added documentation pointing to the registry as source of truth

### 4. New API Action (`list-events`)

Created `src/actions/list-events/index.ts` that provides:

**GET /list-events** - List all events
**GET /list-events?category=asset-sync** - Filter by category
**GET /list-events?eventCode=com.adobe.a2b.assetsync.new** - Get specific event

## Synchronization with a2b-agency

**🔄 CRITICAL: These files must stay synchronized between a2b-agency and a2b-brand:**

### Files That Must Match

| File Path | Purpose | Sync Method |
|-----------|---------|-------------|
| `src/shared/event-registry.ts` | Event definitions | Manual sync or script |
| `src/shared/README.md` | Shared code guidelines | Manual sync |
| `src/actions/list-events/index.ts` | API implementation | Manual sync |
| `src/actions/test/list-events.test.ts` | Tests | Manual sync |
| `docs/apis/list-events/*.json` | Sample responses | Manual sync |
| `docs/apis/list-events/README.md` | API docs | Manual sync |
| `docs/apis/list-events/TESTING.md` | Test docs | Manual sync |

### Synchronization Process

When updating event registry in one project, **ALWAYS** update the other:

1. **Make changes in one project** (e.g., a2b-agency)
2. **Copy files to the other project** (e.g., a2b-brand)
3. **Test in both projects**
4. **Commit and push both projects**
5. **Create PRs for both projects**

### Copy Script (Optional)

```bash
# Copy from a2b-agency to a2b-brand
cp ../a2b-agency/src/shared/event-registry.ts src/shared/
cp ../a2b-agency/src/shared/README.md src/shared/
cp ../a2b-agency/src/actions/list-events/index.ts src/actions/list-events/
cp ../a2b-agency/src/actions/test/list-events.test.ts src/actions/test/
cp -r ../a2b-agency/docs/apis/list-events/* docs/apis/list-events/
```

### Why This is Necessary

Both projects:
- Share the same event codes and metadata
- Need to respond consistently to event queries
- Should provide the same API responses
- Must maintain data integrity across the system

**If these files get out of sync, the two projects may:**
- ❌ Emit events the other doesn't recognize
- ❌ Have inconsistent event metadata
- ❌ Return different API responses
- ❌ Break integration between agency and brand systems

## Benefits

### ✅ Single Source of Truth
All event definitions in one place (`src/shared/event-registry.ts`)

### ✅ Browser-Safe Sharing
Web frontend can import directly without API calls:
```typescript
import { EVENT_REGISTRY } from '../../../../shared/event-registry';
```

### ✅ Type Safety
TypeScript ensures consistency across actions and web

### ✅ Discoverability
- API endpoint lists all events with metadata
- Helper functions make filtering easy
- Documentation in one place

### ✅ Extensibility
Easy to add new events:
1. Add to registry in **both projects**
2. Add constant (backward compatibility)
3. Create event class
4. Done! Automatically available everywhere

### ✅ Backward Compatible
Existing code using `AEM_ASSET_SYNC_EVENT_CODE.NEW` still works

## Usage Examples

### In Actions (Node.js)

```typescript
// Import from shared registry
import { getEventsByCategory } from '../../shared/event-registry';

// Get all workfront events
const workfrontEvents = getEventsByCategory('workfront');
```

### In Web Frontend (Browser)

```typescript
// Direct import - no API call needed!
import { EVENT_REGISTRY, getEventCategories } from '../../../../shared/event-registry';

function EventDashboard() {
  const categories = getEventCategories();
  
  return (
    <div>
      <h1>Supported Events</h1>
      {categories.map(cat => (
        <EventCategoryPanel key={cat} category={cat} />
      ))}
    </div>
  );
}
```

### Via API (External Systems)

```bash
# List all events
curl https://[workspace]-a2b-brand-[env].adobeioruntime.net/api/v1/web/a2b-brand/list-events

# Filter by category
curl "https://[workspace]-a2b-brand-[env].adobeioruntime.net/api/v1/web/a2b-brand/list-events?category=asset-sync"
```

## Files Created/Modified

### Created
- ✨ `src/shared/event-registry.ts` - Event registry with metadata
- ✨ `src/shared/README.md` - Documentation for shared code
- ✨ `src/actions/list-events/index.ts` - API action for listing events
- ✨ `src/actions/test/list-events.test.ts` - 40 comprehensive tests
- ✨ `docs/apis/list-events/` - 10 documentation & sample files
- ✨ `docs/cursor/EVENT_REGISTRY_IMPLEMENTATION.md` - This document

### Modified
- 📝 `src/actions/constants.ts` - Added all event code constants
- 📝 `app.config.yaml` - Added list-events action configuration

## Testing

Run tests to validate the implementation:

```bash
npm test -- list-events.test.ts
```

Expected result: All 40 event registry tests should pass.

## Related Files

- **Event Registry**: `src/shared/event-registry.ts`
- **Action Implementation**: `src/actions/list-events/index.ts`
- **Action Config**: `app.config.yaml`
- **Tests**: `src/actions/test/list-events.test.ts`
- **API Samples**: `docs/apis/list-events/`

