/**
 * Agency event handler
 *
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-event-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));
    const requiredParams = []
    const requiredHeaders = [] // TODO: Add security required headers
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }


    /*
    try {
      logger.debug('new-brand-registration starting cloud event construction');
      const ioCustomEventManager = new IoCustomEventManager(params.AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID,params.LOG_LEVEL, params);
      await ioCustomEventManager.publishEvent(new NewBrandRegistrationEvent(savedBrand));
      
    } catch (error) {
      logger.error('Error sending event', error);
    }
    */
    
    return {
      statusCode: 200,
      body: {
        message: `Agency event processed successfully`
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error processing agency event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}