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
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-assetsync-internal-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = ['APPLICATION_RUNTIME_INFO', 'type', 'data']
    const requiredHeaders = [] // TODO: Add security required headers
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // Validate that app_runtime_info is present in the data
    if (!params.data || !params.data.app_runtime_info) {
      logger.error('Missing app_runtime_info in event data');
      return errorResponse(400, 'Missing app_runtime_info in event data', logger)
    }

    logger.info(`Processing assetsync event: ${params.type}`);

    // Process the event based on type
    let event;
    switch(params.type) {
      case 'com.adobe.a2b.assetsync.new':
        logger.info('Processing new asset sync event');
        event = new AssetSyncNewEvent(params.data);
        break;
      
      case 'com.adobe.a2b.assetsync.updated':
        logger.info('Processing asset sync update event');
        event = new AssetSyncUpdateEvent(params.data);
        break;
      
      case 'com.adobe.a2b.assetsync.deleted':
        logger.info('Processing asset sync delete event');
        event = new AssetSyncDeleteEvent(params.data);
        break;
      
      default:
        logger.error(`Unsupported assetsync event type: ${params.type}`);
        return errorResponse(400, `Unsupported assetsync event type: ${params.type}`, logger)
    }

    // Set up event manager and publish the event
    try {
      const currentS2sAuthenticationCredentials = EventManager.getS2sAuthenticationCredentials(params);
      const applicationRuntimeInfo = EventManager.getApplicationRuntimeInfo(params);
      const eventManager = new EventManager(params.LOG_LEVEL, currentS2sAuthenticationCredentials, applicationRuntimeInfo);
      
      await eventManager.publishEvent(event);
      logger.info(`Assetsync event published successfully: ${params.type}`);
      
    } catch (error) {
      logger.error('Error publishing assetsync event', error);
      return errorResponse(500, 'Error publishing assetsync event', logger)
    }
    
    return {
      statusCode: 200,
      body: {
        message: `Assetsync event processed successfully`,
        eventType: params.type,
        assetId: params.data.asset_id || 'unknown'
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