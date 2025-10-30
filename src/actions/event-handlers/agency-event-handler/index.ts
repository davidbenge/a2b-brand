/**
 * Agency Event Handler
 * 
 * This action receives CloudEvents from agencies and routes them to
 * the appropriate internal handler based on event type.
 * 
 * Required event structure:
 * - type: event type (e.g., "com.adobe.a2b.registration.enabled")
 * - data.app_runtime_info: runtime information identifying the agency
 * - __ow_headers['x-a2b-brand-secret']: brand secret for validation (except registration events)
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import { checkMissingRequestInputs } from "../../utils/common";
import { getApplicationRuntimeInfo } from "../../utils/applicationRuntimeInfo";
import { AgencyManager } from "../../classes/AgencyManager";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const ACTION_NAME = 'brand:agency-event-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  // Handle IO webhook challenge
  if (params.challenge) {
    return {
      statusCode: 200,
      body: { challenge: params.challenge }
    };
  }

  // Check for required params
  const requiredParams: string[] = ['type', 'data'];
  const requiredHeaders: string[] = [];
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
  if (errorMessage) {
    return {
      statusCode: 400,
      body: errorMessage
    };
  }

  // Extract agency ID from app_runtime_info
  const agencyId = params.data?.app_runtime_info?.consoleId;
  if (!agencyId) {
    logger.error('Missing agencyId in app_runtime_info');
    return {
      statusCode: 400,
      body: 'Missing agencyId in app_runtime_info'
    };
  }

  // Determine if this is a registration event (no secret validation needed)
  const isRegistrationEvent = params.type?.startsWith('com.adobe.a2b.registration.');
  
  let agency;
  if (!isRegistrationEvent) {
    // For non-registration events, validate the secret
    const headers = params.__ow_headers || {};
    const brandSecret = headers['x-a2b-brand-secret'];
    
    if (!brandSecret) {
      logger.error(`Missing X-A2B-Brand-Secret header for event type ${params.type}`);
      return {
        statusCode: 401,
        body: 'Missing X-A2B-Brand-Secret header'
      };
    }

    // Validate the secret against the stored agency
    try {
      const agencyManager = new AgencyManager(params.LOG_LEVEL || 'info');
      agency = await agencyManager.getAgency(agencyId);
      
      if (!agency) {
        logger.error(`Agency not found: ${agencyId}`);
        return {
          statusCode: 401,
          body: 'Agency not found or not registered'
        };
      }

      if (!agency.validateSecret(brandSecret)) {
        logger.error(`Invalid brand secret for agency: ${agencyId}`);
        return {
          statusCode: 401,
          body: 'Invalid brand secret'
        };
      }

      logger.info(`Secret validated successfully for agency: ${agencyId}`);
    } catch (error: unknown) {
      logger.error('Error validating agency secret', error as any);
      return {
        statusCode: 500,
        body: 'Error validating agency credentials'
      };
    }
  } else {
    logger.info(`Skipping secret validation for registration event: ${params.type}`);
  }

  try {
    logger.info(`Agency Event Handler called with type: ${params.type}`);

    // Initialize OpenWhisk client for routing
    const ow = openwhiskClient || require("openwhisk")();

    // Route based on event type (simple hardcoded routing)
    let handlerName: string;
    switch (params.type) {
      case 'com.adobe.a2b.registration.received':
      case 'com.adobe.a2b.registration.enabled':
      case 'com.adobe.a2b.registration.disabled':
        handlerName = 'agency-registration-internal-handler';
        break;
      
      case 'com.adobe.a2b.assetsync.new':
      case 'com.adobe.a2b.assetsync.updated':
      case 'com.adobe.a2b.assetsync.deleted':
        handlerName = 'agency-assetsync-internal-handler';
        break;
      
      default:
        logger.warn(`Unhandled event type: ${params.type}`);
        return {
          statusCode: 400,
          body: {
            message: `Unhandled event type: ${params.type}`,
            error: 'Event type not supported'
          }
        };
    }

    logger.info(`Routing event to handler: ${handlerName}`);

    // Prepare the parameters for the handler
    const handlerParams = !isRegistrationEvent && agency ? {
      ...params,
      validatedAgency: agency.toSafeJSON()
    } : params;

    // Invoke the handler (blocking)
    const result = await ow.actions.invoke({
      name: handlerName,
      params: {
        routerParams: handlerParams
      },
      blocking: true,
      result: true
    });
    
    logger.info('Handler invocation successful', {
      handler: handlerName,
      result: result
    });

    return {
      statusCode: 200,
      body: {
        message: `Event ${params.type} processed successfully`,
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
