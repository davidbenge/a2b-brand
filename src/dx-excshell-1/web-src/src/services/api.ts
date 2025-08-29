import axios, { AxiosResponse } from 'axios';
import { ENABLE_DEMO_MODE, simulateApiDelay, logDemoMode } from '../utils/demoMode';

/**
 * API configuration and endpoints
 */
const API_CONFIG = {
    ENDPOINTS: {
        COMPANY_REGISTRATION: '/api/v1/web/a2b-agency/new-brand-registration'
    }
};

/**
 * Company registration form interface
 */
interface CompanyRegistrationForm {
    companyName: string;
    primaryContact: string;
    phoneNumber: string;
}

/**
 * API response interface
 */
interface ApiResponse<T> {
    statusCode: number;
    body: {
        message: string;
        data?: T;
        error?: string;
    };
}

/**
 * API service class for handling serverless function calls
 */
export class ApiService {
    private static instance: ApiService;
    private baseUrl: string;
    private imsToken: string | null = null;
    private imsOrgId: string | null = null;

    private constructor() {
        this.baseUrl = '';
    }

    public static getInstance(): ApiService {
        if (!ApiService.instance) {
            ApiService.instance = new ApiService();
        }
        return ApiService.instance;
    }

    /**
     * Initialize the API service with base URL and IMS token
     * @param baseUrl - The base URL from ViewPropsBase
     * @param imsToken - The IMS token from ViewPropsBase
     */
    public initialize(baseUrl: string, imsToken: string, imsOrgId: string): void {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service initialized in demo mode', { baseUrl, imsOrgId });
            this.baseUrl = 'https://demo.adobeioruntime.net';
            this.imsToken = 'demo-token';
            this.imsOrgId = 'DEMO_ORG@AdobeOrg';
        } else {
            this.baseUrl = baseUrl;
            this.imsToken = imsToken;
            this.imsOrgId = imsOrgId;
        }
    }

    /**
     * Clear the IMS token and base URL
     */
    public clear(): void {
        this.imsToken = null;
        this.baseUrl = '';
        this.imsOrgId = null;
    }

    /**
     * Register a new company
     * @param formData - Company registration form data
     * @returns Promise<ApiResponse<any>>
     */
    public async registerCompany(formData: CompanyRegistrationForm): Promise<ApiResponse<any>> {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: registerCompany (demo mode)', formData);
            
            await simulateApiDelay(1500);
            
            return {
                statusCode: 200,
                body: {
                    message: 'Company registration successful (Demo Mode)',
                    data: {
                        id: Date.now().toString(),
                        ...formData,
                        status: 'pending',
                        createdAt: new Date().toISOString()
                    }
                }
            };
        }
        
        return this.callApi(API_CONFIG.ENDPOINTS.COMPANY_REGISTRATION, 'POST', formData);
    }

    /**
     * Generic method to call serverless functions using axios
     */
    private async callApi<T>(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
        body?: any
    ): Promise<ApiResponse<T>> {
        if (!this.baseUrl) {
            return {
                statusCode: 500,
                body: {
                    message: 'API not initialized',
                    error: 'Base URL not set'
                }
            };
        }

        if (!this.imsToken) {
            return {
                statusCode: 401,
                body: {
                    message: 'Authentication required',
                    error: 'IMS token not set'
                }
            };
        }

        try {
            const url = `${this.baseUrl}${endpoint}`;
            const config = {
                method,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'x-gw-ims-org-id': `${this.imsOrgId}`,
                    'Authorization': `Bearer ${this.imsToken}`
                },
                data: body
            };

            console.debug(`API calling ${url} with method ${method}`);
            const response: AxiosResponse = await axios(config);
            console.debug('API call response', response.data);
            console.debug('API call response json', JSON.stringify(response.data, null, 2));
            
            // Transform the response to match our interface
            return {
                statusCode: response.status,
                body: {
                    message: response.data.message || '',
                    data: response.data.data,
                    error: response.data.error
                }
            };
        } catch (error) {
            console.error('API call error:', error);
            if (axios.isAxiosError(error)) {
                return {
                    statusCode: error.response?.status || 500,
                    body: {
                        message: 'API call failed',
                        error: error.response?.data?.error || error.message
                    }
                };
            }
            return {
                statusCode: 500,
                body: {
                    message: 'API call failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

// Export a singleton instance
export const apiService = ApiService.getInstance(); 