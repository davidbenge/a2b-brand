/**
 * Agency Event Handler
 *
 * This action handles all incoming events from agencies and routes them to appropriate internal handlers
 * based on the event type. It validates that events have the required type and app_runtime_info.
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
const openwhisk = require("openwhisk");

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-event-handler", { level: params.LOG_LEVEL || "info" });

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

    logger.info(`Processing agency event: ${params.type}`);

    // Route events to appropriate internal handlers based on event type
    let routingResult;
    if (params.type.startsWith('com.adobe.a2b.assetsync')) {
      logger.info(`Routing assetsync event to agency-assetsync-internal-handler: ${params.type}`);
      routingResult = await routeToAssetSyncHandler(params, logger);
    } else {
      logger.warn(`Unhandled event type: ${params.type}`);
      return {
        statusCode: 200,
        body: {
          message: `Agency event processed - unhandled type`,
          eventType: params.type,
          note: 'Event type not configured for routing'
        }
      }
    }

    return {
      statusCode: 200,
      body: {
        message: `Agency event processed successfully`,
        eventType: params.type,
        routingResult: routingResult
      }
    }
  } catch (error) {
    logger.error('Error processing agency event', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing agency event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Route assetsync events to the agency-assetsync-internal-handler
 */
async function routeToAssetSyncHandler(params: any, logger: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhisk();
    
    // Prepare the parameters for the assetsync internal handler
    const assetsyncParams = {
      ...params, // Pass through all original parameters
      // Add any additional parameters specific to assetsync if needed
    };

    logger.debug('Invoking agency-assetsync-internal-handler with params:', JSON.stringify(assetsyncParams, null, 2));

    // Invoke the agency-assetsync-internal-handler action
    const result = await ow.actions.invoke({
      name: 'a2b-brand/agency-assetsync-internal-handler',
      params: assetsyncParams,
      blocking: true,
      result: true
    });

    logger.info('agency-assetsync-internal-handler invocation successful:', result);
    return {
      success: true,
      handler: 'agency-assetsync-internal-handler',
      result: result
    };

  } catch (error) {
    logger.error('Error invoking agency-assetsync-internal-handler:', error);
    return {
      success: false,
      handler: 'agency-assetsync-internal-handler',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * TODO: Add more routing functions for other agency event types
 * 
 * Example:
 * async function routeToRegistrationHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for registration events
 * }
 * 
 * async function routeToNotificationHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for notification events
 * }
 */