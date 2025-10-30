import { IApplicationRuntimeInfo } from '../types';

/**
 * Utility functions for parsing and working with Application Runtime Info
 */

/**
 * Parse APPLICATION_RUNTIME_INFO from action parameters
 * 
 * @param params - The parameters object from an action invoke
 * @returns The application runtime information or undefined
 */
export function getApplicationRuntimeInfo(params: any): IApplicationRuntimeInfo | undefined {
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
                        workspace: namespaceParts[2],
                        actionPackageName: runtimeInfo.action_package_name,
                        appName: runtimeInfo.app_name
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

/**
 * Extract application runtime info from event data
 * 
 * @param eventData - The event data object
 * @returns The application runtime information or undefined
 */
export function getAppRuntimeInfoFromEventData(eventData: any): IApplicationRuntimeInfo | undefined {
    if (eventData?.app_runtime_info) {
        return {
            consoleId: eventData.app_runtime_info.consoleId,
            projectName: eventData.app_runtime_info.projectName,
            workspace: eventData.app_runtime_info.workspace,
            actionPackageName: eventData.app_runtime_info.actionPackageName,
            appName: eventData.app_runtime_info.appName
        };
    }
    return undefined;
}

