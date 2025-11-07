/**
 * Workfront API Client
 * 
 * Handles all interactions with Workfront API including:
 * - Authentication (using Adobe IMS S2S credentials - works with Workfront since Adobe acquisition)
 * - Listing Companies and Groups
 * - Managing Event Subscriptions
 * 
 * Authentication: Uses Adobe IMS S2S token which is accepted by Workfront API.
 * Token is cached in state store for 21 hours (valid for 22 hours).
 * 
 * Workfront API Reference: https://experienceleague.adobe.com/en/docs/workfront/using/adobe-workfront-api/api-general-information/api-basics
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import aioLogger from '@adobe/aio-lib-core-logging';
import { getS2STokenWithCache } from '../../utils/tokenCache';

interface IS2SAuthenticationCredentials {
    clientId: string;
    clientSecret: string;
    scopes: string;
    orgId: string;
}

/**
 * Workfront Company structure
 */
export interface IWorkfrontCompany {
    ID: string;
    name: string;
    description?: string;
}

/**
 * Workfront Group structure
 */
export interface IWorkfrontGroup {
    ID: string;
    name: string;
    description?: string;
}

/**
 * Workfront Event Subscription structure
 */
export interface IWorkfrontEventSubscription {
    ID: string;
    objCode: string;
    eventType: string;
    url: string;
    authToken?: string;
}

/**
 * Workfront Event Subscription Create Request
 */
export interface IWorkfrontEventSubscriptionCreate {
    objCode: string;
    eventType: string;
    url: string;
    authToken?: string;
}

/**
 * Workfront Client for API interactions
 */
export class WorkfrontClient {
    private logger: any;
    private workfrontBaseUrl: string;
    private s2sCredentials: IS2SAuthenticationCredentials;
    private axiosClient: AxiosInstance;
    private cachedToken: string | null = null;

    constructor(
        workfrontBaseUrl: string,
        s2sCredentials: IS2SAuthenticationCredentials,
        logLevel: string = 'info'
    ) {
        this.logger = aioLogger('WorkfrontClient', { level: logLevel });
        this.workfrontBaseUrl = workfrontBaseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.s2sCredentials = s2sCredentials;

        // Create axios instance with base configuration
        this.axiosClient = axios.create({
            baseURL: this.workfrontBaseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        this.logger.info('WorkfrontClient initialized', { workfrontBaseUrl });
    }

    /**
     * Get Adobe IMS S2S token (cached for 21 hours)
     * This token is accepted by Workfront API since Adobe acquisition
     */
    private async getAccessToken(): Promise<string> {
        if (this.cachedToken) {
            return this.cachedToken;
        }

        try {
            this.logger.debug('Getting S2S token for Workfront API access');
            
            // Get token with caching (21-hour TTL in state store)
            this.cachedToken = await getS2STokenWithCache(
                this.s2sCredentials,
                this.logger.level
            );
            
            this.logger.info('Successfully obtained S2S token for Workfront');
            return this.cachedToken;
        } catch (error) {
            this.logger.error('Failed to get S2S token for Workfront', error);
            throw new Error(`Workfront authentication failed: ${error}`);
        }
    }

    /**
     * Get authorization headers for Workfront API calls
     */
    private async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await this.getAccessToken();
        if (!token) {
            throw new Error('Failed to obtain access token for Workfront');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Handle Workfront API errors
     */
    private handleError(error: unknown, operation: string): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            const data = axiosError.response?.data;
            
            this.logger.error(`Workfront API error during ${operation}`, {
                status,
                data,
                message: axiosError.message
            });

            throw new Error(`Workfront ${operation} failed: ${axiosError.message}`);
        }

        this.logger.error(`Unexpected error during ${operation}`, error);
        throw new Error(`Workfront ${operation} failed: ${error}`);
    }

    /**
     * List all Companies in Workfront
     * @returns Array of companies
     */
    async listCompanies(): Promise<IWorkfrontCompany[]> {
        try {
            this.logger.debug('Listing Workfront companies');
            const headers = await this.getAuthHeaders();

            const response = await this.axiosClient.get('/attask/api/v15.0/company/search', {
                headers,
                params: {
                    // Note: 'description' field is not supported by Workfront API v15.0 for Company objects
                    fields: 'ID,name'
                }
            });

            const companies = response.data.data as IWorkfrontCompany[];
            this.logger.info(`Retrieved ${companies.length} companies from Workfront`);
            return companies;
        } catch (error) {
            this.handleError(error, 'list companies');
        }
    }

    /**
     * List all Groups in Workfront
     * @returns Array of groups
     */
    async listGroups(): Promise<IWorkfrontGroup[]> {
        try {
            this.logger.debug('Listing Workfront groups');
            const headers = await this.getAuthHeaders();

            const response = await this.axiosClient.get('/attask/api/v15.0/group/search', {
                headers,
                params: {
                    fields: 'ID,name,description'
                }
            });

            const groups = response.data.data as IWorkfrontGroup[];
            this.logger.info(`Retrieved ${groups.length} groups from Workfront`);
            return groups;
        } catch (error) {
            this.handleError(error, 'list groups');
        }
    }

    /**
     * Create a Workfront event subscription
     * @param subscription Event subscription details
     * @returns Created subscription
     */
    async createEventSubscription(
        subscription: IWorkfrontEventSubscriptionCreate
    ): Promise<IWorkfrontEventSubscription> {
        try {
            this.logger.debug('Creating Workfront event subscription', subscription);
            const headers = await this.getAuthHeaders();

            const response = await this.axiosClient.post(
                '/attask/api/v15.0/eventsub',
                subscription,
                { headers }
            );

            const created = response.data.data as IWorkfrontEventSubscription;
            this.logger.info('Created Workfront event subscription', { id: created.ID });
            return created;
        } catch (error) {
            this.handleError(error, 'create event subscription');
        }
    }

    /**
     * Delete a Workfront event subscription
     * @param subscriptionId Subscription ID to delete
     */
    async deleteEventSubscription(subscriptionId: string): Promise<void> {
        try {
            this.logger.debug('Deleting Workfront event subscription', { subscriptionId });
            const headers = await this.getAuthHeaders();

            await this.axiosClient.delete(
                `/attask/api/v15.0/eventsub/${subscriptionId}`,
                { headers }
            );

            this.logger.info('Deleted Workfront event subscription', { subscriptionId });
        } catch (error) {
            this.handleError(error, 'delete event subscription');
        }
    }

    /**
     * List all event subscriptions
     * @returns Array of event subscriptions
     */
    async listEventSubscriptions(): Promise<IWorkfrontEventSubscription[]> {
        try {
            this.logger.debug('Listing Workfront event subscriptions');
            const headers = await this.getAuthHeaders();

            const response = await this.axiosClient.get('/attask/api/v15.0/eventsub/search', {
                headers,
                params: {
                    fields: 'ID,objCode,eventType,url'
                }
            });

            const subscriptions = response.data.data as IWorkfrontEventSubscription[];
            this.logger.info(`Retrieved ${subscriptions.length} event subscriptions from Workfront`);
            return subscriptions;
        } catch (error) {
            this.handleError(error, 'list event subscriptions');
        }
    }

    /**
     * Test the Workfront connection
     * @returns true if connection is successful
     */
    async testConnection(): Promise<boolean> {
        try {
            this.logger.debug('Testing Workfront connection');
            const headers = await this.getAuthHeaders();

            // Simple API call to test connection
            await this.axiosClient.get('/attask/api/v15.0/user', {
                headers,
                params: {
                    fields: 'ID',
                    $$LIMIT: 1
                }
            });

            this.logger.info('Workfront connection test successful');
            return true;
        } catch (error) {
            this.logger.error('Workfront connection test failed', error);
            return false;
        }
    }
}

