/**
 * Jest setup file for mocking Adobe I/O libraries
 * This automatically replaces the real libraries with mock implementations during testing
 */

import { MockFactory } from './MockFactory';

// Mock @adobe/aio-lib-files
jest.mock('@adobe/aio-lib-files', () => ({
  init: jest.fn().mockImplementation(async () => MockFactory.getFileStore())
}));

// Mock @adobe/aio-lib-state
jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockImplementation(async () => MockFactory.getStateStore())
}));

// Mock @adobe/aio-lib-core-logging
jest.mock('@adobe/aio-lib-core-logging', () => {
  return jest.fn().mockReturnValue({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  });
});

// Mock @adobe/aio-lib-events
jest.mock('@adobe/aio-lib-events', () => {
  const { createMockAioLibEvents } = require('./MockAioLibEvents');
  return createMockAioLibEvents();
});

// Mock openwhisk module
jest.doMock('openwhisk', () => {
  const { createMockOpenWhisk } = require('./MockOpenWhisk');
  return createMockOpenWhisk();
});

// Mock require statements for dynamic imports
jest.doMock('@adobe/aio-lib-files', () => ({
  init: jest.fn().mockImplementation(async () => MockFactory.getFileStore())
}));

jest.doMock('@adobe/aio-lib-state', () => ({
  init: jest.fn().mockImplementation(async () => MockFactory.getStateStore())
}));

// Note: Brand.sendCloudEventToEndpoint mocking is handled by jest.spyOn in individual test files

// Global test setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset mock stores to clean state
  MockFactory.reset();
});

afterEach(() => {
  // Clean up after each test
  MockFactory.clearAll();
});

// Export mock factory for use in tests
export { MockFactory };
