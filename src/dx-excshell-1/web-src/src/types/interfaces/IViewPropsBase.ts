import { IShellInfo } from "./IShellInfo";

export interface IViewPropsBase {
    baseUrl: string; //Base url for the solution
    environment: string; //Environment being used
    historyType: string; //Type of history
    imsEnvironment: string; //IMS environment, which follows general rules unless the shell_ims query parameter is in use
    imsOrg: string; //IMS organization ID
    imsOrgName: string; //Name of the IMS organization
    imsProfile: any; //Object containing information about the authenticated user
    imsToken: string; //IMS token
    locale: string; //Locale string for globalization
    preferredLanguages: string[]; //List of preferred languages from the user's IMS profile
    shellInfo: IShellInfo; //Shell-related information needed to populate the shell UI
    tenant: string; //tenant name for current ims organization
    aioRuntimeNamespace: string; //namespace for the runtime pulled in from .env
    aioActionPackageName: string; //aio Action PackageN ame name pulled in from .env
    agencyBaseUrl: string; //agency base url pulled in from .env
}