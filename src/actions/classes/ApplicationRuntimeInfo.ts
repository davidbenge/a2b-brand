import { IApplicationRuntimeInfo } from "../types";

/**
 * ApplicationRuntimeInfo encapsulates the runtime isolation metadata
 * and provides helpers to construct and serialize it for event payloads.
 */
export class ApplicationRuntimeInfo implements IApplicationRuntimeInfo {
  consoleId: string;
  projectName: string;
  workspace: string;
  actionPackageName: string;
  appName: string;

  constructor(params: IApplicationRuntimeInfo) {
    this.consoleId = params.consoleId;
    this.projectName = params.projectName;
    this.workspace = params.workspace;
    this.actionPackageName = params.actionPackageName;
    this.appName = params.appName;
  }

  /**
   * Build ApplicationRuntimeInfo from action params using existing logic.
   * Returns undefined if params do not contain a valid APPLICATION_RUNTIME_INFO.
   */
  static getApplicationRuntimeInfoFromActionParams(params: any): ApplicationRuntimeInfo | undefined {
    // Parse and process APPLICATION_RUNTIME_INFO if provided
    if (params && params.APPLICATION_RUNTIME_INFO) {
      try {
          const runtimeInfo = JSON.parse(params.APPLICATION_RUNTIME_INFO);
          if (runtimeInfo.namespace && runtimeInfo.app_name) {
              // Split namespace into consoleId, projectName, and workspace (expected format: consoleId-projectName-workspace)
              const namespaceParts = String(runtimeInfo.namespace).split('-');
              if (namespaceParts.length === 3) {
                  const applicationRuntimeInfo: IApplicationRuntimeInfo = {
                      consoleId: namespaceParts[0],
                      projectName: namespaceParts[1],
                      workspace: namespaceParts[2],
                      actionPackageName: runtimeInfo.action_package_name,
                      appName: runtimeInfo.app_name
                  };
                  return new ApplicationRuntimeInfo(applicationRuntimeInfo);
              }
          }
      } catch (error) {
          console.warn('Failed to parse APPLICATION_RUNTIME_INFO:', error);
      }
    }
    return undefined;
  }

  /**
   * Build getAppRuntimeInfoFromEventData from action params using existing logic.
   * Returns undefined if params do not contain a valid ApplicationRuntimeInfo.
   * @param params - The parameters object agency to brand or brand to agency event.
   * @returns ApplicationRuntimeInfo | undefined
   */
  static getAppRuntimeInfoFromEventData(params: any): ApplicationRuntimeInfo | undefined {
    if( params && params.data && params.data.app_runtime_info ){
      return new ApplicationRuntimeInfo(params.data.app_runtime_info);
    }
    return undefined;
  }

  /**
   * Serialize to the exact shape we include on a2bEvent.data.app_runtime_info.
   */
  serialize(): {
    consoleId: string;
    projectName: string;
    workspace: string;
    appName: string;
    actionPackageName: string;
  } {
    return {
      consoleId: this.consoleId,
      projectName: this.projectName,
      workspace: this.workspace,
      appName: this.appName,
      actionPackageName: this.actionPackageName,
    };
  }

  /**
   * Build the base endpoint URL for this application
   * Format: https://{consoleId}-{projectName}-{workspace}.adobeio-static.net
   * @returns The base endpoint URL
   */
  buildEndpointUrl(): string {
    return `https://${this.consoleId}-${this.projectName}-${this.workspace}.adobeio-static.net`;
  }

  /**
   * Build a runtime action URL for this application
   * Format: https://{namespace}.adobeioruntime.net/api/v1/web/{packageName}/{actionName}
   * @param actionName The name of the action to invoke
   * @returns The full action URL
   */
  buildActionUrl(actionName: string): string {
    const namespace = `${this.consoleId}-${this.projectName}-${this.workspace}`;
    return `https://${namespace}.adobeioruntime.net/api/v1/web/${this.actionPackageName}/${actionName}`;
  }
}

