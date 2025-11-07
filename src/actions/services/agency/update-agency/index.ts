/**
 * Update an existing agency
 * This action updates agency registration details
 * Protected by Adobe authentication
 */
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../../../classes/AgencyManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("update-agency", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));

    const requiredParams: string[] = ['agencyId'];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
    
    // Get the existing agency
    const existingAgency = await agencyManager.getAgency(params.agencyId);
    
    if (!existingAgency) {
      return errorResponse(404, `Agency ${params.agencyId} not found`, logger);
    }

    // Validate Workfront fields if provided
    if (params.workfrontServerUrl) {
      if (!params.workfrontCompanyId) {
        return errorResponse(400, 'workfrontCompanyId is required when workfrontServerUrl is specified', logger);
      }
      if (!params.workfrontGroupId) {
        return errorResponse(400, 'workfrontGroupId is required when workfrontServerUrl is specified', logger);
      }
    }

    // Update the agency with new data
    // Note: agencyId cannot be changed
    const updatedAgency = await agencyManager.updateAgency(params.agencyId, {
      name: params.name,
      endPointUrl: params.endPointUrl,
      enabled: params.enabled,
      logo: params.logo,
      workfrontServerUrl: params.workfrontServerUrl,
      workfrontCompanyId: params.workfrontCompanyId,
      workfrontCompanyName: params.workfrontCompanyName,
      workfrontGroupId: params.workfrontGroupId,
      workfrontGroupName: params.workfrontGroupName
      // secret and brandId are not updateable through this API
    });

    if (!updatedAgency) {
      return errorResponse(500, 'Failed to update agency', logger);
    }

    logger.info(`Updated agency ${params.agencyId}`);

    return {
      statusCode: 200,
      body: {
        message: `Agency ${params.agencyId} updated successfully`,
        data: updatedAgency.toSafeJSON()
      }
    };
  } catch (error) {
    logger.error('Error updating agency', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error updating agency',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

