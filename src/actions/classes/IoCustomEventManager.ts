import * as aioLogger from "@adobe/aio-lib-core-logging";
<<<<<<< HEAD
import { Brand } from "./Brand";
import { BRAND_FILE_STORE_DIR } from "../constants";
import { IIoEvent, IS2SAuthenticationCredentials } from "../types";
=======
import { IIoEvent } from "../types";
>>>>>>> bd12aa9 (eod)
import { v4 as uuidv4 } from 'uuid';
import { getServer2ServerToken } from "../utils/adobeAuthUtils";

export class IoCustomEventManager {
    private logger: any;
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private registrationProviderId: string; 
    private assetSynchProviderId: string;
    
    /*******
     * constructor - constructor for the IoCustomEventManager
     * 
     * @param logLevel: string
     * @param s2sAuthenticationCredentials: IS2SAuthenticationCredentials from action
     *******/
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials) {
        this.logger = aioLogger("IoCustomEventManager", { level: logLevel || "info" });
        this.logger.debug('IoCustomEventManager constructor');

        //check that the params object has the data we need
        if(s2sAuthenticationCredentials.clientId && s2sAuthenticationCredentials.clientSecret && s2sAuthenticationCredentials.scopes && s2sAuthenticationCredentials.orgId){
            this.logger.debug('IoCustomEventManager constructor params', s2sAuthenticationCredentials);
            this.s2sAuthenticationCredentials = s2sAuthenticationCredentials;
        }else{
            this.logger.error('IoCustomEventManager constructor params missing', s2sAuthenticationCredentials);
            throw new Error('IoCustomEventManager constructor params missing. We need S2S_API_KEY, S2S_CLIENT_SECRET, S2S_SCOPES, and ORG_ID');
        }

        this.registrationProviderId = process.env.AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID;
        this.assetSynchProviderId = process.env.AIO_AGENCY_EVENTS_AEM_ASSET_SYNCH_PROVIDER_ID;
        this.logger.debug('IoCustomEventManager constructor registrationProviderId', this.registrationProviderId);
        this.logger.debug('IoCustomEventManager constructor assetSynchProviderId', this.assetSynchProviderId);
    }

    /*******
     * publishEvent - publish the event to the Adobe Event Hub
     * 
     * @param event: IIoEvent
     * @returns Promise<void>
     *******/
    async publishEvent(event: IIoEvent): Promise<void> {
        this.logger.debug('IoCustomEventManager:publishEvent starting');
        let providerId = "";

        // based on the event type lets pull the provider id
        switch(event.type) {
            case "com.adobe.a2b.registration.enabled":
            case "com.adobe.a2b.registration.disabled":
            case "com.adobe.a2b.registration.received":
                providerId = this.registrationProviderId;
                break;
            case "com.adobe.a2b.assetsynch.new":
            case "com.adobe.a2b.assetsynch.updated":
            case "com.adobe.a2b.assetsynch.deleted":
                providerId = this.assetSynchProviderId;
                break;
            default:
                this.logger.error('IoCustomEventManager:publishEvent: Event type not supported', event);
        }

        event.id = uuidv4(); // set the id
        event.source = `urn:uuid:${providerId}`; // set the source
        
        if(event.validate()){
            this.logger.debug('Event is valid', event);
        }else{
            this.logger.error('Event is not valid', event);
            throw new Error('Event is not valid');
        }

        await this.publishEventToAdobeEventHub(event);
    }

    /*******
     * publishEventToAdobeEventHub - publish the event to the Adobe Event Hub
     * 
     * @param event: any
     * @returns Promise<void>
     *******/
    async publishEventToAdobeEventHub(event: any): Promise<void> {
        // publish the event
        const eventSdk = require('@adobe/aio-lib-events');

        // get the token
        let token = "";
        try{
            token = await getServer2ServerToken(this.s2sAuthenticationCredentials, this.logger);
        }catch(error){
            this.logger.error('IoCustomEventManager:publishEventToAdobeEventHub: Error getting server2server token', error);
            throw new Error('Error getting server2server token');
        }

        // initialize the event client
        //This class provides methods to call your Adobe I/O Events APIs. Before calling any method initialize the instance by calling the init method on it with valid values for organizationId, apiKey, accessToken and optional http options such as timeout and max number of retries
        const eventClient = await eventSdk.init(this.s2sAuthenticationCredentials.orgId, this.s2sAuthenticationCredentials.clientId, token);
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub eventClient', eventClient);

        const cloudEventToSend = event.toCloudEvent();
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub cloudEvent to publish toJSON',event.toJSON());
        this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub cloudEvent to publish',cloudEventToSend);
        const eventSendResult = await eventClient.publishEvent(cloudEventToSend);

        if(eventSendResult === 'OK'){  
            this.logger.debug('IoCustomEventManager:publishEventToAdobeEventHub: Event sent', eventSendResult);
        }else{
            this.logger.error('IoCustomEventManager:publishEventToAdobeEventHub: Error sending event', eventSendResult);
            throw new Error('Error sending event');
        }
    }
}