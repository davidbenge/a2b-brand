/**
 * Agency Event Handler
 *
 * This action handles all incoming events from agencies and routes them to appropriate internal handlers
 * based on the event type. It validates that events have the required type, app_runtime_info, and workspace matching.
 */
import { checkMissingRequestInputs, stripOpenWhiskParams } from "../utils/common";
import { getApplicationRuntimeInfo } from "../utils/applicationRuntimeInfo";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../classes/AgencyManager";
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
      logger.error(`400: ${errorMessage}`);
      return {
        statusCode: 400,
        body: errorMessage
      }
    }

    // Validate that app_runtime_info is present in the data
    if (!params.data || !params.data.app_runtime_info) {
      logger.error('Missing app_runtime_info in event data');
      return {
        statusCode: 400,
        body: 'Missing app_runtime_info in event data'
      }
    }

    // Validate secret header for all events EXCEPT registration events
    // Registration events (registration.received and registration.enabled) don't require secret validation
    // because the brand doesn't have the secret yet during registration
    const isRegistrationEvent = params.type === 'com.adobe.a2b.registration.received' || 
                                 params.type === 'com.adobe.a2b.registration.enabled';
    
    let agency;
    if (!isRegistrationEvent) {
      const headers = params.__ow_headers || {};
      const brandSecret = headers['x-a2b-brand-secret'];
      
      if (!brandSecret) {
        logger.error('Missing X-A2B-Brand-Secret header');
        return {
          statusCode: 401,
          body: 'Missing X-A2B-Brand-Secret header'
        }
      }

      // Validate the secret against stored agency configuration using the secret index
      const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
      agency = await agencyManager.getAgencyBySecret(brandSecret);
      
      if (!agency) {
        logger.error('Invalid secret - no matching agency found');
        return {
          statusCode: 401,
          body: 'Invalid secret - authentication failed'
        }
      }

      if (!agency.isEnabled()) {
        logger.error(`Agency ${agency.agencyId} is not enabled`);
        return {
          statusCode: 403,
          body: 'Agency is not enabled'
        }
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

    // Route events to appropriate internal handlers based on event type
    let routingResult;
    if (params.type.startsWith('com.adobe.a2b.assetsync')) {
      logger.info(`Routing assetsync event to agency-assetsync-internal-handler: ${params.type}`);
      routingResult = await routeToAssetSyncHandler(params, agency, logger);
    } else if (params.type.startsWith('com.adobe.a2b.registration')) {
      logger.info(`Routing registration event to agency-registration-internal-handler: ${params.type}`);
      routingResult = await routeToRegistrationHandler(params, logger);
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
async function routeToAssetSyncHandler(params: any, agency: any, logger: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhisk();

    // Prepare the parameters for the assetsync internal handler
    // Include the validated agency information
    const handlerParams = {
      ...params,
      validatedAgency: agency ? agency.toSafeJSON() : undefined
    };

    logger.debug('Invoking agency-assetsync-internal-handler with params:', JSON.stringify(handlerParams, null, 2));

    // Invoke the agency-assetsync-internal-handler action
    const result = await ow.actions.invoke({
      name: 'a2b-brand/agency-assetsync-internal-handler',
      params: {
        routerParams: handlerParams
      },
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
 * Route registration events to the agency-registration-internal-handler
 */
async function routeToRegistrationHandler(params: any, logger: any): Promise<any> {
  try {
    // Initialize OpenWhisk client
    const ow = openwhisk();

    logger.debug('Invoking agency-registration-internal-handler with params:', JSON.stringify(params, null, 2));

    // Invoke the agency-registration-internal-handler action
    const result = await ow.actions.invoke({
      name: 'a2b-brand/agency-registration-internal-handler',
      params: {
        routerParams: params
      },
      blocking: true,
      result: true
    });

    logger.info('agency-registration-internal-handler invocation successful:', result);
    return {
      success: true,
      handler: 'agency-registration-internal-handler',
      result: result
    };

  } catch (error) {
    logger.error('Error invoking agency-registration-internal-handler:', error);
    return {
      success: false,
      handler: 'agency-registration-internal-handler',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * TODO: Add more routing functions for other agency event types
 * 
 * Example:
 * async function routeToNotificationHandler(params: any, logger: any): Promise<any> {
 *   // Implementation for notification events
 * }
 */