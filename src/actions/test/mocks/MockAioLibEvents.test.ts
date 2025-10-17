import { MockAioLibEvents, createMockAioLibEvents } from './MockAioLibEvents';

describe('MockAioLibEvents', () => {
  let mockEvents: MockAioLibEvents;

  beforeEach(() => {
    mockEvents = createMockAioLibEvents();
  });

  afterEach(() => {
    mockEvents.clear();
  });

  describe('Initialization', () => {
    it('should initialize with sample data', async () => {
      const client = await mockEvents.init('test-org', 'test-api-key', 'test-token');
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(MockAioLibEvents);
    });
  });

  describe('Event Registrations', () => {
    it('should create a new registration', async () => {
      const registration = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        description: 'Test description',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [
          { provider_id: 'aem-assets', event_code: 'aem.assets.asset.created' }
        ],
        delivery_type: 'webhook'
      });

      expect(registration.id).toBeDefined();
      expect(registration.client_id).toBe('test-client');
      expect(registration.name).toBe('Test Registration');
      expect(registration.webhook_url).toBe('https://example.com/webhook');
      expect(registration.events_of_interest).toHaveLength(1);
      expect(registration.enabled).toBe(true);
    });

    it('should retrieve a registration by ID', async () => {
      const created = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      const retrieved = await mockEvents.getRegistration(created.id);
      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent registration', async () => {
      const retrieved = await mockEvents.getRegistration('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should get all registrations with pagination', async () => {
      // Create multiple registrations
      for (let i = 0; i < 15; i++) {
        await mockEvents.createRegistration({
          client_id: `client-${i}`,
          name: `Registration ${i}`,
          events_of_interest: [],
          delivery_type: 'webhook'
        });
      }

      const result = await mockEvents.getRegistrations({ page: 0, size: 10 });
      expect(result._embedded.registrations).toHaveLength(10);
      expect(result._page.total_elements).toBe(16); // 15 created + 1 from seedMockData
      expect(result._page.total_pages).toBe(2);
      expect(result._page.number).toBe(0);
    });

    it('should update an existing registration', async () => {
      const created = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      // Add a small delay to ensure timestamps are different
      await new Promise(resolve => setTimeout(resolve, 1));

      const updated = await mockEvents.updateRegistration(created.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated description');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should delete a registration', async () => {
      const created = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      await mockEvents.deleteRegistration(created.id);
      
      const retrieved = await mockEvents.getRegistration(created.id);
      expect(retrieved).toBeNull();
    });

    it('should throw error when updating non-existent registration', async () => {
      await expect(
        mockEvents.updateRegistration('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Registration non-existent not found');
    });

    it('should throw error when deleting non-existent registration', async () => {
      await expect(
        mockEvents.deleteRegistration('non-existent')
      ).rejects.toThrow('Registration non-existent not found');
    });
  });

  describe('Event Providers', () => {
    it('should get all providers with pagination', async () => {
      const result = await mockEvents.getProviders({ page: 0, size: 5 });
      
      expect(result._embedded.providers).toBeDefined();
      expect(result._embedded.providers.length).toBeGreaterThan(0);
      expect(result._page.total_elements).toBeGreaterThan(0);
    });

    it('should have AEM Assets provider with event metadata', async () => {
      const result = await mockEvents.getProviders();
      const aemProvider = result._embedded.providers.find(p => p.id === 'aem-assets');
      
      expect(aemProvider).toBeDefined();
      expect(aemProvider?.label).toBe('AEM Assets');
      expect(aemProvider?.event_metadata).toBeDefined();
      expect(aemProvider?.event_metadata?.length).toBeGreaterThan(0);
    });
  });

  describe('Event Metadata', () => {
    it('should get event metadata by provider and event code', async () => {
      const metadata = await mockEvents.getEventMetadata('aem-assets', 'aem.assets.asset.created');
      
      expect(metadata).toBeDefined();
      expect(metadata?.event_code).toBe('aem.assets.asset.created');
      expect(metadata?.label).toBe('Asset Created');
    });

    it('should return null for non-existent event metadata', async () => {
      const metadata = await mockEvents.getEventMetadata('non-existent', 'non-existent.event');
      expect(metadata).toBeNull();
    });
  });

  describe('Webhook Functionality', () => {
    it('should send event to webhook successfully', async () => {
      const registration = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      const event = { type: 'test.event', data: { test: 'data' } };
      const result = await mockEvents.sendEventToWebhook(registration.id, event);

      expect(result.status).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should throw error when sending to non-existent registration', async () => {
      const event = { type: 'test.event', data: { test: 'data' } };
      
      await expect(
        mockEvents.sendEventToWebhook('non-existent', event)
      ).rejects.toThrow('Registration non-existent not found');
    });

    it('should throw error when registration has no webhook URL', async () => {
      const registration = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
        // No webhook_url
      });

      const event = { type: 'test.event', data: { test: 'data' } };
      
      await expect(
        mockEvents.sendEventToWebhook(registration.id, event)
      ).rejects.toThrow('Registration ' + registration.id + ' has no webhook URL');
    });

    it('should track webhook delivery history', async () => {
      const registration = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      const event = { type: 'test.event', data: { test: 'data' } };
      await mockEvents.sendEventToWebhook(registration.id, event);

      const history = mockEvents.getWebhookHistory();
      expect(history).toHaveLength(1);
      expect(history[0].registrationId).toBe(registration.id);
      expect(history[0].event).toEqual(event);
    });

    it('should clear webhook history', async () => {
      const registration = await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      const event = { type: 'test.event', data: { test: 'data' } };
      await mockEvents.sendEventToWebhook(registration.id, event);

      expect(mockEvents.getWebhookHistory()).toHaveLength(1);
      
      mockEvents.clearWebhookHistory();
      expect(mockEvents.getWebhookHistory()).toHaveLength(0);
    });
  });

  describe('Journal Functionality', () => {
    it('should create journal observable', () => {
      const observable = mockEvents.getEventsObservableFromJournal('https://example.com/journal');
      
      expect(observable).toBeDefined();
      expect(observable.subscribe).toBeDefined();
      expect(typeof observable.subscribe).toBe('function');
    });

    it('should handle journal subscription', () => {
      const observable = mockEvents.getEventsObservableFromJournal('https://example.com/journal');
      
      const subscription = observable.subscribe({
        next: jest.fn(),
        error: jest.fn(),
        complete: jest.fn()
      });

      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toBeDefined();
      expect(typeof subscription.unsubscribe).toBe('function');
    });
  });

  describe('Reset and Clear', () => {
    it('should reset to initial state', async () => {
      // Create some custom data
      await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      // Send some webhook events
      const registration = await mockEvents.createRegistration({
        client_id: 'webhook-client',
        name: 'Webhook Registration',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      await mockEvents.sendEventToWebhook(registration.id, { test: 'event' });

      // Verify data exists
      const registrations = await mockEvents.getRegistrations();
      expect(registrations._embedded.registrations.length).toBeGreaterThan(1);
      expect(mockEvents.getWebhookHistory().length).toBeGreaterThan(0);

      // Reset
      mockEvents.reset();

      // Verify back to initial state
      const resetRegistrations = await mockEvents.getRegistrations();
      expect(resetRegistrations._embedded.registrations.length).toBe(1); // Default sample
      expect(mockEvents.getWebhookHistory().length).toBe(0);
    });

    it('should clear all data', async () => {
      // Create some custom data
      await mockEvents.createRegistration({
        client_id: 'test-client',
        name: 'Test Registration',
        events_of_interest: [],
        delivery_type: 'webhook'
      });

      // Verify data exists
      const registrations = await mockEvents.getRegistrations();
      expect(registrations._embedded.registrations.length).toBeGreaterThan(1);

      // Clear
      mockEvents.clear();

      // Verify all data is cleared
      const clearedRegistrations = await mockEvents.getRegistrations();
      expect(clearedRegistrations._embedded.registrations.length).toBe(0);
    });
  });
});
