/* eslint-disable */
import { CACHING_ENABLED } from './../interceptors/caching.interceptor';
import { inject, Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { FieldData, ReferencesResponce, ReferencesValuesResponce } from '../interfaces/interface';
import { map } from 'rxjs/operators';
import { IDocFileContentResponse } from './common-service.service';
import { ID_INTERFACE_FIELD } from "../../shared/enums";
import {
  ACTUAL_SIZE_READINESS_FIELDS,
  AUCTION_TYPE,
  COMPLEX_LOT_PRODUCT_TYPE_ID,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  IdDirection,
  pricingType
} from "../../api.constants";
import { ValueChangedEvent } from "devextreme/ui/text_box";
import TreeView from "devextreme/ui/tree_view";
import { GoodCharacteristics } from "./add-nsi-good.service";
import { DeliveryPlaceTreeLevel } from '../enums/basis-info/delivery-place-tree-level';
import { SECTIONS_TYPES } from "../../sub_components/header/enums";
import dxDataGrid, { CellPreparedEvent, Row } from "devextreme/ui/data_grid";

export interface GetArchiveDocumentContentResponse {
  content: string;
  fileName: string;
}

export interface Good {
  idDemandOfferGood: number;
  idGood: number;
  isDeleted: boolean;
  isSimilarToFirst: boolean;
}

export interface GetGoodsResponse {
  goods: Good[];
}

export interface OfferFullInfoResponse {
  serverTime: number;
  generalInfo: GeneralInfo;
  goods: GoodAuction[];
  deliveryScopes: DeliveryScope[];
  deliveryScopesGraded: DeliveryScope[];
  delivSchPeriods: DeliverySchedulePeriod[];
  delivSchPeriodsGraded: DeliverySchedulePeriod[];
  deliveryConditions: DeliveryCondition[];
  deliveryPeriod: DeliveryPeriod;
  paymentCond: PaymentCondition;
  documents: DocumentItem[];
}

export interface GoodAuction {
  goodValues: GoodValue[];
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodsSpecification[];
  properties: GoodProperty[];
  unitId: number;
  unitName: string;
}


export interface GoodOfferDemand {
  goodValues: GoodValue[];
  idNomenclatureGroup: number;
  nomenclatureGroup: string;
  idGoodGroup: number;
  goodGroup: string;
  idGoodName: number;
  idGood: number;
  goodName: string;
  goodDescription: string;
  goodsSpecifications: GoodsSpecification[];
  properties: GoodProperty[];
  unitId: number;
  unitName: string;
  isDeletedGood: boolean;
}

export interface GoodValue {
  idReference: number;
  referenceName: string;
  listValues: ReferenceValue[];
  isAllowAnalogs: boolean;
}

export interface ReferenceValue {
  idValue: number;
  valueName: string;
}

export interface GoodsSpecification {
  idDemandOfferGood: number;
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string;
  fieldName: string;
  fieldPrecision: number;
  controlFieldType: string;
  fieldValue: string;
  blockId: number;
  isVirtual: boolean;
}

export interface GoodProperty {
  propertyName: string;
  propertyValue: string;
}

export interface GeneralInfo {
  idDemandOffer: number;
  idDemandOfferParent: number;
  dateCreate: number;
  directionId: number;
  directionName: string;
  statusId: number;
  statusName: string;
  idModel: number;
  firmName: string;
  branchId: number;
  branchName: string;
  idClientContractType: number;
  clientId: number;
  clientName: string;
  lotNumber: number;
  idDeliveryScheduleType: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  concatedDeliveryPeriod: string;
  concatedPaymentConditions: string;
  rejectionReason: string;
  isCanReject: boolean;
  isCanRestoreRejected: boolean;
  pricingTypeId: number;
  isAllowedFilesPrivate: boolean;
  isAllowedFilesPublic: boolean;
  concatedMarketTypes: string;
  isWatched: boolean;
  isCanCalculateDeposit: boolean;
  traderFullName: string;
  traderTelephone: string;
  traderEmail: string;
  bidDateFinish: number;
  bidIsMyLeading: boolean;
  isCombinedMarketTypes: boolean;
  bidNumber: number;
  bidId: number;
  isMinPriceMainBasis: boolean;
  isInactiveByPriceCorridor: boolean;
  isInactiveByPriceQuotate: boolean;
  isInactiveByUnreliable: boolean;
  isExistCounterOffer: boolean;
  buyerInfo: BuyerInfo;
  isIndividualPriceStepUsed: boolean;
  purchasePurpose: string;
}

export interface BuyerInfo {
  idFirm: number;
  concatedFirmName: string;
  idClientContractType: number;
  concatedClientName: string;
  branchName: string;
  idTrader: number;
  traderName: string;
  traderTelephone: string;
  traderEmail: string;
}

export interface DeliveryCondition {
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
  priceStartWithoutVat: number;
  priceStartAdjustment: number;
  minPriceWithoutVat: number;
}

export interface DeliveryScope {
  idDemandOffer: number;
  idDemandOfferGood?: number;
  idFirmClient: number;
  volume: number;
  firmClientName: string;
}

export interface DeliverySchedulePeriod {
  idDemandOffer: number;
  idDemandOfferGood?: number;
  periodDateBegin: number;
  periodDateEnd: number;
  periodVolume: number;
}

export interface DeliverySchedulePeriodWithGoodInfo {
  idDemandOffer: number;
  idDemandOfferGood: number;
  periodDateBegin: number;
  periodDateEnd: number;
  periodVolume: number;
  idGood: number;
  goodName: string;
  unit: GoodCharacteristics[];
  properties: GoodProperty[];
}

export interface DeliveryPeriod {
  idDemandOffer: number;
  idDeliveryMoment: number;
  idDeliveryType: number;
  periodTypeValue: number;
  dateBegin: number;
  dateEnd: number;
}

export interface PayCondFull {
  idPaymentType: number | string;
  idDayType: number | string | null;
  idShipmentVolume: number | string;
  idPaymentMoment: number | string;
  periodValueNumber: number | string | null;
  periodValueDate: number | null;
}

export interface DeliveryTerms {
  idDeliveryMoment: number | string;
  idPeriodType: number | string;
  periodTypeValue: number | string;
  dateBegin: number | null;
  dateEnd: number | null;
}

export interface PaymentPart {
  idDayType: number | string | null;
  idShipmentVolume: number | string;
  idPaymentMomentPrepay: number | string;
  firstPercent: number;
  firstPeriodValueNumber: number | null;
  idPaymentMomentDelay: number | string;
  secondPercent: number;
  secondPeriodValueNumber: number | null;
  thirdPeriodValueNumber: number | null;
}

export interface PaymentCondition {
  idDemandOffer: number;
  idPaymentType: number;
  idDayType: string;
  idShipmentVolume: number;
  firstPaymentMomentId: number;
  firstPercent: number;
  firstPeriodValueNumber: number;
  firstPeriodValueDate: number;
  secondPaymentMomentId: number;
  secondPercent: number;
  secondPeriodValueNumber: number;
  thirdPeriodValueNumber: number;
}

export interface DocumentItem {
  idDemandOffer: number;
  idDocument: number;
  filename: string;
  uploadDate: number;
  isPrivate: boolean;
  content?: string;
}

export interface DocumentItemRefresh {
  idSection: number;
  idSession: number;
  documentName: string;
  documentExtension: string;
  documentContent: string;
  isPrivate: boolean;
}

export interface EditOfferDemandResponse {
  idDemandOfferCurrent: number;
  lotNumberCurrent: number;
  idDemandOfferRemains: number;
  lotNumberRemains: number;
}

export interface NsiGoodValue {
  idReference: number;
  listValues: number[];
  isAllowAnalogs: boolean;
}

interface Property {
  idInterfaceField: number;
  fieldValueNumber: number;
  fieldValueString: string;
  listFieldValues: number[];
}

interface SetDemandOffer {
  idDemandOffer: number;
  idSession: number;
  idModel: number;
  idFirmClient: number;
  idClientContractType: number;
  idBranch: number;
  idCurrency: number;
  vatPercent: number;
  idPriceAdjustment: number;
  isPriceAdjusted: boolean;
  idFinance: number;
  detailsImportDomestic: string;
  detailsExportForeign: string;
  listDeletedDocuments: number[];
  idDeliveryScheduleType: number;
}

interface EditPayCondFull {
  idPaymentType: number;
  idDayType: string;
  idShipmentVolume: number;
  idPaymentMoment: number;
  periodValueNumber: number;
  periodValueDate: number;
}

interface EditPaymentPart {
  idDayType: string;
  idShipmentVolume: number;
  idPaymentMomentPrepay: number;
  firstPercent: number;
  firstPeriodValueNumber: number;
  idPaymentMomentDelay: number;
  secondPercent: number;
  secondPeriodValueNumber: number;
  thirdPeriodValueNumber: number;
}

interface EditDeliveryPeriod {
  idDeliveryMoment: number;
  idPeriodType: number;
  periodTypeValue: number;
  dateBegin: number;
  dateEnd: number;
}

interface Rules {
  model: string;
  modelId: number;
  values: string;
  sessionsParams: string;
  generalParams: string;
  demandParams: string;
}

interface DemandGood {
  idGood: number;
  idGoodFromFront: number;
  nsiGoodValues: NsiGoodValue[];
  idGoodName: number;
  idGoodGroup: number;
  idNomenclature: number;
  minPriceWithoutVat: number;
  locationService: number;
  properties: Property[];
  priceWithoutVat?: number;
  priceAdjustment?: number;
  volume?: number;
  periodVolume?: number;
}

interface DemandDelivCondition {
  goods: DemandGood[];
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeDetails: string;
}

export interface DemandDelivScope {
  goods: DemandGood[];
  idFirmClient: number;
}

export interface DemandDelivSchPeriod {
  goods: DemandGood[];
  periodDateBegin: number;
  periodDateEnd: number;
  idPeriod: number;
}

interface Demand {
  idDirection: number;
  idSection: number;
  setDemandOffer: SetDemandOffer;
  goods: DemandGood[];
  payCondFull: PayCondFull;
  paymentPart: PaymentPart;
  deliveryPeriod: DeliveryPeriod;
  delivConditions: DemandDelivCondition[];
  delivScope: DemandDelivScope[];
  delivSchPeriods: DemandDelivSchPeriod[];
  idVatPercent: number;
  idVatQuote: number;
  rules: Rules;
}

interface OfferGood {
  idGood: number;
  idGoodFromFront: number;
  nsiGoodValues: NsiGoodValue[];
  idGoodName: number;
  idGoodGroup: number;
  idNomenclature: number;
  properties: Property[];
  priceWithoutVat?: number;
  priceAdjustment?: number;
  volume?: number;
  periodVolume?: number;
}

interface OfferDelivCondition {
  goods: OfferGood[];
  isMain: boolean;
  idBasisLink: number;
  idBasisValue: number;
  idPlaceLink: number;
  idPlaceValue: number;
  placeDetails: string;
}

export interface OfferDelivScope {
  goods: OfferGood[];
  idFirmClient: number;
}

export interface OfferDelivSchPeriod {
  goods: OfferGood[];
  periodDateBegin: number;
  periodDateEnd: number;
  idPeriod: number;
}

interface Offer {
  idDirection: number;
  idSection: number;
  setDemandOffer: SetDemandOffer;
  goods: OfferGood[];
  payCondFull: PayCondFull;
  paymentPart: PaymentPart;
  deliveryPeriod: DeliveryPeriod;
  delivConditions: OfferDelivCondition[];
  delivScope: OfferDelivScope[];
  delivSchPeriods: OfferDelivSchPeriod[];
  idVatPercent: number;
  idVatQuote: number;
  rules: Rules;
}

export interface DemandData {
  currentDemand: Demand;
  remainsDemand: Demand;
}

export interface OfferData {
  currentOffer: Offer;
  remainsOffer: Offer;
}

export interface IFieldProperty {
  referenceValue: string;
  referenceId: number;
  rangeLeftBound: number;
  rangeRightBound: number;
  dataType: string;
  isStringDataTypeApplicable: boolean;
  multiplicator: number;
  placeholder?: string;
}

export interface StandardizedProps {
  props: IFieldProperty[];
}

export interface GetByModelId {
  succeeded: boolean;
  data: Session[];
  message?: string;
  errors?: string[];
}

// Интерфейс для сессии
export interface Session {
  id: number;
  isDeleted: boolean;
  tradeSectionId: number;
  tradeTypeId: string;
  marketTypeIds: string[];
  sessionNameId: number;
  startDateTime: string | Date;
  applicationFormBuyerId: number;
  applicationFormSellerId: number;
  complexLotTypeId: string;
  quartzCountRepeat: number;
  quartzEndDateTime: string | Date;
  quartzExpression: string;
  quartzExceptions: string[];
  regularityId: string;
  deliveryBasisIds: string[];
  productsParams: ProductParam[];
  notes: string;
  isUpdated: boolean;
  isAllowedAnalogues: boolean;
  analogues: Analogue[];
  stageId: string;
  statusId: number;
  isManualStageChange: boolean;
  demandsCount: DemandsCount;
  endDate: string | Date;
  stagesScheduler: StageScheduler[];
  sessionTemplateId: number;
  sessionTemplateName: string;
  multiBasisTypeId: string;
  pricingTypeId: string;
  pricingTypeName: string;
  isAllowedFilesPublic: boolean;
  isAllowedFilesPrivate: boolean;
  isAllowedTargetedTransact: boolean;
  priceLimitParams: PriceLimitParam[];
  isCanCloseAgreementSigning: boolean;
  dateCloseAgreementSigning: string | Date;
}

export interface ProductParam {
  products: Product[];
  minLotValue: number;
  maxLotValue: number;
  lotUnitId: string;
}

export interface Product {
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
}

export interface Analogue {
  id: number;
  products: Product[];
}

export interface DemandsCount {
  numberRegsBuy: number;
  numberRegsSale: number;
  numberDemoffBuy: number;
  numberDemoffSale: number;
}

export interface StageScheduler {
  sessionId: number;
  stageId: string;
  startTime: string | Date;
  endTime: string | Date;
  nextStageId: string;
}

export interface PriceLimitParam {
  priceLimitMarketId: number;
  priceLimitMarketName: string;
  priceLimitSessionId: number;
  priceLimitSessionName: string;
}

export interface concatedCondition {
  result: string;
}
export interface INomenclaturesWithGroups {
  nomenclaturesWithGroups: NomenclaturesWithGroups[];
}

export interface NomenclaturesWithGroups {
  idLink: number;
  idValue: number;
  valueName: string;
  idReference: number;
  groups: IRefGroups[];
}

export interface IGoods {
  goods: IRefGroups[];
}

export interface IRefGroups {
  idLink: number;
  idValue: number;
  valueName: string;
  idReference: number;
}

export interface BasisGoods{
  id: number;
  name: string;
  volume: number;
  units: string;
  cost: number | null;
  currency: string;
  quotation: number;
  quoteCurrency: string;
  priceAdjustment: number;
  minPrice: number | null;
  maxPrice: number | null;
  minPriceField: number | null;
  isRequiredMinPrice: boolean;
  amendment: number | null;
  costVAT: number;
}

export interface DeliveryCondition{
  minAddBasisPlaces: number | null;
  contradictoryValueId: number | null;
  contradictoryBasisName: string | null;
  isRequiredPlace: boolean | null;
  isRequiredAddBasis: boolean;
  minAddBasis: number | null;
  placeName: string | null;
  placeTypeId: number | null;
  parentId: number;
  linkId: number;
  valueId: number;
  level: number;
  hasChildren: boolean;
  isIncoterm: boolean;
  basisId: number;
  basisName: string;
  children: DeliveryCondition[];
}

export interface TreesPlaceDetails {
  trees: TreesValue[];
}

export interface TreesValue {
  idLink: number;
  idLinkParent: number;
  idValue: number;
  valueName: string;
  lvl: number;
  disableCountries?: boolean;
  childCount?: number;
  hasLazyChildren?: boolean;
  isLazyPlaceholder?: boolean;
}

export interface PlaceSearchResult {
  items: TreesValue[];
  isBroadSearch: boolean;
  matchCount: number;
  matchIds: Set<number>;
}

export interface complexLotProductTypes {
  referenceIds: string[];
  typeId: string;
}

export interface DeliverySchedulePeriodGraded {
  idPeriod: number;
  periodDateBegin: number | string;
  periodDateEnd: number | string;
  periodVolume: number;
}

export interface DeliveryScopeGraded {
  idFirmClient: number;
  volume: number;
}

export interface sumVolumeGood {
  id: number;
  sumValue: number;
}

export interface DelivScope {
  idBroker: number;
  nameBroker: string;
  goods: ScopesGood[];
  volume: number;
}

export interface ScopesGood {
  goodId: number;
  goodName: string;
  volume: number;
  goodUnits: string;
  properties: GoodProperty[];
}

export interface CheckAnalogRequirements{
  idSection: number;
  idSession: number;
  idGoodName: number;
  listProperties: number[];
}

export interface CheckAnalogRequirementsResult {
  isAnyProductExist: boolean;
}


export interface AnalogueItem {
  idSessionAnalogues: number;
  lvl: number;
  idValue: number;
  valueName: string;
  idLink: number;
}

export interface GetAnaloguesBySessionResponse {
  analogues: AnalogueItem[];
}
export interface GroupedAnalogueItem {
  level: number;
  valueId: number;
  productName: string;
  linkId: number;
}

export interface GroupedAnalogue {
  id: number;
  products: GroupedAnalogueItem[];
}

@Injectable({
  providedIn: 'root',
})
export class CreateOfferService {
  private static readonly BROAD_SEARCH_MATCH_THRESHOLD = 30;
  private static readonly SHALLOW_SEARCH_MATCH_THRESHOLD = 10;
  private static readonly MAX_AUTO_EXPAND_ITEMS = 15;

  private placeTreeIndexSource: TreesValue[] | null = null;
  private childrenByParent = new Map<number, TreesValue[]>();
  private nodeById = new Map<number, TreesValue>();

  idOffer: number = null;
  sessionName: any = '';
  sectionName: any = '';
  sessionId: number = 0;
  sessionIdArchive: number = 0;
  sessionDateTime: number = 0;
  sectionId: number = 0;
  modelId: number = 0;
  choosenMarketType: string = '';
  direction: any;
  modelResult: any = [];
  isCreateCopy = false;
  isMine = false;

  isArchive: boolean;
  isArchiveSubmit: boolean; //подача заявка из архива
  unsold: boolean;

  model: string = '';

  demandsModal: any;

  listProperties: string;
  listGoods: string;

  cookieService = inject(CookieService);

  public standartdizePropsSubject = new BehaviorSubject<IFieldProperty[]>([]);
  public standartdizeProps$ = this.standartdizePropsSubject.asObservable();

  private OrderManagement: any = this.conf.OrderManagement;

  private urlNTS: any = this.conf.backendINV;
  private DemandsManagement: any = this.conf.DemandsManagement;
  private SessionsManagement: any = this.conf.SessionsManagement;
  private NSIManagement: any = this.conf.NSIManagement;
  private trading: any = this.conf.trading;

  constructor(private http: HttpClient, private conf: AppConfigService) {}

  public isComplexLotBySameCharacteristics(complexLotProductTypes: complexLotProductTypes[]): boolean {
    return !!(complexLotProductTypes?.length === 1 &&
      complexLotProductTypes.find(
        (el) => el.typeId === COMPLEX_LOT_PRODUCT_TYPE_ID &&
          el.referenceIds?.length === 1 &&
          el.referenceIds[0] === COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
      ));
  }

  public isSameGradesInSaleOffer(
    sectionId: number,
    complexLotProductTypes: complexLotProductTypes[],
    tradeTypeId: string,
    direction: number
  ): boolean {
    return sectionId === SECTIONS_TYPES.TIMBER &&
      this.isComplexLotBySameCharacteristics(complexLotProductTypes) &&
      Number(tradeTypeId) === AUCTION_TYPE.SIMPLE_SELLER_AUCTION &&
      direction === IdDirection.sale;
  }

  public isShowByPricingTypeField(field: any, pricingTypeId: number): boolean {
    const id = field?.interfaceField?.fieldId;

    if (ACTUAL_SIZE_READINESS_FIELDS.includes(id)) {
      return false;
    }

    switch (Number(pricingTypeId)) {
      case pricingType?.price:
        return !(
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.UNIT,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.CURRENCY,
            ID_INTERFACE_FIELD.VAT_RATE,
          ].includes(id) ||
          field?.costNoVAT ||
          field?.costVAT ||
          field?.amountVAT ||
          field?.amountVAT === 0
        );

      case pricingType?.formulaWithQuotation:
        return !(
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.UNIT,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.CURRENCY,
            ID_INTERFACE_FIELD.VAT_RATE,
            ID_INTERFACE_FIELD.AMENDMENT_TYPE,
            ID_INTERFACE_FIELD.AMENDMENT,
            ID_INTERFACE_FIELD.QUOTE_CURRENCY,
            ID_INTERFACE_FIELD.QUOTATION,
          ].includes(id) ||
          field?.costNoVAT ||
          field?.costVAT ||
          field?.amountVAT ||
          field?.amountVAT === 0
        );

      case pricingType?.formulaWithoutQuotation:
        return ![
          ID_INTERFACE_FIELD.QUANTITY,
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.CURRENCY,
          ID_INTERFACE_FIELD.VAT_RATE,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          ID_INTERFACE_FIELD.AMENDMENT,
        ].includes(id);

      default:
        return true;
    }
  }

  public isShowByPricingTypeSpecialField(
    field: any,
    pricingTypeId: number
  ): boolean {
    const id = field?.interfaceField?.fieldId;

    switch (Number(pricingTypeId)) {
      case pricingType?.price:
        return (
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.VAT_RATE,
          ].includes(id) ||
          field?.costNoVAT ||
          field?.costVAT ||
          field?.amountVAT ||
          field?.amountVAT === 0
        );

      case pricingType?.formulaWithQuotation:
        return (
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.VAT_RATE,
            ID_INTERFACE_FIELD.AMENDMENT,
            ID_INTERFACE_FIELD.QUOTATION,
          ].includes(id) ||
          field?.costNoVAT ||
          field?.costVAT ||
          field?.amountVAT ||
          field?.amountVAT === 0
        );

      case pricingType?.formulaWithoutQuotation:
        return [
          ID_INTERFACE_FIELD.QUANTITY,
          ID_INTERFACE_FIELD.VAT_RATE,
          ID_INTERFACE_FIELD.AMENDMENT,
        ].includes(id);

      default:
        return true;
    }
  }

  //получение роли
  GetRole(SessionKey: string): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .get(`${this.urlNTS}${this.OrderManagement}/Auth/GetRole`, {
        headers: myHeaders,
        context: new HttpContext().set(CACHING_ENABLED, true),
      })
      .pipe(shareReplay(1));
  }

  //получение id моделей
  GetModels(SessionKey, SectionId, SessionId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.DemandsManagement}/models/GetBySessionId?section_id=${SectionId}&session_id=${SessionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение данных о модели по id
  Get(SessionKey, SectionId, modelId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.DemandsManagement}/models/Get?model_id=${modelId}&section_id=${SectionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение типов рынка
  GetMarketsTypes(SessionKey, ModelsId: number[], SectionId, IdDirection) {
    this.model = '';

    for (let i = 0; i < ModelsId.length; i++) {
      this.model += '&ModelsId=' + ModelsId[i];
    }

    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetMarketsTypes?${this.model}&SectionId=${SectionId}&IdDirection=${IdDirection}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение сессии по id модели
  GetByModelId(
    SessionKey: string,
    SectionId: number,
    ModelsId: number,
    onlyActive: boolean
  ): Observable<GetByModelId> {
    const headerDict = {
      Authorization: SessionKey,
      'Section-Id': SectionId.toString(),
      lang: this.cookieService.get('UasLang'),
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http.get<GetByModelId>(
      `${this.urlNTS}${this.SessionsManagement}/sessions/GetByModelId?model_id=${ModelsId}&onlyActive=${onlyActive}`,
      requestOptions
    );
  }

  //получение даты окончания сессии
  GetSessionStageDateEnd(SessionKey, SectionId, SessionId, IdDirection) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetSessionStageDateEnd?IdSection=${SectionId}&IdSession=${SessionId}&IdDirection=${IdDirection}&IsForDemoff=true`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение вида торгов
  GetTradeTypes(SessionKey, SectionId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.NSIManagement}/options/GetTradeTypes?section_id=${SectionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение условий поставки
  GetDeliveryBasesTreeByModelId(SessionKey, ModelId, SectionId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.NSIManagement}/bases/GetDeliveryBasesTreeByModelId?model_id=${ModelId}&section_id=${SectionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //клиент брокера в зависимости от договора
  GetListClientsContract(
    SessionKey,
    SectionId,
    listSessions,
    IdDirection,
    ContractType
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Registration/GetListClientsContract?IdSection=${SectionId}&ListSessions=${listSessions}&IdDirection=${IdDirection}&ContractType=${ContractType}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //структурные брокера
  GetListBranchesClients(
    SessionKey,
    IdFirmClient,
    ContractType,
    SectionId,
    listSessions,
    IdDirection
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Registration/GetListBranchesClients?IdFirmClient=${IdFirmClient}&IdContractType=${ContractType}&IdSection=${SectionId}&ListSessions=${listSessions}&IdDirection=${IdDirection}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //контекстная проверка заполнения полей
  CheckDemoffOwnerState(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/Submission/CheckDemoffOwnerState`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //номенклатурная группа + товарная
  GetNomenclaturesWithGroups(SessionKey: string, IdSection, IdModel): Observable<INomenclaturesWithGroups> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .get<INomenclaturesWithGroups>(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetNomenclaturesWithGroups?IdSection=${IdSection}&IdModel=${IdModel}`,
        { headers: myHeaders }
      )
  }

  //список товаров
  GetGoodsListSubmission(SessionKey, IdSection, IdModel, IdGroup) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetGoodsListSubmission?IdSection=${IdSection}&IdGroup=${IdGroup}&IdModel=${IdModel}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //перечень справочников
  public getNomenclatureRefsSubmission(
    sessionKey: string,
    idSection: number,
    listThreeLinks: number[] | number
  ): Observable<ReferencesResponce> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http
      .get<ReferencesResponce>(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetNomenclatureRefsSubmission?IdSection=${idSection}&ListThreeLinks=${listThreeLinks}`,
        { headers: myHeaders }
      );
  }

  //перечень конкретных значений справочников
  public getFilterRefValuesSubmission(
    sessionKey: string,
    idSection: number,
    idReference: number,
    idGoodLink: number[] | number
  ): Observable<ReferencesValuesResponce> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http
      .get<ReferencesValuesResponce>(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetFilterRefValuesSubmission?IdSection=${idSection}&IdReference=${idReference}&IdGoodLink=${idGoodLink}`,
        { headers: myHeaders }
      );
  }

  // IdNomenclature, IdGroup, IdGood,
  //получение товаров из биржевого каталога
  GetGlobalCatalogSubmission(
    SessionKey,
    IdSection,
    IdModel,
    currentPage,
    SearchString,
    ListPropertiesStr,
    ListPropertiesInt,
    ListGoods
  ) {
    // IdSection=2&IdModel=61&IdNomenclature=12&IdGroup=12&IdGood=12&ListProperties=12&ListGoods=12&SearchString=12&CurrentPage=12

    let searchString =
      SearchString === undefined ? '' : '&SearchString=' + SearchString;
    /* let idNomenclature = IdNomenclature === null ? '' : '&IdNomenclature=' + IdNomenclature;
     let idGroup = IdGroup === null ? '' : '&IdGroup=' + IdGroup;
     let idGood = IdGood === null ? '' : '&IdGood=' + IdGood;*/

    /*  this.listProperties = '';
    for (let i = 0; i < ListProperties.length; i++) {
      this.listProperties += '&ListProperties=' + ListProperties[i]
    }
 */
    let listPropertiesStr = '';
    for (let i = 0; i < ListPropertiesStr.length; i++) {
      listPropertiesStr += '&ListPropertiesStr=' + ListPropertiesStr[i];
    }

    let listPropertiesInt = '';
    for (let i = 0; i < ListPropertiesInt.length; i++) {
      listPropertiesInt += '&ListPropertiesInt=' + ListPropertiesInt[i];
    }

    this.listGoods = '';
    for (let i = 0; i < ListGoods.length; i++) {
      this.listGoods += '&ListGoods=' + ListGoods[i];
    }
    // ${idNomenclature}${idGroup}${idGood}
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetGlobalCatalogSubmissionWithDesc?IdSection=${IdSection}&IdModel=${IdModel}&CurrentPage=${currentPage}${searchString}${listPropertiesStr}${listPropertiesInt}${this.listGoods}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  // IdNomenclature, IdGroup, IdGood
  //получение товаров из личного каталога
  GetPersonalCatalogSubmissionWithDesc(
    SessionKey,
    IdSection,
    IdModel,
    currentPage,
    SearchString,
    ListPropertiesStr,
    ListPropertiesInt,
    ListGoods
  ) {
    let searchString =
      SearchString === undefined ? '' : '&SearchString=' + SearchString;
    /*   let idNomenclature = IdNomenclature === null ? '' : '&IdNomenclature=' + IdNomenclature;
       let idGroup = IdGroup === null ? '' : '&IdGroup=' + IdGroup;
       let idGood = IdGood === null ? '' : '&IdGood=' + IdGood;*/

    let listPropertiesStr = '';
    for (let i = 0; i < ListPropertiesStr.length; i++) {
      listPropertiesStr += '&ListPropertiesStr=' + ListPropertiesStr[i];
    }

    let listPropertiesInt = '';
    for (let i = 0; i < ListPropertiesInt.length; i++) {
      listPropertiesInt += '&ListPropertiesInt=' + ListPropertiesInt[i];
    }

    this.listGoods = '';
    for (let i = 0; i < ListGoods.length; i++) {
      this.listGoods += '&ListGoods=' + ListGoods[i];
    }
    // ${idNomenclature}${idGroup}${idGood}
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetPersonalCatalogSubmissionWithDesc?IdSection=${IdSection}&IdModel=${IdModel}&CurrentPage=${currentPage}${searchString}${listPropertiesStr}${listPropertiesInt}${this.listGoods}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //краткое описание товара
  GetGoodDescriptionBrief(SessionKey, IdGood) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetGoodDescriptionBrief?IdGood=${IdGood}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //место поставки базиса
  public GetDeliveryPlacesTree(SessionKey: string, IdBasisLink: number): Observable<TreesPlaceDetails> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get<TreesPlaceDetails>(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetDeliveryPlacesTree?IdBasisLink=${IdBasisLink}`,
        { headers: myHeaders }
      );
  }

  //строка срок поставки
  GetDeliveryTermConcated(
    SessionKey,
    IdDeliveryMoment,
    IdPeriodType,
    PeriodTypeValue?,
    DateBegin?,
    DateEnd?
  ) {
    let periodTypeValue =
      PeriodTypeValue === null ? '' : '&PeriodTypeValue=' + PeriodTypeValue;
    let dateBegin = DateBegin === null ? '' : '&DateBegin=' + DateBegin;
    let dateEnd = DateEnd === null ? '' : '&DateEnd=' + DateEnd;

    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetDeliveryTermConcated?IdDeliveryMoment=${IdDeliveryMoment}&IdPeriodType=${IdPeriodType}${periodTypeValue}${dateBegin}${dateEnd}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //срок поставки
  GetModelsDeliveryConfig(SessionKey) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.NSIManagement}/classifiers/GetModelsDeliveryConfig`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //условия оплаты
  GetPaymentConfig(SessionKey, SectionId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.NSIManagement}/payment/GetPaymentConfig?section_id=${SectionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //строка условия оплаты
  GetPaymentTermConcated(
    SessionKey,
    IdPaymentType,
    IdPaymentCondition,
    FirstPeriodValueNumber,
    FirstPercent,
    FirstPeriodValueDate,
    SecondPercent,
    SecondPeriodValueNumber,
    ThirdPeriodValueNumber,
    IdDayType
  ) {
    let firstPeriodValueNumber =
      FirstPeriodValueNumber === null
        ? ''
        : '&FirstPeriodValueNumber=' + FirstPeriodValueNumber;
    let firstPeriodValueDate =
      FirstPeriodValueDate === null
        ? ''
        : '&FirstPeriodValueDate=' + FirstPeriodValueDate;
    let secondPercent =
      SecondPercent === null ? '' : '&SecondPercent=' + SecondPercent;
    let secondPeriodValueNumber =
      SecondPeriodValueNumber === null
        ? ''
        : '&SecondPeriodValueNumber=' + SecondPeriodValueNumber;
    let thirdPeriodValueNumber =
      ThirdPeriodValueNumber === null
        ? ''
        : '&ThirdPeriodValueNumber=' + ThirdPeriodValueNumber;
    let idDayType = IdDayType === null ? '' : '&IdDayType=' + IdDayType;

    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPaymentTermConcated?IdPaymentType=${IdPaymentType}&IdPaymentCondition=${IdPaymentCondition}${firstPeriodValueNumber}&FirstPercent=${FirstPercent}${firstPeriodValueDate}${secondPercent}${secondPeriodValueNumber}${thirdPeriodValueNumber}${idDayType}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //расчет контрольных сроков по условиям оплаты/поставки
  GetPayDelivDeadlines(
    SessionKey,
    IdSection,
    IdSession,
    isTargeted,
    IdPaymentType,
    IdMomentPrepay,
    IdMomentDelay,
    IdDayType,
    FirstPeriodValueNumber,
    FirstPeriodValueDate,
    SecondPeriodValueNumber,
    ThirdPeriodValueNumber,
    IdDeliveryMoment,
    IdPeriodType,
    PeriodTypeValue,
    DateBegin,
    DateEnd
  ) {
    let idMomentPrepay =
      IdMomentPrepay === null ? '' : '&IdMomentPrepay=' + IdMomentPrepay;
    let idMomentDelay =
      IdMomentDelay === null ? '' : '&IdMomentDelay=' + IdMomentDelay;
    let firstPeriodValueNumber =
      FirstPeriodValueNumber === null
        ? ''
        : '&FirstPeriodValueNumber=' + FirstPeriodValueNumber;
    let firstPeriodValueDate =
      FirstPeriodValueDate === null
        ? ''
        : '&FirstPeriodValueDate=' + FirstPeriodValueDate;
    let secondPeriodValueNumber =
      SecondPeriodValueNumber === null
        ? ''
        : '&SecondPeriodValueNumber=' + SecondPeriodValueNumber;
    let thirdPeriodValueNumber =
      ThirdPeriodValueNumber === null
        ? ''
        : '&ThirdPeriodValueNumber=' + ThirdPeriodValueNumber;
    let idDayType = IdDayType === null ? '' : '&IdDayType=' + IdDayType;
    let periodTypeValue =
      PeriodTypeValue === null ? '' : '&PeriodTypeValue=' + PeriodTypeValue;
    let dateBegin = DateBegin === null ? '' : '&DateBegin=' + DateBegin;
    let dateEnd = DateEnd === null ? '' : '&DateEnd=' + DateEnd;

    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPayDelivDeadlines?IdSection=${IdSection}&IdSession=${IdSession}&IsTargeted=${isTargeted}&IdPaymentType=${IdPaymentType}${idMomentPrepay}${idMomentDelay}${idDayType}${firstPeriodValueNumber}${firstPeriodValueDate}${secondPeriodValueNumber}${thirdPeriodValueNumber}&IdDeliveryMoment=${IdDeliveryMoment}&IdPeriodType=${IdPeriodType}${periodTypeValue}${dateBegin}${dateEnd}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение идентификатора набора условий
  DeterminePaymentCondId(
    SessionKey,
    IdPaymentType,
    IdShipmentVolume,
    IdPaymentMomentPrepay,
    IdPaymentMomentDelay
  ) {
    let idPaymentMomentPrepay =
      IdPaymentMomentPrepay === null
        ? ''
        : '&IdPaymentMomentPrepay=' + IdPaymentMomentPrepay;
    let idPaymentMomentDelay =
      IdPaymentMomentDelay === null
        ? ''
        : '&IdPaymentMomentDelay=' + IdPaymentMomentDelay;

    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/DeterminePaymentCondId?IdPaymentType=${IdPaymentType}&IdShipmentVolume=${IdShipmentVolume}${idPaymentMomentPrepay}${idPaymentMomentDelay}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение ограничений для файлов
  GetUploadFilesRestrict(SessionKey) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Documents/GetUploadFilesRestrict`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //проверка заявки
  ValidateOffer(SessionKey: string, body: any) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/Submission/ValidateOffer`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  // проверка товаров в составе лота
  public checkGoodCompatibility(
    sessionKey: string,
    idDirection: number,
    idDemandOffer: number
  ): Observable<GetGoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetGoodsResponse>(
      `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/CheckGoodCompatibility?IdDirection=${idDirection}&IdDemandOffer=${idDemandOffer}`,
      { headers: myHeaders }
    );
  }

  public getDeliveryCondConcated(
    sessionKey: string,
    IdBasisLink: number,
    IdPlaceLink?: number,
    PlaceDetails?: string
  ): Observable<concatedCondition> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let placeDetails =
      PlaceDetails === null ? '' : '&PlaceDetails=' + PlaceDetails;

    return this.http.get<concatedCondition>(
      `${this.urlNTS}${this.OrderManagement}/Submission/GetDeliveryCondConcated?IdBasisLink=${IdBasisLink}${idPlaceLink}${placeDetails}`,
      { headers: myHeaders }
    );
  }

  //подача заявки
  CollectOfferDataAndSend(
    SessionKey: string,
    body: any,
    sectionId
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http.post<any>(
      `${this.urlNTS}${this.OrderManagement}/Submission/CollectDataAndSend`,
      body,
      { headers: myHeaders }
    );
  }

  //получение сообщений при проверке
  ApplyRules(SessionKey, SectionId, body: any) {
    const headerDict = {
      Authorization: SessionKey,
      'Section-Id': SectionId.toString(), //сделать sectionId стринг обязательно!!!!!!!!!
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http
      .post(
        `${this.urlNTS}${this.DemandsManagement}/rules/ApplyRules`,
        body,
        requestOptions
      )
      .toPromise()
      .then((res) => res);
  }

  //получаем данные для редактирования заявки работником в торгах
  public getDemandOfferFullInfo(
    sessionKey: string,
    directionId: number,
    sectionId: number,
    sessionId: number,
    demandOfferId: number,
    currentTab: number,
    FilterIdCurrency?: string,
    IsNeedOriginal?: boolean
  ): Observable<OfferFullInfoResponse> {
    //currentTab 1-заявки, 2 - торги
    let filterIdCurrency =
      '&FilterIdCurrency=' + FilterIdCurrency;

    let isNeedOriginal =
      IsNeedOriginal ? '&IsNeedOriginal=' + true : '';

    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<OfferFullInfoResponse>(
        `${this.urlNTS}${this.trading}/DemandOffer/GetDemandOfferFullInfo?IdDirection=${directionId}&IdSection=${sectionId}&IdSession=${sessionId}&IdDemandOffer=${demandOfferId}&CurrentTab=${currentTab}${filterIdCurrency}${isNeedOriginal}`,
        { headers: myHeaders }
      )
  }

  public editOffer(
    sessionKey: string,
    body: OfferData
  ): Observable<EditOfferDemandResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<EditOfferDemandResponse>(
      `${this.urlNTS}${this.trading}/DemandOffer/EditOffer`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  public editDemand(
    sessionKey: string,
    body: DemandData
  ): Observable<EditOfferDemandResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<EditOfferDemandResponse>(
      `${this.urlNTS}${this.trading}/DemandOffer/EditDemand`,
      body,
      {
        headers: myHeaders,
      }
    );
  }

  //просмотр заявки из Каталога предложений
  GetWorkerOfferFullInfo(SessionKey, IdOffer, IdDirection) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetDemandOfferFullInfo?IdDirection=${IdDirection}&IdDemandOffer=${IdOffer}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получения информации о стандартизированных характеристиках товара
  GetStandardizedProps(SessionKey, IdGood) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetStandartdizedProps?IdGood=${IdGood}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res: StandardizedProps) => res);
  }

  //проверка минимального интервала
  CheckDimensionIntervals(SessionKey, body: any) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/Submission/CheckDimensionIntervals`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получение списка архивных заявок на основании которых подается заявка
  ArchiveGetListMasterWithDetails(
    SessionKey,
    IdSection,
    IdSession,
    IdModel,
    IdDirection,
    IsMeOnly?
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/ArchiveGetListMasterWithDetails?IdSection=${IdSection}&IdSession=${IdSession}&IdModel=${IdModel}&IdDirection=${IdDirection}&IsMeOnly=${IsMeOnly}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  // проверка товаров в составе лота (архив)
  public archieveCheckGoodCompatibility(
    sessionKey: string,
    idModel: number,
    idDirection: number,
    idDemandOffer: number
  ): Observable<GetGoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetGoodsResponse>(
      `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/ArchiveCheckGoodCompatibility?IdModel=${idModel}&IdDirection=${idDirection}&IdDemandOffer=${idDemandOffer}`,
      { headers: myHeaders }
    );
  }

  /*--------- адресные сделки ---------*/

  //контекстная проверка продавца
  CheckStateSeller(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.trading}/TargetedOffer/CheckStateSeller`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //контекстная проверка покупателя
  CheckStateBuyer(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.trading}/TargetedOffer/CheckStateBuyer`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения списка участников покупателей вместе со структурными подразделениями
  GetContractorsVisitors(SessionKey, IdFirmSeller) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idFirmSeller =
      IdFirmSeller === '' ? '' : '&IdFirmSeller=' + IdFirmSeller;
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetContractorsVisitors?${idFirmSeller}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения списка клиентов покупателей вместе со структурными подразделениями
  GetContractorsClients(SessionKey, IdFirmSeller, IdFirmBuyer) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idFirmSeller =
      IdFirmSeller === '' ? '' : 'IdFirmSeller=' + IdFirmSeller + '&';
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetContractorsClients?${idFirmSeller}IdFirmBuyer=${IdFirmBuyer}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения перечня товаров из биржевого каталога
  GetGlobalCatalogTarg(
    SessionKey,
    IdSection,
    IdSession,
    IdModel,
    ListPropertiesStr,
    ListPropertiesInt,
    SearchString,
    CurrentPage,
    IdMarketType
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let searchString =
      SearchString === undefined ? '' : '&SearchString=' + SearchString;
    let listPropertiesStr = '';
    for (let i = 0; i < ListPropertiesStr.length; i++) {
      listPropertiesStr += '&ListPropertiesStr=' + ListPropertiesStr[i];
    }

    let listPropertiesInt = '';
    for (let i = 0; i < ListPropertiesInt.length; i++) {
      listPropertiesInt += '&ListPropertiesInt=' + ListPropertiesInt[i];
    }

    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetGlobalCatalogTarg?IdSection=${IdSection}&IdSession=${IdSession}&IdModel=${IdModel}${listPropertiesStr}${listPropertiesInt}${searchString}&CurrentPage=${CurrentPage}&IdMarketType=${IdMarketType}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения перечня товаров из личного каталога
  GetPersonalCatalogTarg(
    SessionKey,
    IdSection,
    IdSession,
    IdModel,
    ListPropertiesStr,
    ListPropertiesInt,
    SearchString,
    CurrentPage,
    IdMarketType,
    IdFirmClient
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let searchString =
      SearchString === undefined ? '' : '&SearchString=' + SearchString;
    let listPropertiesStr = '';
    for (let i = 0; i < ListPropertiesStr.length; i++) {
      listPropertiesStr += '&ListPropertiesStr=' + ListPropertiesStr[i];
    }

    let listPropertiesInt = '';
    for (let i = 0; i < ListPropertiesInt.length; i++) {
      listPropertiesInt += '&ListPropertiesInt=' + ListPropertiesInt[i];
    }

    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetPersonalCatalogTarg?IdSection=${IdSection}&IdSession=${IdSession}&IdModel=${IdModel}${listPropertiesStr}${listPropertiesInt}${searchString}&CurrentPage=${CurrentPage}&IdMarketType=${IdMarketType}&IdFirmClient=${IdFirmClient}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения доступных для выбранного товара единиц измерения
  GetStatisticsUnits(SessionKey, IdSection, IdSession, IdMarketType, IdGood) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetStatisticsUnits?IdSection=${IdSection}&IdSession=${IdSession}&IdMarketType=${IdMarketType}&IdGood=${IdGood}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения доступных для выбранного товара условий оплаты
  GetStatisticsPayments(
    SessionKey,
    IdSection,
    IdSession,
    IdMarketType,
    IdGood,
    IdUnit
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetStatisticsPayments?IdSection=${IdSection}&IdSession=${IdSession}&IdMarketType=${IdMarketType}&IdGood=${IdGood}&IdUnit=${IdUnit}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения доступных для выбранного товара базисов поставки
  GetStatisticsBases(
    SessionKey,
    IdSection,
    IdSession,
    IdPaymentType,
    IdMarketType,
    IdGood,
    IdUnit
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetStatisticsBases?IdSection=${IdSection}&IdSession=${IdSession}&IdPaymentType=${IdPaymentType}&IdMarketType=${IdMarketType}&IdGood=${IdGood}&IdUnit=${IdUnit}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения списка доступных мест поставки
  GetStatisticsPlacesTree(
    SessionKey,
    IdSection,
    IdSession,
    IdPaymentType,
    IdMarketType,
    IdGood,
    IdUnit,
    IdBasisLink,
    IdBasisValue
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetStatisticsPlacesTree?IdSection=${IdSection}&IdSession=${IdSession}&IdPaymentType=${IdPaymentType}&IdMarketType=${IdMarketType}&IdGood=${IdGood}&IdUnit=${IdUnit}&IdBasisLink=${IdBasisLink}&IdBasisValue=${IdBasisValue}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получения средневзвешенной цены биржевого товара
  GetStatisticsPriceLimit(
    SessionKey,
    IdSection,
    IdSession,
    IdPaymentType,
    IdMarketType,
    IdCurrency,
    VatPercent,
    IdGood,
    IdUnit,
    IdBasisValue,
    IdPlaceLink
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idPlaceLink =
      IdPlaceLink === undefined || IdPlaceLink === null
        ? ''
        : '&IdPlaceLink=' + IdPlaceLink;

    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetStatisticsPriceLimit?IdSection=${IdSection}&IdSession=${IdSession}&IdPaymentType=${IdPaymentType}&IdMarketType=${IdMarketType}&IdCurrency=${IdCurrency}&VatPercent=${VatPercent}&IdGood=${IdGood}&IdUnit=${IdUnit}&IdBasisValue=${IdBasisValue}${idPlaceLink}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //подача адресной заявки
  SetOfferTargeted(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.trading}/TargetedOffer/SetOfferTargeted`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //Просмотр заявки
  GetOfferFullInfo(SessionKey, IdSection, IdSession, IdOffer) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetOfferFullInfo?IdSection=${IdSection}&IdSession=${IdSession}&IdOffer=${IdOffer}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //получение списка заявок на основании окторых подается с-х адресная
  TargetGetListMasterWithDetails(SessionKey, IdSection, IdSession) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/TargetGetListMasterWithDetails?IdSection=${IdSection}&IdSession=${IdSession}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //Просмотр адресной заявки с-х
  GetArchiveOfferFullInfo(
    SessionKey: string,
    IdDirection: number,
    IdSection: number,
    IdSession: number,
    IdDemandOffer: number
  ): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    const url = `${this.urlNTS}${this.trading}/TargetedOffer/GetArchiveDemandOfferFullInfo?IdDirection=${IdDirection}&IdSection=${IdSection}&IdSession=${IdSession}&IdDemandOffer=${IdDemandOffer}`;

    return this.http.get(url, { headers: myHeaders });
  }

  // Получение документа адресной заявки с-х
  public getArchiveOfferDocumentContent(
    sessionKey: string,
    idDirection: number,
    idDemandOffer: number,
    idDocument: number
  ): Observable<GetArchiveDocumentContentResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetArchiveDocumentContentResponse>(
      `${this.urlNTS}${this.trading}/TargetedOffer/GetArchiveDocumentContent?IdDirection=${idDirection}&IdDemandOffer=${idDemandOffer}&IdDocument=${idDocument}`,
      { headers: myHeaders }
    );
  }

  //Получение минимальной цены
  GetArchiveStatisticsPriceLimit(
    SessionKey,
    IdSection,
    IdSession,
    IdOfferArchive,
    IdPaymentType,
    IdCurrency,
    IdGood,
    IdUnit,
    IdBasisValue,
    IdPlaceLink?,
    IdCnfea?,
    IdDestination?
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    let idPlaceLink = IdPlaceLink === null ? '' : '&IdPlaceLink=' + IdPlaceLink;
    let idCnfea = IdCnfea === null ? '' : '&IdCnfea=' + IdCnfea;
    let idDestination =
      IdDestination === null ? '' : '&IdDestination=' + IdDestination;

    return this.http
      .get(
        `${this.urlNTS}${this.trading}/TargetedOffer/GetArchiveStatisticsPriceLimit?IdSection=${IdSection}&IdSession=${IdSession}&IdOfferArchive=${IdOfferArchive}&IdPaymentType=${IdPaymentType}&IdCurrency=${IdCurrency}&IdGood=${IdGood}&IdUnit=${IdUnit}&IdBasisValue=${IdBasisValue}${idPlaceLink}${idCnfea}${idDestination}`,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //проверка состояния выбранной заявки
  TargetedCheckOfferState(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.trading}/TargetedOffer/TargetedCheckOfferState`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  public sortActualFields(fields: FieldData[]): FieldData[] {
    const blockZeroFields = [];
    const otherFields = [];

    for (const field of fields) {
      if (field.interfaceField.blockId === 0) {
        blockZeroFields.push(field);
      } else {
        otherFields.push(field);
      }
    }

    blockZeroFields.sort((a, b) => a.sortBy - b.sortBy);
    return blockZeroFields.concat(otherFields);
  }

  public buildPlaceTreeIndex(placeDataBasis: TreesValue[]): void {
    if (this.placeTreeIndexSource === placeDataBasis && this.nodeById.size > 0) {
      return;
    }
    this.placeTreeIndexSource = placeDataBasis;
    this.childrenByParent.clear();
    this.nodeById.clear();

    for (const node of placeDataBasis) {
      this.nodeById.set(node.idLink, node);
      const parentId = node.idLinkParent != null ? Number(node.idLinkParent) : 0;
      if (!this.childrenByParent.has(parentId)) {
        this.childrenByParent.set(parentId, []);
      }
      this.childrenByParent.get(parentId).push(node);
    }
  }

  private ensurePlaceTreeIndex(placeDataBasis: TreesValue[]): void {
    this.buildPlaceTreeIndex(placeDataBasis);
  }

  private addAncestors(idLink: number, resultIds: Set<number>): void {
    let current: TreesValue = this.nodeById.get(idLink);
    while (current?.idLinkParent != null) {
      resultIds.add(current.idLinkParent);
      current = this.nodeById.get(current.idLinkParent);
    }
  }

  private addAllDescendants(parentId: number, resultIds: Set<number>): void {
    const children: TreesValue[] = this.childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      if (!resultIds.has(child.idLink)) {
        resultIds.add(child.idLink);
        this.addAllDescendants(child.idLink, resultIds);
      }
    }
  }

  private markLazyChildren(
    node: TreesValue,
    childCount: number,
    lazyMeta: Map<number, Partial<TreesValue>>,
    placeholders: TreesValue[],
    resultIds: Set<number>
  ): void {
    lazyMeta.set(node.idLink, {
      childCount,
      hasLazyChildren: true,
    });
    const placeholder: TreesValue = this.createLazyPlaceholder(
      node.idLink,
      node.lvl,
      childCount
    );
    placeholders.push(placeholder);
    resultIds.add(placeholder.idLink);
  }

  private createLazyPlaceholder(
    parentId: number,
    parentLvl: number,
    childCount: number
  ): TreesValue {
    return {
      idLink: -Math.abs(parentId),
      idLinkParent: parentId,
      idValue: -Math.abs(parentId),
      valueName: '',
      lvl: parentLvl + 1,
      isLazyPlaceholder: true,
      childCount,
    };
  }

  private addDirectChildren(
    parentId: number,
    resultIds: Set<number>,
    lazyMeta: Map<number, Partial<TreesValue>>,
    placeholders: TreesValue[]
  ): void {
    const children: TreesValue[] = this.childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      if (resultIds.has(child.idLink)) {
        continue;
      }
      resultIds.add(child.idLink);
      const grandChildren: TreesValue[] = this.childrenByParent.get(child.idLink) ?? [];
      if (grandChildren.length > 0) {
        this.markLazyChildren(
          child,
          grandChildren.length,
          lazyMeta,
          placeholders,
          resultIds
        );
      }
    }
  }

  private addDescendantsUpToLevel(
    parentId: number,
    resultIds: Set<number>,
    maxLvl: number,
    lazyMeta: Map<number, Partial<TreesValue>>,
    placeholders: TreesValue[]
  ): void {
    const children: TreesValue[] = this.childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      if (resultIds.has(child.idLink) || child.lvl > maxLvl) {
        continue;
      }

      resultIds.add(child.idLink);

      if (child.lvl === maxLvl) {
        const deeperChildren: TreesValue[] = this.childrenByParent.get(child.idLink) ?? [];
        if (deeperChildren.length > 0) {
          this.markLazyChildren(
            child,
            deeperChildren.length,
            lazyMeta,
            placeholders,
            resultIds
          );
        }
        continue;
      }

      this.addDescendantsUpToLevel(
        child.idLink,
        resultIds,
        maxLvl,
        lazyMeta,
        placeholders
      );
    }
  }

  public getFilteredDataWithParents(
    placeDataBasis: TreesValue[],
    searchText: string
  ): PlaceSearchResult {
    this.ensurePlaceTreeIndex(placeDataBasis);

    const matches: TreesValue[] = placeDataBasis.filter((item: TreesValue) =>
      item.valueName.toLowerCase().includes(searchText)
    );
    const resultIds = new Set<number>();
    const matchIds = new Set<number>(matches.map((m) => m.idLink));
    const lazyMeta = new Map<number, Partial<TreesValue>>();
    const placeholders: TreesValue[] = [];

    const hasHighLevelMatch: boolean = matches.some((m: TreesValue) => m.lvl <= DeliveryPlaceTreeLevel.REGION);
    const isBroadSearch: boolean =
      hasHighLevelMatch ||
      matches.length > CreateOfferService.BROAD_SEARCH_MATCH_THRESHOLD;

    for (const match of matches) {
      resultIds.add(match.idLink);
      this.addAncestors(match.idLink, resultIds);

      if (match.lvl <= DeliveryPlaceTreeLevel.REGION) {
        if (matches.length > CreateOfferService.SHALLOW_SEARCH_MATCH_THRESHOLD) {
          this.addDirectChildren(match.idLink, resultIds, lazyMeta, placeholders);
        } else {
          this.addDescendantsUpToLevel(
            match.idLink,
            resultIds,
            DeliveryPlaceTreeLevel.DISTRICT,
            lazyMeta,
            placeholders
          );
        }
      } else {
        this.addAllDescendants(match.idLink, resultIds);
      }
    }

    const items: TreesValue[] = [
      ...placeDataBasis
        .filter((item) => resultIds.has(item.idLink))
        .map((item) => {
          const meta = lazyMeta.get(item.idLink);
          return meta ? { ...item, ...meta } : item;
        }),
      ...placeholders,
    ];

    return {
      items,
      isBroadSearch,
      matchCount: matches.length,
      matchIds,
    };
  }

  public appendLazyChildren(
    placeDataBasis: TreesValue[],
    currentFiltered: TreesValue[],
    parentId: number,
    _broadSearchMatchIds?: Set<number>
  ): TreesValue[] {
    this.ensurePlaceTreeIndex(placeDataBasis);

    const withoutPlaceholders: TreesValue[] = currentFiltered.filter(
      (item) =>
        !item.isLazyPlaceholder ||
        Number(item.idLinkParent) !== Number(parentId)
    );

    const existingIds: Set<number> = new Set(
      withoutPlaceholders
        .filter((item) => !item.isLazyPlaceholder)
        .map((item) => item.idLink)
    );

    const children: TreesValue[] = this.childrenByParent.get(parentId) ?? [];
    const placeholders: TreesValue[] = [];
    const toAdd: TreesValue[] = [];

    for (const child of children) {
      if (existingIds.has(child.idLink)) {
        continue;
      }

      const grandChildren: TreesValue[] = this.childrenByParent.get(child.idLink) ?? [];
      const unloadedGrandChildren: TreesValue[] = grandChildren.filter(
        (grandChild) => !existingIds.has(grandChild.idLink)
      );

      if (unloadedGrandChildren.length > 0 && child.lvl < DeliveryPlaceTreeLevel.SETTLEMENT) {
        toAdd.push({
          ...child,
          childCount: unloadedGrandChildren.length,
          hasLazyChildren: true,
        });
        placeholders.push(
          this.createLazyPlaceholder(
            child.idLink,
            child.lvl,
            unloadedGrandChildren.length
          )
        );
      } else {
        toAdd.push({ ...child });
      }
    }

    if (!toAdd.length) {
      return currentFiltered;
    }

    const clearedParent: TreesValue[] = withoutPlaceholders.map((item) =>
      Number(item.idLink) === Number(parentId)
        ? { ...item, hasLazyChildren: false, childCount: undefined }
        : item
    );

    return [...clearedParent, ...toAdd, ...placeholders];
  }

  public applyPlaceTreeSearch(
    searchValue: string,
    placeDataBasis: TreesValue[],
    treeViewInstance: TreeView
  ): PlaceSearchResult {
    const searchTextLength: number = searchValue?.length ?? 0;
    let result: PlaceSearchResult;

    treeViewInstance.beginUpdate();
    try {
      if (searchTextLength === 0) {
        treeViewInstance.option('dataSource', []);
        treeViewInstance.repaint();
        treeViewInstance.option('dataSource', placeDataBasis);
        treeViewInstance.collapseAll();
        treeViewInstance.repaint();
        treeViewInstance.option('searchValue', '');

        result = {
          items: placeDataBasis,
          isBroadSearch: false,
          matchCount: 0,
          matchIds: new Set<number>(),
        };
      } else {
        result = this.getFilteredDataWithParents(
          placeDataBasis,
          searchValue.toLowerCase()
        );
        treeViewInstance.option('dataSource', result.items);
      }
    } finally {
      treeViewInstance.endUpdate();
    }

    if (searchTextLength > 0) {
      this.expandSearchMatches(treeViewInstance, result);
    }

    return result;
  }

  private expandSearchMatches(
    treeViewInstance: TreeView,
    result: PlaceSearchResult
  ): void {
    if (!result.isBroadSearch) {
      treeViewInstance.expandAll();
      return;
    }

    const matchesToExpand: TreesValue[] = result.items.filter((item) =>
      result.matchIds.has(item.idLink)
    );
    if (matchesToExpand.length > CreateOfferService.MAX_AUTO_EXPAND_ITEMS) {
      return;
    }

    for (const item of matchesToExpand) {
      try {
        treeViewInstance.expandItem(item.idLink);
      } catch {
        // узел может отсутствовать в текущем dataSource
      }
    }
  }

  public searchTxtBoxValueChange(
    e: ValueChangedEvent,
    placeDataBasis: TreesValue[],
    treeViewInstance: TreeView
  ): PlaceSearchResult {
    return this.applyPlaceTreeSearch(e.value, placeDataBasis, treeViewInstance);
  }

  public isValueInTheArray(array: any[], value: string, key: string = 'id'): boolean {
    return array?.find(el => el?.[key] === value);
  }

  public onCellPreparedDelivScope(event: CellPreparedEvent, goodsListCount: number, isSameGarade: boolean): void {
    if (isSameGarade) {
      if (event.rowType === 'data' && event.column.dataField === 'volume') {
        const dataGrid: dxDataGrid<any, any> = event.component;
        const visibleRows: Row[] = dataGrid.getVisibleRows();
        const rowIndex: number = event.rowIndex;
        const currentData: any = event.data;

        if (rowIndex > 0 && visibleRows[rowIndex - 1].data?.volume === currentData?.volume) {
          event.cellElement.style.display = 'none';
          return;
        }

        let rowSpan: number = goodsListCount;

        if (rowSpan > 1) {
          event.cellElement.setAttribute('rowspan', rowSpan.toString());
          event.cellElement.style.verticalAlign = 'middle';
        }
      }
    }
  }

  public checkAnalogRequirements(SessionKey, body: CheckAnalogRequirements): Observable<CheckAnalogRequirementsResult> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post<CheckAnalogRequirementsResult>(
        `${this.urlNTS}${this.OrderManagement}/Submission/CheckAnalogRequirements`,
        body,
        { headers: myHeaders }
      );
  }

  //получение сведений об аналогах на сессию
  public getAnaloguesBySession(
    sectionId: number,
    sessionId: number
  ): Observable<GetAnaloguesBySessionResponse> {
    return this.http.get<GetAnaloguesBySessionResponse>(
      `${this.urlNTS}${this.OrderManagement}/Submission/GetAnaloguesBySession?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }
}
