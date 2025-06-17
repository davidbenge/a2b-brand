import { config } from "dotenv";
import { IIoEvent, IS2SAuthenticationCredentials } from "../types";
import { BrandManager } from "./BrandManager";
import { IoCustomEventManager } from "./IoCustomEventManager";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export class EventManager {
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private logLevel: string;
    private ioCustomEventManager: IoCustomEventManager;
    private logger: any;
    private brandManager: BrandManager;

    /****
     * @param logLevel - the log level to use
     * @param s2sAuthenticationCredentials - the s2s authentication credentials 
     */
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials) {
        this.logger = aioLogger("EventManager", { level: logLevel || "info" });
        if(s2sAuthenticationCredentials.clientId && s2sAuthenticationCredentials.clientSecret && s2sAuthenticationCredentials.scopes && s2sAuthenticationCredentials.orgId){
            this.s2sAuthenticationCredentials = s2sAuthenticationCredentials;
        }else{
            this.logger.error('EventManager:constructor: s2sAuthenticationCredentials missing', s2sAuthenticationCredentials);
            throw new Error('EventManager:constructor: s2sAuthenticationCredentials missing');
        }

        this.brandManager = new BrandManager(logLevel);
        this.ioCustomEventManager = new IoCustomEventManager(logLevel, this.s2sAuthenticationCredentials);
        this.logLevel = logLevel;
    }

    /****
     * @param event - the IIoEvent to publish
     * 
     * @returns void
     */
    async publishEvent(event: IIoEvent): Promise<void> {
        this.logger.debug('EventManager:publishEvent: event', event);

        // TODO: all events are echoed on IO
        await this.ioCustomEventManager.publishEvent(event);
       
        // TODO: check and see if event needs to go to brand if so send it. some day that will be in the Brand config
        // get brand data 
        //const brandId = event.brandId;
        //const brand = await this.brandManager.getBrand(brandId);
        ///this.logger.debug('EventManager:publishEvent: brand', brand);

        // TODO: if external get the Brand it needs to be sent to and the end point url and auth. use brand manager
        // TODO: route the event to the correct receivers. send the event to the correct receivers with the auth in the header

        //await this.ioCustomEventManager.publishEvent(event);
    }

    /***
     * @param params - the parameters object from an action invoke
     * 
     * @returns the s2s authentication credentials
     */
    static getS2sAuthenticationCredentials(params: any): IS2SAuthenticationCredentials {
        if(!params.S2S_CLIENT_ID || !params.S2S_CLIENT_SECRET || !params.S2S_SCOPES || !params.ORG_ID){
            throw new Error('EventManager:getS2sAuthenticationCredentials: missing required parameters');
        }
        
        // clean up the meta scopes
        // they are in the .env like ["AdobeID","openid","read_organizations","additional_info.projectedProductContext","additional_info.roles","adobeio_api","read_client_secret","manage_client_secrets"]
        let metaScopes = JSON.parse(params.S2S_SCOPES);
        metaScopes = metaScopes.join(',');

        const s2sAuthenticationCredentials = {
            clientId: params.S2S_CLIENT_ID,
            clientSecret: params.S2S_CLIENT_SECRET,
            scopes: metaScopes,
            orgId: params.ORG_ID
        } as IS2SAuthenticationCredentials;

        console.log("EventManager:getS2sAuthenticationCredentials: s2sAuthenticationCredentials", s2sAuthenticationCredentials);

        return s2sAuthenticationCredentials;
    }
}