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
import { checkMissingRequestInputs } from '../../utils/common';
import { AgencyManager } from "../../classes/AgencyManager";
import { sanitizeEventForLogging } from "../../utils/eventSanitizer";
import { getEventDefinition } from "../../classes/AppEventRegistry";

export async function main(params: any, openwhiskClient?: any): Promise<any> {
  const ACTION_NAME = 'brand:agency-event-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

  // Log sanitized incoming event
  logger.info(`${ACTION_NAME}: Received event`, sanitizeEventForLogging(params));

  // handle IO webhook challenge
  if(params.challenge){
    const response = {
      statusCode: 200,
      body: {challenge: params.challenge}
    }
    return response
  }
  
  // Check for required params
  const requiredParams: string[] = ['type', 'data']
  const requiredHeaders: string[] = []
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  if (errorMessage) {
    // return and log client errors
    logger.error(`${ACTION_NAME}: ${errorMessage}`);
    return {
      statusCode: 400,
      body: errorMessage
    };
  }

  // Check for required data structure
  if (!params.data || !params.data.app_runtime_info) {
    logger.error(`${ACTION_NAME}: Missing required data.app_runtime_info in event`);
    return {
      statusCode: 400,
      body: 'Missing required data.app_runtime_info in event'
    };
  }

  // Extract agency ID from app_runtime_info
  const agencyId = params.data.app_runtime_info?.consoleId;
  if (!agencyId) {
    logger.error(`${ACTION_NAME}: Missing consoleId in app_runtime_info`);
    return {
      statusCode: 400,
      body: 'Missing consoleId in app_runtime_info'
    };
  }

  // Validate secret header for all events EXCEPT registration events
  // Registration events (a2b.registration.*) don't require secret validation
  // because the brand doesn't have the secret yet during registration
  const isRegistrationEvent = params.type?.startsWith('com.adobe.a2b.registration.');
  
  let agency;
  if (!isRegistrationEvent) {
    const headers = params.__ow_headers || {};
    const brandSecret = headers['x-a2b-brand-secret'];
    
    if (!brandSecret) {
      logger.error(`${ACTION_NAME}: Missing X-A2B-Brand-Secret header for event type ${params.type}`);
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
        logger.error(`${ACTION_NAME}: Agency not found: ${agencyId}`);
        return {
          statusCode: 401,
          body: 'Agency not found or not registered'
        };
      }

      if (!agency.validateSecret(brandSecret)) {
        logger.error(`${ACTION_NAME}: Invalid brand secret for agency: ${agencyId}`);
        return {
          statusCode: 401,
          body: 'Invalid brand secret'
        };
      }

      logger.info(`${ACTION_NAME}: Secret validated successfully for agency: ${agencyId}`);
    } catch (error: unknown) {
      logger.error(`${ACTION_NAME}: Error validating agency secret`, error as any);
      return {
        statusCode: 500,
        body: 'Error validating agency credentials'
      };
    }
  } else {
    logger.info(`${ACTION_NAME}: Skipping secret validation for registration event: ${params.type}`);
  }

  try {
    logger.info(`${ACTION_NAME}: Agency Event Handler called with type: ${params.type} from agency: ${agencyId}`);

    // Initialize OpenWhisk client for routing

    // No params needed - we're already running in OpenWhisk context
    const openwhisk = require('openwhisk');
    const ow = openwhisk();

    // Route events based on type
    let handlerName: string;
    let eventDefinition = getEventDefinition(params.type);

    if (!eventDefinition) {
      logger.warn(`${ACTION_NAME}: Event definition not found for type: ${params.type}`);
      return {
        statusCode: 400,
        body: {
          message: `Event definition not found for type: ${params.type}`,
          error: 'Event type not supported'
        }
      }
    }

    if (eventDefinition.handlerActionName) {
      handlerName = eventDefinition.handlerActionName;
    } else {
      logger.warn(`${ACTION_NAME}: Event definition not found for type: ${params.type}`);
      return {
        statusCode: 400,
        body: {
          message: `Event definition not implemented for type: ${params.type}`,
          error: 'Event type not implemented'
        }
      }
    }
    

    logger.info(`${ACTION_NAME}: Routing ${params.type} to ${handlerName}`);

    // Invoke the handler with routerParams
    const result = await ow.actions.invoke({
      name: handlerName,
      params: {
        routerParams: params
      },
      blocking: true,
      result: true
    });

    logger.info(`${ACTION_NAME}: Handler invocation successful`);

    return {
      statusCode: 200,
      body: {
        message: `Event ${params.type} processed successfully`,
        result: result
      }
    };

  } catch (error: unknown) {
    logger.error(`${ACTION_NAME}: Error processing event`, error as any);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing agency event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
