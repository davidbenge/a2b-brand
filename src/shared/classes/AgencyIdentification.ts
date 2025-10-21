/**
 * AgencyIdentification encapsulates the agency's identity metadata
 * that is included in all events sent to brands.
 * 
 * This allows brands to:
 * - Support multiple agencies (1-to-many relationship)
 * - Identify which agency an event came from
 * - Store agency-specific configuration
 */
export interface IAgencyIdentification {
  agencyId: string;
  orgId: string;
}

export class AgencyIdentification implements IAgencyIdentification {
  agencyId: string;
  orgId: string;

  constructor(params: IAgencyIdentification) {
    this.agencyId = params.agencyId;
    this.orgId = params.orgId;
  }

  /**
   * Build AgencyIdentification from action params (reads from environment variables).
   * Returns undefined if params do not contain valid AGENCY_ID and ORG_ID.
   * 
   * @param params - Action parameters that should include AGENCY_ID and ORG_ID
   * @returns AgencyIdentification | undefined
   */
  static getAgencyIdentificationFromActionParams(params: any): AgencyIdentification | undefined {
    if (params && params.AGENCY_ID && params.ORG_ID) {
      return new AgencyIdentification({
        agencyId: params.AGENCY_ID,
        orgId: params.ORG_ID
      });
    }
    console.warn('Missing AGENCY_ID or ORG_ID in action params');
    return undefined;
  }

  /**
   * Build AgencyIdentification from event data.
   * Used by brands to extract agency identity from received events.
   * 
   * @param params - Event parameters that should include data.agency_identification
   * @returns AgencyIdentification | undefined
   */
  static getAgencyIdentificationFromEventData(params: any): AgencyIdentification | undefined {
    if (params && params.data && params.data.agency_identification) {
      return new AgencyIdentification(params.data.agency_identification);
    }
    return undefined;
  }

  /**
   * Serialize to the exact shape we include on event.data.agency_identification.
   * 
   * @returns Object with agencyId and orgId
   */
  serialize(): {
    agencyId: string;
    orgId: string;
  } {
    return {
      agencyId: this.agencyId,
      orgId: this.orgId
    };
  }

  /**
   * Validate that both agencyId and orgId are present.
   * 
   * @returns true if both fields are non-empty strings
   */
  isValid(): boolean {
    return Boolean(
      this.agencyId && 
      this.agencyId.trim().length > 0 &&
      this.orgId && 
      this.orgId.trim().length > 0
    );
  }
}

