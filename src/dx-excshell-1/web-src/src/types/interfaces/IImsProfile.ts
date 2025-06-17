export interface ITargetData {
    gid?: string;
    group_name?: string | null;
    svc_code?: string;
    pc_ident?: string;
}

export interface IRole {
    principal: string;
    organization: string;
    named_role: string;
    target: string;
    target_type: any;
    target_data: ITargetData;
}

export interface IProductContext {
    "orig_sys": string;
    "owningEntity": string;
    "serviceCode": string;
    "ident": string;
    "groupid": string;
    "label": string;
    "modDts": number,
    "enable_sub_service": string;
    "fulfillable_data": string;
    "serviceLevel": string;
    "createDts": number,
    "user_visible_name": string;
    "statusCode": string;  
}

export interface IImsProfile {
    account_type: string;
    utcOffset: string | null;
    preferred_languages: string[];
    displayName: string;
    session: string;
    roles: IRole[];
    last_name: string;
    authAccountType: string;
    userId: string;
    authId: string;
    tags: string[];
    projectedProductContext: IProductContext[];
    emailVerified: string;
    toua: any;
    phoneNumber: string | null;
    job_function: string | null;
    countryCode: string | null;
    name: string;
    mrktPerm: any;
    mrktPermEmail: any;
    first_name: string;
    email: string;
    avatar: string;
    avatarSrc: string;
    isImpersonated: boolean;
} 