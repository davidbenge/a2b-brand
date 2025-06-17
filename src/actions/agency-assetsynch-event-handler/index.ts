/**
 * assetsynch-event-handler
 *
 * we use this to handle the asset events that are sent to the action and then we will
 * determine if the asset needs to be processed.  If it does we will then call the asset-synch-event-handler and others
 * 
 */

import { AssetSynchEventHandler } from '../classes/event_handlers/AemAssetSynchHandler';
import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  let config = {
    logLevel: params.LOG_LEVEL || "info"
  };

  // handle IO webhook challenge
  if(params.challenge){
    const response = {
      statusCode: 200,
      body: {challenge: params.challenge}
    }
    return response
  }
  
  try {
    //log the params
    const logger = aioLogger("assetsynch-event-handler", { level: params.LOG_LEVEL || "info" });

    //const config = { env: 'prod' }; // Simulated injected config
    const aemSynchHandler = new AssetSynchEventHandler(config);

    // we will stack more inline when we have many things that need evaluation
    await aemSynchHandler.handleEvent(params);

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