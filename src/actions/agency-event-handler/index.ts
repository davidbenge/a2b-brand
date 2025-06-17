/**
 * Agency event handler
 *
 */
import { EventManager } from "../classes/EventManager";
import { AssetSynchNewEvent } from "../classes/io_events/AssetSynchNewEvent";
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = []
    const requiredHeaders = [] // TODO: Add security required headers
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // check the event
    const testEvent = {
      "asset_id": "123",
       "asset_path":"/content/dam/test/test.jpg",
       "metadate":{"a":"b","lot":"123","brandId":"123"}
    };

    const event = new AssetSynchNewEvent(testEvent);

    try {
      logger.debug('New event from agency');
      const eventManager = new EventManager(params.LOG_LEVEL, params);
      await eventManager.publishEvent(event);
      logger.debug('New event from agency published');
      
    } catch (error) {
      logger.error('Error sending event', error);
    }
    
    return {
      statusCode: 200,
      body: {
        message: `Agency event processed successfully`
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing agency event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}