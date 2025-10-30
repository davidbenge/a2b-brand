/**
 * Mock implementation of @adobe/aio-lib-events for testing
 * 
 * This mock simulates the Adobe I/O Events library functionality without requiring
 * actual Adobe I/O Events service access.
 */

export interface MockEventRegistration {
  id: string;
  client_id: string;
  name: string;
  description: string;
  webhook_url?: string;
  events_of_interest: Array<{
    provider_id: string;
    event_code: string;
  }>;
  delivery_type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockEventProvider {
  id: string;
  label: string;
  description?: string;
  docs_url?: string;
  instance_id?: string;
  event_metadata?: Array<{
    id: string;
    label: string;
    description: string;
    event_code: string;
    sample_event_template?: string;
  }>;
}

export interface MockEventMetadata {
  id: string;
  label: string;
  description: string;
  event_code: string;
  sample_event_template?: string;
}

export class MockAioLibEvents {
  private registrations: Map<string, MockEventRegistration> = new Map();
  private providers: Map<string, MockEventProvider> = new Map();
  private eventMetadata: Map<string, MockEventMetadata> = new Map();
  private webhookHistory: Array<{
    registrationId: string;
    event: any;
    timestamp: string;
    status: 'success' | 'failed';
  }> = [];
  private logger: any;

  constructor(logger?: any) {
    this.logger = logger || console;
    this.seedMockData();
  }

  /**
   * Initialize the mock SDK (simulates the real init method)
   */
  async init(organizationId: string, apiKey: string, accessToken: string, options?: any): Promise<MockAioLibEvents> {
    this.logger.debug('MockAioLibEvents: Initialized with', {
      organizationId,
      apiKey: apiKey ? '[REDACTED]' : undefined,
      accessToken: accessToken ? '[REDACTED]' : undefined,
      options
    });
    return this;
  }

  /**
   * Create a new event registration
   */
  async createRegistration(registration: any): Promise<MockEventRegistration> {
    const id = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newRegistration: MockEventRegistration = {
      id,
      client_id: registration.client_id,
      name: registration.name,
      description: registration.description || '',
      webhook_url: registration.webhook_url,
      events_of_interest: registration.events_of_interest || [],
      delivery_type: registration.delivery_type || 'webhook',
      enabled: registration.enabled !== false,
      created_at: now,
      updated_at: now
    };

    this.registrations.set(id, newRegistration);
    this.logger.debug('MockAioLibEvents: Created registration', newRegistration);
    
    return newRegistration;
  }

  /**
   * Get event registration by ID
   */
  async getRegistration(registrationId: string): Promise<MockEventRegistration | null> {
    const registration = this.registrations.get(registrationId);
    this.logger.debug('MockAioLibEvents: Retrieved registration', registration);
    return registration || null;
  }

  /**
   * Get all registrations
   */
  async getRegistrations(options?: any): Promise<{
    _embedded: {
      registrations: MockEventRegistration[];
    };
    _page: {
      size: number;
      total_elements: number;
      total_pages: number;
      number: number;
    };
  }> {
    const registrations = Array.from(this.registrations.values());
    const page = options?.page || 0;
    const size = options?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedRegistrations = registrations.slice(start, end);

    this.logger.debug('MockAioLibEvents: Retrieved registrations', {
      count: paginatedRegistrations.length,
      total: registrations.length,
      page,
      size
    });

    return {
      _embedded: {
        registrations: paginatedRegistrations
      },
      _page: {
        size,
        total_elements: registrations.length,
        total_pages: Math.ceil(registrations.length / size),
        number: page
      }
    };
  }

  /**
   * Update an existing registration
   */
  async updateRegistration(registrationId: string, updates: any): Promise<MockEventRegistration> {
    const existing = this.registrations.get(registrationId);
    if (!existing) {
      throw new Error(`Registration ${registrationId} not found`);
    }

    const updatedRegistration: MockEventRegistration = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.registrations.set(registrationId, updatedRegistration);
    this.logger.debug('MockAioLibEvents: Updated registration', updatedRegistration);
    
    return updatedRegistration;
  }

  /**
   * Delete a registration
   */
  async deleteRegistration(registrationId: string): Promise<void> {
    const deleted = this.registrations.delete(registrationId);
    if (deleted) {
      this.logger.debug('MockAioLibEvents: Deleted registration', registrationId);
    } else {
      throw new Error(`Registration ${registrationId} not found`);
    }
  }

  /**
   * Get event providers
   */
  async getProviders(options?: any): Promise<{
    _embedded: {
      providers: MockEventProvider[];
    };
    _page: {
      size: number;
      total_elements: number;
      total_pages: number;
      number: number;
    };
  }> {
    const providers = Array.from(this.providers.values());
    const page = options?.page || 0;
    const size = options?.size || 10;
    const start = page * size;
    const end = start + size;
    const paginatedProviders = providers.slice(start, end);

    this.logger.debug('MockAioLibEvents: Retrieved providers', {
      count: paginatedProviders.length,
      total: providers.length,
      page,
      size
    });

    return {
      _embedded: {
        providers: paginatedProviders
      },
      _page: {
        size,
        total_elements: providers.length,
        total_pages: Math.ceil(providers.length / size),
        number: page
      }
    };
  }

  /**
   * Get event metadata
   */
  async getEventMetadata(providerId: string, eventCode: string): Promise<MockEventMetadata | null> {
    const metadata = Array.from(this.eventMetadata.values()).find(
      md => md.event_code === eventCode
    );
    
    this.logger.debug('MockAioLibEvents: Retrieved event metadata', {
      providerId,
      eventCode,
      metadata
    });
    
    return metadata || null;
  }

  /**
   * Simulate sending an event to a webhook
   */
  async sendEventToWebhook(registrationId: string, event: any): Promise<{
    status: 'success' | 'failed';
    message: string;
    timestamp: string;
  }> {
    const registration = this.registrations.get(registrationId);
    if (!registration) {
      throw new Error(`Registration ${registrationId} not found`);
    }

    if (!registration.webhook_url) {
      throw new Error(`Registration ${registrationId} has no webhook URL`);
    }

    // Simulate webhook delivery
    const timestamp = new Date().toISOString();
    const success = Math.random() > 0.1; // 90% success rate for testing
    
    const webhookResult = {
      registrationId,
      event,
      timestamp,
      status: success ? 'success' as const : 'failed' as const
    };

    this.webhookHistory.push(webhookResult);
    
    this.logger.debug('MockAioLibEvents: Sent event to webhook', webhookResult);
    
    return {
      status: webhookResult.status,
      message: success ? 'Event delivered successfully' : 'Event delivery failed',
      timestamp
    };
  }

  /**
   * Get webhook delivery history
   */
  getWebhookHistory(): Array<typeof this.webhookHistory[0]> {
    return [...this.webhookHistory];
  }

  /**
   * Clear webhook history
   */
  clearWebhookHistory(): void {
    this.webhookHistory = [];
    this.logger.debug('MockAioLibEvents: Cleared webhook history');
  }

  /**
   * Get events observable from journal (simulates the real method)
   */
  getEventsObservableFromJournal(journalUrl: string, options?: any): {
    subscribe: (observer: {
      next: (value: any) => void;
      error: (error: any) => void;
      complete: () => void;
    }) => {
      unsubscribe: () => void;
    };
  } {
    this.logger.debug('MockAioLibEvents: Created journal observable', { journalUrl, options });
    
    return {
      subscribe: (observer) => {
        // Simulate a simple observable that can be subscribed to
        this.logger.debug('MockAioLibEvents: Journal observable subscribed');
        
        return {
          unsubscribe: () => {
            this.logger.debug('MockAioLibEvents: Journal observable unsubscribed');
          }
        };
      }
    };
  }

  /**
   * Seed the mock with some sample data
   */
  private seedMockData(): void {
    // Add some sample providers
    const sampleProviders: MockEventProvider[] = [
      {
        id: 'aem-assets',
        label: 'AEM Assets',
        description: 'Adobe Experience Manager Assets events',
        docs_url: 'https://docs.adobe.com/aem-assets',
        event_metadata: [
          {
            id: 'aem-assets-created',
            label: 'Asset Created',
            description: 'Asset was created in AEM',
            event_code: 'aem.assets.asset.created'
          },
          {
            id: 'aem-assets-updated',
            label: 'Asset Updated',
            description: 'Asset was updated in AEM',
            event_code: 'aem.assets.asset.updated'
          },
          {
            id: 'aem-assets-deleted',
            label: 'Asset Deleted',
            description: 'Asset was deleted from AEM',
            event_code: 'aem.assets.asset.deleted'
          }
        ]
      },
      {
        id: 'creative-cloud',
        label: 'Creative Cloud',
        description: 'Adobe Creative Cloud events',
        docs_url: 'https://docs.adobe.com/creative-cloud'
      }
    ];

    sampleProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
      if (provider.event_metadata) {
        provider.event_metadata.forEach(metadata => {
          this.eventMetadata.set(metadata.id, metadata);
        });
      }
    });

    // Add some sample registrations
    const sampleRegistrations: MockEventRegistration[] = [
      {
        id: 'reg_sample_1',
        client_id: 'test-client-1',
        name: 'Test AEM Assets Registration',
        description: 'Test registration for AEM Assets events',
        webhook_url: 'https://example.com/webhook/aem-assets',
        events_of_interest: [
          { provider_id: 'aem-assets', event_code: 'aem.assets.asset.created' },
          { provider_id: 'aem-assets', event_code: 'aem.assets.asset.updated' }
        ],
        delivery_type: 'webhook',
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    sampleRegistrations.forEach(registration => {
      this.registrations.set(registration.id, registration);
    });
  }

  /**
   * Reset the mock to initial state
   */
  reset(): void {
    this.registrations.clear();
    this.providers.clear();
    this.eventMetadata.clear();
    this.webhookHistory = [];
    this.seedMockData();
    this.logger.debug('MockAioLibEvents: Reset to initial state');
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.registrations.clear();
    this.providers.clear();
    this.eventMetadata.clear();
    this.webhookHistory = [];
    this.logger.debug('MockAioLibEvents: Cleared all data');
  }
}

/**
 * Factory function to create a mock instance
 */
export function createMockAioLibEvents(logger?: any): MockAioLibEvents {
  return new MockAioLibEvents(logger);
}

/**
 * Mock module export that matches the real library structure
 */
export const mockAioLibEvents = {
  init: async (organizationId: string, apiKey: string, accessToken: string, options?: any) => {
    return createMockAioLibEvents();
  }
};
