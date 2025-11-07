import axios, { AxiosResponse } from 'axios';
import { ENABLE_DEMO_MODE, simulateApiDelay, logDemoMode } from '../utils/demoMode';

/**
 * API configuration and endpoints
 * Note: COMPANY_REGISTRATION endpoint is deprecated and not used.
 * Agency registration is handled directly in AgencyRegistrationView component
 * using agencyBaseUrl from environment configuration.
 */
const API_CONFIG = {
    ENDPOINTS: {
        // DEPRECATED: Not used - AgencyRegistrationView handles registration directly
        // COMPANY_REGISTRATION: '/api/v1/web/a2b-agency/new-brand-registration',
        GET_AGENCIES: '/api/v1/web/a2b-brand/get-agencies',
        GET_AGENCY: '/api/v1/web/a2b-brand/get-agency',
        UPDATE_AGENCY: '/api/v1/web/a2b-brand/update-agency',
        DELETE_AGENCY: '/api/v1/web/a2b-brand/delete-agency'
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
 * Agency interface (matches IAgency from types)
 */
export interface Agency {
    agencyId: string;
    agencyName?: string;
    brandId: string;
    name: string;
    endPointUrl: string;
    agencyEndPointUrl?: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}

/**
 * Agency update data interface
 */
interface AgencyUpdateData {
    name?: string;
    endPointUrl?: string;
    enabled?: boolean;
    logo?: string;
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
     * @deprecated This method is not used. Agency registration is handled directly
     * in AgencyRegistrationView component using agencyBaseUrl from environment.
     * @param formData - Company registration form data
     * @returns Promise<ApiResponse<any>>
     */
    public async registerCompany(formData: CompanyRegistrationForm): Promise<ApiResponse<any>> {
        console.warn('ApiService.registerCompany is deprecated and should not be used.');
        
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: registerCompany (demo mode - DEPRECATED)', formData);
            
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
        
        // This would fail because COMPANY_REGISTRATION endpoint is removed
        return {
            statusCode: 500,
            body: {
                message: 'This method is deprecated',
                error: 'Use AgencyRegistrationView component for brand registration'
            }
        };
    }

    /**
     * Get all agencies
     * @returns Promise<ApiResponse<Agency[]>>
     */
    public async getAgencies(): Promise<ApiResponse<Agency[]>> {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: getAgencies (demo mode)');
            await simulateApiDelay(500);
            
            return {
                statusCode: 200,
                body: {
                    message: 'Retrieved agencies successfully (Demo Mode)',
                    data: []
                }
            };
        }
        
        return this.callApi<Agency[]>(API_CONFIG.ENDPOINTS.GET_AGENCIES, 'GET');
    }

    /**
     * Get a specific agency by ID
     * @param agencyId - The agency ID to retrieve
     * @returns Promise<ApiResponse<Agency>>
     */
    public async getAgency(agencyId: string): Promise<ApiResponse<Agency>> {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: getAgency (demo mode)', { agencyId });
            await simulateApiDelay(300);
            
            return {
                statusCode: 404,
                body: {
                    message: 'Agency not found (Demo Mode)',
                    error: 'Demo mode - agency not found'
                }
            };
        }
        
        return this.callApi<Agency>(`${API_CONFIG.ENDPOINTS.GET_AGENCY}?agencyId=${agencyId}`, 'GET');
    }

    /**
     * Update an agency
     * @param agencyId - The agency ID to update
     * @param updateData - The data to update
     * @returns Promise<ApiResponse<Agency>>
     */
    public async updateAgency(agencyId: string, updateData: AgencyUpdateData): Promise<ApiResponse<Agency>> {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: updateAgency (demo mode)', { agencyId, updateData });
            await simulateApiDelay(800);
            
            return {
                statusCode: 200,
                body: {
                    message: 'Agency updated successfully (Demo Mode)',
                    data: {
                        agencyId,
                        brandId: 'demo-brand-id',
                        name: updateData.name || 'Demo Agency',
                        endPointUrl: updateData.endPointUrl || 'https://demo.com',
                        enabled: updateData.enabled !== undefined ? updateData.enabled : true,
                        logo: updateData.logo,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        enabledAt: new Date().toISOString()
                    } as Agency
                }
            };
        }
        
        return this.callApi<Agency>(API_CONFIG.ENDPOINTS.UPDATE_AGENCY, 'POST', {
            agencyId,
            ...updateData
        });
    }

    /**
     * Delete an agency
     * @param agencyId - The agency ID to delete
     * @returns Promise<ApiResponse<{ agencyId: string; deleted: boolean }>>
     */
    public async deleteAgency(agencyId: string): Promise<ApiResponse<{ agencyId: string; deleted: boolean }>> {
        if (ENABLE_DEMO_MODE) {
            logDemoMode('API Service: deleteAgency (demo mode)', { agencyId });
            await simulateApiDelay(600);
            
            return {
                statusCode: 200,
                body: {
                    message: 'Agency deleted successfully (Demo Mode)',
                    data: {
                        agencyId,
                        deleted: true
                    }
                }
            };
        }
        
        return this.callApi<{ agencyId: string; deleted: boolean }>(
            API_CONFIG.ENDPOINTS.DELETE_AGENCY,
            'POST',
            { agencyId }
        );
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