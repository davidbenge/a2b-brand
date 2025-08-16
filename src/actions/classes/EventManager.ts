import { config } from "dotenv";
import { IIoEvent, IS2SAuthenticationCredentials, IApplicationRuntimeInfo } from "../types";
import { IoCustomEventManager } from "./IoCustomEventManager";
import * as aioLogger from "@adobe/aio-lib-core-logging";

export class EventManager {
    private s2sAuthenticationCredentials: IS2SAuthenticationCredentials;
    private applicationRuntimeInfo: IApplicationRuntimeInfo | undefined;
    private logLevel: string;
    private ioCustomEventManager: IoCustomEventManager;
    private logger: any;

    /****
     * @param logLevel - the log level to use
     * @param s2sAuthenticationCredentials - the s2s authentication credentials 
     * @param applicationRuntimeInfo - the application runtime information (optional)
     */
    constructor(logLevel: string, s2sAuthenticationCredentials: IS2SAuthenticationCredentials, applicationRuntimeInfo?: IApplicationRuntimeInfo) {
        this.logger = aioLogger("EventManager", { level: logLevel || "info" });
        if(s2sAuthenticationCredentials.clientId && s2sAuthenticationCredentials.clientSecret && s2sAuthenticationCredentials.scopes && s2sAuthenticationCredentials.orgId){
            this.s2sAuthenticationCredentials = s2sAuthenticationCredentials;
        }else{
            this.logger.error('EventManager:constructor: s2sAuthenticationCredentials missing', s2sAuthenticationCredentials);
            throw new Error('EventManager:constructor: s2sAuthenticationCredentials missing');
        }

        this.applicationRuntimeInfo = applicationRuntimeInfo;
        this.ioCustomEventManager = new IoCustomEventManager(logLevel, this.s2sAuthenticationCredentials, this.applicationRuntimeInfo);
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
       
        //await this.ioCustomEventManager.publishEvent(event);
    }

    /***
     * getS2sAuthenticationCredentials
     * 
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

    /***
     * getApplicationRuntimeInfo
     * 
     * @param params - the parameters object from an action invoke
     * 
     * @returns the application runtime information or undefined
     */
    static getApplicationRuntimeInfo(params: any): IApplicationRuntimeInfo | undefined {
        // Parse and process APPLICATION_RUNTIME_INFO if provided
        if (params.APPLICATION_RUNTIME_INFO) {
            try {
                const runtimeInfo = JSON.parse(params.APPLICATION_RUNTIME_INFO);
                if (runtimeInfo.namespace && runtimeInfo.app_name) {
                    // Split namespace into consoleId, projectName, and workspace
                    const namespaceParts = runtimeInfo.namespace.split('/');
                    if (namespaceParts.length >= 3) {
                        const applicationRuntimeInfo: IApplicationRuntimeInfo = {
                            consoleId: namespaceParts[0],
                            projectName: namespaceParts[1],
                            workspace: namespaceParts[2]
                        };
                        return applicationRuntimeInfo;
                    }
                }
            } catch (error) {
                console.warn('Failed to parse APPLICATION_RUNTIME_INFO:', error);
            }
        }
        return undefined;
    }
}