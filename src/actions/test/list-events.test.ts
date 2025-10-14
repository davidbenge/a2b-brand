/**
 * Tests for list-events action
 * 
 * Validates that the list-events action returns correct responses
 * matching the samples in docs/apis/list-events/
 */

import { 
    EVENT_REGISTRY, 
    getAllEventCodes, 
    getEventsByCategory, 
    getEventDefinition,
    getEventCategories,
    isValidEventCode,
    getEventCountByCategory,
    EventDefinition
} from '../../shared/event-registry';

// Import expected response samples
const listAllEventsResponse = require('../../../docs/apis/list-events/list-all-events.json');
const filterAssetSyncResponse = require('../../../docs/apis/list-events/filter-by-category-asset-sync.json');
const filterWorkfrontResponse = require('../../../docs/apis/list-events/filter-by-category-workfront.json');
const filterBrandRegResponse = require('../../../docs/apis/list-events/filter-by-category-brand-registration.json');
const getSpecificEventResponse = require('../../../docs/apis/list-events/get-specific-event.json');
const errorEventNotFoundResponse = require('../../../docs/apis/list-events/error-event-not-found.json');
const errorInvalidCategoryResponse = require('../../../docs/apis/list-events/error-invalid-category.json');

describe('Event Registry', () => {
    describe('getAllEventCodes', () => {
        it('should return all 9 event codes', () => {
            const codes = getAllEventCodes();
            expect(codes).toHaveLength(9);
            expect(codes).toEqual([
                'com.adobe.a2b.registration.disabled',
                'com.adobe.a2b.registration.received',
                'com.adobe.a2b.registration.enabled',
                'com.adobe.a2b.assetsync.new',
                'com.adobe.a2b.assetsync.update',
                'com.adobe.a2b.assetsync.delete',
                'com.adobe.a2b.workfront.task.created',
                'com.adobe.a2b.workfront.task.updated',
                'com.adobe.a2b.workfront.task.completed'
            ]);
        });

        it('should match the codes in list-all-events.json sample', () => {
            const codes = getAllEventCodes();
            const sampleEventCodes = Object.keys(listAllEventsResponse.body.data.events);
            expect(codes).toEqual(sampleEventCodes);
        });
    });

    describe('getEventCategories', () => {
        it('should return all 3 categories', () => {
            const categories = getEventCategories();
            expect(categories).toHaveLength(3);
            expect(categories).toContain('brand-registration');
            expect(categories).toContain('asset-sync');
            expect(categories).toContain('workfront');
        });

        it('should match categories in list-all-events.json sample', () => {
            const categories = getEventCategories();
            const sampleCategories = listAllEventsResponse.body.data.summary.categories;
            expect(categories).toEqual(sampleCategories);
        });
    });

    describe('getEventCountByCategory', () => {
        it('should return correct count for each category', () => {
            const counts = getEventCountByCategory();
            expect(counts['brand-registration']).toBe(3);
            expect(counts['asset-sync']).toBe(3);
            expect(counts['workfront']).toBe(3);
        });

        it('should match counts in list-all-events.json sample', () => {
            const counts = getEventCountByCategory();
            const sampleCounts = listAllEventsResponse.body.data.summary.eventCounts;
            expect(counts).toEqual(sampleCounts);
        });
    });

    describe('getEventsByCategory', () => {
        it('should return 3 asset-sync events', () => {
            const events = getEventsByCategory('asset-sync');
            expect(events).toHaveLength(3);
            expect(events.every(e => e.category === 'asset-sync')).toBe(true);
        });

        it('should match asset-sync sample response', () => {
            const events = getEventsByCategory('asset-sync');
            const sampleEvents = filterAssetSyncResponse.body.data.events;
            expect(events).toEqual(sampleEvents);
        });

        it('should return 3 workfront events', () => {
            const events = getEventsByCategory('workfront');
            expect(events).toHaveLength(3);
            expect(events.every(e => e.category === 'workfront')).toBe(true);
        });

        it('should match workfront sample response', () => {
            const events = getEventsByCategory('workfront');
            const sampleEvents = filterWorkfrontResponse.body.data.events;
            expect(events).toEqual(sampleEvents);
        });

        it('should return 3 brand-registration events', () => {
            const events = getEventsByCategory('brand-registration');
            expect(events).toHaveLength(3);
            expect(events.every(e => e.category === 'brand-registration')).toBe(true);
        });

        it('should match brand-registration sample response', () => {
            const events = getEventsByCategory('brand-registration');
            const sampleEvents = filterBrandRegResponse.body.data.events;
            expect(events).toEqual(sampleEvents);
        });
    });

    describe('getEventDefinition', () => {
        it('should return correct definition for asset sync new event', () => {
            const event = getEventDefinition('com.adobe.a2b.assetsync.new');
            expect(event).toBeDefined();
            expect(event?.code).toBe('com.adobe.a2b.assetsync.new');
            expect(event?.category).toBe('asset-sync');
            expect(event?.name).toBe('Asset Sync New');
            expect(event?.eventClass).toBe('AssetSyncNewEvent');
        });

        it('should match specific event sample response', () => {
            const event = getEventDefinition('com.adobe.a2b.assetsync.new');
            const sampleEvent = getSpecificEventResponse.body.data.event;
            expect(event).toEqual(sampleEvent);
        });

        it('should return undefined for invalid event code', () => {
            const event = getEventDefinition('com.adobe.a2b.invalid.event');
            expect(event).toBeUndefined();
        });

        it('should have required fields for all events', () => {
            const allCodes = getAllEventCodes();
            allCodes.forEach(code => {
                const event = getEventDefinition(code);
                expect(event).toBeDefined();
                expect(event?.requiredFields).toBeDefined();
                expect(Array.isArray(event?.requiredFields)).toBe(true);
                expect(event!.requiredFields.length).toBeGreaterThan(0);
            });
        });
    });

    describe('isValidEventCode', () => {
        it('should return true for valid event codes', () => {
            expect(isValidEventCode('com.adobe.a2b.assetsync.new')).toBe(true);
            expect(isValidEventCode('com.adobe.a2b.registration.received')).toBe(true);
            expect(isValidEventCode('com.adobe.a2b.workfront.task.created')).toBe(true);
        });

        it('should return false for invalid event codes', () => {
            expect(isValidEventCode('com.adobe.a2b.invalid.event')).toBe(false);
            expect(isValidEventCode('invalid')).toBe(false);
            expect(isValidEventCode('')).toBe(false);
        });

        it('should match error response available codes', () => {
            const availableCodes = errorEventNotFoundResponse.body.details.availableEventCodes;
            availableCodes.forEach((code: string) => {
                expect(isValidEventCode(code)).toBe(true);
            });
        });
    });

    describe('Event Registry Structure', () => {
        it('should have all required fields for each event', () => {
            Object.values(EVENT_REGISTRY).forEach((event: EventDefinition) => {
                expect(event.code).toBeDefined();
                expect(typeof event.code).toBe('string');
                
                expect(event.category).toBeDefined();
                expect(['brand-registration', 'asset-sync', 'workfront']).toContain(event.category);
                
                expect(event.name).toBeDefined();
                expect(typeof event.name).toBe('string');
                
                expect(event.description).toBeDefined();
                expect(typeof event.description).toBe('string');
                
                expect(event.eventClass).toBeDefined();
                expect(typeof event.eventClass).toBe('string');
                
                expect(event.version).toBeDefined();
                expect(typeof event.version).toBe('string');
                
                expect(event.requiredFields).toBeDefined();
                expect(Array.isArray(event.requiredFields)).toBe(true);
            });
        });

        it('should match structure in sample responses', () => {
            const sampleEvent = listAllEventsResponse.body.data.events['com.adobe.a2b.assetsync.new'];
            const registryEvent = EVENT_REGISTRY['com.adobe.a2b.assetsync.new'];
            
            expect(registryEvent).toMatchObject(sampleEvent);
        });
    });
});

describe('List Events Action Response Structure', () => {
    describe('Success Response - List All', () => {
        it('should have correct structure', () => {
            const response = listAllEventsResponse;
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(response.body.data.summary).toBeDefined();
            expect(response.body.data.events).toBeDefined();
            expect(response.body.data.timestamp).toBeDefined();
        });

        it('should have correct summary data', () => {
            const summary = listAllEventsResponse.body.data.summary;
            expect(summary.totalEvents).toBe(9);
            expect(summary.categories).toHaveLength(3);
            expect(summary.eventCounts).toBeDefined();
            expect(summary.eventCounts['brand-registration']).toBe(3);
            expect(summary.eventCounts['asset-sync']).toBe(3);
            expect(summary.eventCounts['workfront']).toBe(3);
        });

        it('should contain all 9 events', () => {
            const events = listAllEventsResponse.body.data.events;
            expect(Object.keys(events)).toHaveLength(9);
        });
    });

    describe('Success Response - Filter by Category', () => {
        it('should have correct structure for asset-sync', () => {
            const response = filterAssetSyncResponse;
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.category).toBe('asset-sync');
            expect(response.body.data.count).toBe(3);
            expect(response.body.data.events).toHaveLength(3);
        });

        it('should have correct structure for workfront', () => {
            const response = filterWorkfrontResponse;
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.category).toBe('workfront');
            expect(response.body.data.count).toBe(3);
            expect(response.body.data.events).toHaveLength(3);
        });

        it('should have correct structure for brand-registration', () => {
            const response = filterBrandRegResponse;
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.category).toBe('brand-registration');
            expect(response.body.data.count).toBe(3);
            expect(response.body.data.events).toHaveLength(3);
        });
    });

    describe('Success Response - Get Specific Event', () => {
        it('should have correct structure', () => {
            const response = getSpecificEventResponse;
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.event).toBeDefined();
            expect(response.body.data.timestamp).toBeDefined();
        });

        it('should contain complete event definition', () => {
            const event = getSpecificEventResponse.body.data.event;
            expect(event.code).toBe('com.adobe.a2b.assetsync.new');
            expect(event.category).toBe('asset-sync');
            expect(event.name).toBeDefined();
            expect(event.description).toBeDefined();
            expect(event.eventClass).toBeDefined();
            expect(event.version).toBeDefined();
            expect(event.requiredFields).toBeDefined();
            expect(event.optionalFields).toBeDefined();
        });
    });

    describe('Error Response - Event Not Found', () => {
        it('should have correct structure', () => {
            const response = errorEventNotFoundResponse;
            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
            expect(typeof response.body.error).toBe('string');
            expect(response.body.details).toBeDefined();
        });

        it('should include available event codes in details', () => {
            const details = errorEventNotFoundResponse.body.details;
            expect(details.availableEventCodes).toBeDefined();
            expect(Array.isArray(details.availableEventCodes)).toBe(true);
            expect(details.availableEventCodes).toHaveLength(9);
        });
    });

    describe('Error Response - Invalid Category', () => {
        it('should have correct structure', () => {
            const response = errorInvalidCategoryResponse;
            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBeDefined();
            expect(typeof response.body.error).toBe('string');
            expect(response.body.details).toBeDefined();
        });

        it('should include valid categories in details', () => {
            const details = errorInvalidCategoryResponse.body.details;
            expect(details.validCategories).toBeDefined();
            expect(Array.isArray(details.validCategories)).toBe(true);
            expect(details.validCategories).toHaveLength(3);
            expect(details.validCategories).toContain('brand-registration');
            expect(details.validCategories).toContain('asset-sync');
            expect(details.validCategories).toContain('workfront');
        });
    });
});

describe('Event Data Validation', () => {
    describe('Asset Sync Events', () => {
        it('should have correct required fields for new event', () => {
            const event = getEventDefinition('com.adobe.a2b.assetsync.new');
            expect(event?.requiredFields).toEqual([
                'asset_id',
                'asset_path',
                'metadata',
                'brandId',
                'asset_presigned_url'
            ]);
        });

        it('should have correct required fields for update event', () => {
            const event = getEventDefinition('com.adobe.a2b.assetsync.update');
            expect(event?.requiredFields).toEqual([
                'asset_id',
                'brandId'
            ]);
        });

        it('should have correct required fields for delete event', () => {
            const event = getEventDefinition('com.adobe.a2b.assetsync.delete');
            expect(event?.requiredFields).toEqual([
                'asset_id',
                'brandId'
            ]);
        });
    });

    describe('Brand Registration Events', () => {
        it('should have brandId and enabled in required fields', () => {
            const disabled = getEventDefinition('com.adobe.a2b.registration.disabled');
            const enabled = getEventDefinition('com.adobe.a2b.registration.enabled');
            
            expect(disabled?.requiredFields).toContain('brandId');
            expect(disabled?.requiredFields).toContain('enabled');
            expect(enabled?.requiredFields).toContain('brandId');
            expect(enabled?.requiredFields).toContain('enabled');
        });

        it('should have all required fields for received event', () => {
            const event = getEventDefinition('com.adobe.a2b.registration.received');
            expect(event?.requiredFields).toEqual([
                'brandId',
                'name',
                'endPointUrl',
                'enabled'
            ]);
        });
    });

    describe('Workfront Events', () => {
        it('should all have taskId as required field', () => {
            const created = getEventDefinition('com.adobe.a2b.workfront.task.created');
            const updated = getEventDefinition('com.adobe.a2b.workfront.task.updated');
            const completed = getEventDefinition('com.adobe.a2b.workfront.task.completed');
            
            expect(created?.requiredFields).toContain('taskId');
            expect(updated?.requiredFields).toContain('taskId');
            expect(completed?.requiredFields).toContain('taskId');
        });

        it('should have appropriate optional fields', () => {
            const created = getEventDefinition('com.adobe.a2b.workfront.task.created');
            expect(created?.optionalFields).toBeDefined();
            expect(created?.optionalFields).toContain('projectId');
        });
    });
});

