/**
 * Configure Workfront Action
 * 
 * Saves Workfront configuration (server URL, company, group) to an Agency
 * 
 * Input params:
 * - agencyId: Agency ID to configure
 * - workfrontServerUrl: Base URL of Workfront instance
 * - workfrontCompanyId: Selected company ID
 * - workfrontCompanyName: Company name for display
 * - workfrontGroupId: Selected group ID
 * - workfrontGroupName: Group name for display
 * - APPLICATION_RUNTIME_INFO: Runtime info (JSON string)
 * - LOG_LEVEL: Logging level (optional)
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { AgencyManager } from '../../../classes/AgencyManager';
import { ApplicationRuntimeInfo } from '../../../classes/ApplicationRuntimeInfo';

interface ActionParams {
    agencyId: string;
    workfrontServerUrl: string;
    workfrontCompanyId: string;
    workfrontCompanyName: string;
    workfrontGroupId: string;
    workfrontGroupName: string;
    APPLICATION_RUNTIME_INFO: string;
    LOG_LEVEL?: string;
}

/**
 * Main action handler
 */
export async function main(params: ActionParams): Promise<any> {
    const logger = aioLogger('configure-workfront', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('Configuring Workfront for agency', { agencyId: params.agencyId });

        // Validate required parameters
        const missing: string[] = [];
        if (!params.agencyId) missing.push('agencyId');
        if (!params.workfrontServerUrl) missing.push('workfrontServerUrl');
        if (!params.workfrontCompanyId) missing.push('workfrontCompanyId');
        if (!params.workfrontCompanyName) missing.push('workfrontCompanyName');
        if (!params.workfrontGroupId) missing.push('workfrontGroupId');
        if (!params.workfrontGroupName) missing.push('workfrontGroupName');
        if (!params.APPLICATION_RUNTIME_INFO) missing.push('APPLICATION_RUNTIME_INFO');

        if (missing.length > 0) {
            return {
                statusCode: 400,
                body: {
                    error: 'Missing required parameters',
                    missing
                }
            };
        }

        // Parse runtime info
        const runtimeInfo = new ApplicationRuntimeInfo(
            JSON.parse(params.APPLICATION_RUNTIME_INFO)
        );

        // Initialize Agency Manager
        const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');

        // Get existing agency
        const agency = await agencyManager.getAgency(params.agencyId);
        if (!agency) {
            return {
                statusCode: 404,
                body: {
                    error: 'Agency not found',
                    agencyId: params.agencyId
                }
            };
        }

        // Update agency with Workfront configuration
        // Update the agency object properties
        (agency as any).workfrontServerUrl = params.workfrontServerUrl;
        (agency as any).workfrontCompanyId = params.workfrontCompanyId;
        (agency as any).workfrontCompanyName = params.workfrontCompanyName;
        (agency as any).workfrontGroupId = params.workfrontGroupId;
        (agency as any).workfrontGroupName = params.workfrontGroupName;
        (agency as any).workfrontEventSubscriptions = []; // Will be populated when subscriptions are created
        
        // Save the updated agency
        const updatedAgency = await agencyManager.saveAgency(agency);

        logger.info('Successfully configured Workfront for agency', { 
            agencyId: params.agencyId,
            workfrontCompanyId: params.workfrontCompanyId,
            workfrontGroupId: params.workfrontGroupId
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                agency: updatedAgency.toSafeJSON()
            }
        };

    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Error configuring Workfront', errorObj);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            statusCode: 500,
            body: {
                error: 'Failed to configure Workfront',
                message: errorMessage
            }
        };
    }
}

