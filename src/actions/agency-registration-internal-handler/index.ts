/**
 * Agency Registration Internal Handler
 *
 * This action handles registration events from the agency (registration.received and registration.enabled).
 * It stores the brand's registration with the agency including the secret for future authenticated communication.
 */
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { AgencyManager } from "../classes/AgencyManager";
import { Agency } from "../classes/Agency";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("agency-registration-internal-handler", { level: params.LOG_LEVEL || "info" });

  try {
    logger.debug(JSON.stringify(params, null, 2));

    // Extract routerParams (which contains the actual event data)
    const eventParams = params.routerParams || params;
    
    const requiredParams = ['type', 'data'];
    const requiredHeaders: string[] = [];
    const errorMessage = checkMissingRequestInputs(eventParams, requiredParams, requiredHeaders);
    if (errorMessage) {
      return {
        statusCode: 400,
        body: errorMessage
      };
    }

    // Validate event data structure
    if (!eventParams.data || !eventParams.data.app_runtime_info) {
      logger.error('Missing app_runtime_info in event data');
      return {
        statusCode: 400,
        body: 'Missing app_runtime_info in event data'
      };
    }

    const eventType = eventParams.type;
    const eventData = eventParams.data;

    logger.info(`Processing registration event: ${eventType}`);

    // Handle registration.received event
    if (eventType === 'com.adobe.a2b.registration.received') {
      logger.info('Handling registration.received event');
      
      // Validate required fields for registration.received (NO secret at this stage)
      if (!eventData.brandId || !eventData.name || !eventData.endPointUrl) {
        logger.error('Missing required fields in registration.received event');
        return {
          statusCode: 400,
          body: 'Missing required fields: brandId, name, endPointUrl'
        };
      }

      // Extract agencyId from app_runtime_info (use consoleId as the agency identifier)
      const agencyId = eventData.app_runtime_info?.consoleId;
      
      if (!agencyId) {
        logger.error('Missing consoleId in app_runtime_info');
        return {
          statusCode: 400,
          body: 'Missing consoleId in app_runtime_info'
        };
      }
      
      // Create AgencyManager and store the agency registration
      const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
      
      try {
        // Check if agency already exists
        let agency = await agencyManager.getAgency(agencyId);
        
        if (agency) {
          logger.info(`Agency ${agencyId} already exists, updating with registration.received data`);
          // Update existing agency
          agency = await agencyManager.updateAgency(agencyId, {
            brandId: eventData.brandId,
            name: eventData.name,
            endPointUrl: eventData.endPointUrl,
            enabled: false,
            enabledAt: null
          });
        } else {
          logger.info(`Creating new agency registration for ${agencyId}`);
          // Create new agency record
          agency = new Agency({
            agencyId: agencyId,
            brandId: eventData.brandId,
            secret: '', // No secret yet
            name: eventData.name,
            endPointUrl: eventData.endPointUrl,
            enabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            enabledAt: null
          });
          
          await agencyManager.saveAgency(agency);
        }

        logger.info('Stored brand registration with agency (awaiting secret):', agency.toSafeJSON());

        return {
          statusCode: 200,
          body: {
            message: 'Registration received successfully - awaiting enablement with secret',
            brandId: eventData.brandId,
            name: eventData.name,
            agencyId: agencyId
          }
        };
      } catch (error) {
        logger.error('Error storing agency registration:', error);
        return {
          statusCode: 500,
          body: 'Error storing agency registration'
        };
      }
    }

    // Handle registration.enabled event
    if (eventType === 'com.adobe.a2b.registration.enabled') {
      logger.info('Handling registration.enabled event');
      
      // Validate required fields for registration.enabled (includes secret!)
      if (!eventData.brandId || !eventData.secret || eventData.enabled === undefined) {
        logger.error('Missing required fields in registration.enabled event');
        return {
          statusCode: 400,
          body: 'Missing required fields: brandId, secret, enabled'
        };
      }

      // Extract agencyId from app_runtime_info (use consoleId as the agency identifier)
      const agencyId = eventData.app_runtime_info?.consoleId;
      
      if (!agencyId) {
        logger.error('Missing consoleId in app_runtime_info');
        return {
          statusCode: 400,
          body: 'Missing consoleId in app_runtime_info'
        };
      }
      
      // Create AgencyManager and update the agency with secret
      const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
      
      try {
        let agency = await agencyManager.getAgency(agencyId);
        
        if (!agency) {
          // Agency doesn't exist - registration.enabled should come after registration.received
          // If name and endPointUrl are provided, create the agency, otherwise return error
          if (!eventData.name || !eventData.endPointUrl) {
            logger.error(`Agency ${agencyId} not found and registration.enabled event missing name/endPointUrl`);
            return {
              statusCode: 400,
              body: 'Cannot process registration.enabled without prior registration.received (missing name/endPointUrl)'
            };
          }
          
          logger.warn(`Agency ${agencyId} not found, creating new record with registration.enabled data`);
          // Create new agency record with all data from registration.enabled
          agency = new Agency({
            agencyId: agencyId,
            brandId: eventData.brandId,
            secret: eventData.secret,
            name: eventData.name,
            endPointUrl: eventData.endPointUrl,
            enabled: eventData.enabled,
            createdAt: new Date(),
            updatedAt: new Date(),
            enabledAt: eventData.enabledAt ? new Date(eventData.enabledAt) : new Date()
          });
          
          await agencyManager.saveAgency(agency);
        } else {
          logger.info(`Updating agency ${agencyId} with secret and enabled status`);
          // Update existing agency with secret and enabled status
          agency = await agencyManager.updateAgency(agencyId, {
            secret: eventData.secret,
            enabled: eventData.enabled,
            enabledAt: eventData.enabledAt ? new Date(eventData.enabledAt) : new Date(),
            name: eventData.name || agency.name,
            endPointUrl: eventData.endPointUrl || agency.endPointUrl
          });
        }

        logger.info('Updated agency registration with secret:', {
          agencyId: agencyId,
          brandId: eventData.brandId,
          enabled: eventData.enabled,
          secret: '<redacted>',
          hasSecret: agency?.hasSecret()
        });

        return {
          statusCode: 200,
          body: {
            message: 'Registration enabled successfully - secret stored for authentication',
            brandId: eventData.brandId,
            enabled: eventData.enabled,
            agencyId: agencyId
          }
        };
      } catch (error) {
        logger.error('Error updating agency registration:', error);
        return {
          statusCode: 500,
          body: 'Error updating agency registration'
        };
      }
    }

    // Unknown registration event type
    logger.warn(`Unknown registration event type: ${eventType}`);
    return {
      statusCode: 200,
      body: {
        message: 'Registration event processed - unknown type',
        eventType: eventType
      }
    };

  } catch (error) {
    logger.error('Error processing registration event', error);
    return {
      statusCode: 500,
      body: {
        message: 'Error processing registration event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

