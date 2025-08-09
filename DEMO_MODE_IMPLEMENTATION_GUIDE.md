# Demo Mode Implementation Guide

This guide provides comprehensive instructions for implementing a demo mode feature in your Adobe App Builder project, based on the patterns used in the a2b-brand application.

## Overview

Demo mode allows your application to function with mock data and simulated API responses, enabling:
- Local development without backend dependencies
- User demonstrations with realistic data
- Testing UI interactions without affecting production data
- Fallback functionality when services are unavailable

## Core Implementation Patterns

### 1. Environment-Based Feature Flag

Create a feature flag that automatically enables demo mode based on environment variables:

```typescript
// Feature flag for demo mode - can be controlled via environment variable
const ENABLE_DEMO_MODE = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                        process.env.NODE_ENV === 'development' ||
                        process.env.NODE_ENV !== 'production';
```

**Key Benefits:**
- Automatic enablement in development environment
- Manual control via environment variable
- Production-safe (disabled by default in production)

### 2. Mock Data Structure

Define comprehensive mock data that mirrors your production data structure:

```typescript
// Mock data for testing (only used in demo mode)
const mockData: DataType[] = [
    new DataType({
        id: '1',
        name: 'Demo Item 1',
        status: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        // ... other realistic properties
    }),
    new DataType({
        id: '2', 
        name: 'Demo Item 2',
        status: false,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        // ... other realistic properties
    })
];
```

**Best Practices:**
- Use realistic data that represents typical use cases
- Include various states (enabled/disabled, different dates, etc.)
- Use your actual data model classes/constructors
- Provide enough variety to test filtering and sorting

### 3. State Management Pattern

Initialize state differently based on demo mode:

```typescript
const YourComponent: React.FC = () => {
    const [data, setData] = useState<DataType[]>(ENABLE_DEMO_MODE ? mockData : []);
    const [loading, setLoading] = useState(!ENABLE_DEMO_MODE);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Load data from API when not in demo mode
    useEffect(() => {
        if (!ENABLE_DEMO_MODE) {
            // TODO: Implement real API call here
            // For now, just set loading to false
            setLoading(false);
        }
    }, [ENABLE_DEMO_MODE]);
```

### 4. Conditional API Calls

Implement conditional logic for all CRUD operations:

```typescript
const handleCreate = async (newItem: Partial<DataType>) => {
    if (ENABLE_DEMO_MODE) {
        // Demo mode: local state management
        const newData = new DataType({
            ...newItem,
            id: Date.now().toString(), // Simple ID generation for demo
            createdAt: new Date(),
            updatedAt: new Date()
        });
        setData([...data, newData]);
        setSuccess('Item created successfully');
    } else {
        // Production mode: real API call
        try {
            const response = await apiService.createItem(newItem);
            // Handle real API response
        } catch (error) {
            setError('Error creating item');
        }
    }
};

const handleUpdate = async (id: string, updates: Partial<DataType>) => {
    if (ENABLE_DEMO_MODE) {
        // Demo mode: local state management
        setData(data.map(item => 
            item.id === id ? new DataType({ ...item.toJSON(), ...updates, updatedAt: new Date() }) : item
        ));
        setSuccess('Item updated successfully');
    } else {
        // Production mode: real API call
        try {
            const response = await apiService.updateItem(id, updates);
            // Handle real API response
        } catch (error) {
            setError('Error updating item');
        }
    }
};

const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }

    if (ENABLE_DEMO_MODE) {
        // Demo mode: local state management
        setData(data.filter(item => item.id !== id));
        setSuccess('Item deleted successfully');
    } else {
        // Production mode: real API call
        try {
            // TODO: Implement real API call
            setError('Delete functionality not implemented in production mode');
        } catch (error) {
            setError('Error deleting item');
        }
    }
};
```

### 5. Visual Indicators

Provide clear visual feedback when in demo mode:

```tsx
return (
    <View>
        <Flex justifyContent="space-between" alignItems="center">
            <Heading level={1}>
                Your Application
                {ENABLE_DEMO_MODE && ' (Demo Mode)'}
            </Heading>
        </Flex>
        
        {ENABLE_DEMO_MODE && (
            <StatusLight variant="info" marginBottom="size-200">
                Running in demo mode with mock data
            </StatusLight>
        )}
        
        {/* Rest of your UI */}
    </View>
);
```

## Implementation Steps

### Step 1: Environment Configuration

1. **Add environment variable support:**
   ```bash
   # In your .env file (for local development)
   REACT_APP_ENABLE_DEMO_MODE=true
   ```

2. **Create the feature flag:**
   ```typescript
   const ENABLE_DEMO_MODE = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                           process.env.NODE_ENV === 'development' ||
                           process.env.NODE_ENV !== 'production';
   ```

### Step 2: Mock Data Creation

1. **Define your mock data structure** using your existing data models
2. **Create realistic, varied test data** that covers different scenarios
3. **Use proper date objects** and realistic IDs

### Step 3: Component Refactoring

1. **Update state initialization** to use mock data in demo mode
2. **Modify loading states** to skip loading in demo mode
3. **Add conditional logic** to all API-dependent operations

### Step 4: UI Enhancement

1. **Add demo mode indicators** to main headings
2. **Include status messages** to inform users about demo mode
3. **Ensure all interactive features** work with mock data

### Step 5: Fallback Runtime Support

For Adobe Experience Cloud Shell applications, implement fallback runtime:

```javascript
// In your index.js entry point
try {
  require('./exc-runtime')
  init(bootstrapInExcShell)
} catch (e) {
  console.log('application not running in Adobe Experience Cloud Shell')
  bootstrapRaw() // Fallback with mock runtime
}

function bootstrapRaw() {
  const mockRuntime = { on: () => {} }
  const mockIms = {}
  
  ReactDOM.render(
    <App runtime={mockRuntime} ims={mockIms} />,
    document.getElementById('root')
  )
}
```

## Advanced Features

### Search and Filtering in Demo Mode

Ensure all filtering and search functionality works with mock data:

```typescript
const getFilteredData = () => {
    let filteredData = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredData = filteredData.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
        const isEnabled = statusFilter === 'enabled';
        filteredData = filteredData.filter(item => item.enabled === isEnabled);
    }

    return filteredData;
};
```

### Form Validation

Maintain the same validation logic in demo mode:

```typescript
const validateForm = (data: Partial<DataType>): string[] => {
    const errors: string[] = [];
    
    if (!data.name?.trim()) {
        errors.push('Name is required');
    }
    
    if (!data.url?.trim()) {
        errors.push('URL is required');
    }
    
    return errors;
};
```

## Best Practices

### 1. Consistency
- Use the same data models and validation in both modes
- Maintain identical UI behavior regardless of mode
- Ensure error handling works in both scenarios

### 2. Realism
- Create mock data that represents real-world scenarios
- Include edge cases and various states
- Use realistic timestamps and IDs

### 3. Development Experience
- Make demo mode easily toggleable
- Provide clear visual indicators
- Include helpful debug information

### 4. Production Safety
- Never enable demo mode in production by default
- Use environment-based detection
- Provide clear warnings when active

### 5. Testing
- Test all CRUD operations in demo mode
- Verify filtering and sorting work correctly
- Ensure form validation remains consistent

## Configuration Examples

### Adobe App Builder Scripts

```json
{
  "scripts": {
    "run:excshell": "aio app run -e dx/excshell/1",
    "run:demo": "cross-env REACT_APP_ENABLE_DEMO_MODE=true aio app run -e dx/excshell/1",
    "run:prod": "cross-env REACT_APP_ENABLE_DEMO_MODE=false aio app run -e dx/excshell/1"
  }
}
```

**Standard Usage:**
```bash
# Development with demo mode (default)
aio app run -e dx/excshell/1

# Alternative using npm scripts
npm run run:excshell
```

### Environment Files

```bash
# .env.development
REACT_APP_ENABLE_DEMO_MODE=true

# .env.production  
REACT_APP_ENABLE_DEMO_MODE=false
```

## Integration with Adobe App Builder

### Runtime Detection

```typescript
// Safe access to viewProps with fallbacks for demo mode
const safeViewProps = viewProps || {} as any;
const userEmail = safeViewProps.imsProfile?.email || 'Demo User';
const imsToken = safeViewProps.imsToken || 'demo-token';
```

### Service Initialization

```typescript
useEffect(() => {
    if (!ENABLE_DEMO_MODE) {
        // Initialize real services only in production mode
        apiService.initialize(safeViewProps.imsToken, safeViewProps.imsOrg);
    }
}, [ENABLE_DEMO_MODE]);
```

## Troubleshooting

### Common Issues

1. **Demo mode not activating:**
   - Check environment variable spelling: `REACT_APP_ENABLE_DEMO_MODE`
   - Verify NODE_ENV is set correctly
   - Restart development server after environment changes

2. **Mock data not displaying:**
   - Ensure mock data uses correct data model constructors
   - Check that state initialization includes mock data
   - Verify loading state is set correctly

3. **Operations failing in demo mode:**
   - Add conditional logic to all API-dependent functions
   - Ensure error/success states are managed locally
   - Check that mock data IDs are consistent

## Conclusion

This demo mode implementation provides a robust foundation for development, testing, and demonstration scenarios. The pattern ensures your application remains functional and realistic even without backend services, while maintaining production safety and code consistency.

Remember to:
- Test thoroughly in both modes
- Keep mock data realistic and up-to-date
- Provide clear visual indicators
- Maintain consistency between demo and production behavior
