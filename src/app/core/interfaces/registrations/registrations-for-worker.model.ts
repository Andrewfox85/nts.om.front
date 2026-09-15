/* eslint-disable */
export interface SessionRegistrationWorker {
  directionID: number;
  directionName: string;
  firmBranchId: number;
  firmBranchName: string;
  clientId: number;
  clientName: string;
  clientBranchId: number;
  clientBranchName: string;
  clientContractTypeId: number;
  clientContractTypeName: string;
  registrationDate: number;
  firmId: number;
  firmName: string;
  traderId: number;
  traderName: string;
  deletionReason: string;
  id: number;
  registrationDateString: string;
  isCreatedAfterDataTransfer: boolean;
}

export interface SessionRegistrationWorkerResponse {
  sessionRegistrationWorkers: SessionRegistrationWorker[];
}

export interface RegistrationDateEndResponse {
  regDateEndSale: number;
  regDateEndBuy: number;
}

export interface RegistrationAnnulClient {
  idTrader: number;
  idFirm: number;
  idFirmClient: number;
  contractType: number;
  idBranch: number;
  idDirection: number;
  deletionReason: string;
  id: number;
}

export interface RegistrationAnnulBody {
  idSection: number;
  idSession: number;
  registrationAnnulClients: RegistrationAnnulClient[];
}

export interface ClientResult {
  id: number;
  result: boolean;
  description: string;
}

export interface OperationResult {
  success: number;
  errorOperation: number;
}

export interface RegistrationAnnulResponse {
  registrationAnnulClients: ClientResult[];
  resultOperation: OperationResult;
}

export interface RegistrationRestoreClient {
  idTrader: number;
  idFirm: number;
  idFirmClient: number;
  contractType: number;
  idBranch: number;
  idDirection: number;
  id: number;
}

export interface RegistrationRestoreBody {
  idSection: number;
  idSession: number;
  registrationRestoreClients: RegistrationRestoreClient[];
}

export interface RegistrationRestoreResponse {
  registrationRestoreClients: ClientResult[];
  resultOperation: OperationResult;
}

export interface TradersListBody {
  idFirm: number;
  isOnlyActive: boolean;
}

export interface Trader {
  idTrader: number;
  traderFio: string;
  traderRegNumber: string;
}

export interface TradersListResponse {
  traders: Trader[];
}

export interface SessionStageDateEndResponse {
  isScheduleExist: boolean;
  dateEnd: number;
  traderRegNumber: string;
}

export interface TransferRegistrationBody {
  idSection: number;
  idSession: number;
  idTrader: number;
  idFirm: number;
  idFirmClient: number;
  contractType: number;
  idBranch: number;
  idDirection: number;
  isControlViolations: boolean;
  isControlDeposit: boolean;
  isSyncWithGias: boolean;
}

export interface TransferRegistrationResponse {
  isSucceed: boolean;
  infoMessage: string;
}



