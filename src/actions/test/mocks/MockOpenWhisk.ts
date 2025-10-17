/**
 * Mock OpenWhisk Client for testing actions that invoke other OpenWhisk actions
 * This simulates the openwhisk() client API without requiring actual OpenWhisk runtime access
 */

export interface MockActionInvocation {
  name: string;
  params: any;
  blocking: boolean;
  result: boolean;
}

export interface MockActionResult {
  success: boolean;
  data?: any;
  error?: string;
  activationId?: string;
  duration?: number;
}

export class MockOpenWhiskClient {
  private actionHandlers: Map<string, (params: any) => Promise<any>> = new Map();
  private logger: any;
  private invocationHistory: MockActionInvocation[] = [];
  private mockResults: Map<string, any> = new Map();

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Mock actions object that simulates the real OpenWhisk actions API
   */
  get actions() {
    return {
      invoke: async (options: MockActionInvocation): Promise<any> => {
        return this.invokeAction(options);
      }
    };
  }

  /**
   * Mock action invocation
   */
  async invokeAction(options: MockActionInvocation): Promise<any> {
    const { name, params, blocking, result } = options;
    
    // Record the invocation for testing
    this.invocationHistory.push({
      name,
      params,
      blocking,
      result
    });

    this.logger.debug(`MockOpenWhisk: Invoking action ${name}`, {
      params,
      blocking,
      result
    });

    // Check if we have a custom mock result for this action
    if (this.mockResults.has(name)) {
      const mockResult = this.mockResults.get(name);
      this.logger.debug(`MockOpenWhisk: Using mock result for ${name}`, mockResult);
      return mockResult;
    }

    // Check if we have a custom handler for this action
    if (this.actionHandlers.has(name)) {
      try {
        const handler = this.actionHandlers.get(name)!;
        const result = await handler(params);
        this.logger.debug(`MockOpenWhisk: Custom handler result for ${name}`, result);
        return result;
      } catch (error) {
        this.logger.error(`MockOpenWhisk: Error in custom handler for ${name}`, error);
        throw error;
      }
    }

    // Simulate calling the actual action if it exists
    try {
      const actionResult = await this.simulateActionInvocation(name, params);
      if (actionResult) {
        this.logger.debug(`MockOpenWhisk: Simulated action result for ${name}`, actionResult);
        return actionResult;
      }
    } catch (error) {
      this.logger.debug(`MockOpenWhisk: Could not simulate action ${name}, using default`, error);
    }

    // Default mock response
    const defaultResult = {
      activationId: `mock-activation-${Date.now()}`,
      name: name,
      version: '0.0.1',
      publish: false,
      annotations: [
        { key: 'path', value: name },
        { key: 'kind', value: 'nodejs:22' },
        { key: 'limits', value: { timeout: 60000, memory: 256, logs: 10 } }
      ],
      duration: Math.floor(Math.random() * 100) + 50,
      start: Date.now(),
      end: Date.now(),
      response: {
        status: 'success',
        statusCode: 0,
        success: true,
        result: {
          statusCode: 200,
          body: {
            message: `Mock result for action ${name}`,
            params: params,
            timestamp: new Date().toISOString()
          }
        }
      }
    };

    this.logger.debug(`MockOpenWhisk: Default result for ${name}`, defaultResult);
    return defaultResult;
  }

  /**
   * Simulate calling the actual action handler
   * This allows testing the full action chain
   */
  private async simulateActionInvocation(actionName: string, params: any): Promise<any> {
    try {
      // Try to dynamically import and call the actual action
      const actionPath = this.getActionPath(actionName);
      if (actionPath) {
        const actionModule = require(actionPath);
        if (actionModule.main) {
          this.logger.debug(`MockOpenWhisk: Calling actual action ${actionName}`);
          const result = await actionModule.main(params);
          return {
            activationId: `real-activation-${Date.now()}`,
            name: actionName,
            response: {
              status: 'success',
              statusCode: 0,
              success: true,
              result: result
            }
          };
        }
      }
    } catch (error) {
      this.logger.debug(`MockOpenWhisk: Could not load action ${actionName}`, error);
    }
    return null;
  }

  /**
   * Get the file path for an action based on its name
   */
  private getActionPath(actionName: string): string | null {
    try {
      // Convert action name to file path
      // e.g., 'a2b-agency/agency-assetsync-internal-handler-metadata-updated' -> '../../agency-assetsync-internal-handler-metadata-updated/index'
      const parts = actionName.split('/');
      if (parts.length === 2) {
        const actionDir = parts[1];
        return `../../${actionDir}/index`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register a custom handler for a specific action
   */
  registerAction(name: string, handler: (params: any) => Promise<any>): void {
    this.actionHandlers.set(name, handler);
    this.logger.debug(`MockOpenWhisk: Registered custom handler for action ${name}`);
  }

  /**
   * Set a mock result for a specific action
   */
  setMockResult(actionName: string, result: any): void {
    this.mockResults.set(actionName, result);
    this.logger.debug(`MockOpenWhisk: Set mock result for action ${actionName}`, result);
  }

  /**
   * Clear mock results
   */
  clearMockResults(): void {
    this.mockResults.clear();
    this.logger.debug('MockOpenWhisk: Cleared all mock results');
  }

  /**
   * Get invocation history for testing assertions
   */
  getInvocationHistory(): MockActionInvocation[] {
    return [...this.invocationHistory];
  }

  /**
   * Get the last invocation
   */
  getLastInvocation(): MockActionInvocation | undefined {
    return this.invocationHistory[this.invocationHistory.length - 1];
  }

  /**
   * Get invocations for a specific action
   */
  getInvocationsForAction(actionName: string): MockActionInvocation[] {
    return this.invocationHistory.filter(inv => inv.name === actionName);
  }

  /**
   * Clear invocation history
   */
  clearInvocationHistory(): void {
    this.invocationHistory = [];
    this.logger.debug('MockOpenWhisk: Cleared invocation history');
  }

  /**
   * Reset the mock client to initial state
   */
  reset(): void {
    this.actionHandlers.clear();
    this.mockResults.clear();
    this.invocationHistory = [];
    this.logger.debug('MockOpenWhisk: Reset to initial state');
  }

  /**
   * Check if an action was invoked
   */
  wasActionInvoked(actionName: string): boolean {
    return this.invocationHistory.some(inv => inv.name === actionName);
  }

  /**
   * Get the count of invocations for a specific action
   */
  getInvocationCount(actionName: string): number {
    return this.invocationHistory.filter(inv => inv.name === actionName).length;
  }

  /**
   * Verify that an action was invoked with specific parameters
   */
  verifyInvocation(actionName: string, expectedParams?: any): boolean {
    const invocations = this.getInvocationsForAction(actionName);
    if (invocations.length === 0) {
      return false;
    }

    if (!expectedParams) {
      return true;
    }

    // Check if any invocation matches the expected parameters
    return invocations.some(inv => {
      if (expectedParams.routerParams) {
        return JSON.stringify(inv.params.routerParams) === JSON.stringify(expectedParams.routerParams);
      }
      return JSON.stringify(inv.params) === JSON.stringify(expectedParams);
    });
  }
}

/**
 * Factory function that creates a mock OpenWhisk client
 * This simulates the require('openwhisk')() call
 */
export function createMockOpenWhisk(logger?: any): MockOpenWhiskClient {
  return new MockOpenWhiskClient(logger);
}

/**
 * Mock the openwhisk module
 */
export const mockOpenWhisk = {
  __esModule: false,
  default: createMockOpenWhisk,
  createMockOpenWhisk
};
