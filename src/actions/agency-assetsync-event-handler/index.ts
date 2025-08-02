/**
 * assetsynch-event-handler
 *
 * we use this to handle the asset events that are sent to the action and then we will
 * determine if the asset needs to be processed.  If it does we will then call the asset-synch-event-handler and others
 * 
 */

import * as aioLogger from "@adobe/aio-lib-core-logging";
import { EventManager } from '../classes/EventManager';
import { checkMissingRequestInputs } from "../utils/common";
import { errorResponse } from "../utils/common";

export async function main(params: any): Promise<any> {
  // config the needed items 
  const ACTION_NAME = 'brand:agency-assetsync-event-handler';
  const logger = aioLogger(ACTION_NAME, { level: params.logLevel || "info" });
  
  // handle IO webhook challenge
  if(params.challenge){
    const response = {
      statusCode: 200,
      body: {challenge: params.challenge}
    }
    return response
  }

  // CHECK for missing params  
  logger.debug('agency-assetsync-event-handler params',JSON.stringify(params, null, 2));
  
  const requiredParams = ['APPLICATION_RUNTIME_INFO']
  const requiredHeaders = [] // TODO: Add security required headers
  const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
  if (errorMessage) {
    // return and log client errors
    return errorResponse(400, errorMessage, logger)
  }

  // set up the s2s authentication credentials and application runtime info
  let eventManager: EventManager;
  try {
    const currentS2sAuthenticationCredentials = EventManager.getS2sAuthenticationCredentials(params);
    const applicationRuntimeInfo = EventManager.getApplicationRuntimeInfo(params);
    logger.debug('IoEventHandler:constructor: currentS2sAuthenticationCredentials', currentS2sAuthenticationCredentials);
    logger.debug('IoEventHandler:constructor: applicationRuntimeInfo', applicationRuntimeInfo);
    eventManager = new EventManager(params.logLevel, currentS2sAuthenticationCredentials, applicationRuntimeInfo);
  } catch (error) {
    logger.error('agency-assetsync-event-handler', error);
    return errorResponse(500, 'Error Handling Event', logger)
  }

  try {

     // todo:// look to see if we need to handle the event 
     if(params.type === 'aem.assets.asset.deleted'){
      logger.info("Asset deleted event",params);

      // do delete stuff here
    }else if(params.type === 'aem.assets.asset.metadata_updated'){
      logger.info("Asset metadata updated event",params);

    }
  
    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing IO event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}