/* eslint-disable */
import { DynamicFieldsModel } from './api';

export interface CollectOfferResponse {
  validateDemandOffer: ValidateDemandOffer;
  idDemandOffer: number;
  lotNumber: number;
}

export interface ValidateDemandOffer {
  incorrectIntersections: IncorrectIntersection[];
  applyRulesMessages: ApplyRulesMessage[];
}

export interface IncorrectIntersection {
  foundDelivConditions: boolean;
  foundDeliveryTerm: boolean;
  foundDeliverySchedule: boolean;
  foundCondPayment: boolean;
  foundCurrency: boolean;
  foundVat: boolean;
  foundFinance: boolean;
  foundIsPriceAdjusted: boolean;
  foundVatQuote: boolean;
  idBlock: number;
}

export interface ApplyRulesMessage {
  messageType: number;
  messageText: string;
  ruleName: string;
}

export interface LimitsTreeNode {
  parentId: number;
  hasChildren: boolean;
  isReadonly: boolean;
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
}

export interface IResponse<T> {
  succeeded: boolean;
  data: T | null;
  message: string | null;
  errors: any | null;
}

export interface LimitsTreeResult {
  treeProducts: LimitsTreeNode[];
  minLotValue: null;
  maxLotValue: null;
  lotUnitId: null;
}

export interface IServiceError {
  error: boolean;
  errorStatus: number;
  messageError: string;
  errorState?: number;
}

export interface Good {
  goodId: number;
  idDemandOffer: number;
  destinations: string;
  goodName: string;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
  locationGood: string;
  locationService: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  quotationValue: number;
  quotationCurrencyName: string;
  quotationCurrencyPrecision: number;
  totalAmount: number;
  vatAmount: number;
  lotSummaryVolume: number;
  lotSummaryVolumeUnit: string;
  lotSummaryPriceWithoutVat: number;
  lotSummaryTotalAmount: number;
  lotSummaryVatAmount: number;
  dynamicFields?: DynamicFieldsModel;
}

export interface SessionArchiveItem {
  idSession: number;
  datetimeBegin: number;
  sessionName: string;
  sessionStageId: number;
  sessionStageName: string;
}

export interface UnsoldGetListSessArchResponse {
  listSessionArchive: SessionArchiveItem[];
}

export interface RefsData {
  id: number | string;
  name: string;
}

export interface RefsDataValues {
  values: RefsData[]
}

export interface GoodsSpecifications {
  idDemandOfferGood: number;
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string | null;
  fieldName: string;
  fieldPrecision: number;
  controlFieldType: string;
  fieldValue: string;
  blockId: number;
  isVirtual: boolean;
  isAvailableMultiSelection: boolean;
  sortBy?: number;
  costWithoutVAT?: number;
  amountVAT?: number;
  costVAT?: number;
}

export interface DataSourceOption {
  id: string;
  name: string;
}

export interface InterfaceField {
  blockId: number;
  fieldId: number;
  fieldName: string;
  fieldPrecision: number;
  allowedValues: DataSourceOption[];
  controlFieldType: string;
  fieldSize: number;
  isAvailableFreeInput: boolean;
  fieldDataType: string;
  referenceAlias: string;
  referenceId: number | null;
  isAvailableMultiSelection: boolean;
  isAccessibleForWorker: boolean;
}

export interface FieldData {
  interfaceField: InterfaceField;
  selectedValues: any;
  isRequired: boolean;
  dataSource?: DataSourceOption[];
  sortBy?: number;
}

export enum ciNodeDelivPlace {
  ciNodeDelivPlaceSettlement = 1,
  ciNodeDelivPlaceBorderCross,
  ciNodeDelivPlacePort,
  ciNodeDelivPlaceRailStation
}

export const ciNodeDelivPlaceArray = [
  ciNodeDelivPlace.ciNodeDelivPlaceSettlement,
  ciNodeDelivPlace.ciNodeDelivPlaceBorderCross,
  ciNodeDelivPlace.ciNodeDelivPlacePort,
  ciNodeDelivPlace.ciNodeDelivPlaceRailStation
]


export interface SessionRegistrationsResponse {
  sessionRegistrations: SessionRegistrations[];
}

export interface SessionRegistrations {
  firmName: string;
  branchName: string;
  clientName: string;
  clientContractTypeName: string;
  registrationDate: number;
}

export interface SessionInfo {
  sectionId: number;
  sectionName: string;
  sessionId: number;
  sessionDateTime: number;
  sessionName: string;
  sessionStatusId: number;
  sessionStatusName: string;
  sessionStageId: number;
  sessionStageName: string;
  auctionTypeId: number;
  auctionTypeName: string;
  concatedMarketTypes: string;
  lotAvailabilityId: number;
  lotAvailabilityName: string;
  multiBasisAvailabilityId: number;
  multiBasisAvailabilityName: string;
  applicationFormBuyerId: number;
  applicationFormBuyerName: string;
  applicationFormSellerId: number;
  applicationFormSellerName: string;
  numberOffers: number;
  numberDemands: number;
  numberRegistrationSale: number;
  numberRegistrationBuy: number;
  isCanRegisterAsSeller: boolean;
  isCanRegisterAsBuyer: boolean;
  isCanSetOffer: boolean;
  isCanSetDemand: boolean;
  isAllowedTargetTransact: boolean;
  isCanLogin: boolean;
  isCanTargetedOffer: boolean;
  idSessionPeriod: number;
  isAllowedAnalogues: boolean;
  idDirection: number;
  tradeTypeId?: number | string;
  tradeSectionId?: number | string;
  marketTypeIds?: Array<string>;
}

export interface ReferencesResponce {
  references: References[];
}

export interface References {
  id: number;
  name: string;
  dType: string;
}

export interface ReferencesValuesResponce {
  values: ReferencesValues[];
}

export interface ReferencesValues {
  id: number;
  name: string;
  rangeBoundLeft: number;
  rangeBoundRight: number;
}

export interface SucceedRes {
  id: number;
}

export interface UnsucceedRes {
  id: number;
  description: string;
}

export interface OfferData {
  idSection: number;
  idSession: number;
  idDemandOffer: number;
  idDirection: number;
  pricingTypeId: number;
  currencyPrecision?: number;
  volumePrecision?: number;
  quoteCurrencyPrecision?: number;
  deliveryConditions: Array<[string, DeliveryConditionDetail[]]>;
  offerGoods: OfferGood[];
}

export interface DeliveryConditionDetail {
  idDemandOffer: number;
  idDemandOfferGood: number;
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeName: string;
  placeDetails: string;
  priceWithoutVat: number;
  priceAdjustment: number;
  concatedCondition: string;
  priceCorridorLeftBound: number;
  priceCorridorRightBound: number;
  minPriceWithoutVat: number;
  goodId: number;
  goodGroupId: number;
  goodNomenclatureId: number;
  goodNameId: number;
  goodValues: string;
  goodName: string;
  unitId: number;
  unitName: string;
  properties: string;
  volume: number;
  quotation: number;
  quoteCurrency: string;
  amendment: number;
  currency: string;
  currencyId: number;
  vat: number;
  costVat: number;
}

export interface OfferGood {
  goodValues: string;
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodsSpecifications[];
  properties: Properties[];
  unitName: string;
  unitId: number;
  currency: string;
  quoteCurrency: string;
  priceAdjustment: number;
}

export interface Properties {
  propertyName: string;
  propertyValue: string;
}

export * from './api';
