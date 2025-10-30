/**
 * Get a specific agency by ID
 * This action retrieves a single agency registration
 * Protected by Adobe authentication
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../../../classes/AgencyManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("get-agency", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));

    const requiredParams: string[] = ['agencyId'];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
    
    // Get the agency
    const agency = await agencyManager.getAgency(params.agencyId);

    if (!agency) {
      return errorResponse(404, `Agency ${params.agencyId} not found`, logger);
    }

    logger.info(`Retrieved agency ${params.agencyId}`);

    return {
      statusCode: 200,
      body: {
        message: `Agency ${params.agencyId} retrieved successfully`,
        data: agency.toSafeJSON()
      }
    };
  } catch (error) {
    logger.error('Error retrieving agency', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error retrieving agency',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

