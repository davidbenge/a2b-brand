/**
 * Mock Factory for testing classes that depend on Adobe I/O libraries
 * This provides easy access to all mock implementations
 */

import { MockFileStore } from './MockFileStore';
import { MockStateStore } from './MockStateStore';
import { MockOpenWhiskClient, createMockOpenWhisk } from './MockOpenWhisk';
import { MockAioLibEvents, createMockAioLibEvents } from './MockAioLibEvents';

export class MockFactory {
  private static fileStore: MockFileStore;
  private static stateStore: MockStateStore;
  private static openWhiskClient: MockOpenWhiskClient;
  private static aioLibEvents: MockAioLibEvents;

  /**
   * Get or create a singleton MockFileStore instance
   */
  static getFileStore(): MockFileStore {
    if (!MockFactory.fileStore) {
      MockFactory.fileStore = new MockFileStore();
    }
    return MockFactory.fileStore;
  }

  /**
   * Get or create a singleton MockStateStore instance
   */
  static getStateStore(): MockStateStore {
    if (!MockFactory.stateStore) {
      MockFactory.stateStore = new MockStateStore();
    }
    return MockFactory.stateStore;
  }

  /**
   * Get or create a singleton MockOpenWhiskClient instance
   */
  static getOpenWhiskClient(): MockOpenWhiskClient {
    if (!MockFactory.openWhiskClient) {
      MockFactory.openWhiskClient = createMockOpenWhisk();
    }
    return MockFactory.openWhiskClient;
  }

  static getAioLibEvents(): MockAioLibEvents {
    if (!MockFactory.aioLibEvents) {
      MockFactory.aioLibEvents = createMockAioLibEvents();
    }
    return MockFactory.aioLibEvents;
  }

  /**
   * Clear all mock stores (useful for test cleanup)
   */
  static clearAll(): void {
    if (MockFactory.fileStore) {
      MockFactory.fileStore.clear();
    }
    if (MockFactory.stateStore) {
      MockFactory.stateStore.clear();
    }
    if (MockFactory.openWhiskClient) {
      MockFactory.openWhiskClient.clearInvocationHistory();
      MockFactory.openWhiskClient.clearMockResults();
    }
    if (MockFactory.aioLibEvents) {
      MockFactory.aioLibEvents.clear();
    }
  }

  /**
   * Reset all mock stores to initial state
   */
  static reset(): void {
    MockFactory.fileStore = new MockFileStore();
    MockFactory.stateStore = new MockStateStore();
    MockFactory.openWhiskClient = createMockOpenWhisk();
    MockFactory.aioLibEvents = createMockAioLibEvents();
  }

  /**
   * Seed file store with test data
   */
  static seedFileStore(testData: { [path: string]: string | Buffer }): void {
    MockFactory.getFileStore().seedWithTestData(testData);
  }

  /**
   * Seed state store with test data
   */
  static seedStateStore(testData: { [key: string]: any }): void {
    MockFactory.getStateStore().seedWithTestData(testData);
  }
}
