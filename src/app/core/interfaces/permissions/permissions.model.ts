/* eslint-disable */
export interface Permission {
  id: number;
  workerFullName: string;
  dateCreate: number;
  dateCreateString: string;
  firmName: string;
  traderFullName: string;
  actionName: string;
  directionId: number;
  directionName: string;
  dateDelete: number;
  dateDeleteString: string;
  notes: string;
  actionNumberPermitted: number;
  actionNumberUsed: number;
  isCanProcess: boolean;
  isExistDemoff: boolean;
}
export interface RegulationPermissResponse {
  permissions: Permission[];
}
export interface OfferDetail {
  lotNumber: number;
  dateWaste: number;
}
export interface OffersDetailsResponse {
  offersDetails: OfferDetail[];
}
export interface SetOutRegulationPermissBody {
  idSection: number;
  idSession: number;
  idDirection: number;
  idFirm: number;
  idTrader: number;
  idAction: number;
  actionsNumber: number;
  listDemoff: number[];
  notes: string;
}
export interface SetOutRegulationNoticeBody {
  idPermission: number;
}
export interface DeleteOutRegulationPermissBody {
  idPermission: number;
}
export interface Action {
  id: number;
  name: string;
}
export interface RegulationActionsResponse {
  actions: Action[];
}
export interface Offer {
  idDemandOffer: number;
  lotNumber: number;
}
export interface RegulationDemoffResponse {
  offers: Offer[];
}
