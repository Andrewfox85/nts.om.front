/* eslint-disable */
export interface Limitation {
  id: number;
  treeLevel: number;
  treeIdLink: number;
  treeIdValue: number;
  lotQuantityUnitId: number;
  goodName: string;
  goodSpecification: string;
  lotQuantityMaximum: number;
  lotQuantityUnitName: string;
  firms?: LimitParticipant[];
}

export interface LimitationsResponse {
  limitations: Limitation[];
}
export interface LimitParticipant {
  idLimitation: number;
  firmId: number;
  firmName: string;
  clientId: number;
  clientName: string;
  isAvailable: boolean;
  isChecked: boolean;
}

export interface LimitsParticipantsResponse {
  limitsParticipants: LimitParticipant[];
}

export interface LimitationSpecify {
  idReference: number;
  idValue: number;
}

export interface LimitationSpecifiesResponse {
  limitationSpecifies: LimitationSpecify[];
}

export interface SetLimitationBody {
  idSection: number;
  idSession: number;
  idLimitation: number;
  listFirms: number[];
  listClients: number[];
  idValue: number;
  idLink: number;
  lotQuantityMaximum: number;
  lotQuantityUnit: number;
  listValues: number[];
}
export interface SetLimitationResponse {
  idLimitation: number;
}
export interface DeleteLimitationBody {
  idSection: number;
  idSession: number;
  idLimitation: number;
}