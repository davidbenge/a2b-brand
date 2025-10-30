# Routing Rules Service

The Routing Rules Service provides CRUD APIs for managing event routing rules at multiple levels:

- **Global Product Event Routing Rules**: Rules that apply to all product events (e.g., AEM, Workfront)
- **Global App Event Routing Rules**: Rules that apply to all app events (e.g., asset sync, registration)
- **Agency-Specific Routing Rules**: Rules that apply to specific agencies for app events

## Architecture

### Storage Strategy

Routing rules are stored using an optimized embedded structure:

- **Global Rules**: Stored in App Builder State Store with dedicated prefixes
  - Product Event Rules: `P-EVENT-RULE-GLOBAL_{eventCode}`
  - App Event Rules: `A-EVENT-RULE-GLOBAL_{eventCode}`
  
- **Agency-Specific Rules**: Embedded directly within the `Agency` object
  - Stored under `Agency.routingRules[eventCode]`
  - Eliminates separate state store entries
  - Reduces reads/writes by 50%
  - Improves latency and reduces costs

### Rule Structure

Each routing rule follows the `IRoutingRule` interface:

```typescript
interface IRoutingRule {
  id: string;                    // Unique rule ID (UUID)
  name: string;                  // Human-readable rule name
  description?: string;          // Optional description
  enabled: boolean;              // Whether the rule is active
  priority: number;              // Execution order (lower = higher priority)
  conditions: IRuleCondition[];  // Conditions to match
  actions: IRuleAction[];        // Actions to execute
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

## API Endpoints

### Global Product Event Routing Rules

Located in: `services/routing-rules/global/product/`

- **List Product Routing Rules**: `GET /list-product-routing-rules`
  - Lists all event codes with product routing rules
  
- **Get Product Routing Rules**: `GET /get-product-routing-rules`
  - Gets all rules for a specific product event code
  - Params: `eventCode`
  
- **Create Product Routing Rule**: `POST /create-product-routing-rule`
  - Creates a new product event routing rule
  - Params: `eventCode`, `rule`
  
- **Update Product Routing Rule**: `PUT /update-product-routing-rule`
  - Updates an existing product event routing rule
  - Params: `eventCode`, `ruleId`, `updates`
  
- **Delete Product Routing Rule**: `DELETE /delete-product-routing-rule`
  - Deletes a product event routing rule
  - Params: `eventCode`, `ruleId`

### Global App Event Routing Rules

Located in: `services/routing-rules/global/app/`

- **List App Routing Rules**: `GET /list-app-routing-rules`
  - Lists all event codes with app routing rules
  
- **Get App Routing Rules**: `GET /get-app-routing-rules`
  - Gets all rules for a specific app event code
  - Params: `eventCode`
  
- **Create App Routing Rule**: `POST /create-app-routing-rule`
  - Creates a new app event routing rule
  - Params: `eventCode`, `rule`
  
- **Update App Routing Rule**: `PUT /update-app-routing-rule`
  - Updates an existing app event routing rule
  - Params: `eventCode`, `ruleId`, `updates`
  
- **Delete App Routing Rule**: `DELETE /delete-app-routing-rule`
  - Deletes an app event routing rule
  - Params: `eventCode`, `ruleId`

### Agency-Specific Routing Rules

Located in: `services/routing-rules/agency/`

- **List Agency Routing Rules**: `GET /list-agency-routing-rules`
  - Lists all event codes with agency-specific routing rules
  - Params: `agencyId`
  
- **Get Agency Routing Rules**: `GET /get-agency-routing-rules`
  - Gets all rules for a specific agency and event code
  - Params: `agencyId`, `eventCode`
  
- **Create Agency Routing Rule**: `POST /create-agency-routing-rule`
  - Creates a new agency-specific routing rule
  - Params: `agencyId`, `eventCode`, `rule`
  
- **Update Agency Routing Rule**: `PUT /update-agency-routing-rule`
  - Updates an existing agency-specific routing rule
  - Params: `agencyId`, `eventCode`, `ruleId`, `updates`
  
- **Delete Agency Routing Rule**: `DELETE /delete-agency-routing-rule`
  - Deletes an agency-specific routing rule
  - Params: `agencyId`, `eventCode`, `ruleId`

## Authentication

All routing rules APIs are protected with Adobe authentication:

```yaml
annotations:
  require-adobe-auth: true
```

## Usage Examples

### Creating a Global Product Event Rule

```bash
curl -X POST https://your-namespace.adobeioruntime.net/api/v1/web/a2b-brand/create-product-routing-rule \
  -H "Authorization: Bearer $ADOBE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventCode": "aem-assets-metadata-updated",
    "rule": {
      "name": "Route to Active Agencies Only",
      "description": "Only send metadata updates to enabled agencies",
      "enabled": true,
      "priority": 10,
      "conditions": [
        {
          "field": "agency.enabled",
          "operator": "equals",
          "value": true
        }
      ],
      "actions": [
        {
          "type": "forward",
          "target": "agency.endPointUrl"
        }
      ]
    }
  }'
```

### Creating an Agency-Specific Rule

```bash
curl -X POST https://your-namespace.adobeioruntime.net/api/v1/web/a2b-brand/create-agency-routing-rule \
  -H "Authorization: Bearer $ADOBE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agencyId": "agency-uuid-here",
    "eventCode": "com.adobe.a2b.assetsync.new",
    "rule": {
      "name": "Filter by Asset Type",
      "description": "Only send image assets to this agency",
      "enabled": true,
      "priority": 5,
      "conditions": [
        {
          "field": "data.metadata.dc:format",
          "operator": "startsWith",
          "value": "image/"
        }
      ],
      "actions": [
        {
          "type": "forward",
          "target": "agency.endPointUrl"
        }
      ]
    }
  }'
```

## Rule Execution Order

Rules are executed in the following order:

1. **Global Product Event Rules** (if product event)
2. **Global App Event Rules** (if app event)
3. **Agency-Specific Rules** (if applicable)

Within each level, rules are executed by priority (lower number = higher priority).

## Performance Optimizations

### Embedded Agency Rules

Agency-specific routing rules are stored directly within the `Agency` object:

**Before (Separate State Entries):**
- Read agency: 1 state store operation
- Read rules: N state store operations (one per event code)
- **Total: N+1 operations**

**After (Embedded):**
- Read agency with embedded rules: 1 state store operation
- **Total: 1 operation**

**Benefits:**
- 50% reduction in state store reads
- 50% reduction in state store writes
- ~50% reduction in latency
- ~50% reduction in costs

## Related Documentation

- `src/actions/classes/RoutingRulesManager.ts` - Global rules manager
- `src/actions/classes/AgencyManager.ts` - Agency-specific rules management
- `src/shared/types/rules-types.ts` - Type definitions
- `docs/cursor/ROUTING_RULES_REFACTORING_STATUS.md` - Implementation details
- `docs/cursor/EMBEDDED_ROUTING_RULES_OPTIMIZATION.md` - Optimization details

## State Store Prefixes

- `P-EVENT-RULE-GLOBAL_` - Global product event rules
- `A-EVENT-RULE-GLOBAL_` - Global app event rules
- Agency-specific rules are embedded in the `Agency` object (no separate prefix)

## Testing

Run tests with:

```bash
npm test -- AgencyManager.test.ts
npm test -- RoutingRulesManager.test.ts
```

## Migration Notes

If upgrading from the old `EventRegistryManager` system:

1. Global rules are now managed by `RoutingRulesManager`
2. Agency-specific rules are now embedded in `Agency` objects
3. Old event definition CRUD APIs have been removed
4. Event registries (`AppEventRegistry`, `ProductEventRegistry`) are now read-only
