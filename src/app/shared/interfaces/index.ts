export interface DemandOfferCataloguePayload {
  idSection: number;
  idSession: number;
  idDemands: number[];
  idOffers: number[];
}

export interface DemandsResponse {
  isSucceeded: boolean;
  errorLog: string;
  idDemand: number;
}

export interface OffersResponse {
  isSucceeded: boolean;
  errorLog: string;
  idOffer: number;
}

export interface DemandOfferCatalogueResponse {
  demands: DemandsResponse[];
  offers: OffersResponse[];
}

export interface ApproveOfferApiError {
  status: number;
  title: string;
  traceId: string;
  type: string;
}

export interface ExportRequest {
  requestId: number;
  requestSection: number;
  idReportType: number;
  dateCreate: number;
  dateFailure: number;
  dateExport: number;
}

export interface ExportResponse {
  exportRequests: ExportRequest[];
}

export interface DownloadResponse {
  content: string;
  fileName: string;
}

export interface FilterOption {
  key: FilterValueType[] ;
  value: FilterValueType;
  text: string;
}

export type FilterValueType = string | boolean | number;

export interface PriceLimitCorridor {
  leftBound: number;
  rightBound: number;
}

export interface PriceLimitQuotation {
  priceWithoutVat: number;
}
