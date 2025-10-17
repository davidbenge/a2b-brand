# Agency Management UI Implementation

## Overview

Implemented a complete agency management system in the a2b-brand web application, replacing the mock CompanyRegistrationList with a production-ready AgencyRegistrationList that integrates with authenticated REST APIs backed by AgencyManager.

**Date**: 2025-10-16

## What Was Built

### 1. Backend REST APIs (✅ Complete)

Created four new authenticated actions for agency management:

#### `get-agencies`
**File**: `src/actions/get-agencies/index.ts`
**Purpose**: Retrieve all agency registrations for the brand
**Auth**: `require-adobe-auth: true`
**Method**: GET
**Response**: Array of agencies (without secrets)

```typescript
{
  statusCode: 200,
  body: {
    message: "Retrieved N agencies successfully",
    data: Agency[],  // Array of agencies with toSafeJSON()
    count: number
  }
}
```

#### `get-agency`
**File**: `src/actions/get-agency/index.ts`
**Purpose**: Retrieve a specific agency by ID
**Auth**: `require-adobe-auth: true`
**Method**: GET
**Parameters**: `agencyId` (required)
**Response**: Single agency object (without secret)

```typescript
{
  statusCode: 200,
  body: {
    message: "Agency {agencyId} retrieved successfully",
    data: Agency  // Single agency with toSafeJSON()
  }
}
```

#### `update-agency`
**File**: `src/actions/update-agency/index.ts`
**Purpose**: Update agency registration details
**Auth**: `require-adobe-auth: true`
**Method**: POST
**Parameters**: 
- `agencyId` (required)
- `name` (optional)
- `endPointUrl` (optional)
- `enabled` (optional)
- `logo` (optional)

**Note**: `agencyId`, `brandId`, and `secret` cannot be changed through this API

```typescript
{
  statusCode: 200,
  body: {
    message: "Agency {agencyId} updated successfully",
    data: Agency  // Updated agency with toSafeJSON()
  }
}
```

#### `delete-agency`
**File**: `src/actions/delete-agency/index.ts`
**Purpose**: Remove an agency registration
**Auth**: `require-adobe-auth: true`
**Method**: POST
**Parameters**: `agencyId` (required)

```typescript
{
  statusCode: 200,
  body: {
    message: "Agency {agencyId} deleted successfully",
    data: {
      agencyId: string,
      deleted: true
    }
  }
}
```

### 2. API Configuration (✅ Complete)

**File**: `app.config.yaml`

Added four new actions to the runtime manifest:

```yaml
get-agencies:
  function: src/actions/get-agencies/index.ts
  web: 'yes'
  runtime: nodejs:20
  annotations:
    require-adobe-auth: true  # ← Adobe IMS authentication required
    final: true

get-agency:
  function: src/actions/get-agency/index.ts
  web: 'yes'
  runtime: nodejs:20
  annotations:
    require-adobe-auth: true  # ← Adobe IMS authentication required
    final: true

update-agency:
  function: src/actions/update-agency/index.ts
  web: 'yes'
  runtime: nodejs:20
  annotations:
    require-adobe-auth: true  # ← Adobe IMS authentication required
    final: true

delete-agency:
  function: src/actions/delete-agency/index.ts
  web: 'yes'
  runtime: nodejs:20
  annotations:
    require-adobe-auth: true  # ← Adobe IMS authentication required
    final: true
```

### 3. API Service Layer (✅ Complete)

**File**: `src/dx-excshell-1/web-src/src/services/api.ts`

Enhanced the existing API service with agency management methods:

```typescript
export class ApiService {
  // Existing methods...
  
  /**
   * Get all agencies
   */
  public async getAgencies(): Promise<ApiResponse<Agency[]>>
  
  /**
   * Get a specific agency by ID
   */
  public async getAgency(agencyId: string): Promise<ApiResponse<Agency>>
  
  /**
   * Update an agency
   */
  public async updateAgency(
    agencyId: string, 
    updateData: AgencyUpdateData
  ): Promise<ApiResponse<Agency>>
  
  /**
   * Delete an agency
   */
  public async deleteAgency(
    agencyId: string
  ): Promise<ApiResponse<{ agencyId: string; deleted: boolean }>>
}
```

**Key Features**:
- ✅ Automatic Adobe IMS token injection via `Authorization: Bearer {token}` header
- ✅ Automatic `x-gw-ims-org-id` header injection
- ✅ Demo mode support with simulated delays
- ✅ Error handling and response transformation
- ✅ TypeScript type safety

### 4. Frontend Component (✅ Complete)

**File**: `src/dx-excshell-1/web-src/src/components/layout/AgencyRegistrationList.tsx`

Created a new production-ready React component using Adobe React Spectrum:

**Features**:
- ✅ Real-time data loading from authenticated APIs
- ✅ Search functionality (by name, ID, or endpoint URL)
- ✅ Status filtering (All, Enabled, Disabled)
- ✅ Enable/Disable toggle for agencies
- ✅ Delete agency with confirmation dialog
- ✅ Refresh button to reload data
- ✅ Loading states with progress indicator
- ✅ Success/error message handling
- ✅ Demo mode support
- ✅ Responsive layout
- ✅ Accessible (ARIA labels, keyboard navigation)

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────┐
│ Agency Registrations                              [Refresh]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ [Search: by name, ID, or endpoint...]                           │
│ [All (N)] [Enabled (N)] [Disabled (N)]                          │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Name │ Agency ID │ Brand ID │ Endpoint │ Status │ Actions│   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ ...  │ abc123... │ def456...│ agency...│ ●Enabled│ [...]│   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Table Columns**:
1. Agency Name
2. Agency ID (truncated with monospace font)
3. Brand ID (truncated with monospace font)
4. Endpoint URL (hostname only)
5. Status (StatusLight - green/red)
6. Enabled At (date)
7. Actions (Enable/Disable, Delete)

## Authentication Flow

### How Adobe Auth Works

```
User → React App (browser)
       ↓
   1. User logs in via Adobe IMS
       ↓
   2. IMS token stored in viewProps.ims.token
       ↓
   3. API Service initialized with token
       ↓
   4. User clicks "Refresh" or component loads
       ↓
   5. API Service calls backend action
       ↓
   6. Request headers include:
       - Authorization: Bearer {imsToken}
       - x-gw-ims-org-id: {orgId}
       ↓
   7. Adobe App Builder validates token
       ↓
   8. If valid: Action executes
       If invalid: 401 Unauthorized
       ↓
   9. Response returned to React app
       ↓
  10. UI updates with data
```

### Token Injection

**In React Component**:
```typescript
useEffect(() => {
  if (viewProps && !ENABLE_DEMO_MODE) {
    apiService.initialize(
      viewProps.runtime.apiHost,  // Runtime URL
      viewProps.ims.token,          // IMS token
      viewProps.ims.org             // Org ID
    );
  }
}, [viewProps]);
```

**In API Service**:
```typescript
const config = {
  method: 'GET',
  url: `${this.baseUrl}/api/v1/web/a2b-brand/get-agencies`,
  headers: {
    'Content-Type': 'application/json',
    'x-gw-ims-org-id': `${this.imsOrgId}`,
    'Authorization': `Bearer ${this.imsToken}`  // ← Token here!
  }
};

const response = await axios(config);
```

## Data Flow

### Loading Agencies

```
Component Mount
     ↓
loadAgencies() called
     ↓
apiService.getAgencies()
     ↓
HTTP GET /api/v1/web/a2b-brand/get-agencies
     Authorization: Bearer {token}
     x-gw-ims-org-id: {orgId}
     ↓
Adobe App Builder validates auth
     ↓
get-agencies action executes
     ↓
AgencyManager.getAllAgencies()
     ↓
Reads from state store (memory) and file store (disk)
     ↓
Returns Agency[] with toSafeJSON() (no secrets)
     ↓
Response sent to React app
     ↓
Component updates state
     ↓
Table renders with agency data
```

### Updating Agency (Enable/Disable)

```
User clicks "Enable" or "Disable"
     ↓
handleToggleEnabled(agencyId, currentStatus)
     ↓
apiService.updateAgency(agencyId, { enabled: !currentStatus })
     ↓
HTTP POST /api/v1/web/a2b-brand/update-agency
     Authorization: Bearer {token}
     Body: { agencyId, enabled: true/false }
     ↓
update-agency action executes
     ↓
AgencyManager.updateAgency(agencyId, updates)
     ↓
Updates agency in state store and file store
     ↓
Returns updated Agency
     ↓
Success message shown
     ↓
loadAgencies() called to refresh data
     ↓
Table updates with new status
```

### Deleting Agency

```
User clicks Delete → Confirmation Dialog
     ↓
User confirms deletion
     ↓
handleDelete(agencyId)
     ↓
apiService.deleteAgency(agencyId)
     ↓
HTTP POST /api/v1/web/a2b-brand/delete-agency
     Authorization: Bearer {token}
     Body: { agencyId }
     ↓
delete-agency action executes
     ↓
AgencyManager.deleteAgency(agencyId)
     ↓
Removes from state store and file store
     ↓
Success response returned
     ↓
Success message shown
     ↓
loadAgencies() called to refresh data
     ↓
Agency removed from table
```

## Demo Mode Support

All API methods support demo mode for development and testing:

**Demo Mode Behavior**:
- ✅ No real API calls made
- ✅ Simulated delays (300-1500ms) for realistic UX
- ✅ Console logging of all operations
- ✅ Empty agency list by default
- ✅ Success messages indicate "(Demo Mode)"
- ✅ No authentication required

**Enabling Demo Mode**:
```typescript
// In demoMode.ts
export const ENABLE_DEMO_MODE = true;  // or false
```

## Security Features

### 1. Adobe Authentication (`require-adobe-auth: true`)

All agency management APIs require valid Adobe IMS authentication:
- ✅ Token validation by Adobe App Builder
- ✅ Automatic 401 response if token invalid
- ✅ Token expiration handling
- ✅ Org ID verification

### 2. Secret Protection

Agency secrets are NEVER exposed to the frontend:
- ✅ `toSafeJSON()` method excludes `secret` field
- ✅ Only `brandId`, `name`, `endPointUrl`, `enabled`, `logo`, dates returned
- ✅ Secrets only accessible server-side in AgencyManager

### 3. Authorization

Only authenticated users from the correct organization can:
- ✅ View their brand's agency registrations
- ✅ Update agency settings
- ✅ Delete agency registrations

### 4. Input Validation

All actions validate inputs:
- ✅ Required parameters checked
- ✅ Agency existence verified before operations
- ✅ Error responses for invalid data

## File Changes Summary

### Created Files

**Backend Actions**:
1. `src/actions/get-agencies/index.ts` (60 lines)
2. `src/actions/get-agency/index.ts` (58 lines)
3. `src/actions/update-agency/index.ts` (68 lines)
4. `src/actions/delete-agency/index.ts` (53 lines)

**Frontend**:
5. `src/dx-excshell-1/web-src/src/components/layout/AgencyRegistrationList.tsx` (360 lines)
6. `docs/cursor/AGENCY_MANAGEMENT_UI_IMPLEMENTATION.md` (this file)

### Modified Files

1. `app.config.yaml` - Added 5 new actions (get-agencies, get-agency, update-agency, delete-agency, agency-registration-internal-handler)
2. `src/dx-excshell-1/web-src/src/services/api.ts` - Added agency management methods

## Usage

### For End Users

1. **Navigate to Agency Registrations page**
2. **View all registered agencies** with their status
3. **Search agencies** by name, ID, or endpoint
4. **Filter by status** (All, Enabled, Disabled)
5. **Enable/Disable agencies** as needed
6. **Delete agencies** to unregister
7. **Refresh** to reload latest data

### For Developers

**Deploy Changes**:
```bash
cd a2b-brand
aio app deploy
```

**Run Locally** (Actions only):
```bash
aio app run -e application --no-serve
```

**Run Locally** (Web only):
```bash
aio app run -e dx/excshell/1 --no-actions
```

## Testing

### Manual Testing Checklist

- [ ] Load agency list in production mode
- [ ] Load agency list in demo mode
- [ ] Search agencies by name
- [ ] Search agencies by ID
- [ ] Search agencies by endpoint URL
- [ ] Filter by "All" status
- [ ] Filter by "Enabled" status
- [ ] Filter by "Disabled" status
- [ ] Enable an agency
- [ ] Disable an agency
- [ ] Delete an agency (with confirmation)
- [ ] Cancel delete operation
- [ ] Refresh agency list
- [ ] Verify auth token in Network tab
- [ ] Verify 401 error if not authenticated
- [ ] Test with expired token

### Automated Testing

Future work:
- Unit tests for API service methods
- Integration tests for actions
- E2E tests for component interactions

## Related Components

### In a2b-brand:

**Backend**:
- `AgencyManager` - CRUD operations for agencies
- `Agency` - Agency data model
- `agency-registration-internal-handler` - Handles registration events
- `agency-event-handler` - Routes incoming agency events

**Frontend**:
- `AgencyRegistrationView` - Form for new agency registration
- `CompanyRegistrationList` - Legacy component (can be removed)

### Similar Pattern in a2b-agency:

The a2b-brand agency management mirrors the a2b-agency brand management:

**a2b-agency** (Brand Management):
- `get-brands` action
- `get-brand` action
- `update-brand` action
- `delete-brand` action
- Brand management UI component

**a2b-brand** (Agency Management):
- `get-agencies` action ← New!
- `get-agency` action ← New!
- `update-agency` action ← New!
- `delete-agency` action ← New!
- `AgencyRegistrationList` component ← New!

## Migration from CompanyRegistrationList

### What Changed

**Old** (`CompanyRegistrationList.tsx`):
- Mock data only (`mockCompanyRegistrations`)
- "Company" terminology
- No real API integration
- Simple status (pending/approved/rejected)
- No authentication

**New** (`AgencyRegistrationList.tsx`):
- Real API integration with AgencyManager
- "Agency" terminology
- Full CRUD operations
- Simple status (enabled/disabled)
- Adobe IMS authentication
- Production-ready

### Migration Path

1. **Keep both components** during transition
2. **Update routing** to use `AgencyRegistrationList`
3. **Test thoroughly** in both demo and production modes
4. **Remove `CompanyRegistrationList`** when ready

## Future Enhancements

### Short Term

1. **Edit Dialog** - Update agency name, endpoint, logo via modal
2. **Bulk Operations** - Enable/disable/delete multiple agencies
3. **Export** - Download agency list as CSV/JSON
4. **Pagination** - Handle large numbers of agencies

### Medium Term

1. **Agency Details View** - Full agency profile page
2. **Activity Log** - Track all agency interactions
3. **Notifications** - Alert when agency status changes
4. **Agency Metrics** - Show sync stats, event counts

### Long Term

1. **Multi-tenant Support** - Manage multiple brands
2. **Role-based Access** - Different permissions for users
3. **API Keys** - Generate API keys for agency integration
4. **Webhooks** - Configure custom webhooks per agency

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   AgencyRegistrationList Component (React)             │    │
│  │   - Search, Filter, Enable/Disable, Delete             │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │   API Service (apiService)                             │    │
│  │   - getAgencies(), updateAgency(), deleteAgency()      │    │
│  │   - Injects: Authorization: Bearer {token}             │    │
│  │   - Injects: x-gw-ims-org-id: {orgId}                  │    │
│  └────────────────────────┬───────────────────────────────┘    │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS + Auth Token
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ADOBE APP BUILDER                              │
│                                                                  │
│  ┌────────────────────────┬───────────────────────────────┐    │
│  │   Adobe IMS Auth       │  require-adobe-auth: true     │    │
│  │   - Validates token    │  - 401 if invalid             │    │
│  └────────────────────────┴───────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │   OpenWhisk Actions (nodejs:20)                        │    │
│  │   - get-agencies                                        │    │
│  │   - get-agency                                          │    │
│  │   - update-agency                                       │    │
│  │   - delete-agency                                       │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼───────────────────────────────┐    │
│  │   AgencyManager (TypeScript)                           │    │
│  │   - getAllAgencies(), getAgency()                      │    │
│  │   - updateAgency(), deleteAgency()                     │    │
│  │   - Dual persistence (state + file store)              │    │
│  └────────────────────────┬───────────────────────────────┘    │
│                           │                                     │
│           ┌───────────────┴────────────────┐                   │
│           ↓                                ↓                   │
│  ┌─────────────────────┐        ┌──────────────────────┐      │
│  │  @adobe/aio-lib-state│        │ @adobe/aio-lib-files │      │
│  │  (Memory Cache)      │        │ (Disk Storage)       │      │
│  │  - TTL: 3600s        │        │ - agency/*.json      │      │
│  │  - Key: AGENCY_{id}  │        │ - Persistent         │      │
│  └─────────────────────┘        └──────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## Summary

✅ **Complete agency management system** implemented in a2b-brand
✅ **4 new authenticated REST APIs** for CRUD operations
✅ **Production-ready React component** with Adobe React Spectrum
✅ **Secure authentication** via Adobe IMS tokens
✅ **Demo mode support** for development
✅ **Dual persistence** (memory cache + disk storage)
✅ **Secret protection** - never exposed to frontend
✅ **Mirrors a2b-agency pattern** for consistency

The a2b-brand application now has full agency management capabilities, allowing users to view, enable/disable, and delete agency registrations through a secure, authenticated web interface! 🎉

