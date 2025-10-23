/**
 * New Agency Registration Action
 * 
 * This action handles brand registration requests to an agency.
 * It acts as a secure intermediary between the frontend form and the agency's registration endpoint.
 * 
 * Benefits:
 * - Abstracts URL construction from the frontend
 * - Adds authentication layer (Adobe IMS)
 * - Enriches payload with IMS user/org information
 * - Derives agency endpoint from stored agency configuration
 * 
 * Protected by Adobe authentication - only authenticated users can submit registrations.
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../classes/AgencyManager";
import { ApplicationRuntimeInfo } from "../classes/ApplicationRuntimeInfo";
import axios from 'axios';

/**
 * Registration form data from the frontend
 */
interface RegistrationFormData {
    name: string;
    primaryContact: string;
    phoneNumber: string;
    imsOrgName?: string;
    imsOrgId?: string;
}


export async function main(params: any): Promise<any> {
    const logger = aioLogger("new-agency-registration", { level: params.LOG_LEVEL || "info" });

    try {
        logger.debug('new-agency-registration params', JSON.stringify(params, null, 2));

        // Extract form data from params
        const formData: RegistrationFormData = params.data || {};
        
        // Validate required fields
        const requiredParams: string[] = ['name', 'primaryContact', 'phoneNumber'];
        const errorMessage = checkMissingRequestInputs(formData, requiredParams, []);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        // Build the agency's registration endpoint URL
        const agencyRegistrationUrl = params.AGENCY_BASE_URL + '/api/v1/web/a2b-agency/new-brand-registration';
        
        // Get brand's runtime info from action params
        const brandRuntimeInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
        if (!brandRuntimeInfo) {
            logger.error('Failed to parse APPLICATION_RUNTIME_INFO from action params');
            return errorResponse(500, 'Missing or invalid APPLICATION_RUNTIME_INFO', logger);
        }
        
        // Build callback URL using the helper - agency will send events here
        const brandCallbackUrl = `${brandRuntimeInfo.buildEndpointUrl()}/api/v1/web/${brandRuntimeInfo.actionPackageName}/agency-event-handler`;

        // Construct payload to send to agency
        const payload = {
            data: {
                name: formData.name,
                primaryContact: formData.primaryContact,
                phoneNumber: formData.phoneNumber,
                endPointUrl: brandCallbackUrl,
                app_runtime_info: brandRuntimeInfo.serialize(),
                // Include IMS org information if provided
                imsOrgName: formData.imsOrgName,
                imsOrgId: formData.imsOrgId
            }
        };

        logger.info('Sending registration to agency', {
            agencyUrl: agencyRegistrationUrl,
            brandCallbackUrl: brandCallbackUrl,
            brandName: formData.name
        });

        // Get IMS org from headers (for x-gw-ims-org-id header)
        const imsOrg = params.__ow_headers?.['x-gw-ims-org-id'] || params.imsOrg;

        try {
            // Send registration request to agency
            const response = await axios.post(
                agencyRegistrationUrl,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-gw-ims-org-id': imsOrg
                    }
                }
            );

            logger.info('Registration submitted successfully', {
                status: response.status,
                brandName: formData.name
            });

            return {
                statusCode: 200,
                body: {
                    message: 'Registration submitted successfully to agency',
                    brandName: formData.name
                }
            };

        } catch (axiosError: any) {
            logger.error('Failed to submit registration to agency', {
                error: axiosError.message,
                status: axiosError.response?.status,
                data: axiosError.response?.data
            });

            const errorMsg = axiosError.response?.data?.body?.error 
                || axiosError.response?.data?.error 
                || axiosError.response?.data?.message
                || axiosError.message
                || 'Failed to submit registration to agency';

            return errorResponse(500, errorMsg, logger);
        }

    } catch (error) {
        logger.error('Error in new-agency-registration', error as any);
        return errorResponse(500, 'Internal server error', logger);
    }
}

