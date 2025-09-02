/**
 * Agency Asset Sync Internal Handler
 *
 * This internal action handles com.adobe.a2b.assetsync events from agencies.
 * It processes asset synchronization events and manages the asset sync workflow.
 */
import { EventManager } from "../classes/EventManager";
import { AssetSyncNewEvent } from "../classes/io_events/AssetSyncNewEvent";
import { AssetSyncUpdateEvent } from "../classes/io_events/AssetSyncUpdateEvent";
import { AssetSyncDeleteEvent } from "../classes/io_events/AssetSyncDeleteEvent";
import { errorResponse, checkMissingRequestInputs, mergeRouterParams } from "../utils/common";
import { fetchAssetFromPreassigned } from "../utils/aemOpenAPIUtils";


import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-assetsync-internal-handler", { level: params.LOG_LEVEL || "info" });
  params = mergeRouterParams(params);
  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = ['APPLICATION_RUNTIME_INFO', 'type', 'data']
    const requiredHeaders = [] // TODO: Add security required headers
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, "errorMessage", logger)
    }

    // Validate that app_runtime_info is present in the data
    if (!params.data || !params.data.app_runtime_info) {
      logger.error('Missing app_runtime_info in event data');
      return errorResponse(400, 'Missing app_runtime_info in event data', logger)
    }

    logger.info(`Processing assetsync event: ${params.type}`);

    logger.info(`Processing preassigned URL: ${params.data.asset_presigned_url}`);

    if (params.data.asset_presigned_url) {
      //const res = fetchAssetFromPreassigned(params.data.asset_presigned_url,params,logger)
        const res = fetchAssetFromPreassigned(params,logger)
        if(!res){
          logger.error("RES object returned is Empty");
        }else{
          
        }
    } else {
      logger.error(`No pre-assigned URL`);
    }

    return {
      statusCode: 200,
      body: {
        message: `Assetsync event processed successfully`,
        eventType: params.type,
        assetId: params.data.asset_id || 'unknown',
        assetURL: params.data.asset_presigned_url || 'unknown'
      }
    }
  } catch (error) {
    logger.error('Error processing assetsync event', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing assetsync event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
} 