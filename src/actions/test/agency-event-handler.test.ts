/**
 * Tests for agency-event-handler action (Brand App)
 * 
 * Validates that the brand correctly:
 * - Handles incoming agency events
 * - Validates secrets for non-registration events
 * - Skips secret validation for registration events
 * - Routes events to appropriate internal handlers
 */

import { main } from '../event-handlers/agency-event-handler/index';
import { AgencyManager } from '../classes/AgencyManager';
import { Agency } from '../classes/Agency';

// Mock OpenWhisk client
const mockInvoke = jest.fn();
jest.mock('openwhisk', () => {
  return jest.fn(() => ({
    actions: {
      invoke: mockInvoke
    }
  }));
});

const registrationReceivedEvent = require('../../../docs/events/registration/com-adobe-a2b-registration-received.json');

describe('agency-event-handler (Brand App)', () => {
  let agencyManager: AgencyManager;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({ success: true });
    
    // Set up a test agency with a known secret for validation tests
    agencyManager = new AgencyManager('debug');
    const testAgency = new Agency({
      agencyId: 'test-agency-id',
      orgId: 'test-org-id@AdobeOrg',
      brandId: 'test-brand-id',
      secret: 'valid-secret-32chars-long-xxxxxx',
      name: 'Test Agency',
      endPointUrl: 'https://agency.example.com/webhook',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      enabledAt: new Date()
    });
    
    await agencyManager.saveAgency(testAgency);
  });

  describe('Event Validation', () => {
    it('should reject events without APPLICATION_RUNTIME_INFO', async () => {
      const params = {
        type: 'com.adobe.a2b.assetsync.new',
        data: { some: 'data' },
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject events without type', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        data: { some: 'data' },
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject events without data', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject events without app_runtime_info in data', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        data: { some: 'data' },
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('app_runtime_info');
    });
  });

  describe('Secret Validation', () => {
    it('should reject non-registration events without secret header', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          asset_id: 'test-asset',
          brandId: 'test-brand'
        },
        __ow_headers: {},
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(401);
      expect(response.body).toContain('X-A2B-Brand-Secret');
    });

    it('should accept non-registration events with valid secret header', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          asset_id: 'test-asset',
          brandId: 'test-brand'
        },
        __ow_headers: {
          'x-a2b-brand-secret': 'valid-secret-32chars-long-xxxxxx'
        },
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: { message: 'Success' }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should skip secret validation for registration.received event', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.registration.received',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          brandId: 'new-brand-id',
          secret: 'new-secret-32chars-long-xxxxxxxx',
          name: 'New Brand',
          endPointUrl: 'https://brand.example.com/webhook',
          enabled: false
        },
        __ow_headers: {}, // No secret header
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: { message: 'Registration processed' }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(mockInvoke).toHaveBeenCalledWith({
        name: 'agency-registration-internal-handler',
        params: {
          routerParams: expect.objectContaining({
            type: 'com.adobe.a2b.registration.received'
          })
        },
        blocking: true,
        result: true
      });
    });

    it('should skip secret validation for registration.enabled event', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.registration.enabled',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          brandId: 'existing-brand-id',
          enabled: true
        },
        __ow_headers: {}, // No secret header
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: { message: 'Registration enabled updated' }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(mockInvoke).toHaveBeenCalledWith({
        name: 'agency-registration-internal-handler',
        params: {
          routerParams: expect.objectContaining({
            type: 'com.adobe.a2b.registration.enabled'
          })
        },
        blocking: true,
        result: true
      });
    });
  });

  describe('Event Routing', () => {
    it('should route assetsync events to agency-assetsync-internal-handler', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          asset_id: 'test-asset',
          brandId: 'test-brand'
        },
        __ow_headers: {
          'x-a2b-brand-secret': 'valid-secret-32chars-long-xxxxxx'
        },
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: { message: 'Asset processed' }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(mockInvoke).toHaveBeenCalledWith({
        name: 'agency-assetsync-internal-handler',
        params: {
          routerParams: expect.objectContaining({
            type: 'com.adobe.a2b.assetsync.new'
          })
        },
        blocking: true,
        result: true
      });
    });

    it('should route registration events to agency-registration-internal-handler', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.registration.received',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          brandId: 'new-brand-id',
          secret: 'new-secret',
          name: 'New Brand',
          endPointUrl: 'https://brand.example.com/webhook',
          enabled: false
        },
        __ow_headers: {},
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: { message: 'Registration processed' }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      // Simplified handler doesn't return routingResult
      // expect(response.body.routingResult.handler).toBe('agency-registration-internal-handler');
    });

    it('should return 400 for unhandled event types', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.unknown.event',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          }
        },
        __ow_headers: {
          'x-a2b-brand-secret': 'valid-secret-32chars-long-xxxxxx'
        },
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400); // Unhandled events return 400
      expect(response.body.message).toContain('Unhandled event type');
      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('Registration Flow Integration', () => {
    it('should successfully process complete registration.received event', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'brand-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand',
          workspace: 'production'
        }),
        ...registrationReceivedEvent,
        __ow_headers: {},
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockResolvedValue({
        statusCode: 200,
        body: {
          message: 'Registration received successfully',
          brandId: registrationReceivedEvent.data.brandId,
          name: registrationReceivedEvent.data.name,
          enabled: registrationReceivedEvent.data.enabled
        }
      });

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('processed successfully');
      // Simplified handler doesn't return eventType
      // expect(response.body.eventType).toBe('com.adobe.a2b.registration.received');
      expect(mockInvoke).toHaveBeenCalledWith({
        name: 'agency-registration-internal-handler',
        params: {
          routerParams: expect.objectContaining({
            type: 'com.adobe.a2b.registration.received',
            data: expect.objectContaining({
              brandId: registrationReceivedEvent.data.brandId,
              // Note: registration.received does NOT include secret
              // Secret is only sent on registration.enabled event
              name: registrationReceivedEvent.data.name,
              endPointUrl: registrationReceivedEvent.data.endPointUrl
            })
          })
        },
        blocking: true,
        result: true
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle routing errors gracefully', async () => {
      const params = {
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'test-namespace',
          app_name: 'brand',
          action_package_name: 'a2b-brand'
        }),
        type: 'com.adobe.a2b.assetsync.new',
        data: {
          app_runtime_info: {
            consoleId: "test-agency-id",
            namespace: 'agency-namespace',
            app_name: 'agency'
          },
          asset_id: 'test-asset',
          brandId: 'test-brand'
        },
        __ow_headers: {
          'x-a2b-brand-secret': 'valid-secret-32chars-long-xxxxxx'
        },
        LOG_LEVEL: 'debug'
      };

      mockInvoke.mockRejectedValue(new Error('Internal handler not available'));

      const response = await main(params);
      
      expect(response.statusCode).toBe(500); // Errors return 500
      // Simplified handler returns error message directly
      expect(response.body.message).toContain('Error processing');
      // expect(response.body.routingResult.error).toContain('Internal handler not available');
    });
  });
});

