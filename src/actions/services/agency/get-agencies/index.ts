/**
 * Get all agencies
 * This action retrieves all agency registrations for the brand
 * Protected by Adobe authentication
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../../../classes/AgencyManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("get-agencies", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));

    // No required params for getting all agencies
    const requiredParams: string[] = [];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
    
    // Get all agencies
    const agencies = await agencyManager.getAllAgencies();
    logger.info(`Retrieved ${agencies.length} agencies`);

    // Convert to safe JSON (without secrets)
    const safeAgencies = agencies.map(agency => agency.toSafeJSON());

    return {
      statusCode: 200,
      body: {
        message: `Retrieved ${agencies.length} agencies successfully`,
        data: safeAgencies,
        count: agencies.length
      }
    };
  } catch (error) {
    logger.error('Error retrieving agencies', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error retrieving agencies',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

