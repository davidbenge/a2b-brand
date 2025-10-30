/**
 * Adobe Product Event Handler
 *
 * This action handles events from Adobe products (AEM, Creative Cloud, etc.)
 * and routes them to the appropriate internal event handlers based on event type.
 */
import { getProductEventDefinition } from "../../../../classes/ProductEventRegistry";
import { errorResponse, checkMissingRequestInputs } from "../../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const logger = aioLogger("adobe-product-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    const requiredParams: string[] = [];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      return errorResponse(400, errorMessage, logger);
    }

    // Handle IO webhook challenge
    if (params.challenge) {
      return {
        statusCode: 200,
        body: { challenge: params.challenge }
      };
    }

    // Validate event type
    if (!params.type) {
      logger.warn("No event type provided, cannot route event");
      return {
        statusCode: 400,
        body: {
          message: 'No event type provided',
          error: 'Event type is required for routing'
        }
      };
    }

    logger.info(`Processing Adobe product event: ${params.type}`);

    // Get event definition from registry
    const eventDefinition = getProductEventDefinition(params.type);
    if (!eventDefinition) {
      logger.warn(`Event type not found in registry: ${params.type}`);
      return {
        statusCode: 200,
        body: {
          message: 'Adobe product event processed - unhandled type',
          eventType: params.type,
          note: 'Event type not configured for routing'
        }
      };
    }

    // Initialize OpenWhisk client for routing
    const ow = openwhiskClient || require("openwhisk")();

    logger.info(`Routing event to handler: ${eventDefinition.handlerActionName}`);
    logger.debug('Routing parameters', {
      eventType: params.type,
      handler: eventDefinition.handlerActionName,
      params: JSON.stringify(params, null, 2)
    });

    // Invoke the internal handler action
    // We wrap params in 'routerParams' so internal handlers can distinguish
    // between direct invocation and router invocation, allowing them to work
    // both standalone and as part of orchestration
    let result: any;

    if (eventDefinition.callBlocking) {
      // Blocking call - wait for the result
      result = await ow.actions.invoke({
        name: `${eventDefinition.handlerActionName}`,
        params: {
          routerParams: params,
          eventDefinition: eventDefinition
        },
        blocking: true,
        result: true
      });
      
      logger.info('Handler invocation successful (blocking)', {
        handler: eventDefinition.handlerActionName,
        result: result
      });
    } else {
      // Non-blocking call - fire and forget
      ow.actions.invoke({
        name: `${eventDefinition.handlerActionName}`,
        params: {
          routerParams: params,
          eventDefinition: eventDefinition
        },
        blocking: false
      }).catch((err: any) => {
        // Log error but don't fail the main request
        logger.error('Error in non-blocking handler invocation', {
          handler: eventDefinition.handlerActionName,
          error: err
        });
      });
      
      result = 'Handler invoked asynchronously';
      logger.info('Handler invoked (non-blocking)', {
        handler: eventDefinition.handlerActionName
      });
    }

    return {
      statusCode: 200,
      body: {
        message: 'Adobe product event processed successfully',
        eventType: params.type,
        handler: eventDefinition.handlerActionName,
        result: result
      }
    };

  } catch (error: unknown) {
    logger.error('Error processing Adobe product event', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing Adobe product event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 