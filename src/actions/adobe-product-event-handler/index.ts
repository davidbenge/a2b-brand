/**
 * Adobe Product Event Handler
 *
 * This action handles events from Adobe products (AEM, Creative Cloud, etc.)
 * and routes them to the appropriate internal event handlers based on event type.
 */
import { EventManager } from "../classes/EventManager";
import { errorResponse, checkMissingRequestInputs, stripOpenWhiskParams } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
const openwhisk = require("openwhisk");

export async function main(params: any): Promise<any> {
  const logger = aioLogger("adobe-product-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = ['APPLICATION_RUNTIME_INFO']
    const requiredHeaders = [] // TODO: Add security required headers
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    // handle IO webhook challenge
    if(params.challenge){
      const response = {
        statusCode: 200,
        body: {challenge: params.challenge}
      }
      return response
    }

    // Process the Adobe product event
    logger.info("Processing Adobe product event", params);

    if(!params.type) {
      logger.warn("No event type provided, cannot route event");
      return {
        statusCode: 400,
        body: {
          message: 'No event type provided',
          error: 'Event type is required for routing'
        }
      }
    }

    logger.info(`Event type: ${params.type}`);
    
    // Route events to appropriate internal handlers based on event type
    let routingResult;
    switch(params.type) {
      case 'aem.assets.asset.created':
      case 'aem.assets.asset.updated':
      case 'aem.assets.asset.deleted':
      case 'aem.assets.asset.metadata_updated':
      logger.info(`Routing AEM asset event to TODO//need to handle this: ${params.type}`);
      //routingResult = await routeToAssetSyncHandler(params, logger);
      break;
      
      // TODO: Add more Adobe product event types as needed
      // case 'creativecloud.file.created':
      // case 'creativecloud.file.updated':
      //   logger.info(`Routing Creative Cloud event to creative-cloud-handler: ${params.type}`);
      //   routingResult = await routeToCreativeCloudHandler(params, logger);
      //   break;
      
      // case 'documentcloud.document.created':
      // case 'documentcloud.document.updated':
      //   logger.info(`Routing Document Cloud event to document-cloud-handler: ${params.type}`);
      //   routingResult = await routeToDocumentCloudHandler(params, logger);
      //   break;
      
      default:
        logger.warn(`Unhandled event type: ${params.type}`);
        return {
          statusCode: 200,
          body: {
            message: `Adobe product event processed - unhandled type`,
            eventType: params.type,
            note: 'Event type not configured for routing'
          }
        }
    }

    return {
      statusCode: 200,
      body: {
        message: `Adobe product event processed successfully`,
        eventType: params.type,
        routingResult: routingResult
      }
    }
  } catch (error) {
    logger.error('Error processing Adobe product event', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing Adobe product event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Route AEM asset events to the agency-assetsync-event-handler
 */
async function routeToAssetSyncHandler(params: any, logger: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhisk();
    
    // Prepare the parameters for the asset sync handler
    const assetSyncParams = stripOpenWhiskParams(params);

    logger.debug('Invoking agency-assetsync-event-handler with params:', JSON.stringify(assetSyncParams, null, 2));

    // Invoke the agency-assetsync-event-handler action
    const result = await ow.actions.invoke({
      name: 'a2b-brand/agency-assetsync-event-handler',
      params: assetSyncParams,
      blocking: true,
      result: true
    });

    logger.info('agency-assetsync-event-handler invocation successful:', result);
    return {
      success: true,
      handler: 'agency-assetsync-event-handler',
      result: result
    };

  } catch (error) {
    logger.error('Error invoking agency-assetsync-event-handler:', error);
    return {
      success: false,
      handler: 'agency-assetsync-event-handler',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * TODO: Add more routing functions for other Adobe product event types
 * 
 * Example:
 * async function routeToCreativeCloudHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for Creative Cloud events
 * }
 * 
 * async function routeToDocumentCloudHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for Document Cloud events
 * }
 */ 