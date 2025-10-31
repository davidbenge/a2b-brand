/**
 * List Workfront Groups Action
 * 
 * Lists all groups from a Workfront instance
 * Used by the UI to populate the group selection dropdown
 * 
 * Authentication: Uses Adobe IMS S2S credentials which work for Workfront API
 * (S2S token is cached for 21 hours to reduce IMS calls)
 * 
 * Input params:
 * - workfrontServerUrl: Base URL of Workfront instance
 * - S2S_CLIENT_ID: S2S client ID
 * - S2S_CLIENT_SECRET: S2S client secret
 * - S2S_SCOPES: S2S scopes (JSON array)
 * - ORG_ID: Organization ID
 * - LOG_LEVEL: Logging level (optional)
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { WorkfrontClient } from '../WorkfrontClient';

interface ActionParams {
    workfrontServerUrl: string;
    S2S_CLIENT_ID: string;
    S2S_CLIENT_SECRET: string;
    S2S_SCOPES: string;
    ORG_ID: string;
    LOG_LEVEL?: string;
}

/**
 * Main action handler
 */
export async function main(params: ActionParams): Promise<any> {
    const logger = aioLogger('list-workfront-groups', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('Listing Workfront groups', { 
            workfrontServerUrl: params.workfrontServerUrl 
        });

        // Validate required parameters
        const missing: string[] = [];
        if (!params.workfrontServerUrl) missing.push('workfrontServerUrl');
        if (!params.S2S_CLIENT_ID) missing.push('S2S_CLIENT_ID');
        if (!params.S2S_CLIENT_SECRET) missing.push('S2S_CLIENT_SECRET');
        if (!params.S2S_SCOPES) missing.push('S2S_SCOPES');
        if (!params.ORG_ID) missing.push('ORG_ID');

        if (missing.length > 0) {
            return {
                statusCode: 400,
                body: {
                    error: 'Missing required parameters',
                    missing
                }
            };
        }

        // Prepare S2S credentials
        const scopesCleaned = JSON.parse(params.S2S_SCOPES);
        const scopes = scopesCleaned.join(',');
        
        const s2sCredentials = {
            clientId: params.S2S_CLIENT_ID,
            clientSecret: params.S2S_CLIENT_SECRET,
            scopes,
            orgId: params.ORG_ID
        };

        // Create Workfront client with S2S credentials and list groups
        const wfClient = new WorkfrontClient(
            params.workfrontServerUrl,
            s2sCredentials,
            params.LOG_LEVEL || 'info'
        );

        const groups = await wfClient.listGroups();

        logger.info(`Successfully retrieved ${groups.length} groups`);

        return {
            statusCode: 200,
            body: {
                success: true,
                groups,
                count: groups.length
            }
        };

    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Error listing Workfront groups', errorObj);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            statusCode: 500,
            body: {
                error: 'Failed to list Workfront groups',
                message: errorMessage
            }
        };
    }
}

