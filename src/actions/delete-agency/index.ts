/**
 * Delete an agency
 * This action removes an agency registration
 * Protected by Adobe authentication
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../classes/AgencyManager";

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
    logger.error('Error deleting agency', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error deleting agency',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

