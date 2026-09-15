/* eslint-disable */
export interface ListOffersCatalogueApiModel {
  offers: OfferModel[];
  fields: FieldsModel[];
  numberTotal: number;
}

export interface OfferModel {
  idDemandOffer: number;
  idDemandOfferParent: number;
  statusId: number;
  statusName: string;
  directionId: number;
  directionName: string;
  demoffMarketTypes: string;
  dateCreate: number;
  dateCreateString: string;
  isComposite: boolean;
  isMultibasis: boolean;
  isPriceAdjusted: boolean;
  isEditedAfterApprove: boolean;
  lotNumber: number;
  currencyName: string;
  currencyPrecision: number;
  idPriceAdjustment: number;
  vatPercent: number;
  conditionsPayment: string;
  conditionsDelivery: string;
  concatedConditionsDelivery: string;
  conditionsDeliveryPeriod: string;
  firmId: number;
  concatedFirmName: string;
  clientContractTypeName: string;
  concatedClientName: string;
  branchName: string;
  traderId: number;
  traderName: string;
  isExistDelivSchedule: boolean;
  isExistFilesPublic: boolean;
  isExistFilesPrivate: boolean;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  rejectionReason: string;
  rejectionDate: number;
  rejectionDateString: string;
  isCanEdit: boolean;
  isCanReject: boolean;
  isCanRestoreRejected: boolean;
  goods: Array<GoodApiModel>,
  isCanApprove: boolean;
  isCreatedAfterDataTransferred: boolean;
  isCanTransfer: boolean;
  isOutOfPriceCorridor: boolean;
  idModel: number;
  isWaitForSyncTemplate: boolean;
  isCanSetIndividPriceStep: boolean;
  isIndividualPriceStepUsed: boolean;
  isContainDeletedGoods: boolean;
  isAllowAnalogs: boolean;
  isNeedPreOfferSubmission: boolean;
}

export interface GoodApiModel {
  idDemandOffer: number;
  idDemandOfferGood: number;
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGood: number,
  goodName: string;
  goodDescription: string;
  goodVolume: number;
  goodUnitName: string;
  priceWithoutVat: number;
  vatAmount: number;
  totalAmount: number;
  lotSummaryVolume: number;
  lotSummaryVolumeUnit: string;
  lotSummaryPriceWithoutVat: number;
  lotSummaryVatAmount: number;
  lotSummaryTotalAmount: number;
  dynamicFields: DynamicFieldsModel;
}

export type DynamicFieldsModel = {
  [key: string]: string;
}

export interface FieldsModel {
  fieldName: string;
  showName: string;
}
