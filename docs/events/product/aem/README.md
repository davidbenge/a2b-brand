# AEM Product Events

This directory contains Adobe Experience Manager (AEM) Assets event examples that are consumed by the agency application.

## Event Types

### 1. AEM Assets Events (from AEM)
These are events emitted BY AEM Assets that the agency consumes:

- **`aem-assets-asset-metadata.json`** - Base AEM asset metadata event
- **`aem-assets-asset-metadata-updated-event.json`** - AEM asset metadata update event
- **`aem-assets-asset-metadata_updated_2.json`** - Alternative AEM metadata update format
- **`aem-assets-asset-processing-complete.json`** - AEM asset processing completion event
- **`aem-assets-metadata-change.json`** - AEM metadata change event

These events trigger the agency to process asset changes and potentially sync them to brands.

### 2. Test Variants & Examples
Test variants showing different scenarios:

- **`com-adobe-a2b-assetsync-update_metadata-only.json`** - Test example showing an assetsync.update event where only metadata changes (no binary asset). This demonstrates how the agency would publish an update event to brands when AEM asset metadata is modified but the binary asset itself hasn't changed.

## File Naming Convention

### AEM Product Events
- Pattern: `aem-assets-[event-type].json`
- Example: `aem-assets-asset-metadata.json`

### Test Variants
- Pattern: `[base-event-name]_[variant-description].json`
- Example: `com-adobe-a2b-assetsync-update_metadata-only.json`

## Event Flow

```
AEM Assets → Agency (processes) → Brand(s)
```

1. **AEM emits event** (e.g., `aem-assets-asset-metadata-updated-event.json`)
2. **Agency consumes via `adobe-product-event-handler`**
3. **Agency processes and enriches** the asset data
4. **Agency publishes to brands** (e.g., `com.adobe.a2b.assetsync.update`)

## Usage in Code

These event examples are used for:
- **Documentation** - Understanding AEM event structure
- **Testing** - Creating mock AEM events for test cases
- **Development** - Reference for event handling logic

Example test usage:
```typescript
const aemMetadataEvent = require('../../../docs/events/product/aem/aem-assets-asset-metadata.json');
// Use in test to simulate AEM sending an event
```

## AEM Asset Sync Metadata

Key metadata fields used for asset sync:

- **`a2b__customers`** - Array of brand IDs that should receive this asset
- **`a2b__sync_on_change`** - Boolean flag indicating if changes should auto-sync
- **`a2b__last_sync`** - Timestamp of last successful sync

Example:
```json
{
  "metadata": {
    "a2b__customers": ["brand-uuid-1", "brand-uuid-2"],
    "a2b__sync_on_change": "true",
    "dc:title": "My Asset Title"
  }
}
```

## Related Documentation

- [Event Naming Conventions](../../../.cursor/rules/event-naming-conventions.mdc)
- [Asset Sync Flow](../../../cursor/ASSET_SYNC_FLOW.md) (if exists)
- [AEM Integration Guide](../../../aem/README.md) (if exists)

## Adding New AEM Event Examples

When adding new AEM event examples:

1. **Capture real event** from AEM webhook or I/O Events
2. **Sanitize data** - Remove any sensitive information
3. **Name appropriately** following the convention above
4. **Document purpose** - Update this README with the new file
5. **Reference in tests** if used for testing

## Notes

- AEM events may have different formats depending on the AEM version and configuration
- Asset metadata schema can be customized in AEM, so fields may vary
- Test variants (like `_metadata-only`) show edge cases and special scenarios

