/* eslint-disable */
export interface FullInfoForBrockerAndVizitorResponse {
  role: string;
  listBranchesFirmWithDetails: ListBranchesFirm;
  listBranchesAllClientsWithDetails: ListBranchesAllClients;
}

export interface ListBranchesFirm {
  branchFirmWithDetails: BranchFirmDetail[];
}

export interface ListBranchesAllClients {
  clientWithDetails: ClientDetail[];
}

export interface BranchFirmDetail {
  idFirm: number;
  idContractType: number;
  isRegisteredOriginal: number;
  idKeyValue: number;
  nameFull: string;
  nameShort?: string;
  isRegistered: number;
  description: string;
  branchesWithDetails: BranchDetail[];
}

export interface ClientDetail {
  idClient: number;
  nameFull: string;
  nameShort: string;
  regNumber: string;
  idContractType: number;
  isRegistered: number;
  description: string;
  isRegisteredOriginal: number;
  branchesWithDetails: BranchDetail[];
  idKeyValue: number;
}

export interface BranchDetail {
  idFirmBranch: number;
  nameFull: string;
  nameShort: string;
  isRegistered: number;
  description: string;
  idContractType: number;
  isRegisteredOriginal: number;
  idKeyValue: number;
}

export interface RegistrAndRevokeSessionRegistrationBody {
  idSection: number;
  listSessions: number[];
  idDirection: number;
  idContractType: number;
  idFirmClientAndIdBranchList: FirmClientBranch[];
}

export interface FirmClientBranch {
  idFirmClient: number;
  idBranch: number;
  isRegistered: number;
}

export interface RegistrAndRevokeSessionRegistrationResponse {
  registrOrRevokeClients: ClientOperationResult[];
  resultOperation: OperationSummary;
}

export interface ClientOperationResult {
  idKeyValue: number;
  result: boolean;
  description: string;
}

export interface OperationSummary {
  registered: number;
  revoked: number;
  errorOperation: number;
}