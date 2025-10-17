/**
 * Mock State Store for testing classes that depend on @adobe/aio-lib-state
 * This simulates the state store API without requiring Adobe I/O Runtime access
 */

export interface MockStateData {
  value: any;
  ttl?: number;
  created: Date;
  updated: Date;
}

export class MockStateStore {
  private store: Map<string, MockStateData> = new Map();
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Mock initialization - simulates stateLib.init()
   */
  async init(): Promise<MockStateStore> {
    this.logger.debug('MockStateStore initialized');
    return this;
  }

  /**
   * Mock put operation
   */
  async put(key: string, value: any, options?: { ttl?: number }): Promise<void> {
    const now = new Date();
    const stateData: MockStateData = {
      value: value,
      ttl: options?.ttl,
      created: now,
      updated: now
    };
    
    this.store.set(key, stateData);
    this.logger.debug(`MockStateStore: Stored key ${key}`);
  }

  /**
   * Mock get operation
   */
  async get(key: string): Promise<MockStateData | undefined> {
    const stateData = this.store.get(key);
    if (stateData) {
      // Check TTL
      if (stateData.ttl) {
        const expiryTime = stateData.created.getTime() + (stateData.ttl * 1000);
        if (Date.now() > expiryTime) {
          this.store.delete(key);
          this.logger.debug(`MockStateStore: Key ${key} expired and was removed`);
          return undefined;
        }
      }
      
      this.logger.debug(`MockStateStore: Retrieved key ${key}`);
      return stateData;
    }
    
    this.logger.debug(`MockStateStore: Key ${key} not found`);
    return undefined;
  }

  /**
   * Mock delete operation
   */
  async delete(key: string): Promise<void> {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.logger.debug(`MockStateStore: Deleted key ${key}`);
    } else {
      this.logger.debug(`MockStateStore: Key ${key} not found for deletion`);
    }
  }

  /**
   * Mock list operation (simplified - returns all keys)
   */
  async list(): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    this.logger.debug(`MockStateStore: Listed ${keys.length} keys`);
    return keys;
  }

  /**
   * Helper method to seed the mock store with test data
   */
  seedWithTestData(testData: { [key: string]: any }): void {
    Object.entries(testData).forEach(([key, value]) => {
      this.store.set(key, {
        value: value,
        created: new Date(),
        updated: new Date()
      });
    });
    this.logger.debug(`MockStateStore: Seeded with ${Object.keys(testData).length} test entries`);
  }

  /**
   * Helper method to clear all data (useful for test cleanup)
   */
  clear(): void {
    this.store.clear();
    this.logger.debug('MockStateStore: Cleared all data');
  }

  /**
   * Helper method to get store size (useful for assertions)
   */
  getSize(): number {
    return this.store.size;
  }

  /**
   * Helper method to check if key exists
   */
  keyExists(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * Helper method to get all stored data (useful for debugging)
   */
  getAllData(): Map<string, MockStateData> {
    return new Map(this.store);
  }
}
