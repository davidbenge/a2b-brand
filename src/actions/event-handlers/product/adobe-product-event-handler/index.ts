/**
 * Adobe Product Event Handler
 *
 * This action handles events from Adobe products (AEM, Creative Cloud, Workfront, etc.)
 * and routes them to the appropriate internal event handlers based on event type.
 * 
 * Supports:
 * - AEM and other Adobe products (using "type" field)
 * - Workfront events (using "objCode" and "eventType" fields)
 */
import { getProductEventDefinition } from "../../../classes/ProductEventRegistry";
import { getWorkfrontEventByObjCodeAndType } from "../../../classes/WorkfrontEventRegistry";
import { errorResponse, checkMissingRequestInputs } from "../../../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { sanitizeEventForLogging } from "../../../utils/eventSanitizer";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const logger = aioLogger("adobe-product-event-handler", { level: params.LOG_LEVEL || "info" });

  // Log sanitized incoming event
  logger.info(`adobe-product-event-handler: Received event`, sanitizeEventForLogging(params));

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

    // Detect event type: Workfront vs other Adobe products
    let eventDefinition: any;
    let isWorkfrontEvent = false;
    let eventCode = '';

    if (params.objCode && params.eventType) {
      // This is a Workfront event
      isWorkfrontEvent = true;
      eventCode = `workfront.${params.objCode.toLowerCase()}.${params.eventType.toLowerCase()}`;
      
      logger.info(`Processing Workfront event: ${eventCode}`, {
        objCode: params.objCode,
        eventType: params.eventType,
        objectId: params.ID
      });

      // Get event definition from Workfront registry
      eventDefinition = getWorkfrontEventByObjCodeAndType(params.objCode, params.eventType);
      
      if (!eventDefinition) {
        logger.warn(`Workfront event not registered: ${eventCode}`, {
          objCode: params.objCode,
          eventType: params.eventType
        });
        
        // Return 200 to acknowledge receipt even if not registered
        return {
          statusCode: 200,
          body: {
            message: `Workfront event acknowledged but not registered: ${eventCode}`,
            objCode: params.objCode,
            eventType: params.eventType
          }
        };
      }
    } else if (params.type) {
      // This is a standard Adobe product event (AEM, etc.)
      eventCode = params.type;
      
      logger.info(`Processing Adobe product event: ${params.type}`);

      // Get event definition from Product registry
      eventDefinition = getProductEventDefinition(params.type);
      
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
    } else {
      logger.warn("No event type or objCode provided, cannot route event");
      return {
        statusCode: 400,
        body: {
          message: 'No event type or objCode provided',
          error: 'Event type or objCode is required for routing'
        }
      };
    }

    // For Workfront events, log and acknowledge (internal processing can be added later)
    if (isWorkfrontEvent) {
      logger.info('Workfront event received and acknowledged', {
        eventCode,
        objCode: params.objCode,
        eventType: params.eventType,
        objectId: params.ID,
        objectName: params.name
      });

      // TODO: Add internal processing for Workfront events
      // For now, just acknowledge receipt
      return {
        statusCode: 200,
        body: {
          message: 'Workfront event processed successfully',
          eventCode,
          objCode: params.objCode,
          eventType: params.eventType,
          objectId: params.ID
        }
      };
    }

    // Initialize OpenWhisk client for routing (non-Workfront events)
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