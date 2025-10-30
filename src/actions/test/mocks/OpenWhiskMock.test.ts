import { MockOpenWhiskClient, createMockOpenWhisk } from './MockOpenWhisk';

describe('OpenWhisk Mock', () => {
  let mockClient: MockOpenWhiskClient;

  beforeEach(() => {
    mockClient = createMockOpenWhisk();
  });

  afterEach(() => {
    mockClient.reset();
  });

  it('should create a mock OpenWhisk client', () => {
    expect(mockClient).toBeDefined();
    expect(mockClient.actions).toBeDefined();
    expect(mockClient.actions.invoke).toBeDefined();
  });

  it('should record action invocations', async () => {
    const params = { test: 'data' };
    
    await mockClient.actions.invoke({
      name: 'test-action',
      params,
      blocking: true,
      result: true
    });

    expect(mockClient.wasActionInvoked('test-action')).toBe(true);
    expect(mockClient.getInvocationCount('test-action')).toBe(1);
    
    const invocation = mockClient.getLastInvocation();
    expect(invocation).toBeDefined();
    expect(invocation!.name).toBe('test-action');
    expect(invocation!.params).toEqual(params);
  });

  it('should return custom mock results', async () => {
    const customResult = { success: true, data: 'custom' };
    mockClient.setMockResult('test-action', customResult);

    const result = await mockClient.actions.invoke({
      name: 'test-action',
      params: {},
      blocking: true,
      result: true
    });

    expect(result).toEqual(customResult);
  });

  it('should return default mock response when no custom result is set', async () => {
    const result = await mockClient.actions.invoke({
      name: 'test-action',
      params: { test: 'data' },
      blocking: true,
      result: true
    });

    expect(result).toBeDefined();
    expect(result.activationId).toContain('mock-activation-');
    expect(result.name).toBe('test-action');
    expect(result.response.status).toBe('success');
    expect(result.response.result.statusCode).toBe(200);
  });

  it('should handle multiple invocations', async () => {
    const actions = ['action1', 'action2', 'action3'];
    
    for (const action of actions) {
      await mockClient.actions.invoke({
        name: action,
        params: { action },
        blocking: true,
        result: true
      });
    }

    expect(mockClient.getInvocationHistory()).toHaveLength(3);
    actions.forEach(action => {
      expect(mockClient.wasActionInvoked(action)).toBe(true);
      expect(mockClient.getInvocationCount(action)).toBe(1);
    });
  });

  it('should clear invocation history', async () => {
    await mockClient.actions.invoke({
      name: 'test-action',
      params: {},
      blocking: true,
      result: true
    });

    expect(mockClient.getInvocationCount('test-action')).toBe(1);
    
    mockClient.clearInvocationHistory();
    expect(mockClient.getInvocationCount('test-action')).toBe(0);
    expect(mockClient.getInvocationHistory()).toHaveLength(0);
  });

  it('should verify invocations with parameters', async () => {
    const params = { routerParams: { test: 'data' } };
    
    await mockClient.actions.invoke({
      name: 'test-action',
      params,
      blocking: true,
      result: true
    });

    expect(mockClient.verifyInvocation('test-action', params)).toBe(true);
    expect(mockClient.verifyInvocation('test-action', { different: 'params' })).toBe(false);
  });
});
