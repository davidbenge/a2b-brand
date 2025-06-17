import { IViewPropsBase } from './interfaces/IViewPropsBase';

export abstract class ViewPropsBase implements IViewPropsBase {
    baseUrl: string;
    environment: string;
    historyType: string;
    imsEnvironment: string;
    imsOrg: string;
    imsOrgName: string;
    imsProfile: any;
    imsToken: string;
    locale: string;
    preferredLanguages: string[];
    shellInfo: any;
    tenant: string;
    aioRuntimeNamespace: string;
    aioAppName: string;
    agencyBaseUrl: string;

    constructor(props: IViewPropsBase) {
        this.baseUrl = props.baseUrl;
        this.environment = props.environment;
        this.historyType = props.historyType;
        this.imsEnvironment = props.imsEnvironment;
        this.imsOrg = props.imsOrg;
        this.imsOrgName = props.imsOrgName;
        this.imsProfile = props.imsProfile;
        this.imsToken = props.imsToken;
        this.locale = props.locale;
        this.preferredLanguages = props.preferredLanguages;
        this.shellInfo = props.shellInfo;
        this.tenant = props.tenant;
        this.aioRuntimeNamespace = props.aioRuntimeNamespace;
        this.aioAppName = props.aioAppName;
        this.agencyBaseUrl = props.agencyBaseUrl;
    }

    /**
     * Validate if all required fields are present
     * @returns true if all required fields are filled
     */
    isValid(): boolean {
        return Boolean(
            this.baseUrl &&
            this.environment &&
            this.historyType &&
            this.imsEnvironment &&
            this.imsOrg &&
            this.imsOrgName &&
            this.imsToken &&
            this.locale &&
            this.tenant &&
            this.aioRuntimeNamespace &&
            this.aioAppName &&
            this.agencyBaseUrl
        );
    }

    /**
     * Convert the instance to a JSON object
     * @returns JSON representation of the view props
     */
    toJSON(): IViewPropsBase {
        return {
            baseUrl: this.baseUrl,
            environment: this.environment,
            historyType: this.historyType,
            imsEnvironment: this.imsEnvironment,
            imsOrg: this.imsOrg,
            imsOrgName: this.imsOrgName,
            imsProfile: this.imsProfile,
            imsToken: this.imsToken,
            locale: this.locale,
            preferredLanguages: this.preferredLanguages,
            shellInfo: this.shellInfo,
            tenant: this.tenant,
            aioRuntimeNamespace: this.aioRuntimeNamespace,
            aioAppName: this.aioAppName,
            agencyBaseUrl: this.agencyBaseUrl
        };
    }
} 