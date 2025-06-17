import { IIoEventHandler, IS2SAuthenticationCredentials } from '../types';
import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import * as aioLogger from "@adobe/aio-lib-core-logging";
import { EventManager } from './EventManager';

export class IoEventHandler implements IIoEventHandler {
    logger: any;
    private config: any;
    public eventManager: EventManager;

    constructor(config: any) {
        this.config = config;
        this.logger = aioLogger(this.constructor.name, { level: config.logLevel || "info" });
        this.logger.debug('IoEventHandler:constructor: config', config);
        const currentS2sAuthenticationCredentials = {
            clientId: config.S2S_CLIENT_ID,
            clientSecret: config.S2S_CLIENT_SECRET,
            scopes: config.S2S_SCOPES,
            orgId: config.ORG_ID
        } as IS2SAuthenticationCredentials;
        this.logger.debug('IoEventHandler:constructor: currentS2sAuthenticationCredentials', currentS2sAuthenticationCredentials);  
        this.eventManager = new EventManager(config.logLevel, currentS2sAuthenticationCredentials);
    }

    /*******
     * handleEvent - should be overloaded by the implementation class
     * 
     * @param event 
     * @returns 
     *******/
    async handleEvent(event: any): Promise<any> {
        throw new Error('handleEvent method must be overloaded by implementation class');
    }
}