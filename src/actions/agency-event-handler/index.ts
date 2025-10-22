/**
 * Agency Event Handler
 *
 * This action handles all incoming events from agencies and routes them to appropriate internal handlers
 * based on the event type using the AppEventRegistry for dynamic routing.
 */
import { getEventDefinition } from "../../shared/classes/AppEventRegistry";
import { checkMissingRequestInputs } from "../utils/common";
import { getApplicationRuntimeInfo } from "../utils/applicationRuntimeInfo";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../classes/AgencyManager";
import { EventCategory } from "../../shared/constants";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const logger = aioLogger("agency-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    
    const requiredParams = ['APPLICATION_RUNTIME_INFO', 'type', 'data'];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
      logger.error(`400: ${errorMessage}`);
      return {
        statusCode: 400,
        body: errorMessage
      };
    }

    // Validate that app_runtime_info is present in the data
    if (!params.data || !params.data.app_runtime_info) {
      logger.error('Missing app_runtime_info in event data');
      return {
        statusCode: 400,
        body: 'Missing app_runtime_info in event data'
      };
    }

    logger.info(`Processing agency event: ${params.type}`);

    // Get event definition from registry
    const eventDefinition = getEventDefinition(params.type);
    if (!eventDefinition) {
      logger.warn(`Event type not found in registry: ${params.type}`);
      return {
        statusCode: 200,
        body: {
          message: 'Agency event processed - unhandled type',
          eventType: params.type,
          note: 'Event type not configured for routing'
        }
      };
    }

    // Validate secret header for all events EXCEPT registration events
    // Registration events don't require secret validation because the brand 
    // doesn't have the secret yet during registration
    const isRegistrationEvent = eventDefinition.category === EventCategory.REGISTRATION;
    
    let agency;
    if (!isRegistrationEvent) {
      const headers = params.__ow_headers || {};
      const brandSecret = headers['x-a2b-brand-secret'];
      
      if (!brandSecret) {
        logger.error('Missing X-A2B-Brand-Secret header');
        return {
          statusCode: 401,
          body: 'Missing X-A2B-Brand-Secret header'
        };
      }

      // Validate the secret against stored agency configuration using the secret index
      const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
      agency = await agencyManager.getAgencyBySecret(brandSecret);
      
      if (!agency) {
        logger.error('Invalid secret - no matching agency found');
        return {
          statusCode: 401,
          body: 'Invalid secret - authentication failed'
        };
      }

      if (!agency.isEnabled()) {
        logger.error(`Agency ${agency.agencyId} is not enabled`);
        return {
          statusCode: 403,
          body: 'Agency is not enabled'
        };
      }

      logger.info(`Secret validated for agency ${agency.agencyId} (${agency.name})`);
    } else {
      logger.info(`Skipping secret validation for registration event: ${params.type}`);
    }
/*
    // Validate that the incoming event's workspace matches our action's workspace
    const actionRuntimeInfo = getApplicationRuntimeInfo(params);
    if (!actionRuntimeInfo) {
      logger.error('Failed to parse APPLICATION_RUNTIME_INFO from action parameters!');
      return errorResponse(500, 'Failed to parse APPLICATION_RUNTIME_INFO from action parameters.', logger)
    }

    const eventWorkspace = params.data.app_runtime_info.workspace;
    const actionWorkspace = actionRuntimeInfo.workspace;

    if (eventWorkspace !== actionWorkspace) {
      logger.error(`Workspace mismatch: event workspace '${eventWorkspace}' does not match action workspace '${actionWorkspace}'`);
      return errorResponse(400, `Workspace mismatch: event workspace '${eventWorkspace}' does not match action workspace '${actionWorkspace}'`, logger)
    }

    logger.info(`Processing agency event: ${params.type} in workspace: ${actionWorkspace}`);
*/

    // Initialize OpenWhisk client for routing
    const ow = openwhiskClient || require("openwhisk")();

    logger.info(`Routing event to handler: ${eventDefinition.handlerActionName}`);
    logger.debug('Routing parameters', {
      eventType: params.type,
      handler: eventDefinition.handlerActionName,
      category: eventDefinition.category,
      blocking: eventDefinition.callBlocking
    });

    // Prepare the parameters for the handler
    // Include the validated agency information for non-registration events
    const handlerParams = !isRegistrationEvent && agency ? {
      ...params,
      validatedAgency: agency.toSafeJSON()
    } : params;

    // Invoke the internal handler action
    // We wrap params in 'routerParams' so internal handlers can distinguish
    // between direct invocation and router invocation, allowing them to work
    // both standalone and as part of orchestration
    let result: any;

    if (eventDefinition.callBlocking) {
      // Blocking call - wait for the result
      result = await ow.actions.invoke({
        name: eventDefinition.handlerActionName,
        params: {
          routerParams: handlerParams,
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
        name: eventDefinition.handlerActionName,
        params: {
          routerParams: handlerParams,
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
        message: 'Agency event processed successfully',
        eventType: params.type,
        category: eventDefinition.category,
        handler: eventDefinition.handlerActionName,
        result: result
      }
    };

  } catch (error: unknown) {
    logger.error('Error processing agency event', error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing agency event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}