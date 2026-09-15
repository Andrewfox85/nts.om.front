// TODO: remove any and then delete eslint-disable
/* eslint-disable */
import { ID_INTERFACE_FIELD } from '../../enums';

export interface ReportDealsTransactionsBody {
  idSection: number;
  filterSessionId: number;
  listPropertiesStr?: number[];
  filterSessionDateFrom: number;
  filterSessionDateTo: number;
}

export interface ReportDealsDynamicFields {
  [key: string]: string;
}

export interface ReportDealsGoods {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
  totalAmount: number;
  lotSummaryVolume: number;
  lotSummaryVolumeUnit: string;
  lotSummaryTotalAmount: number;
  cnfea: string;
  priceWithoutVat: number;
  lotSummaryTotalAmountByn: number;
  dynamicFields: ReportDealsDynamicFields;
}

export interface ReportDealsTransactions {
  idSession: number;
  isComposite: boolean;
  isMultiBasis: boolean;
  isContainDeletedGoods: boolean;
  idPriceAdjustment: number;
  idDirection: number;
  idDemandOffer: number;
  lotNumber: number;
  transactionStatus: string;
  transactionNumber: string;
  transactionDateCreate: number;
  transactionDateCreateString: string;
  transactionDateTerminate: number;
  transactionDateTerminateString: string;
  transactionTerminationReason: string;
  isTargeted: true;
  currencyName: string;
  currencyPrecision: number;
  vatPercent: number;
  transactionDetails: string;
  conditionsPayment: string;
  conditionsDelivery: string;
  conditionsDeliveryPeriod: string;
  buyerFirmName: string;
  buyerConcatedClientName: string;
  buyerRegNumber: string;
  buyerBranchName: string;
  buyerTin: string;
  buyerLegalAddress: string;
  buyerCountry: string;
  buyerAffiliation: string;
  buyerTraderName: string;
  mainName: string;
  sellerFirmName: string;
  sellerConcatedClientName: string;
  sellerRegNumber: string;
  sellerBranchName: string;
  sellerTin: string;
  sellerLegalAddress: string;
  sellerCountry: string;
  sellerAffiliation: string;
  sellerTraderName: string;
  goods: ReportDealsGoods[];
}

export interface ReportDealsFields {
  fieldName: ID_INTERFACE_FIELD;
  showName: string;
}

export interface ReportDealsTransactionsPayload {
  transactions: ReportDealsTransactions[];
  fields: ReportDealsFields[];
}

export interface DemandOfferGood {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
  totalAmount: number;
  lotSummaryVolume: number;
  lotSummaryVolumeUnit: string;
  lotSummaryTotalAmount: number;
  cnfea: string;
  concatedDeliveryConditionAdd: string;
  priceWithoutVatOriginal: number;
  priceWithoutVatStarting: number;
  priceWithoutVatStartingTrading: number;
  priceWithoutVatCurrent: number;
  dynamicFields: Record<string, ID_INTERFACE_FIELD>;
}

export interface TradingSessionDemandOffersField {
  fieldName: ID_INTERFACE_FIELD;
  showName: string;
}

export interface DemandOffer {
  idDemandOffer: number;
  idSession: number;
  sessionDateTimeBegin: number;
  sessionDateTimeBeginString: string;
  isTargeted: boolean;
  isParticipateInTrading: boolean;
  transactionNumber: string | null;
  statusName: string;
  directionId: number;
  directionName: string;
  dateCreate: number;
  dateCreateString: string;
  isComposite: boolean;
  isMultiBasis: boolean;
  lotNumber: number;
  currencyName: string;
  currencyPrecision: number;
  idPriceAdjustment: number | null;
  vatPercent: number;
  conditionsPayment: string;
  conditionsDelivery: string;
  conditionsDeliveryPeriod: string;
  concatedFirmName: string;
  clientContractTypeName: string | null;
  concatedClientName: string | null;
  branchName: string | null;
  traderName: string;
  detailsImportDomestic: any | null;
  detailsExportForeign: any | null;
  rejectionReason: any | null;
  rejectionDate: any | null;
  rejectionDateString: any | null;
  isContainDeletedGoods: boolean;
  mainName: string;
  goods: DemandOfferGood[];
}

export interface TradingSessionDemandOffersBody {
  idSection: number;
  filterSessionId: number;
  listPropertiesStr?: number[];
  filterSessionDateFrom: number;
  filterSessionDateTo: number;
}

export interface GetTradingSessionDemandOffersResponse {
  demandOffers: DemandOffer[];
  fields: TradingSessionDemandOffersField[];
}

export interface GetTradingParticipantsResponse {
  participants: TradingParticipant[];
}

export interface TradingParticipant {
  directionName: string;
  numberDemoff: number;
  isExistRegistration: boolean;
  firmNameShort: string;
  firmRegistrationNumber: string;
  firmDateAccreditation: number;
  firmCountry: string;
  firmDepositName: string;
  clientNameShort: string;
  clientRegistrationNumber: string;
  clientCountry: string;
  clientDepositName: string;
  traderFullName: string;
  traderPhone: string;
  traderEmail: string;
}

export interface ReportBiddingProcessResponse {
  biddingProcesses: ReportBiddingProcess[];
}

export interface ReportBiddingProcess {
  lotNumber: number;
  dateTimeActivate: number;
  dateTimeDeActivate: number;
  dateTimeActivateString: string;
  dateTimeDeActivateString: string;
  nameDemandOffer: string;
  nameSessionPeriod: string;
  directionName: string;
  statusName: string;
  descriptionExtended: string;
  concatedNameFirm: string;
  nameClientContractType: string;
  concatedNameFirmClient: string;
  nameBranch: string;
  traderFio: string;
  maklerFio: string;
  isSystemForming: boolean;
  nameCurrency: string;
  nameUnit: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  vatAmount: number;
  vatPercent: number;
  totalVolume: number;
  totalAmount: number;
  lotGoodsNumber: number;
  lotGoodsBasisesNumber: number;
  concatedDeliveryPeriodRu: string;
  concatedPaymentConditionsRu: string;
  concatedDeliveryConditionRu: string;
  isDiffPaymentConditions: boolean;
  isDiffDeliveryPeriod: boolean;
  isDiffDeliveryConditions: boolean;
  isDiffCurrency: boolean;
  isDiffVolume: boolean;
  diffPriceTrend: number;
  isCounterBid: boolean;
  transactionNumber: string;
  nameFinanceSources: string;
  transactionWithRestoration: number;
  goodDescriptionBrief: string;
}