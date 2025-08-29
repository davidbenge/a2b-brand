/**
 * Demo Mode Configuration and Utilities
 * 
 * This module manages demo mode functionality for the Brand to Agency application.
 * Demo mode allows the application to function with mock data and simulated API responses.
 */

// Feature flag for demo mode - can be controlled via environment variable
export const ENABLE_DEMO_MODE = (process.env.AIO_ENABLE_DEMO_MODE === 'true') 

/**
 * Interface for Company Registration mock data
 */
export interface CompanyRegistrationData {
    id: string;
    name: string;
    primaryContact: string;
    phoneNumber: string;
    endPointUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mock data for company registrations (only used in demo mode)
 */
export const mockCompanyRegistrations: CompanyRegistrationData[] = [
    {
        id: '1',
        name: 'Acme Creative Agency',
        primaryContact: 'John Smith',
        phoneNumber: '+1 (555) 123-4567',
        endPointUrl: 'https://demo.adobeio-static.net/api/v1/web/acme/agency-event-handler',
        status: 'approved',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-16T14:22:00Z')
    },
    {
        id: '2',
        name: 'Digital Marketing Solutions',
        primaryContact: 'Sarah Johnson',
        phoneNumber: '+1 (555) 987-6543',
        endPointUrl: 'https://demo.adobeio-static.net/api/v1/web/dms/agency-event-handler',
        status: 'pending',
        createdAt: new Date('2024-01-20T09:15:00Z'),
        updatedAt: new Date('2024-01-20T09:15:00Z')
    },
    {
        id: '3',
        name: 'Brand Experience Co',
        primaryContact: 'Michael Chen',
        phoneNumber: '+1 (555) 456-7890',
        endPointUrl: 'https://demo.adobeio-static.net/api/v1/web/bec/agency-event-handler',
        status: 'rejected',
        createdAt: new Date('2024-01-18T16:45:00Z'),
        updatedAt: new Date('2024-01-19T11:30:00Z')
    }
];

/**
 * Mock ViewProps for demo mode
 */
export const mockViewProps = {
    baseUrl: 'https://demo.adobeio-static.net',
    environment: 'demo',
    historyType: 'browser',
    imsEnvironment: 'demo',
    imsOrg: 'DEMO_ORG@AdobeOrg',
    imsOrgName: 'Demo Organization',
    imsProfile: {
        email: 'demo.user@example.com',
        name: 'Demo User',
        userId: 'demo-user-123'
    },
    imsToken: 'demo-token-12345',
    locale: 'en-US',
    preferredLanguages: ['en-US'],
    shellInfo: {
        version: '1.0.0'
    },
    tenant: 'demo-tenant',
    aioRuntimeNamespace: 'demo-namespace',
    aioAppName: 'a2b-brand-demo',
    agencyBaseUrl: 'https://demo-agency.adobeio-static.net/index.html'
};

/**
 * Simulates API delay for realistic demo experience
 */
export const simulateApiDelay = (ms: number = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generates a realistic mock response for API calls
 */
export const createMockApiResponse = <T>(data: T, delay: number = 1000) => {
    return {
        execute: async (): Promise<{
            statusCode: number;
            body: {
                message: string;
                data: T;
            };
        }> => {
            await simulateApiDelay(delay);
            return {
                statusCode: 200,
                body: {
                    message: 'Success (Demo Mode)',
                    data
                }
            };
        }
    };
};

/**
 * Utility to get safe ViewProps with fallbacks for demo mode
 */
export const getSafeViewProps = (viewProps?: any) => {
    if (ENABLE_DEMO_MODE && !viewProps) {
        return mockViewProps;
    }
    
    return {
        ...mockViewProps,
        ...viewProps,
        imsProfile: {
            ...mockViewProps.imsProfile,
            ...viewProps?.imsProfile
        }
    };
};

/**
 * Debug logging for demo mode
 */
export const logDemoMode = (message: string, data?: any) => {
    if (ENABLE_DEMO_MODE) {
        console.log(`[DEMO MODE] ${message}`, data || '');
    }
};
