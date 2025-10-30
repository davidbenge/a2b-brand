/**
 * Tests for agency-registration-internal-handler action (Brand App)
 * 
 * Validates that the brand correctly:
 * - Processes registration.received events and stores brand configuration
 * - Processes registration.enabled events and updates enabled status
 * - Validates required fields
 * - Handles errors gracefully
 */

import { main } from '../event-handlers/agency-registration-internal-handler/index';

const registrationReceivedEvent = require('../../../docs/events/registration/com-adobe-a2b-registration-received.json');

// Mock the state and file stores
jest.mock('@adobe/aio-lib-state', () => ({
  init: jest.fn(() => Promise.resolve({
    get: jest.fn(() => Promise.resolve({ value: null })),
    put: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve())
  }))
}));

jest.mock('@adobe/aio-lib-files', () => ({
  init: jest.fn(() => Promise.resolve({
    read: jest.fn(() => Promise.resolve(null)),
    write: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    list: jest.fn(() => Promise.resolve([]))
  }))
}));

describe('agency-registration-internal-handler (Brand App)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registration.received Event', () => {
    it('should process valid registration.received event', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency',
              workspace: 'production'
            },
            agency_identification: {
              agencyId: 'test-agency-id',
              orgId: 'test-org-id@AdobeOrg'
            },
            brandId: 'test-brand-id-12345678',
            name: 'Test Brand',
            endPointUrl: 'https://brand.example.com/webhook'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('Registration received successfully');
      expect(response.body.brandId).toBe('test-brand-id-12345678');
      expect(response.body.name).toBe('Test Brand');
    });

    it('should reject registration.received without brandId', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            secret: 'test-secret',
            name: 'Test Brand',
            endPointUrl: 'https://brand.example.com/webhook'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('brandId');
    });

    it('should accept registration.received without secret (secret comes later in enabled event)', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            agency_identification: {
              agencyId: 'test-agency-id',
              orgId: 'test-org-id@AdobeOrg'
            },
            brandId: 'test-brand-id',
            name: 'Test Brand',
            endPointUrl: 'https://brand.example.com/webhook'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('awaiting enablement');
    });

    it('should reject registration.received without name', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            brandId: 'test-brand-id',
            secret: 'test-secret',
            endPointUrl: 'https://brand.example.com/webhook'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('name');
    });

    it('should derive agency endPointUrl from app_runtime_info (not from event data)', async () => {
      // Note: endPointUrl is no longer passed in event data - it's derived from app_runtime_info
      // The handler constructs the URL as: https://{consoleId}-{projectName}-{workspace}.adobeio-static.net
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              projectName: 'a2b',
              workspace: 'benge',
              app_name: 'agency'
            },
            agency_identification: {
              agencyId: 'agency-123',
              orgId: 'org-456'
            },
            brandId: 'test-brand-id',
            name: 'Test Brand'
            // NOTE: NO endPointUrl in event data - it's derived from app_runtime_info
          }
        }
      };

      const response = await main(params);
      
      // Should succeed because endPointUrl is derived from app_runtime_info
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('Registration received successfully');
      expect(response.body.agencyId).toBe('27200');
      
      // The agency should be stored with endPointUrl: https://27200-a2b-benge.adobeio-static.net
      // (derived from app_runtime_info, not from event data)
    });

    it('should process registration.received event from example file', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: registrationReceivedEvent.type,
          data: registrationReceivedEvent.data
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.brandId).toBe(registrationReceivedEvent.data.brandId);
      expect(response.body.name).toBe(registrationReceivedEvent.data.name);
      expect(response.body.message).toContain('awaiting enablement');
    });
  });

  describe('registration.enabled Event', () => {
    it('should process valid registration.enabled event with secret', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.enabled',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            agency_identification: {
              agencyId: 'test-agency-id',
              orgId: 'test-org-id@AdobeOrg'
            },
            brandId: 'existing-brand-id',
            name: 'Test Brand',
            endPointUrl: 'https://brand.example.com/webhook',
            secret: 'test-secret-32chars-long-xxxxxx',
            enabled: true
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('secret stored');
      expect(response.body.brandId).toBe('existing-brand-id');
      expect(response.body.enabled).toBe(true);
    });

    it('should handle enabled=false in registration.enabled event', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.enabled',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            agency_identification: {
              agencyId: 'test-agency-id',
              orgId: 'test-org-id@AdobeOrg'
            },
            brandId: 'existing-brand-id',
            name: 'Test Brand',
            endPointUrl: 'https://brand.example.com/webhook',
            secret: 'test-secret-32chars-long-xxxxxx',
            enabled: false
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.enabled).toBe(false);
    });

    it('should reject registration.enabled without brandId', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.enabled',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            secret: 'test-secret',
            enabled: true
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('brandId');
    });

    it('should reject registration.enabled without secret', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.enabled',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            brandId: 'existing-brand-id',
            enabled: true
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('secret');
    });

    it('should reject registration.enabled without enabled field', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.enabled',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            brandId: 'existing-brand-id'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('enabled');
    });
  });

  describe('Event Validation', () => {
    it('should reject events without type', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          data: {
            app_runtime_info: {},
            brandId: 'test'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject events without data', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received'
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });

    it('should reject events without app_runtime_info', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.received',
          data: {
            brandId: 'test'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toContain('app_runtime_info');
    });

    it('should handle unknown registration event types', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: {
          type: 'com.adobe.a2b.registration.unknown',
          data: {
            app_runtime_info: {
              consoleId: '27200',
              namespace: 'agency-namespace',
              app_name: 'agency'
            },
            brandId: 'test'
          }
        }
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('unknown type');
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const params = {
        LOG_LEVEL: 'debug',
        routerParams: null // This will cause an error
      };

      const response = await main(params);
      
      expect(response.statusCode).toBe(400);
    });
  });
});

