# Mock Implementations for Adobe I/O Libraries

This directory contains mock implementations for Adobe I/O libraries that are commonly used in OpenWhisk actions. These mocks allow you to test your actions locally without requiring access to external services or storage providers.

## Overview

The mocking solution provides:
- **MockFileStore**: Simulates `@adobe/aio-lib-files` operations
- **MockStateStore**: Simulates `@adobe/aio-lib-state` operations  
- **MockOpenWhiskClient**: Simulates OpenWhisk action invocations
- **MockFactory**: Centralized factory for managing mock instances

## OpenWhisk Action Invocation Mocking

The `MockOpenWhiskClient` allows you to test actions that invoke other OpenWhisk actions without requiring actual OpenWhisk runtime access.

### Key Features

- **Action Invocation Recording**: Tracks all action invocations for testing assertions
- **Custom Mock Results**: Set specific responses for different actions
- **Parameter Verification**: Verify that actions are called with expected parameters
- **Real Action Simulation**: Optionally call actual action handlers for integration testing

### Basic Usage

```typescript
import { MockOpenWhiskClient, createMockOpenWhisk } from './mocks/MockOpenWhisk';

describe('My Action Tests', () => {
  let mockOpenWhisk: MockOpenWhiskClient;

  beforeEach(() => {
    mockOpenWhisk = createMockOpenWhisk();
  });

  it('should invoke another action', async () => {
    // Your action code that calls ow.actions.invoke()
    await myAction(params);

    // Verify the action was invoked
    expect(mockOpenWhisk.wasActionInvoked('action-name')).toBe(true);
    expect(mockOpenWhisk.getInvocationCount('action-name')).toBe(1);

    // Check invocation details
    const invocation = mockOpenWhisk.getLastInvocation();
    expect(invocation!.params).toEqual(expectedParams);
  });
});
```

### Setting Custom Mock Results

```typescript
// Set a specific result for an action
mockOpenWhisk.setMockResult('action-name', {
  success: true,
  data: 'custom response'
});

// Your action will receive this result when it invokes 'action-name'
```

### Verifying Action Invocations

```typescript
// Check if an action was invoked
expect(mockOpenWhisk.wasActionInvoked('action-name')).toBe(true);

// Get invocation count
expect(mockOpenWhisk.getInvocationCount('action-name')).toBe(3);

// Get all invocations for an action
const invocations = mockOpenWhisk.getInvocationsForAction('action-name');

// Verify invocation with specific parameters
expect(mockOpenWhisk.verifyInvocation('action-name', expectedParams)).toBe(true);
```

### Integration with Real Actions

The mock can optionally simulate calling actual action handlers:

```typescript
// When you call ow.actions.invoke('action-name'), the mock will:
// 1. First check for custom mock results
// 2. Then try to call the actual action handler if it exists
// 3. Finally fall back to a default mock response
```

## File Store Mocking

The `MockFileStore` simulates file operations without requiring actual storage:

```typescript
import { MockFactory } from './mocks/MockFactory';

describe('File Operations', () => {
  beforeEach(() => {
    MockFactory.reset();
  });

  it('should write and read files', async () => {
    const fileStore = MockFactory.getFileStore();
    
    // Write a file
    await fileStore.write('test.txt', 'Hello World');
    
    // Read it back
    const content = await fileStore.read('test.txt');
    expect(content.toString()).toBe('Hello World');
  });
});
```

## State Store Mocking

The `MockStateStore` simulates key-value storage operations:

```typescript
import { MockFactory } from './mocks/MockFactory';

describe('State Operations', () => {
  beforeEach(() => {
    MockFactory.reset();
  });

  it('should store and retrieve values', async () => {
    const stateStore = MockFactory.getStateStore();
    
    // Store a value
    await stateStore.put('key', 'value', { ttl: 3600 });
    
    // Retrieve it
    const result = await stateStore.get('key');
    expect(result!.value).toBe('value');
  });
});
```

## Jest Integration

The mocks are automatically integrated with Jest through `jest.setup.ts`:

```typescript
// This file automatically mocks the libraries
import './mocks/jest.setup';

// Your tests can now use the mocks without additional setup
```

## Testing Patterns

### Testing Action Chains

```typescript
it('should process event and invoke handler', async () => {
  const mockOpenWhisk = createMockOpenWhisk();
  
  // Set up mock result for the handler action
  mockOpenWhisk.setMockResult('handler-action', {
    success: true,
    processed: true
  });

  // Call your main action
  const result = await mainAction(eventData);

  // Verify the handler was invoked
  expect(mockOpenWhisk.wasActionInvoked('handler-action')).toBe(true);
  
  // Verify the result
  expect(result.success).toBe(true);
});
```

### Testing Error Scenarios

```typescript
it('should handle handler errors gracefully', async () => {
  const mockOpenWhisk = createMockOpenWhisk();
  
  // Mock an error response
  mockOpenWhisk.setMockResult('handler-action', {
    error: 'Handler failed',
    statusCode: 500
  });

  const result = await mainAction(eventData);
  
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
});
```

### Testing Multiple Invocations

```typescript
it('should handle multiple events', async () => {
  const mockOpenWhisk = createMockOpenWhisk();
  
  const events = ['event1', 'event2', 'event3'];
  
  for (const event of events) {
    await processEvent(event);
  }
  
  // Verify all events were processed
  expect(mockOpenWhisk.getInvocationCount('handler-action')).toBe(3);
  
  // Verify each invocation
  const invocations = mockOpenWhisk.getInvocationsForAction('handler-action');
  invocations.forEach((inv, index) => {
    expect(inv.params.event).toBe(events[index]);
  });
});
```

## Advanced Features

### Custom Action Handlers

```typescript
// Register a custom handler for a specific action
mockOpenWhisk.registerAction('custom-action', async (params) => {
  // Your custom logic here
  return { processed: true, data: params };
});

// When 'custom-action' is invoked, your handler will be called
```

### Seeding Test Data

```typescript
// Seed the file store with test data
MockFactory.seedFileStore({
  'config.json': JSON.stringify({ setting: 'value' }),
  'data.csv': 'header,value\nrow1,data1'
});

// Seed the state store with test data
MockFactory.seedStateStore({
  'CONFIG_KEY': { setting: 'value' },
  'DATA_KEY': { items: ['item1', 'item2'] }
});
```

## Best Practices

1. **Reset mocks between tests**: Always call `MockFactory.reset()` in `beforeEach`
2. **Clear data after tests**: Use `MockFactory.clearAll()` in `afterEach`
3. **Use descriptive test data**: Make your test data realistic and meaningful
4. **Test error scenarios**: Don't just test happy paths, test error conditions too
5. **Verify side effects**: Check that actions are invoked with correct parameters

## Troubleshooting

### Mock not being used

If your mocks aren't being used, check:
- Jest setup is properly configured
- Mock files are imported in the right order
- Module resolution is working correctly

### Tests failing unexpectedly

Common issues:
- Mocks not being reset between tests
- Incorrect parameter matching in assertions
- Async operations not being properly awaited

### Performance issues

For large test suites:
- Use `MockFactory.reset()` instead of `MockFactory.clearAll()` when possible
- Consider using `jest.isolateModules()` for complex mocking scenarios
