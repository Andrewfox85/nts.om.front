/* eslint-disable */
export interface DepositTypeResponse {
  depositType: number;
}

export interface ClientDepositDetail {
  firmRegNumber: string;
  firmNameShort: string;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumFree: number;
  depositSumCalc: number;
  currencyName: string;
  currencyPrecision: number;
  currencyId: number;
}

export interface DepositDetailsResponse {
  detailsList: ClientDepositDetail[];
}

export interface FirmDealDetail {
  idDirection: number;
  depositSumRequired: number;
  depositSumFree: number;
  depositSumTrader: number;
  depositSumFirm: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
}

export interface DepositFirmDealsResponse {
  detailsFirmDeals: FirmDealDetail[];
}

export interface FirmTax {
  sumRate: number;
  sumFree: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
}

export interface DepositFirmTaxResponse {
  firmTax: FirmTax;
}

export interface Client {
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  idDepositType?: number;
  isFirm?: boolean;
}

export interface DepositClientsResponse {
  clients: Client[];
}

export interface ClientDealDetail {
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumRequiredBuy: number;
  depositSumRequiredSale: number;
  depositSumTraderBuy: number;
  depositSumTraderSale: number;
  depositSumFree: number;
  depositSumFirm: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
  isUnavailable?: boolean;
  firmId?: boolean;
}

export interface DepositClientDealsResponse {
  detailsClientDeals: ClientDealDetail[];
}

export interface ClientTaxDetail {
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  sumRate: number;
  sumFree: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
  isUnavailable?: boolean;
  firmId?: boolean;
}

export interface DepositClientTaxResponse {
  detailsClientTaxes: ClientTaxDetail[];
}

export interface DepositDealDetail {
  firmId: number;
  firmRegNumber: string;
  firmNameShort: string;
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  depositSumRequiredBuy: number;
  depositSumRequiredSale: number;
  depositSumBuy: number;
  depositSumSale: number;
  depositSumFree: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
  isUnavailable?: boolean;
}

export interface DepositDealsResponse {
  detailsDeals: DepositDealDetail[];
}

export interface DepositTaxDetail {
  firmId: number;
  firmRegNumber: string;
  firmNameShort: string;
  clientId: number;
  clientRegNumber: string;
  clientNameShort: string;
  sumRate: number;
  sumFree: number;
  currencyName: string;
  currencyId: number;
  currencyPrecision: number;
  isUnavailable?: boolean;
}

export interface DepositTaxResponse {
  detailsTaxes: DepositTaxDetail[];
}