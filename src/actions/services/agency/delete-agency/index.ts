/**
 * Delete an agency
 * This action removes an agency registration
 * Protected by Adobe authentication
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../../../classes/AgencyManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("delete-agency", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));

    const requiredParams: string[] = ['agencyId'];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
    
    // Check if agency exists
    const existingAgency = await agencyManager.getAgency(params.agencyId);
    
    if (!existingAgency) {
      return errorResponse(404, `Agency ${params.agencyId} not found`, logger);
    }

    // Clean up Workfront event subscriptions if configured
    if (existingAgency.workfrontServerUrl && existingAgency.workfrontEventSubscriptions && existingAgency.workfrontEventSubscriptions.length > 0) {
      logger.info(`Cleaning up ${existingAgency.workfrontEventSubscriptions.length} Workfront event subscriptions before deletion`);
      
      try {
        // Call manage-workfront-subscriptions to unregister
        const ow = require("openwhisk")();
        await ow.actions.invoke({
          name: 'a2b-brand/manage-workfront-subscriptions',
          params: {
            agencyId: existingAgency.agencyId,
            action: 'unregister',
            S2S_CLIENT_ID: params.S2S_CLIENT_ID,
            S2S_CLIENT_SECRET: params.S2S_CLIENT_SECRET,
            S2S_SCOPES: params.S2S_SCOPES,
            ORG_ID: params.ORG_ID,
            APPLICATION_RUNTIME_INFO: params.APPLICATION_RUNTIME_INFO,
            LOG_LEVEL: params.LOG_LEVEL
          },
          blocking: true,
          result: true
        });
        
        logger.info('Successfully cleaned up Workfront subscriptions before deletion');
      } catch (wfError: unknown) {
        const err = wfError as Error;
        logger.error('Failed to cleanup Workfront subscriptions before deletion', { 
          error: err.message, 
          stack: err.stack 
        });
        // Don't fail the deletion if Workfront cleanup fails - log and continue
      }
    }

    // Delete the agency
    await agencyManager.deleteAgency(params.agencyId);
    logger.info(`Deleted agency ${params.agencyId}`);

    return {
      statusCode: 200,
      body: {
        message: `Agency ${params.agencyId} deleted successfully`,
        data: {
          agencyId: params.agencyId,
          deleted: true
        }
      }
    };
  } catch (error) {
    logger.error('Error deleting agency', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error deleting agency',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

