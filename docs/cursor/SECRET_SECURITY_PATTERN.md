# Brand Secret Security Pattern

## Overview

The brand `secret` is a critical security credential used to authenticate CloudEvents between the agency and brand applications. It must **NEVER** be exposed in:

1. ❌ Frontend UI (view or edit modes)
2. ❌ Public REST API responses
3. ❌ Update API calls (visible in network tab)
4. ❌ Browser DevTools
5. ❌ Client-side JavaScript

## Secret Lifecycle

### 1. Generation (Once)

**When**: Brand registration (`new-brand-registration` action)

```typescript
// src/actions/new-brand-registration/index.ts
const newBrand = BrandManager.createBrand({
  brandId: uuidv4(),
  secret: BrandManager.generateSecret(), // Generated ONLY here
  name: params.data.name,
  endPointUrl: params.data.endPointUrl,
  enabled: false
});
```

**Response**: Secret is NOT returned

```json
{
  "message": "Brand registration processed successfully for brand id {uuid}"
}
```

### 2. Delivery to Brand (Once)

**When**: Admin enables the brand (`update-brand` action)

**How**: Via CloudEvent `com.adobe.a2b.registration.enabled`

```typescript
// src/actions/update-brand/index.ts
if (isEnablingBrand) {
  const event = new RegistrationEnabledEvent(
    savedBrand.brandId,
    savedBrand.secret,  // Secret included ONLY in this CloudEvent
    savedBrand.name,
    savedBrand.endPointUrl,
    savedBrand.enabledAt || now
  );
  
  await brand.sendCloudEventToEndpoint(event);
}
```

**Event Payload**:
```json
{
  "type": "com.adobe.a2b.registration.enabled",
  "data": {
    "brandId": "uuid",
    "secret": "xCZpPrN1rhUVFPyWdRndqyGjDTGuoMJh",
    "name": "Brand Name",
    "endPointUrl": "https://...",
    "enabledAt": "2025-10-17T..."
  }
}
```

### 3. Authentication (Every Request)

**When**: Agency sends CloudEvents to brand

**How**: Via HTTP header `X-A2B-Brand-Secret`

```typescript
// src/actions/classes/Brand.ts - sendCloudEventToEndpoint()
const headers = {
  'Content-Type': 'application/json',
  'X-A2B-Brand-Id': this.brandId,
  'X-A2B-Brand-Secret': this.secret  // Used for authentication
};

await axios.post(this.endPointUrl, requestPayload, { headers });
```

**When**: Brand sends events to agency (if applicable)

**How**: Same pattern - brand includes secret in header

---

## Security Rules

### ✅ ALLOWED Uses of Secret

| Location | Purpose | Notes |
|----------|---------|-------|
| `new-brand-registration` action | Generate secret | One-time generation |
| `update-brand` action | Send via CloudEvent when enabling | One-time delivery |
| `Brand.sendCloudEventToEndpoint()` | Add to headers | Authentication |
| Internal logging (masked) | Debugging | Last 4 chars only: `****oMJh` |

### ❌ FORBIDDEN Uses of Secret

| Location | Why Forbidden | Risk |
|----------|---------------|------|
| `new-brand-registration` response | Prevents interception | Secret exposed in HTTP response |
| `get-brand` response | Prevents UI exposure | Visible in DevTools/Network tab |
| `get-brands` response | Prevents UI exposure | All secrets visible |
| `update-brand` response | Prevents UI exposure | Visible in DevTools/Network tab |
| `update-brand` request params | Prevents tampering | Client could change secret |
| Frontend UI (view/edit) | Prevents exposure | Visible to users/admins |
| Browser localStorage/sessionStorage | Prevents theft | Accessible to XSS attacks |

---

## Implementation Details

### Brand Class Methods

```typescript
// src/actions/classes/Brand.ts

class Brand {
  // INTERNAL - Returns full object including secret
  toJSON(): IBrand {
    return {
      brandId: this.brandId,
      secret: this.secret,  // ✅ OK - Internal use only
      name: this.name,
      // ...
    };
  }
  
  // PUBLIC - Returns safe object WITHOUT secret
  toSafeJSON(): Omit<IBrand, 'secret'> {
    return {
      brandId: this.brandId,
      // secret is EXCLUDED ✅
      name: this.name,
      endPointUrl: this.endPointUrl,
      // ...
    };
  }
}
```

**Usage Pattern**:
- Use `toJSON()` for internal state management and event publishing
- Use `toSafeJSON()` for ALL API responses to frontend/external systems

### API Actions

#### ❌ Before (Insecure)

```typescript
// get-brand/index.ts
return {
  statusCode: 200,
  body: {
    message: "Brand fetched successfully",
    data: brand  // ❌ Includes secret
  }
};
```

#### ✅ After (Secure)

```typescript
// get-brand/index.ts
return {
  statusCode: 200,
  body: {
    message: "Brand fetched successfully",
    data: brand.toSafeJSON()  // ✅ Excludes secret
  }
};
```

### Update Action - Reject Secret from Params

```typescript
// update-brand/index.ts

// ❌ BEFORE: Client could send secret in params
const updatedBrand = BrandManager.createBrand({
  ...existingBrand.toJSON(),
  ...params,  // ❌ Could include secret from client
  secret: secret
});

// ✅ AFTER: Secret explicitly excluded from params
const { secret: _ignoredSecret, ...safeParams } = params;

const updatedBrand = BrandManager.createBrand({
  ...existingBrand.toJSON(),
  ...safeParams,  // ✅ Secret from params is ignored
  secret: secret  // ✅ Only use internally managed secret
});
```

### Frontend - Never Display Secret

```tsx
// BrandForm.tsx

// ❌ BEFORE: Secret visible in UI
{brand && mode === 'view' && (
  <Text><strong>Secret:</strong> {brand.secret}</Text>  // ❌ Exposes secret
)}

// ✅ AFTER: Secret never displayed
{/* Secret is NEVER displayed in the UI for security reasons.
    It is only shared:
    - Generated during new-brand-registration
    - Sent via registration.enabled CloudEvent to brand
    - Used in X-A2B-Brand-Secret header for authentication */}
```

---

## Testing & Verification

### ✅ Verify Secret is NOT Exposed

1. **Test get-brand API**:
   ```bash
   curl https://.../get-brand?brandId=xxx
   ```
   Response should NOT contain `secret` field

2. **Test get-brands API**:
   ```bash
   curl https://.../get-brands
   ```
   Response should NOT contain `secret` in any brand

3. **Test update-brand API**:
   ```bash
   curl -X POST https://.../update-brand -d '{"brandId":"xxx","enabled":true}'
   ```
   Response should NOT contain `secret` field

4. **Test UI**: 
   - Open Brand Manager in agency UI
   - View brand details
   - Secret should NOT be visible anywhere
   - Check DevTools Network tab
   - Secret should NOT appear in any response

5. **Test Update Call**:
   - Edit a brand in UI
   - Open DevTools Network tab
   - Submit form
   - Request payload should NOT include `secret`
   - Response should NOT include `secret`

### ✅ Verify Secret IS Used for Authentication

1. **Test CloudEvent Delivery**:
   ```typescript
   // Enable a brand
   // Check brand's endpoint receives event with header
   Headers:
     X-A2B-Brand-Secret: xCZpPrN1rhUVFPyWdRndqyGjDTGuoMJh
   ```

2. **Test registration.enabled Event**:
   ```json
   {
     "type": "com.adobe.a2b.registration.enabled",
     "data": {
       "secret": "xCZpPrN1rhUVFPyWdRndqyGjDTGuoMJh"  // ✅ OK - Delivered once
     }
   }
   ```

---

## Related Files

### a2b-agency

**Backend (Actions)**:
- `src/actions/classes/Brand.ts` - Added `toSafeJSON()` method
- `src/actions/get-brand/index.ts` - Uses `toSafeJSON()`
- `src/actions/get-brands/index.ts` - Uses `toSafeJSON()`
- `src/actions/update-brand/index.ts` - Excludes secret from params, uses `toSafeJSON()`
- `src/actions/new-brand-registration/index.ts` - Generates secret, doesn't return it

**Frontend (UI)**:
- `src/dx-excshell-1/web-src/src/components/layout/BrandForm.tsx` - Removed secret display
- `src/dx-excshell-1/web-src/src/components/layout/BrandManagerView.tsx` - No secret handling

### a2b-brand

**Backend (Actions)**:
- `src/actions/agency-registration-internal-handler/index.ts` - Receives secret from event, stores it
- `src/actions/classes/Agency.ts` - Similar `toSafeJSON()` pattern (if needed)

---

## Cursor Rules Reference

See `.cursorrules` in both projects for:
- Secret security patterns
- API response guidelines
- Frontend security rules

---

## Changelog

**2025-10-17**: Initial implementation
- Added `Brand.toSafeJSON()` method
- Updated all get/update actions to exclude secret from responses
- Removed secret display from frontend UI
- Prevented secret from being passed in update params
- Documented complete secret lifecycle and security patterns

---

## Summary

**Secret Flow**:
```
1. Generate (new-brand-registration)
   ↓
2. Store in state (BrandManager)
   ↓
3. Deliver to brand (registration.enabled event) - ONE TIME
   ↓
4. Use for auth (X-A2B-Brand-Secret header) - EVERY REQUEST
```

**Security Principle**:
> The secret is a shared credential between agency and brand.
> It must NEVER leave the backend except:
> - Once via CloudEvent to deliver it to the brand
> - In headers for authentication
> 
> It must NEVER be exposed to:
> - Frontend UI
> - Public API responses
> - Browser DevTools
> - Network traffic (except in headers)

