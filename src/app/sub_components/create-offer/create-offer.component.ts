/* eslint-disable */
import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AddGoodToCatalogResult, FiltersService } from '../filters/filters.service';
import { User } from '../../core/classes/user';
import { CommonService, IContractType } from '../../core/services/common-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CreateOfferService,
  EditOfferDemandResponse,
  PayCondFull,
  PaymentPart,
  DeliveryTerms,
  DocumentItem,
  DocumentItemRefresh,
  INomenclaturesWithGroups,
  IGoods,
  DeliverySchedulePeriodWithGoodInfo,
  DeliverySchedulePeriodGraded,
  DemandDelivSchPeriod,
  OfferDelivSchPeriod,
  DemandDelivScope,
  OfferDelivScope,
  DeliveryScopeGraded,
  NsiGoodValue,
  sumVolumeGood,
  DelivScope,
  CheckAnalogRequirements,
  ScopesGood,
  GetAnaloguesBySessionResponse,
  AnalogueItem,
  GroupedAnalogue,
  GroupedAnalogueItem
} from '../../core/services/create-offer-service.service';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru-BY';
import {
  role,
  searchIcon,
  minDeliveryScheduleDaysCount,
  termsConditionsPaymentConst,
  pricingType,
  maxLengthTextArea,
  IdDirection,
  GOOD_REF_ID,
  VALIDATION_ERROR,
  ErrorStates,
  NO_DEMAND_OFFER_ID,
  levelProductBlock,
  SORT_ID_ACTUAL_FIELDS,
  AUCTION_TYPE,
  ACTUAL_SIZE_READINESS_FIELDS,
  CURRENT_TAB_FROM_AUCTIONS,
  REF_ID,
  ID_DELIVERY_TERM,
  ACTUAL_SIZE_FIELDS,
  ID_DOCUMENT,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  COMPLEX_LOT_PRODUCT_TYPE_ID,
  sectionID,
  ID_DELIVERY_TERM_TYPE,
  BLOCK_ID_FIELDS,
  STEPS_TO_APPLY,
  TIMBER_TICKET,
  FILES_TYPE,
  ID_WITHOUT_VAT,
  OFFERS_ADJUSTMENT_PERIOD,
} from 'src/app/api.constants';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';
import { SessionsScheduleService } from 'src/app/core/services/sessions-schedule.service';
import { GoodDescriptionFull, SidebarService } from 'src/app/core/services/sidebar-service.service';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import {
  DxDataGridComponent,
  DxPopupComponent,
  DxValidationGroupComponent,
  DxValidatorComponent,
} from 'devextreme-angular';
import moment from 'moment';
import { Location } from '@angular/common';
import { OfferManagementService } from '../../core/services/offer-management-service.service';
import { ComponentCanDeactivate } from '../../core/guard/redirect.guard';
import { first, firstValueFrom, interval, Observable, Subject, tap } from 'rxjs';
import { custom } from 'devextreme/ui/dialog';
import { CatalogService } from '../../core/services/catalog-service.service';
import {
  CollectOfferResponse,
  DataSourceOption,
  FieldData,
  InterfaceField,
  IServiceError
} from 'src/app/core/interfaces/interface';
import { takeUntil } from 'rxjs';
import { POPUP_DIMENSIONS } from './constants';
import { poopupDimensionsType } from './interfaces';
import { GOODS_FIELDS_BLOCK, popupDeminsionsEnum, SCHEDULE_BLOCK, SCOPE_BLOCK, SUM_GOOD_VOLUME_BLOCK } from './enums';
import { AppConfigService } from '../../app-config.service';
import { DemandOffer } from '../../shared/services/report-service';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { addGoodFromNSI, AddNsiGoodService, FullCharacteristics } from "../../core/services/add-nsi-good.service";
import { createEndObjectForRule } from "../../core/helpers/createObjectForRules";
import { Store } from "@ngrx/store";
import { setLoading } from "../../store/settings/settings.action";
import { excelToJSDate, getTranslateResultByCurrentLang } from "../../core/helpers";
import { localeDependentDate } from "../../core/helpers/locale-dependent-date";
import { SumVolumePipe } from "../../shared/pipes/sumVolume/sum-volume.pipe";
import { ErrorServiceService } from "../../core/services/error-service.service";
import { SERVER_ERROR_CODE } from "../../core/constants";
import { PriceLimitCorridor, PriceLimitQuotation } from "../../shared/interfaces";

@Component({
  selector: 'app-create-offer',
  templateUrl: './create-offer.component.html',
  styleUrls: ['./create-offer.component.scss'],
})
export class CreateOfferComponent
  implements OnInit, ComponentCanDeactivate, OnDestroy
{
  @ViewChild('dataGridDeliveryCondition', { static: false })
  dataGrid: DxDataGridComponent;
  @ViewChild('generalInfo', { static: false })
  generalInfoValidationGroup: DxValidationGroupComponent;
  @ViewChild('deliveryTerm', { static: false })
  deliveryTermValidationGroup: DxValidationGroupComponent;
  @ViewChild('termsPayment', { static: false })
  validationGroup: DxValidationGroupComponent;

  private destroy$ = new Subject<void>();
  private destroyWaiting$ = new Subject<void>();

  user: User;
  locale: string;

  role: any;
  UserRole: number;
  ListBranchesAllClients: any;
  ListBranchesFirm: any;
  contractType: any;
  disabledAssignments = true;
  disabledCommission = true;

  clientActive = false;
  branchActive = false;

  listBranch = [];
  branchesFirmsOfAllClients = [];
  brokerClient = [];
  listClientBranch = [];

  activeStep = 1;

  sessionName: string;
  sectionName: string;
  sessionId: number;
  sessionDateTime: number;
  sectionId: number;
  modelId: number;
  choosenMarketType: string;
  modelsResult: any = [];
  currentStageDateEnd: any;
  tradeTypes: any = [];
  direction: any;
  demandsModal: any;
  loadingVisible = false;

  isAnalogSession = false; //сессия с аналогом или без аналогов
  IdDirection = IdDirection;

  pricingType = pricingType;

  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  goodsList = [];

  goods = [];

  good: any;
  chooseGoodForm = false;
  goodInfo = false;
  viewInfoGood = null;
  editInfoGood = null;

  chooseTheWay = false;

  refs = [];
  refsValues = [];
  catalogProducts = [];

  // sections = [];
  nomenclaturesWithGroups = [];
  goodsGroup = [];
  goodsValue = [];
  searchIcon: any;

  error = false;
  messageError: string;
  errorState: number;
  ErrorStates = ErrorStates;
  errorDeletedGood = false;

  errorFromEdit: any; //Любая ошибка при редактировании, при которой не смогли не загрузиться данные

  popupForm = false;
  popupMessage: string;
  popupTitle: string;
  popupButton = true;

  chooseGood = this.formBuilder.group({
    catalogTypes: ['global'],
    searchParameters: [''],
    nomenclaturesWithGroups: [],
    goodsGroup: [],
    goods: [],
  });

  generalInfoStep = this.formBuilder.group({
    participant: [],
    contractType: [],
    brokerClient: [null],
    listClientBranch: [null],
    listBranch: [null],
    brokerClientWorker: [],
    listClientBranchWorker: [],
    listBranchWorker: [],
  });

  sectionDescription: any;
  currentPage: number = 1;
  totalPages: number;
  totalCount: number;

  listProperties = [];

  listPropertiesStr = [];
  listPropertiesInt = [];

  firstElement = false; // первый элемент в массиве товаров
  isFirstStep = true; //первый раз переходим с первого на второй шаг
  public isFirstOnCommonStep = true; //первый раз переходим с четвертого шага на пятый
  // пересечения
  deliveryConditions = [];
  deliverySchedule = [];
  deliveryTerm = [];
  termsConditionsPayment = [];
  currencyConditions = [];
  vatConditions = [];
  financeSourcesConditions = [];
  currencyQuotesConditions = [];
  destinationConditions = false;
  adjustablePriceConditions: boolean;
  isDaysCountCorrect = false;

  blockModal: any;
  goodGroup: any;

  filledFields: any;

  deliveryBasis = []; //базисы поставки
  addBasisValue = false;
  deliverySchedulePopup = false;

  delivScopePopup = false; //грузополучатели
  delivScope = []; //массив грузополучателей

  public readonly popupDimensions = POPUP_DIMENSIONS;

  public choosenPopup: poopupDimensionsType =
    popupDeminsionsEnum.CHOOSE_ADD_GOOD;

  //срок поставки
  deliveryTermForm = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [40, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]],
  });
  deliveryTermType = [];
  schedule = [];
  sumVolumeGoodSchedule = [];

  @ViewChild('endValidator', { static: false })
  endValidator: DxValidatorComponent;

  today = new Date();
  isPriceRangeWarning = false; //показывает есть ли цены в базисах не в ценовом коридоре

  termsPaymentForm = this.formBuilder.group({
    termsPayment: [],
    volume: [],
    prepaymentAmount: [],
    momentPrepayment: [],
    prepaymentPeriod: [],
    prepaymentPeriodNumber: [],
    prepaymentPeriodDate: [],
    defermentAmount: [],
    momentDelay: [],
    defermentPeriodNumber: [],
    defermentPeriodDate: [],
    defermentAmount2: [],
    momentDelay2: [],
    defermentPeriod2: [],
    dayTypeId: [],
  });

  termsConditionsPaymentConst: any;
  paymentConfig: any;

  chooseSession = [];

  commonParametersForm = this.formBuilder.group({
    additionalTermsDomestic: [],
    additionalTermsForeign: [],
  });

  maxLengthTextArea = maxLengthTextArea;

  commonFiles = [];
  hiddenFiles = [];
  documents = [];

  maxSingleSize: number;
  maxSizeBatch: number;
  extensions: string;

  checkOfferMessages = []; //Массив ошибок при проверке заявки
  checkOfferError: boolean = false; //форма ошибок
  checkButtons: boolean = false; //кнопки на форме ошибок (вернуться к заполнению)

  isVisible = false;
  message: string;

  isVisibleToast = false;
  toastMessage: string;
  previewVisible = false;

  contractTypeChoose;
  brokerClientChoose = [];
  listBranchChoose;
  deliveryTermScheduleChoose;

  volumePrecision; //точность количества
  currencyPrecision; //точность валюты
  quoteCurrencyPrecision; //точность валюты котировки
  createOffer: any;
  compatibilityGoodsInfo: any; //значение по товарам из архива

  isChangesSaved: boolean = false; //сохранены ли изменения

  /*  РЕДАКТИРОВАНИЕ ЗАЯВКИ*/
  idOffer: number; //idOffer для редактирования заявки
  offerGeneral: any; // общая информация по заявке
  offerGoods = []; // информация по товарам по заявке
  offerDeliveryScopes = []; // грузоотправители/ грузополучатели по заявке
  offerDelivSchPeriods = []; //график поставки по заявке
  offerDeliveryConditions = []; //условия поставки по заявке
  offerDocuments = []; //документы по заявке
  offerDeliveryPeriod: any; //срок оплаты по заявке
  offerPaymentCond: any; //условия оплаты по заявке

  disabledContractType = false; //задизэйблить тип договора

  deleteDocuments = []; //массив удаленных документов

  isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты

  NSIlistProperty = []; //список свойств характеристик при добавлении товара через НСИ
  chooseAddGood = false; //форма выбора откуда добавлять товар
  addGoodNSI = false; //Добавить товар из НСИ
  addFromCatalog = false; //Добавить товар из каталога
  allCharacteristics = [];
  dayTypePaymentConfig: any; //Справочник календарных и банковских дней
  DateSession: any;
  DateSessionPlusDay: Date;

  popupCreateCopy = false; //предварительное окошко перед подачей копии заявки

  isMine = false;
  isCreateCopy = false;
  isArchiveSubmit = false; //подача заявки на основе архивной

  goodRefId = GOOD_REF_ID;
  characteristicsNSI = this.formBuilder.group({});

  public addGoodNSIForm: FormGroup = this.formBuilder.group({
    nomenclaturesWithGroups: [],
    goodsGroup: [],
    goods: [],
  });

  chooseAddGoodForm = this.formBuilder.group({
    chooseAddGood: ['catalog'],
  });

  isActiveQuotation = false; //наличие контроля по ценовым параметрам котировки
  isActiveCorridor = false; //наличие контроля по ценовым параметрам коридора

  public readonly ID_DOCUMENT = ID_DOCUMENT;
  public readonly sectionID = sectionID;

  public isAdjustedPriceResetError: boolean = false;

  public fullData: FullCharacteristics[];
  public isFullDataReady: boolean = false;
  public isSameGradesInSaleOffer: boolean = false;
  private sumVolumePipe = inject(SumVolumePipe);
  private readonly errorServiceService: ErrorServiceService = inject(ErrorServiceService);
  private isCheckingComplete: boolean = false;   //флаг при вополнении проверки на котировку и ценовой коридор

  constructor(
    private formBuilder: FormBuilder,
    public filtersService: FiltersService,
    public commonService: CommonService,
    public router: Router,
    private createOfferService: CreateOfferService,
    public translate: TranslateService,
    public sessionsScheduleService: SessionsScheduleService,
    private route: ActivatedRoute,
    private sidebarService: SidebarService,
    private location: Location,
    public catalogService: CatalogService,
    public offerManagementService: OfferManagementService,
    public config: AppConfigService,
    private pageMeta: PageMetaService,
    private addNsiGoodService: AddNsiGoodService,
    private store: Store
  ) {
    this.locale = this.translate.currentLang;
    //для перевода времени
    registerLocaleData(localeRu);

    this.termsConditionsPaymentConst = termsConditionsPaymentConst;
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.searchIcon = searchIcon;
    this.role = role;

    //для редактирования работником в торгах
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const offerParam = urlParams.get('offer');

      if (offerParam) {
        this.createOffer = JSON.parse(decodeURIComponent(offerParam));
        sessionStorage.setItem('createOffer', JSON.stringify(this.createOffer));
      }
    }

    this.createOffer = JSON.parse(sessionStorage.getItem('createOffer')) || {
      idOffer: this.createOfferService.idOffer,
      sessionName: this.createOfferService.sessionName,
      sectionName: this.createOfferService.sectionName,
      sessionDateTime: this.createOfferService.sessionDateTime,
      sessionId: this.createOfferService.sessionId,
      sectionId: this.createOfferService.sectionId,
      sessionIdArchive: this.createOfferService.sessionIdArchive,
      modelId: this.createOfferService.modelId,
      choosenMarketType: this.createOfferService.choosenMarketType,
      direction: this.createOfferService.direction,
      modelsResult: this.createOfferService.modelResult,
      demandsModal: this.createOfferService.demandsModal,
      isMine: this.createOfferService.isMine,
      isCreateCopy: this.createOfferService.isCreateCopy,
      isArchiveSubmit: this.createOfferService.isArchiveSubmit,
    };

    this.idOffer = this.createOffer.idOffer;
    this.isMine = this.createOffer.isMine;
    this.isArchiveSubmit = this.createOffer.isArchiveSubmit;
    this.isCreateCopy = this.createOffer.isCreateCopy;
    this.direction = this.createOffer.direction;
    this.sessionId = this.createOffer.sessionId;
    this.sectionId = this.createOffer.sectionId;
    this.modelId = this.createOffer.modelId;

    if (!this.sessionId) {
      this.error = true;
      this.errorState = ErrorStates.error;
      this.errorFromEdit = true;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['createOffer'].duplicateMessage
          : EN['createOffer'].duplicateMessage;
      return;
    }

    this.GetRole();

    if (this.idOffer && this.direction) {
      //РЕДАКТИРОВНАИЕ
      if (this.isArchiveSubmit) {
        this.getFullInfoArchive();
      } else if (this.createOffer?.modelsResult?.type === 'editAuctionOffer') {
        this.getFullInfoAuction();
      } else this.getFullInfo();
    }

    if (this.createOfferService.sessionId) {
      sessionStorage.setItem('createOffer', JSON.stringify(this.createOffer));
    }

    let CREATE_OFFER_TITLE = 'Title';
    if (this.direction == IdDirection.buy && !this.idOffer) {
      CREATE_OFFER_TITLE =
        this.translate.store.currentLang == 'RU'
          ? RU['createOffer'].createPurchaseRequisition
          : EN['createOffer'].createPurchaseRequisition;
    }
    if (this.direction == IdDirection.sale && !this.idOffer) {
      CREATE_OFFER_TITLE =
        this.translate.store.currentLang == 'RU'
          ? RU['createOffer'].createSalesRequisition
          : EN['createOffer'].createSalesRequisition;
    }
    if (this.idOffer && !this.isCreateCopy && !this.isArchiveSubmit) {
      CREATE_OFFER_TITLE =
        this.translate.store.currentLang == 'RU'
          ? RU['createOffer'].editingApplication
          : EN['createOffer'].editingApplication;
    }
    if (this.idOffer && (this.isCreateCopy || this.isArchiveSubmit)) {
      if (this.direction == IdDirection.buy) {
        CREATE_OFFER_TITLE =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].createPurchaseRequisition
            : EN['createOffer'].createPurchaseRequisition;
      } else {
        CREATE_OFFER_TITLE =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].createSalesRequisition
            : EN['createOffer'].createSalesRequisition;
      }
    }
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(null, CREATE_OFFER_TITLE, faviconUrl);

    this.sessionName = this.createOffer.sessionName;
    this.sectionName = this.commonService.choosenSection(
      this.sectionId,
      this.translate.store.currentLang
    );
    this.sessionDateTime = this.createOffer.sessionDateTime;
    this.modelsResult = this.createOffer.modelsResult;
    this.demandsModal = this.createOffer.demandsModal;
    this.isAnalogSession = this.modelsResult.isAllowedAnalogues || false;
    this.checkAnaloguesGoods();

    this.DateSession = new Date(
      (this.sessionDateTime - 25569) * 24 * 3600 * 1000
    );
    this.DateSessionPlusDay = new Date(
      this.DateSession.getFullYear(),
      this.DateSession.getMonth(),
      this.DateSession.getDate() + 1
    );
    this.GetSessionStageDateEnd();

    if (
      !(
        this.modelsResult?.type === 'editAuctionOffer' &&
        this.createOffer?.idSessionPeriod === OFFERS_ADJUSTMENT_PERIOD
      )
    ) {
      this.offerManagementService
        .checkActivePriceLimit(
          this.sectionId,
          this.sessionId,
          this.modelId,
          this.direction
        )
        .then((res: any) => {
          this.isActiveQuotation = res.activePriceLimit.isActiveQuotation;
          this.isActiveCorridor = res.activePriceLimit.isActiveCorridor;
        });
    }

    this.initContractType();

    this.createOfferService
      .GetPaymentConfig(this.user.token, this.sectionId)
      .then((res: any) => {
        this.paymentConfig = res.data;
      });

    //получаем справочник календарные и банковские дни
    this.catalogService
      .getByName(this.user?.token, 'daytypes')
      .subscribe((res) => {
        this.dayTypePaymentConfig = res.refbooks;
      });
    // this.createOfferService.GetPaymentConfig(this.user.token, this.sectionId).then((res: any) => {
    //   this.paymentConfig = res.data;
    // })
    this.createOfferService
      .GetUploadFilesRestrict(this.user?.token)
      .then((res: any) => {
        this.maxSingleSize = res.fileMaxSizeSingle;
        this.extensions = res.fileExtensions;
        this.maxSizeBatch = res.fileMaxSizeBatch;
      });

    if (!this.idOffer) this.getDemandsModal();
  }

  public checkAnaloguesGoods(): void {
    if (this.idOffer && this.isAnalogSession) {
      this.createOfferService
        .getAnaloguesBySession(this.sectionId, this.sessionId)
        .subscribe((res: GetAnaloguesBySessionResponse) => {
          const result: GroupedAnalogue[] = this.groupAnalogues(res.analogues);
          this.modelsResult.analogues = result || [];
        });
    }
  }

  //группируем полученные аналоги в структуру аналоов из модели (как в getByModelId)
  private groupAnalogues(data: AnalogueItem[]): GroupedAnalogue[] {
    const groupedObject: Record<number, GroupedAnalogueItem[]> = data.reduce((acc, item) => {
      if (!acc[item.idSessionAnalogues]) {
        acc[item.idSessionAnalogues] = [];
      }

      const { lvl: level, valueName: productName, idLink: linkId, idValue: valueId } = item;
      acc[item.idSessionAnalogues].push({ level, productName, linkId, valueId });

      return acc;
    }, {});

    return Object.entries(groupedObject).map(([id, products]) => ({
      id: Number(id),
      products
    }));
  }


  public getFullInfoAuction(): void {
    this.createOfferService
      .getDemandOfferFullInfo(
        this.user?.token,
        this.direction,
        this.sectionId,
        this.sessionId,
        this.idOffer,
        CURRENT_TAB_FROM_AUCTIONS,
        '',
        true
      )
      .subscribe((res) => {
        this.offerGeneral = res.generalInfo;
        this.offerGoods = res.goods;
        this.offerDeliveryScopes = !this.offerGeneral.isDeliveryScopeGraded ? res.deliveryScopes : res.deliveryScopesGraded;
        this.offerDelivSchPeriods = res.delivSchPeriods.length ? res.delivSchPeriods : res.delivSchPeriodsGraded;
        this.offerDeliveryConditions = res.deliveryConditions;
        this.offerDocuments = res.documents;
        this.offerDeliveryPeriod = res.deliveryPeriod;
        this.offerPaymentCond = res.paymentCond;
        this.modelsResult['isAllowedFilesPrivate'] =
          this.offerGeneral?.isAllowedFilesPrivate;
        this.modelsResult['isAllowedFilesPublic'] =
          this.offerGeneral?.isAllowedFilesPublic;
        sessionStorage.setItem('editOffer', JSON.stringify(res));
        this.commonService
          .GetPrecision(
            this.user?.token,
            this.offerGoods[0].goodsSpecifications.find(
              (el) => el.idInterfaceField === ID_INTERFACE_FIELD.CURRENCY
            ).fieldValueNumber
          )
          .subscribe((res) => {
            this.currencyPrecision = res;
            this.getDemandsModal();
          });
      });
  }

  async getFullInfo() {
    await this.createOfferService
      .GetWorkerOfferFullInfo(this.user?.token, this.idOffer, this.direction)
      .then((res: any) => {
        this.offerGeneral = res.generalInfo;
        this.offerGoods = res.goods;
        this.offerDeliveryScopes = !this.offerGeneral.isDeliveryScopeGraded ? res.deliveryScopes : res.deliveryScopesGraded;
        this.offerDelivSchPeriods = res.delivSchPeriods.length ? res.delivSchPeriods : res.delivSchPeriodsGraded;
        this.offerDeliveryConditions = res.deliveryConditions;
        this.offerDocuments = res.documents;
        this.offerDeliveryPeriod = res.deliveryPeriod;
        this.offerPaymentCond = res.paymentCond;
        sessionStorage.setItem('editOffer', JSON.stringify(res));
        this.commonService
          .GetPrecision(
            this.user?.token,
            this.offerGoods[0].goodsSpecifications.find(
              (el) => el.idInterfaceField == 4
            ).fieldValueNumber
          )
          .subscribe((res) => {
            this.currencyPrecision = res;
            this.getDemandsModal();
          });

        if (this.offerGeneral?.rejectionReason) {
          this.createOfferService
            .checkGoodCompatibility(
              this.user?.token,
              this.direction,
              this.offerGeneral.idDemandOffer
            )
            .subscribe((res) => {
              this.compatibilityGoodsInfo = res.goods;
            });
        }
      });
  }

  public getFullInfoArchive(): void {
    this.createOfferService
      .GetArchiveOfferFullInfo(
        this.user?.token,
        this.direction,
        this.sectionId,
        this.createOffer?.sessionIdArchive,
        this.idOffer
      )
      .subscribe((res: any) => {
        this.offerGeneral = res.generalInfo;
        this.offerGoods = res.goods;
        this.offerDeliveryScopes = !this.offerGeneral.isDeliveryScopeGraded ? res.deliveryScopes : res.deliveryScopesGraded;
        this.offerDelivSchPeriods = res.delivSchPeriods.length ? res.delivSchPeriods : res.delivSchPeriodsGraded;
        this.offerDeliveryConditions = res.deliveryConditions;
        this.offerDocuments = res.documents;
        this.offerDeliveryPeriod = res.deliveryPeriod;
        this.offerPaymentCond = res.paymentCond;
        sessionStorage.setItem('editOffer', JSON.stringify(res));

        this.createOfferService
          .archieveCheckGoodCompatibility(
            this.user?.token,
            this.modelId,
            this.direction,
            this.offerGeneral.idDemandOffer
          )
          .subscribe((res) => {
            this.compatibilityGoodsInfo = res.goods;
          });

        this.commonService
          .GetPrecision(
            this.user?.token,
            this.offerGoods[0].goodsSpecifications.find(
              (el) => el.idInterfaceField == 4
            ).fieldValueNumber
          )
          .subscribe((res) => {
            this.currencyPrecision = res;
            this.getDemandsModal();
          });
      });
  }

  viewAddBasis() {
    let view = false;
    if (this.deliveryBasis.length > 0) {
      if (
        this.deliveryConditions.find(
          (el) => el.linkId == this.deliveryBasis[0].basis
        )?.children?.length > 0
      ) {
        view = true;
      }
    } else view = true;
    return view;
  }

  editOfferSetValue() {
    try {
      if (
        this.offerGeneral &&
        ((this.isMine && this.isCreateCopy) ||
          !this.isCreateCopy ||
          this.isArchiveSubmit)
      ) {
        if (this.UserRole == role.worker) this.getParticipantFromWorker();
        else {
          this.getParticipantFromTrader();
        }
      }
      this.getGoodsByIdOffer();

      /*  Дополнительные условия  */
      this.commonParametersForm.controls.additionalTermsForeign.patchValue(
        this.offerGeneral.detailsExportForeign
      ); //Доп.условия(внеш)
      this.commonParametersForm.controls.additionalTermsDomestic.patchValue(
        this.offerGeneral.detailsImportDomestic
      ); //Доп.условия(внутр)

      /*  Документы   */
      if (
        ((this.isMine && this.isCreateCopy) || !this.isCreateCopy) ||
        this.isArchiveSubmit
      ) {
        this.offerDocuments.forEach((file) => this.processOfferDocument(file));
      }

      if ((this.isMine && this.isCreateCopy) || !this.isCreateCopy) {
        /*  Грузоотправители/грузополучатели  */
        if (this.offerDeliveryScopes.length > 0) {

          const isGradedScope: boolean = this.isSameGradesInSaleOffer && !this.offerDeliveryScopes[0]?.idDemandOfferGood;
          if (isGradedScope) {
            this.offerDeliveryScopes = this.offerDeliveryScopes.flatMap(scope =>
                this.goodsList.map(good => ({
                  ...scope,
                  idGood: good.id,
                  goodName: good.name,
                  unitName: good.units.name,
                  properties: good.properties,
                }))
              );
          } else {
            this.offerDeliveryScopes.forEach((scope) => {
              this.goodsList.forEach((good) => {
                if (good.idDemandOfferGood == scope.idDemandOfferGood) {
                  Object.assign(scope, {
                    idGood: good.id,
                    goodName: good.name,
                    unitName: good.units.name,
                    properties: good.properties,
                  });
                }
              });
            });
          }
          this.offerDeliveryScopes = this.offerDeliveryScopes.reduce(function (
            r,
            a
          ) {
            //сгруппированы поля по idFirmClient
            r[a.idFirmClient] = r[a.idFirmClient] || [];
            r[a.idFirmClient].push(a);
            return r;
          },
          {});
          this.offerDeliveryScopes = Object.entries(this.offerDeliveryScopes);

          if (this.offerDeliveryScopes?.length > 1) {
            this.offerDeliveryScopes.forEach((scope) => {
              let goods = [];
              scope[SCOPE_BLOCK.SCOPE_INFO].forEach((good) => {
                if (this.goodsList.find((el) => el.id === good.idGood)) {
                  goods.push({
                    goodId: good.idGood,
                    goodName: good.goodName,
                    volume: !this.isSameGradesInSaleOffer ? good.volume : 0,
                    goodUnits: good.unitName,
                    properties: good.properties,
                  });
                }
              });

              this.delivScope.push({
                idBroker: scope[SCOPE_BLOCK.SCOPE_INFO][SCOPE_BLOCK.ID_SCOPE].idFirmClient,
                nameBroker: scope[SCOPE_BLOCK.SCOPE_INFO][SCOPE_BLOCK.ID_SCOPE].firmClientName,
                goods: goods,
                volume: isGradedScope ? scope[SCOPE_BLOCK.SCOPE_INFO][SCOPE_BLOCK.ID_SCOPE].volume : 0
              });
            });
          }
        }
      } else {
        this.offerDeliveryScopes.length = 0;
      }

      /*------  УСЛОВИЯ ПОСТАВКИ  ------*/
      if (this.offerDeliveryConditions.length > 0) {
        if (
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          this.hasDeletedGoods()
        ) {
          //при подаче из архива в заявке есть удаленный товар из каталога -> удаляем и базисы для этих товаров
          this.offerDeliveryConditions = this.offerDeliveryConditions.filter(
            (basis) =>
              !this.compatibilityGoodsInfo.find(
                (g) =>
                  g.idDemandOfferGood === basis.idDemandOfferGood && g.isDeleted
              )
          );
        }

        if (
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          this.hasDeletedFromModelGoods()
        ) {
          //при подаче из архива в заявке есть удаленный товар в модели -> удаляем и базисы для этих товаров
          this.offerDeliveryConditions = this.offerDeliveryConditions.filter(
            (basis) =>
              !this.compatibilityGoodsInfo.find(
                (g) =>
                  g.idDemandOfferGood === basis.idDemandOfferGood &&
                  g.isDeletedFromModel
              )
          );
        }

        if (
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          this.isSimilarToFirstGoods()
        ) {
          //при подаче из архива в заявке есть товар не подходящий по сборности -> удаляем и базисы для этих товаров
          this.offerDeliveryConditions = this.offerDeliveryConditions.filter(
            (basis) =>
              !this.compatibilityGoodsInfo.find(
                (g) =>
                  g.idDemandOfferGood === basis.idDemandOfferGood &&
                  !g.isSimilarToFirst
              )
          );
        }

        let offerMainBasis = this.offerDeliveryConditions.find(
          (el) => el.isMain == true
        ); //главный базис из того, что пришло по заявке

        this.offerDeliveryConditions = this.offerDeliveryConditions.reduce(
          function (r, a) {
            //сгруппированы поля по concatedCondition
            r[a.concatedCondition] = r[a.concatedCondition] || [];
            r[a.concatedCondition].push(a);
            return r;
          },
          {}
        );

        this.offerDeliveryConditions = Object.entries(
          this.offerDeliveryConditions
        ); //массивы объектов по сгруппированным полям
        let mainBasis = this.deliveryConditions.find(
          (el) => el.linkId == offerMainBasis.idBasisLink
        );

        if (!mainBasis) {
          /* this.isArchiveSubmit &&  */ //при подаче в архивной заявке, в текущей модели отсутствует основной базис который есть в архивной заявке или заявка была отклонена в рез-те синхронизации
          //очищаем все базисы
          this.deliveryBasis = [];
        } else {
          this.offerDeliveryConditions.forEach((offer) => {
            if (offer[0] == offerMainBasis.concatedCondition) {
              //главный базис
              let goods = [];
              for (let i = 0; i < offer[1].length; i++) {
                let good = this.goodsList.find(
                  (good) => good.idOfferGood == offer[1][i].idDemandOfferGood
                );
                let vat;

                if (this.filledFields.vat.id != 1) {
                  vat = Number(
                    this.filledFields.vat.name.replace(/[^0-9]/g, '')
                  );
                } else vat = 0;

                goods.push({
                  id: good.id,
                  name: good.name,
                  volume: good.volume,
                  units: good.units.name,
                  cost: offer[1][i].priceWithoutVat,
                  currency: good.currency.name,
                  priceAdjustment: Number(good.priceAdjustment.id),
                  quotation: good.quotation,
                  quoteCurrency: good.quoteCurrency,
                  amendment: offer[1][i].priceAdjustment,
                  costVAT:
                    this.commonService.round(
                      offer[1][i].priceWithoutVat * good.volume,
                      2
                    ) +
                    this.commonService.round(
                      (offer[1][i].priceWithoutVat * good.volume * vat) / 100,
                      2
                    ),
                  minPriceField: good.minPriceField,
                  isRequiredMinPrice: good.isRequiredMinPrice || false,
                });
              }

              this.deliveryBasis.unshift({
                concatedCondition: offer[1][0].concatedCondition,
                basis: offer[1][0].idBasisLink,
                placeName: [offer[1][0].idPlaceLink],
                specifyingLocation: offer[1][0].placeDetails,
                minAddBasis: mainBasis.minAddBasis,
                basisName: mainBasis.basisName,
                enterPlaceName: offer[1][0].placeName,
                coreBasis: offer[1][0].isMain,
                idBasisLink: offer[1][0].idBasisLink,
                idBasisValue: offer[1][0].idBasisValue,
                idPlaceLink: offer[1][0].idPlaceLink,
                idPlaceValue: offer[1][0].idPlaceValue,
                minAddBasisPlaces: mainBasis.minAddBasisPlaces,
                contradictoryValueId: mainBasis.contradictoryValueId,
                contradictoryBasisName: mainBasis.contradictoryBasisName,
                isRequiredPlace: mainBasis.isRequiredPlace,
                isRequiredAddBasis: mainBasis.isRequiredAddBasis,
                placeTypeId: mainBasis.placeTypeId,
                parentId: mainBasis.parentId,
                level: mainBasis.level,
                hasChildren: mainBasis.hasChildren,
                basisId: offer[1][0].idBasisLink,
                goods: goods,
              });
            } else {
              //дополнительный базис
              let basis = mainBasis?.children.find(
                (ch) => ch.linkId === offer[1][0].idBasisLink
              );

              if (!basis) {
                //доп. базисы не может быть дополнительными для указанного основного базиса с учетом пересечения - базисы не добавляется;
                return;
              } else {
                let goods = [];
                for (let i = 0; i < offer[1].length; i++) {
                  let good = this.goodsList.find(
                    (good) => good.idOfferGood == offer[1][i].idDemandOfferGood
                  );
                  let vat;

                  if (this.filledFields.vat.id != 1) {
                    vat = Number(
                      this.filledFields.vat.name.replace(/[^0-9]/g, '')
                    );
                  } else vat = 0;
                  goods.push({
                    id: good.id,
                    name: good.name,
                    volume: good.volume,
                    units: good.units.name,
                    cost: offer[1][i].priceWithoutVat,
                    currency: good.currency.name,
                    priceAdjustment: Number(good.priceAdjustment.id),
                    quotation: good.quotation,
                    quoteCurrency: good.quoteCurrency,
                    amendment: offer[1][i].priceAdjustment,
                    costVAT:
                      this.commonService.round(
                        offer[1][i].priceWithoutVat * good.volume,
                        2
                      ) +
                      this.commonService.round(
                        offer[1][i].priceWithoutVat * good.volume * (vat / 100),
                        2
                      ),
                    minPriceField: offer[1][i]?.minPriceWithoutVat,
                    isRequiredMinPrice: good.isRequiredMinPrice || false,
                  });
                }

                this.deliveryBasis.push({
                  concatedCondition: offer[1][0].concatedCondition,
                  basis: offer[1][0].idBasisLink,
                  placeName: [offer[1][0].idPlaceLink],
                  specifyingLocation: offer[1][0].placeDetails,
                  minAddBasis: basis.minAddBasis,
                  basisName: basis.basisName,
                  enterPlaceName: offer[1][0].placeName,
                  coreBasis: offer[1][0].isMain,
                  idBasisLink: offer[1][0].idBasisLink,
                  idBasisValue: offer[1][0].idBasisValue,
                  idPlaceLink: offer[1][0].idPlaceLink,
                  idPlaceValue: offer[1][0].idPlaceValue,
                  minAddBasisPlaces: basis.minAddBasisPlaces,
                  contradictoryValueId: basis.contradictoryValueId,
                  contradictoryBasisName: basis.contradictoryBasisName,
                  isRequiredPlace: basis.isRequiredPlace,
                  isRequiredAddBasis: basis.isRequiredAddBasis,
                  placeTypeId: basis.placeTypeId,
                  parentId: basis.parentId,
                  level: basis.level,
                  hasChildren: basis.hasChildren,
                  basisId: offer[1][0].idBasisLink,
                  goods: goods,
                });
              }
            }
          });
        }
      }
    } catch (error) {
      this.error = true;
      this.errorState = ErrorStates.error;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].loadingApplicationData
          : EN['errors'].loadingApplicationData;
      this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
      this.errorFromEdit = true;
    }
  }

  private processOfferDocument(file: DocumentItem): void {
    const hasAccess =
      (file.isPrivate && this.modelsResult?.isAllowedFilesPrivate) ||
      (!file.isPrivate && this.modelsResult?.isAllowedFilesPublic);

    if (!hasAccess) {
      this.deleteFile(file, file.isPrivate ? FILES_TYPE.HIDDEN_FILES : FILES_TYPE.COMMON_FILES);
      return;
    }
    this.getDocumentContent(file).subscribe((res) => {
      const updatedFile = { ...file, content: res.content };
      if (file.isPrivate && !(this.isArchiveSubmit && !this.isMine)) {
        this.hiddenFiles.push(updatedFile);
      } else if (!file.isPrivate) {
        this.commonFiles.push(updatedFile);
      }
    });
  }

  private getDocumentContent(file: DocumentItem) {
    if (this.isArchiveSubmit) {
      return this.createOfferService
        .getArchiveOfferDocumentContent(
          this.user?.token,
          this.direction,
          file.idDemandOffer,
          file.idDocument
        );
    }
    return this.commonService
      .GetOfferDocumentContent(
        this.user?.token,
        file.idDemandOffer,
        file.idDocument,
        this.direction,
        this.modelsResult?.type === 'editAuctionOffer'
      );
  }

  public editOffer(): void {
    this.error = false;
    this.errorDeletedGood = false;
    if (this.errorFromEdit) {
      this.isChangesSaved = true;
      if (!document.referrer) {
        this.router.navigateByUrl('/');
      } else {
        this.location.back();
      }
    }
  }

  getCost(
    quotation,
    quoteCurrency,
    currency,
    amendmentType,
    amendment,
    idOfferGood,
    vat
  ) {
    let date = new Date();
    let amendmentSize, quotationCurr;
    let cost = 0;

    if (quotation && quoteCurrency && currency) {
      this.commonService
        .ConvertCurrency(
          this.user?.token,
          quotation,
          quoteCurrency,
          currency,
          this.commonService.toOADate(date)
        )
        .subscribe((res) => {
          quotationCurr = res;

          if (amendmentType == 1) {
            //в процентном соотношении
            amendmentSize = (quotationCurr / 100) * amendment;
          } else amendmentSize = amendment;
          cost = this.commonService.round(quotationCurr + amendmentSize, 2);
          let findGood = this.goodsList.find(
            (el) => el.idOfferGood == idOfferGood
          );

          findGood.cost = cost; //цена без НДС
          findGood.costVAT = cost + cost * (vat / 100);
        });
    }
  }

  getFilledFields(item) {
    this.filledFields = {};

    let block4 = item.find((el) => el[0] == 4);
    if (block4) {
      block4[1]?.forEach((i) => {
        if (i.interfaceField.fieldId == 4) {
          //валюта
          this.filledFields = Object.assign(this.filledFields, {
            currency: i.selectedValues,
          });
          /*   this.commonService.GetPrecision(this.user?.token, i.selectedValues).subscribe((res) => {
               this.currencyPrecision = res;
             })*/
        }
        if (i.interfaceField.fieldId == 5) {
          //ставка НДС
          this.filledFields = Object.assign(this.filledFields, {
            vat: i.interfaceField.allowedValues.find(
              (v) => v.id == i.selectedValues
            ),
          });
        }
        if (i.interfaceField.fieldId == 47) {
          //корректируемая цена
          this.filledFields = Object.assign(this.filledFields, {
            adjustedPrice: i.selectedValues,
          });
        }
        if (i.interfaceField.fieldId == 55) {
          //валюта котировки
          this.filledFields = Object.assign(this.filledFields, {
            currencyQuotes: i.selectedValues,
          });
          this.commonService
            .GetPrecision(this.user?.token, i.selectedValues)
            .subscribe((res) => {
              this.quoteCurrencyPrecision = res;
            });
        }
        if (i.interfaceField.fieldId == 53) {
          //тип поправки
          this.filledFields = Object.assign(this.filledFields, {
            priceAdjustment: i.selectedValues,
          });
        }
      });
    }

    let block7 = item.find((el) => el[0] == 7);
    if (block7) {
      block7[1]?.forEach((i) => {
        if (i.interfaceField.fieldId == 11) {
          //источник финансирования
          this.filledFields = Object.assign(this.filledFields, {
            finance: i.selectedValues,
          });
        }
      });
    } else if (this.isArchiveSubmit) {
      //подаем из архива - в новой заявке есть блок 7, а в старой нет -> добавляем
      item.push(['7', []]);
    }
  }

  async getGoodsByIdOffer() {
    //товары при редактировании
    let currency, cost, costWithoutVAT, costVAT;

    this.offerGoods.forEach((item, index) => {
      //переделываем this.offerGoods в структуру для goodsList
      if (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) {
        //смотрим не удален ли товар в модели, если удален - добавляем параметр для уведомлений
        let blockFind: any = [];
        blockFind = this.findBlock(item);

        if (blockFind?.length == 0) {
          this.compatibilityGoodsInfo.find(
            (el) =>
              el.idDemandOfferGood ==
              item.goodsSpecifications[0].idDemandOfferGood
          ).isDeletedFromModel = true;
        }
      }

      if (
        ((this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          !(
            this.compatibilityGoodsInfo.find(
              (el) =>
                el.idDemandOfferGood ==
                item.goodsSpecifications[0].idDemandOfferGood
            )?.isDeleted ||
            !this.compatibilityGoodsInfo.find(
              (el) =>
                el.idDemandOfferGood ==
                item.goodsSpecifications[0].idDemandOfferGood
            )?.isSimilarToFirst ||
            this.compatibilityGoodsInfo.find(
              (el) =>
                el.idDemandOfferGood ==
                item.goodsSpecifications[0].idDemandOfferGood
            )?.isDeletedFromModel
          )) ||
        !(this.isArchiveSubmit || this.offerGeneral?.rejectionReason)
      ) {
        currency = item.goodsSpecifications.find(
          (el) => el.idInterfaceField == ID_INTERFACE_FIELD.CURRENCY
        ); //валюта
        let quoteCurrency = item.goodsSpecifications.find(
          (el) => el.idInterfaceField == ID_INTERFACE_FIELD.QUOTE_CURRENCY
        ); //валюта котировки
        let quotation =
          item.goodsSpecifications.find(
            (el) => el.idInterfaceField === ID_INTERFACE_FIELD.QUOTATION
          )?.fieldValueNumber || null; //котировка
        let amendment =
          item.goodsSpecifications.find(
            (el) => el.idInterfaceField === ID_INTERFACE_FIELD.AMENDMENT
          )?.fieldValueNumber || null; //поправка
        let priceAdjustment =
          item.goodsSpecifications.find(
            (el) => el.idInterfaceField === ID_INTERFACE_FIELD.AMENDMENT_TYPE
          ) || null; //Тип поправки
        let volume = item.goodsSpecifications.find(
          (el) => el.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
        ); //количество
        let VAT = item.goodsSpecifications.find(
          (el) => el.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE
        ); //ставка НДС
        let vat;
        let minPriceField =
          item.goodsSpecifications?.find(
            (el) => el.idInterfaceField === ID_INTERFACE_FIELD.MIN_PRICE
          )?.fieldValueNumber || null;

        if (VAT.fieldValueNumber != 1) {
          vat = Number(VAT.fieldValue.replace(/[^0-9]/g, ''));
        } else vat = 0;

        //если по цене: количество * цену без НДС
        //если по формуле с котировкой: метод, в зависимости от цены
        //если по формуле без котировки: null

        if (
          this.demandsModal.pricingTypeId != pricingType.formulaWithoutQuotation
        ) {
          cost = item.goodsSpecifications?.find(
            (el) => el.idInterfaceField == ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT
          )?.fieldValueNumber; //цена без НДС
          costWithoutVAT = this.commonService.round(
            cost * volume.fieldValueNumber,
            2
          );
          costVAT =
            Number(costWithoutVAT) +
            this.commonService.round(costWithoutVAT * (vat / 100), 2);
        }
        this.volumePrecision = volume.fieldPrecision; //точность объема
        let fields = [];

        /*
             this.blockModal.fields.forEach(blField => {
               this.good.fields.forEach(block => {
                 block[1].forEach(field => {
                   if (!field.costNoVAT && !field.amountVAT && !(field.amountVAT == 0) && !field.costVAT) {
                     if (blField.interfaceField.fieldId == field.interfaceField.fieldId) {
                       if (field.interfaceField.controlFieldType == "dxSelectBox") {
                         // this.getDataSourceSelectBox(blField)
                         if (field.interfaceField.fieldId != 12)                              //ОКРБ 007-2012
                           field.dataSource = blField.selectedValues ? blField.selectedValues : blField.interfaceField.allowedValues;
                         else {
                           this.commonService.GetRefbookByName('', blField.interfaceField.referenceAlias, undefined, this.good.idGoodName).then((res: any) => {
                             field.dataSource = res.refbooks;
                           })
                         }
                         field.interfaceField.allowedValues = blField.interfaceField.allowedValues
                       }
                       field.interfaceField.fieldSize = blField.interfaceField.fieldSize
                       field.interfaceField.fieldDataType = blField.interfaceField.fieldDataType
                       field.isRequired = blField.isRequired
                     }
                   }
                 })
               })
             })*/

        //ищем поля с мультивыбором, группируя по idInterfaceField
        let groupFields = item.goodsSpecifications.reduce(function (r, a) {
          //сгруппированы поля по idInterfaceField
          r[a.idInterfaceField] = r[a.idInterfaceField] || [];
          r[a.idInterfaceField].push(a);
          return r;
        }, {});
        //получаем idInterfaceField, по тем полям, где выбрано больше одного значения
        let idMultiFields = Object.keys(groupFields).filter(
          (key) =>
            Array.isArray(groupFields[key]) && groupFields[key].length > 1
        );

        idMultiFields.forEach((id) => {
          let selectedValues = [];
          for (let i = 0; i < groupFields[id]?.length; i++) {
            selectedValues.push(groupFields[id][i].fieldValueNumber.toString()); //формируем массив всех выбранных значений по полю с мультивыбором
          }
          groupFields[id][0].selectedValues = selectedValues;
          groupFields[id] = [groupFields[id][0]]; //из массива данных с одинаковым idInterfaceField, делаем одно поле, в котором fieldValue включает в себя все выбранные значения
        });
        item.goodsSpecifications = Object.values(groupFields).flat(); //массив с индивидуальными idInterfaceField
        item.goodsSpecifications.forEach((field) => {
          if (!field.isVirtual) {
            fields.push({
              interfaceField: {
                blockId: ACTUAL_SIZE_READINESS_FIELDS.includes(
                  field.idInterfaceField
                )
                  ? 0
                  : field.blockId,
                fieldId: field.idInterfaceField,
                fieldName: field.fieldName,
                fieldPrecision: field.fieldPrecision,
                allowedValues:
                  field.controlFieldType == 'dxSelectBox'
                    ? [
                        {
                          id: field.fieldValueNumber,
                          name: field.fieldValue,
                        },
                      ]
                    : null,
                controlFieldType: field.controlFieldType,
              },
              selectedValues: field.idInterfaceField === ID_INTERFACE_FIELD.PRODUCT_LOCATION ?
                field.fieldValueString :
                field.selectedValues ?? field.fieldValueNumber ?? field.fieldValueString,
              ...([
                ID_INTERFACE_FIELD.ACTUAL_LENGTH,
                ID_INTERFACE_FIELD.ACTUAL_DIAMETER,
                ID_INTERFACE_FIELD.ACTUAL_WIDTH,
                ID_INTERFACE_FIELD.ACTUAL_THICKNESS,
              ].includes(field.idInterfaceField) && {
                sortBy:
                  SORT_ID_ACTUAL_FIELDS['FIELD_' + field.idInterfaceField],
              }),
              ...(field.idInterfaceField ===
                ID_INTERFACE_FIELD.PRODUCT_LOCATION && {
                idSelectedValues: field.fieldValueNumber,
              }),
            });
          }
        });

        //Добавляем поля costNoVAT, amountVAT, costVAT
        if (
          this.demandsModal.pricingTypeId != pricingType.formulaWithoutQuotation
        ) {
          fields.push(
            {
              costNoVAT: costWithoutVAT,
              interfaceField: {
                blockId: 4,
                fieldName:
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].total.costNoVAT
                    : EN['createOffer'].total.costNoVAT,
              },
              selectedValues: costWithoutVAT,
            },
            {
              amountVAT: costWithoutVAT * (vat / 100),
              interfaceField: {
                blockId: 4,
                fieldName:
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].total.amountVAT
                    : EN['createOffer'].total.amountVAT,
              },
              selectedValues: costWithoutVAT * (vat / 100),
            },
            {
              costVAT: costVAT,
              interfaceField: {
                blockId: 4,
                fieldName:
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].total.costVAT
                    : EN['createOffer'].total.costVAT,
              },
              selectedValues: costVAT,
            }
          );
        }

        //сортировка фактических размеров
        fields = this.createOfferService.sortActualFields(fields);

        fields = fields.reduce(function (r, a) {
          //сгруппированы поля по blockId
          r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
          r[a.interfaceField.blockId].push(a);
          return r;
        }, {});

        fields = Object.entries(fields); //массивы объектов по сгруппированным полям
        this.getFilledFields(fields);

        let idGood = item.idGood ? item.idGood : Number(new Date());
        let properties = item.idGood ? item.properties : [];
        if (!item.idGood) {
          item?.goodValues.forEach((value) => {
            properties.push({
              propertyName: value.referenceName,
              propertyValue:
                value?.listValues?.length > 0
                  ? value?.listValues.map((x) => x.valueName)
                  : null,
              isAllowAnalogs: value.isAllowAnalogs,
            });
          });
        }

        this.goodsList.push({
          id: idGood,
          idOfferGood: item.goodsSpecifications[0].idDemandOfferGood,
          idDemandOfferGood: item.goodsSpecifications[0].idDemandOfferGood,
          idNomenclatureGroup: item.idNomenclatureGroup,
          idGoodGroup: item.idGoodGroup,
          idGoodName: item.idGoodName,
          name: item.goodName,
          nomenclature: item.nomenclatureGroup,
          group: item.goodGroup,
          properties: properties,
          fields: fields,
          quoteCurrency: {
            id: quoteCurrency?.fieldValueNumber.toString(),
            name: quoteCurrency?.fieldValue,
          },
          quotation: quotation,
          amendment: amendment,
          priceAdjustment: {
            id: priceAdjustment?.fieldValueNumber.toString(),
            name: priceAdjustment?.fieldValue,
          },
          volume: volume.fieldValueNumber,
          cost: cost,
          costWithoutVAT: costWithoutVAT,
          costVAT: costVAT,
          units: {
            id: item.unitId.toString(),
            name: item.unitName,
          },
          currency: {
            id: currency.fieldValueNumber.toString(),
            name: currency.fieldValue,
          },
          minPriceField: minPriceField,
          ...(this.modelsResult?.type === 'editAuctionOffer' && {
            maxQuantity: volume.fieldValueNumber,
          }),
        });
        if (!item.idGood) {
          let characteristicsNSI = Object({});
          item.goodValues.forEach((value) => {
            characteristicsNSI[value.idReference] =
              value.listValues?.length > 0
                ? value.listValues?.map((x) => x.idValue)
                : null;
            characteristicsNSI['analogs' + value.idReference] =
              value.isAllowAnalogs;
          });
          this.goodsList[this.goodsList.length - 1].characteristicsNSI =
            characteristicsNSI;
          this.goodsList[
            this.goodsList.length - 1
          ].characteristicsNSIOfferGood = characteristicsNSI;
        }
      }
    });

    for (const good of this.goodsList) {
      //поиск пересечений и return допустимых значений для выпадающего списка
      this.good = good;
      this.intersections(true);

      const costWithoutVAT = this.totalForm.controls.costWithoutVat?.value
        ? Number(
            this.totalForm.controls.costWithoutVat?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const amountVAT = this.totalForm.controls.amountVAT?.value
        ? Number(
            this.totalForm.controls.amountVAT?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const costVAT = this.totalForm.controls.costVat?.value
        ? Number(
            this.totalForm.controls.costVat?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const quantity =
        this.totalForm.controls.quantity?.value &&
        this.totalForm.controls.quantity?.value != '-'
          ? Number(
              this.totalForm.controls.quantity?.value
                .replace(good.units.name, '')
                .replaceAll(/[^,\d]/g, '', '')
                .replace(/,/, '.')
            )
          : 0;

      let amountVATValue = this.commonService.round(
        (good.costWithoutVAT *
          Number(this.filledFields.vat.name.replace(/[^0-9]/g, ''))) /
          100,
        this.currencyPrecision
      );

      /*this.commonService.GetPrecision(this.user?.token, currency.fieldValueNumber).subscribe((res) => {
        this.currencyPrecision = res;*/

      this.totalForm.controls.costWithoutVat.patchValue(
        (Number(costWithoutVAT) + Number(good.costWithoutVAT)).toLocaleString(
          'ru',
          {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }
        ) +
          ' ' +
          good.currency.name
      );
      this.totalForm.controls.amountVAT.patchValue(
        amountVATValue
          ? (Number(amountVAT) + Number(amountVATValue)).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              good.currency.name
          : Number('0').toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              good.currency.name
      );
      this.totalForm.controls.costVat.patchValue(
        (Number(costVAT) + Number(good.costVAT)).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          good.currency.name
      );
      if (this.onSameUnits() || this.goodsList.length == 1) {
        this.totalForm.controls.quantity.patchValue(
          (Number(quantity) + Number(good.volume)).toLocaleString('ru', {
            maximumFractionDigits: this.volumePrecision,
          }) +
            ' ' +
            good.units.name
        );
      } else this.totalForm.controls.quantity.patchValue('-');

      //  this.blockModal.fields.forEach(blField => {

      //Сопоставление полей из заявки и из модели. Удаление полей из заявки при отсутствии в модели
      for (const block of good.fields) {
        const fields = block[GOODS_FIELDS_BLOCK.FIELD_INFO];
        for (let i = fields.length - 1; i >= 0; i--) {
          const field = fields[i];
          if (
            !field.costNoVAT &&
            !field.amountVAT &&
            !(field.amountVAT == 0) &&
            !field.costVAT
          ) {
            let blField = this.blockModal.fields.find(
              (blField) =>
                blField.interfaceField.fieldId === field.interfaceField.fieldId
            );
            if (blField) {
              const { interfaceField: blIF } = blField;
              const { interfaceField: fieldIF } = field;
              //если не нашли поле в модели, то удаляем его из товара
              if (fieldIF.controlFieldType == 'dxSelectBox') {
                // this.getDataSourceSelectBox(blField)
                if (
                  !(
                    [
                      ID_INTERFACE_FIELD.UNIT,
                      ID_INTERFACE_FIELD.OKRB007,
                      ID_INTERFACE_FIELD.CFEA,
                    ].includes(fieldIF.fieldId) ||
                    ((fieldIF.referenceId || fieldIF.referenceAlias) &&
                      fieldIF.isAvailableFreeInput)
                  )
                )
                  //ОКРБ 007-2012 и ед. измр.
                  field.dataSource = blField.selectedValues
                    ? blField.selectedValues
                    : blIF.allowedValues;
                else {
                  if (fieldIF.fieldId === ID_INTERFACE_FIELD.UNIT) {
                    //пересечение с классифаером ед.изм.
                    const res: any = await this.commonService.GetRefbookByName(
                      '',
                      'units',
                      undefined,
                      this.good.idGoodName
                    );
                    let dataSourceFromModel =
                      blField.selectedValues &&
                      blField.selectedValues?.length > 0
                        ? blField.selectedValues
                        : blIF.allowedValues;
                    field.dataSource =
                      res.refbooks.length === 0
                        ? dataSourceFromModel
                        : dataSourceFromModel.filter((el) =>
                          res.refbooks.map((v) => v.id).includes(el.id)
                        );
                  } else {
                    if (blIF.referenceAlias) {
                      const res: any = await this.commonService.GetRefbookByName(
                        '',
                        blIF.referenceAlias,
                        undefined,
                        this.good.idGoodName
                      );
                      field.dataSource = res.refbooks;
                    } else if (blIF.referenceId) {
                      const res: any = await firstValueFrom(
                        this.commonService.getById(
                          this.user?.token,
                          blIF.referenceId,
                          this.sectionId
                        )
                      );
                      field.dataSource = res.data;
                    }
                  }
                }
                fieldIF.allowedValues = blIF.allowedValues;
              }
              fieldIF.fieldSize = blIF.fieldSize;
              fieldIF.isAvailableFreeInput = blIF.isAvailableFreeInput;
              fieldIF.fieldDataType = blIF.fieldDataType;
              field.isRequired = blField.isRequired;
              fieldIF.referenceAlias = blIF.referenceAlias;
              fieldIF.referenceId = blIF.referenceId;
              fieldIF.isAvailableMultiSelection =
                blIF.isAvailableMultiSelection;
              fieldIF.isAccessibleForWorker = blIF.isAccessibleForWorker;

              if (
                blIF.isAvailableMultiSelection &&
                typeof field.selectedValues === 'number'
              )
                field.selectedValues = [field.selectedValues.toString()];

              if (fieldIF.controlFieldType === 'dxSelectBox' && !fieldIF.isAvailableFreeInput) {
                if (!field.dataSource?.some(el => Number(el.id) === field.selectedValues)) {
                  field.selectedValues = null;
                }
              }

              if (fieldIF.fieldId === ID_INTERFACE_FIELD.MIN_PRICE) {
                this.good.isRequiredMinPrice = blField.isRequired;
              }
            } else {
              fields.splice(i, 1);
              if (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) {
                this.good.isUnvalidField = true; //выделяется в таблице товар
              }
            }
          }
        }
      }

      //Добавление полей в товар, которые отсутствуют в заявке
      this.blockModal.fields.forEach((blField) => {
        let blockId = ACTUAL_SIZE_READINESS_FIELDS.includes(
          blField.interfaceField.fieldId
        )
          ? 0
          : blField.interfaceField.blockId;
        const idBlockArray = this.good.fields.map((x) => x[0]);
        if (idBlockArray.includes(blockId.toString())) {
          idBlockArray.indexOf(blockId.toString());
          let block =
            this.good.fields[idBlockArray.indexOf(blockId.toString())];
          const fieldOffer = block[1].find(
            (el) => el.interfaceField.fieldId == blField.interfaceField.fieldId
          );
          if (!fieldOffer) {
            this.addFieldFromModel(blField, block);
          }
        } else {
          this.good.fields.push([blockId.toString(), []]);
          this.addFieldFromModel(
            blField,
            this.good.fields[this.good.fields.length - 1]
          );
        }
      });
    }
    this.totalForm.controls.vat.patchValue(
      this.filledFields?.vat?.name.replace('%', '')
    );
    this.getSchedule();

    if (this.isCreateCopy) {
      this.openPreviewWhenCreatingCopy();
    }
  }

  public openPreviewWhenCreatingCopy(): void {
    let prevStep = 0;
    this.store.dispatch(setLoading(({ isLoading: true })));
    const processStep = async () => {
      if (
        this.activeStep === STEPS_TO_APPLY.PREVIEW_SUBMISSION ||
        this.error ||
        this.messageError?.length > 0 ||
        prevStep === this.activeStep ||
        (
          !this.isMine &&
          this.generalInfoStep.get('participant').value === role.visitor &&
          this.listBranch.length > 0
        )
      ) {
        this.store.dispatch(setLoading(({ isLoading: false })));
        return;
      }
      prevStep = this.activeStep;
      if (this.activeStep === STEPS_TO_APPLY.GENERAL_INFO) {
        await this.waitForFirstStep();
      }
      if (this.activeStep === STEPS_TO_APPLY.TERMS_PAYMENT_TERMS) {
        await this.waitForDeadlinesData();
        if (this.deadlineErrorMess) {
          this.store.dispatch(setLoading(({ isLoading: false })));
          return;
        }
      }
      this.goToNextStep();
      if (this.activeStep === STEPS_TO_APPLY.DELIVERY_TERMS) {
        if (this.isActiveCorridor || this.isActiveQuotation) {
          await this.waitForCheckComplete();

          // Проверяем наличие ошибок после проверки
          if (this.error) {
            this.store.dispatch(setLoading(({ isLoading: false })));
            return; // Останавливаем процесс
          }
        }
      }

      processStep();
    };

    processStep();
  }

  private onDestroyWaiting(): void {
    this.destroyWaiting$.next();
    this.destroyWaiting$.complete();
  }

  public waitForFirstStep(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.isMine && this.isCreateCopy) {
        this.onDestroyWaiting();
        this.store.dispatch(setLoading(({ isLoading: false })));
        resolve();
        return;
      }

      if (
        this.errorBrokerClientMessage
        || this.errorBrokerClientMessage?.length === 0
      ) {
        resolve();
        return;
      }

      interval(50)
        .pipe(
          takeUntil(this.destroyWaiting$),
          first(() => !!(this.errorBrokerClientMessage
            || this.errorBrokerClientMessage?.length === 0))
        )
        .subscribe(() => {
          resolve();
        });
    });
  }

  public checkIsValidDeliveryTermTermsPayment(): boolean {
    if (this.deliveryTermValidationGroup && this.validationGroup) {
      return !this.deliveryTermValidationGroup.instance.validate().isValid ||
        !this.validationGroup.instance.validate().isValid;
    }
  }

  public waitForDeadlinesData(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.checkIsValidDeliveryTermTermsPayment()) {
        this.onDestroyWaiting();
        resolve();
        return;
      }

      if (this.deadlineDelivery && this.deadlinePayment) {
        resolve();
        return;
      }

      if (this.deadlineErrorMess) {
        resolve();
        return;
      }

      interval(50)
        .pipe(
          takeUntil(this.destroyWaiting$),
          first(() => !!(this.deadlineDelivery && this.deadlinePayment)
            || !!this.deadlineErrorMess
            || this.checkIsValidDeliveryTermTermsPayment())
        )
        .subscribe(() => {
          resolve();
        });
    });
  }

  private async waitForCheckComplete(): Promise<void> {
    return new Promise<void>((resolve) => {
      interval(50)
        .pipe(
          takeUntil(this.destroyWaiting$),
          first(() => this.isCheckingComplete)
        )
        .subscribe(() => {
          resolve();
        });
    });
  }


  public getSchedule(isShowNotification?: boolean): void {
    if (this.offerDelivSchPeriods.length > 0 && !this.isEditedDeliveryTerm) {
      //график поставки

      const deliveryTermSchedule: DataSourceOption = this.deliverySchedule?.find(
        (el) => el.id === this.offerGeneral.idDeliveryScheduleType.toString()
      );
      if (isShowNotification && this.deliverySchedule?.length === 0) {
        this.error = true;
        this.errorState = ErrorStates.warning;
        this.messageError = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'createOffer.paymentDeliveryTerms.deliveryScheduleCleared'
        );
      }
      if (deliveryTermSchedule) {
        const datepipe: DatePipe = new DatePipe('en-US'); //задает формат даты
        //график поставки
        const isGradedSchedule: boolean = this.isSameGradesInSaleOffer && !this.offerDelivSchPeriods[0]?.idDemandOfferGood;
        if (isGradedSchedule) {
          const goodsMap: any = new Map(this.goodsList.map(good => [good.id, good]));
          const isAlreadyMerged: boolean = this.offerDelivSchPeriods.length > 0 && 'idGood' in this.offerDelivSchPeriods[0];

          if (!isAlreadyMerged) {
            this.offerDelivSchPeriods = this.offerDelivSchPeriods.flatMap(sch =>
              this.goodsList.map(good => ({
                ...sch,
                idGood: good.id,
                goodName: good.name,
                unit: good.units,
                properties: good.properties
              }))
            );
          } else {
            //Обновление существующих данных без дублирования строк
            this.offerDelivSchPeriods = this.offerDelivSchPeriods
              .map(sch => {
                const good = goodsMap.get(sch.idGood);
                if (!good) return null;

                return {
                  ...sch,
                  goodName: good.name,
                  unit: good.units,
                  properties: good.properties
                };
              })
              .filter(sch => sch !== null);
          }
        } else {
          this.offerDelivSchPeriods = this.offerDelivSchPeriods.flatMap(sch =>
            this.goodsList
              .filter(good => good.idDemandOfferGood === sch.idDemandOfferGood)
              .map(good => {
                  return {
                    ...sch,
                    idGood: good.id,
                    goodName: good.name,
                    unit: good.units,
                    properties: good.properties,
                  };
                }
              )
          );
        }
        //формирования массива с суммой объема по товарам из графика поставки
        let groupedByGood = this.offerDelivSchPeriods.reduce(function (r, a) {
          //сгруппированы поля по idOffer
          r[a.idGood] = r[a.idGood] || [];
          r[a.idGood].push(a);
          return r;
        }, {});

        let sumGoodsVolume = Object.entries(groupedByGood);
        this.sumVolumeGoodSchedule = [];
        sumGoodsVolume.forEach((good: [string, DeliverySchedulePeriodWithGoodInfo[]]) => {
          if (this.goodsList.find((el) => el.id == good[0])) {
            let sum = 0;
            good[SUM_GOOD_VOLUME_BLOCK.OFFER_DELIV_SCH_PERIODS].forEach((item) => {
              sum = sum + item.periodVolume;
            });
            this.sumVolumeGoodSchedule.push({
              id: good[0],
              sumValue: sum.toFixed(4),
            });
          }
        });

        const scheduleByPeriodStart = this.offerDelivSchPeriods.reduce(function (r, a) {
          //сгруппированы поля по periodDateBegin
          r[a.periodDateBegin] = r[a.periodDateBegin] || [];
          r[a.periodDateBegin].push(a);
          return r;
        }, {});

        let scheduleEntries = Object.entries(scheduleByPeriodStart);
        //сортировка по дате начала по возрастанию, чтобы отображался график в правильном порядке
        scheduleEntries.sort((a: [string, DeliverySchedulePeriodWithGoodInfo[]], b: [string, DeliverySchedulePeriodWithGoodInfo[]]) =>
          Number(a[0]) - Number(b[0])
        );
        scheduleEntries.forEach((sch: [string, DeliverySchedulePeriodWithGoodInfo[]], index) => {
          let goods = [];
          sch[SCHEDULE_BLOCK.SCHEDULE_INFO].forEach((good) => {
            if (this.goodsList.find((el) => el.id === good.idGood)) {
              goods.push({
                id: good.idGood,
                name: good.goodName,
                volume: good.periodVolume,
                units: good.unit,
                properties: good.properties,
              });
            }
          });

          this.schedule.push({
            numberPeriod: index + 1,
            startDate: datepipe.transform(
              excelToJSDate(sch[SCHEDULE_BLOCK.SCHEDULE_INFO][0].periodDateBegin),
              'dd.MM.yyyy'
            ),
            endDate: datepipe.transform(
              excelToJSDate(sch[SCHEDULE_BLOCK.SCHEDULE_INFO][0].periodDateEnd),
              'dd.MM.yyyy'
            ),
            goods: goods,
            idPeriod: this.offerGeneral.idDeliveryScheduleType.toString(),
            periodVolume: isGradedSchedule ? sch[SCHEDULE_BLOCK.SCHEDULE_INFO][0].periodVolume : null
          });
        });
        this.deliveryTermSchedule =
          this.offerGeneral.idDeliveryScheduleType.toString();
        this.deliveryTermScheduleChoose = deliveryTermSchedule?.name;
      }
    }
  }

  public addFieldFromModel(blField: FieldData, block: InterfaceField): void {
    let dataSource;
    if (
      !(
        [
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.OKRB007,
          ID_INTERFACE_FIELD.CFEA,
        ].includes(blField.interfaceField.fieldId) ||
        ((blField.interfaceField.referenceId ||
          blField.interfaceField.referenceAlias) &&
          blField.interfaceField.isAvailableFreeInput)
      )
    )
      //ОКРБ 007-2012 и ед. измр.
      dataSource = blField.selectedValues
        ? blField.selectedValues
        : blField.interfaceField.allowedValues;
    else {
      if (blField.interfaceField.fieldId == 2) {
        //пересечение с классифаером ед.изм.
        this.commonService
          .GetRefbookByName('', 'units', undefined, this.good.idGoodName)
          .then((res: any) => {
            let dataSourceFromModel =
              blField.selectedValues && blField.selectedValues?.length > 0
                ? blField.selectedValues
                : blField.interfaceField.allowedValues;
            dataSource =
              res.refbooks.length === 0
                ? dataSourceFromModel
                : dataSourceFromModel.filter((el) =>
                    res.refbooks.map((v) => v.id).includes(el.id)
                  );
          });
      } else {
        if (blField.interfaceField.referenceAlias) {
          this.commonService
            .GetRefbookByName(
              '',
              blField.interfaceField.referenceAlias,
              undefined,
              this.good.idGoodName
            )
            .then((res: any) => {
              dataSource = res.refbooks;
            });
        } else if (blField.interfaceField.referenceId) {
          this.commonService
            .getById(
              this.user?.token,
              blField.interfaceField.referenceId,
              this.sectionId
            )
            .subscribe((res: any) => {
              blField.dataSource = res.data;
            });
        }
      }
    }
    block[1].push({
      dataSource: dataSource,
      interfaceField: {
        blockId: blField.interfaceField.blockId,
        fieldId: blField.interfaceField.fieldId,
        fieldName: blField.interfaceField.fieldName,
        fieldPrecision: blField.interfaceField.fieldPrecision,
        allowedValues: blField.interfaceField.allowedValues,
        controlFieldType: blField.interfaceField.controlFieldType,
        fieldSize: blField.interfaceField.fieldSize,
        isAvailableFreeInput: blField.interfaceField.isAvailableFreeInput,
        fieldDataType: blField.interfaceField.fieldDataType,
        isAvailableMultiSelection:
          blField.interfaceField.isAvailableMultiSelection,
        isAccessibleForWorker: blField.interfaceField.isAccessibleForWorker,
        referenceAlias: blField.interfaceField.referenceAlias,
        referenceId: blField.interfaceField.referenceId,
      },
      selectedValues: null,
      isRequired: blField.isRequired,
      sortBy: ACTUAL_SIZE_FIELDS.includes(blField.interfaceField.fieldId)
        ? SORT_ID_ACTUAL_FIELDS['FIELD_' + blField.interfaceField.fieldId]
        : block[1].length,
    });
    if (this.isArchiveSubmit || this.offerGeneral?.rejectionReason || this.isCreateCopy) {
      this.good.isUnvalidField = true; //выделяется в таблице товар
    }
  }

  //----------------------------ШАГ 1----------------------------//

  //получение времени окончания
  GetSessionStageDateEnd() {
    this.createOfferService
      .GetSessionStageDateEnd(
        this.user?.token,
        this.sectionId,
        this.sessionId,
        this.direction
      )
      .then((res: any) => {
        this.currentStageDateEnd = res.dateEnd;
      });
  }

  //получение информации о модели
  getDemandsModal() {
    this.createOfferService
      .Get(this.user.token, this.sectionId, this.modelId)
      .then((res: any) => {
        this.createOfferService.demandsModal = res.data;
        this.demandsModal = Object.assign(
          this.createOfferService.demandsModal,
          {}
        );

        this.choosenMarketType =
          this.translate.store.currentLang === 'EN'
            ? this.demandsModal?.concatedMarketTypesEn
            : this.demandsModal?.concatedMarketTypes;

        if (this.modelsResult?.length == 0) {
          this.modelsResult = {
            pricingTypeId: this.demandsModal.pricingTypeId,
          };
        }

        const createOffer = JSON.parse(sessionStorage.getItem('createOffer'));
        createOffer['demandsModal'] = this.demandsModal;
        sessionStorage.setItem('createOffer', JSON.stringify(createOffer));

        this.isSameGradesInSaleOffer = this.createOfferService.isSameGradesInSaleOffer(
          Number(this.sectionId),
          this.demandsModal.complexLotProductTypes,
          this.demandsModal.tradeTypeId,
          this.direction
        );

        if (this.createOfferService.demandsModal.blocks.length == 0) {
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].loadingApplicationData
              : EN['errors'].loadingApplicationData;
        } else this.GetDeliveryBasesTreeByModelId();
      });
  }

  //получение условий поставки
  GetDeliveryBasesTreeByModelId() {
    this.createOfferService
      .GetDeliveryBasesTreeByModelId(
        this.user.token,
        this.modelId,
        this.sectionId
      )
      .then((res: any) => {
        for (let item in res.data) {
          const listToTree = (item = []) => {
            let map = {},
              node,
              res = [],
              i;
            for (i = 0; i < item.length; i += 1) {
              map[item[i].linkId] = i;
              item[i].children = [];
            }
            for (i = 0; i < item.length; i += 1) {
              node = item[i];
              if (node.parentId !== 0) {
                item[map[node.parentId]].children.push(node);
              } else {
                res.push(node);
              }
            }
            return res;
          };
          const sortedBasis = listToTree(res.data[item]).sort((a, b) => {
            if (a.isIncoterm !== b.isIncoterm) {
              //сначала false
              return a.isIncoterm - b.isIncoterm;
            }
            return a.basisName.localeCompare(b.basisName);
          });
          this.demandsModal.blocks.forEach((block) => {
            if (block.id == item) {
              block.deliveryConditions.selectedValues.bases = sortedBasis;
            }
          });
        }
        if (this.idOffer) this.editOfferSetValue();
      });
  }

  /*  //получение вида торгов
  GetTradeTypes() {
    this.createOfferService.GetTradeTypes(this.user?.token, this.sectionId).then((res: any) => {
      this.tradeTypes = res.data[0]
    })
  }*/

  async initContractType() {
    if (this.disabledAssignments == true && this.disabledCommission == false) {
      this.generalInfoStep.controls.contractType.patchValue(
        ID_DOCUMENT.COMMISSION_AGREEMENT
      );
    } else {
      this.generalInfoStep.controls.contractType.patchValue(
        ID_DOCUMENT.AGENCY_AGREEMENT
      );
    }

    const commission: IContractType = this.commonService.getContractOption(
      ID_DOCUMENT.COMMISSION_AGREEMENT,
      this.translate.store.currentLang,
      'general.commissionAgreement',
      this.disabledCommission
    );
    const agency: IContractType = this.commonService.getContractOption(
      ID_DOCUMENT.AGENCY_AGREEMENT,
      this.translate.store.currentLang,
      'general.agencyAgreement',
      this.disabledAssignments
    );

    this.contractType = [commission, agency];
  }

  GetRole() {
    this.createOfferService.GetRole(this.user?.token).subscribe((res: any) => {
      this.UserRole = res.role;
      let openRole =
        this.UserRole == role.broker || this.UserRole == role.brokerVisitor
          ? role.broker
          : this.UserRole == role.visitor
          ? role.visitor
          : null;

      this.generalInfoStep.get('participant')?.patchValue(openRole);
      if (openRole == role.visitor) {
        this.GetBranchesListFirm();
      }
      if (openRole == role.broker) {
        // this.generalInfoStep.controls.contractType.patchValue(20)
        this.GetBranchesFirmsOfAllClients();

        /*        this.createOfferService.GetListClientsContract(this.user?.token, this.sectionId, [this.sessionId], this.direction, this.generalInfoStep.get('contractType').value).then((res: any) => {
          if (this.generalInfoStep.controls.contractType.value == 20 && res.listClientsContract.length != 0) {
            this.disabledCommission = false;
          }
          this.generalInfoStep.controls.contractType.patchValue(21)
          this.createOfferService.GetListClientsContract(this.user?.token, this.sectionId, [this.sessionId], this.direction, this.generalInfoStep.get('contractType').value).then((resB: any) => {
            if (this.generalInfoStep.controls.contractType.value == 21 && resB.listClientsContract.length != 0) {
              this.disabledAssignments = false;
            }
            this.initContractType();
          })
        })*/
      }
    });
  }

  getParticipantFromWorker() {
    //редактирование работником
    let openRole = this.offerGeneral?.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participant')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractType.patchValue(
        this.offerGeneral.idClientContractType
      );
      this.disabledContractType = true;
      let brockerString;
      if (this.offerGeneral.idClientContractType == 20) {
        let uniqueOfferDeliveryScopes = [
          ...new Map(
            this.offerDeliveryScopes.map(
              (
                item //уникальные значения в массиве offerDeliveryScopes
              ) => [item['idFirmClient'], item]
            )
          ).values(),
        ];

        brockerString =
          this.translate.store.currentLang == 'RU'
            ? uniqueOfferDeliveryScopes.length + ' ' + RU['filters'].selected
            : uniqueOfferDeliveryScopes.length + ' ' + EN['filters'].selected;
        uniqueOfferDeliveryScopes.every((el) =>
          this.brokerClientChoose.push(el.firmClientName)
        );
      } else {
        brockerString = this.offerGeneral.clientName;
        this.generalInfoStep.controls.listClientBranchWorker.patchValue(
          this.offerGeneral.branchName
        );
        this.generalInfoStep.controls.listClientBranch.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChoose = this.offerGeneral.branchName;
        this.brokerClientChoose.push(this.offerGeneral?.clientName);
      }
      this.generalInfoStep.controls.brokerClientWorker.patchValue(
        brockerString
      );
      this.generalInfoStep.controls.brokerClient.patchValue(
        this.offerGeneral.clientId
      );
      this.contractTypeChoose = this.contractType.find(
        (el) =>
          el.refBookKey == this.generalInfoStep.controls.contractType.value
      ).refBookValue;
    } else {
      if (this.offerGeneral.branchId) {
        this.generalInfoStep.controls.listBranchWorker.patchValue(
          this.offerGeneral.branchName
        );
        this.generalInfoStep.controls.listBranch.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChoose = this.offerGeneral.branchName;
      }
    }
  }
  //(onMultiTagPreparing)="TagPreparingName($event)"
  TagPreparingName(e) {
    //e.text = this.translate.store.currentLang == 'RU' ? (e.selectedItems.length + ' ' + RU["filters"].selected) : (e.selectedItems.length + ' ' + EN["filters"].selected)
  }

  getParticipantFromTrader() {
    //редактирование трейдером
    let openRole = this.offerGeneral?.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participant')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractType.patchValue(
        this.offerGeneral.idClientContractType
      );
      if (this.offerGeneral.idClientContractType == 20) {
        let uniqueOfferDeliveryScopes = [
          ...new Map(
            this.offerDeliveryScopes.map(
              (
                item //уникальные значения в массиве offerDeliveryScopes
              ) => [item['idFirmClient'], item]
            )
          ).values(),
        ];
        let array = [];
        uniqueOfferDeliveryScopes.forEach((item) => {
          if (
            !(
              this.isArchiveSubmit &&
              !this.brokerClient.find(
                (el) => el.firmClient == item.idFirmClient
              )
            )
          )
            //если подаем заявку на основе архивной убираем из списка если нет грузоотправителя в нашем списке
            array.push(item.idFirmClient);
        });
        this.generalInfoStep.controls.brokerClient.patchValue(array);
        this.brokerClientChoose = [];
        uniqueOfferDeliveryScopes.every((el) =>
          this.brokerClientChoose.push(el.firmClientName)
        );
      } else {
        this.generalInfoStep.controls.brokerClient.patchValue(
          this.offerGeneral.clientId
        );
        this.generalInfoStep.controls.listClientBranch.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChoose = this.offerGeneral.branchName;
        this.checkIsEmptyListClientBranch();
      }
      this.contractTypeChoose = this.contractType.find(
        (el) =>
          el.refBookKey == this.generalInfoStep.controls.contractType.value
      ).refBookValue;
    } else {
      this.GetBranchesListFirm();
      if (this.offerGeneral.branchId) {
        this.generalInfoStep.controls.listBranch.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChoose = this.offerGeneral.branchName;
      }
    }
  }

  get getListClient(): void {
    let listClients = null;
    if (this.generalInfoStep.get('participant').value == role.broker)
      listClients =
        this.generalInfoStep.get('contractType')?.value ==
        ID_DOCUMENT.COMMISSION_AGREEMENT
          ? this.generalInfoStep.get('brokerClient')?.value
          : [this.generalInfoStep.get('brokerClient')?.value];

    return listClients;
  }

  check(openRole) {
    this.delivScope = [];
    this.generalInfoStep.get('brokerClient').patchValue(null);
    this.generalInfoStep.get('listClientBranch').patchValue(null);
    this.generalInfoStep.get('listBranch').patchValue(null);
    this.generalInfoStep.get('participant').patchValue(openRole);

    if (openRole == role.visitor) {
      // this.generalInfoStep.controls.contractType.patchValue(null)
      this.GetBranchesListFirm();
      this.generalInfoStep.controls.brokerClient.setValue(null);
      this.generalInfoStep.controls.listClientBranch.setValue(null);
      this.generalInfoStep.controls.contractType.setValue(null);
    } else {
      if (
        this.disabledAssignments == true &&
        this.disabledCommission == false
      ) {
        this.generalInfoStep.controls.contractType.patchValue(20);
      } else this.generalInfoStep.controls.contractType.patchValue(21);
      // this.GetListClientsContract()
      // this.GetBranchesFirmsOfAllClients()
      this.initContractType();
      this.getBrokerClient();
    }
  }

  //посетитель - структурные
  async GetBranchesListFirm() {
    this.CheckDemoffOwnerState();
    const body = {
      isOnlyActive: true,
    };
    await this.commonService
      .GetBranchesListFirm(this.user?.token, body)
      .then((res: any) => {
        this.listBranch = res.branchesFirms;
      });
  }

  async GetBranchesFirmsOfAllClients() {
    let body = {
      isOnlyActiveBranchesClient: true,
    };
    const res: any = await this.commonService.GetBranchesFirmsOfAllClients(
      this.user?.token,
      body
    );
    //  await this.commonService.GetBranchesFirmsOfAllClients(this.user?.token, body).then((res: any) => {
    this.branchesFirmsOfAllClients = res.branchesFirmsOfAllClients;
    if (
      this.branchesFirmsOfAllClients.filter((el) => Number(el.contractType) === ID_DOCUMENT.COMMISSION_AGREEMENT)
        ?.length != 0
    ) {
      this.disabledCommission = false;
    }
    if (
      this.branchesFirmsOfAllClients.filter((el) => Number(el.contractType) === ID_DOCUMENT.AGENCY_AGREEMENT)
        ?.length != 0
    ) {
      this.disabledAssignments = false;
    }
    if (!this.idOffer) {
      //если при редактировании, то не запускаем проверку, так как перезаписывается результат
      this.initContractType();
    } else {
      const commission: IContractType = this.commonService.getContractOption(
        ID_DOCUMENT.COMMISSION_AGREEMENT,
        this.translate.store.currentLang,
        'general.commissionAgreement',
        this.disabledCommission
      );
      const agency: IContractType = this.commonService.getContractOption(
        ID_DOCUMENT.AGENCY_AGREEMENT,
        this.translate.store.currentLang,
        'general.agencyAgreement',
        this.disabledAssignments
      );

      this.contractType = [commission, agency];
    }
    this.getBrokerClient();
    // })
  }

  getBrokerClient() {
    this.brokerClient = this.branchesFirmsOfAllClients.filter(
      (el) => Number(el.contractType) === Number(this.generalInfoStep.controls.contractType.value)
    );
    this.onChooseBroker();
    if (
      this.idOffer &&
      Number(this.generalInfoStep.controls.contractType?.value) ===
        ID_DOCUMENT.AGENCY_AGREEMENT &&
      !this.listClientBranch
    ) {
      this.GetListBranchesClients();
    }
  }

  /*  //клиенты брокера в зависимости от типа договора
  GetListClientsContract() {
    this.GetBranchesFirmsOfAllClients()
    this.createOfferService.GetListClientsContract(this.user?.token, this.sectionId, [this.sessionId], this.direction, this.generalInfoStep.get('contractType').value).then((res: any) => {
      this.brokerClient = res.listClientsContract;
    })
  }*/

  private checkIsEmptyListClientBranch(): void {
    if (
      this.idOffer &&
      this.listClientBranch?.length > 0 &&
      !this.offerGeneral.branchId
    ) {
      //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
      this.generalInfoStep.controls.listClientBranch.patchValue(
        this.listClientBranch[0].idFirmBranch
      );
      this.listBranchChoose = this.listClientBranch[0].nameShort;
    }
  }

  // структурные клиентов брокера
  private GetListBranchesClients(): void {
    this.listClientBranch = this.brokerClient.find(
      (el) => el.firmClient === this.generalInfoStep.controls.brokerClient.value
    )?.branchesClients;

    this.checkIsEmptyListClientBranch();
  }

  errorBrokerClientMessage: string;

  //контекстная проверка
  CheckDemoffOwnerState() {
    if (this.modelId) {
      const body = {
        idSection: this.sectionId,
        idSession: this.sessionId,
        idModel: this.modelId,
        idDirection: this.direction,
        idFirmClient:
          this.generalInfoStep.get('participant').value == role.broker &&
          this.generalInfoStep.get('contractType')?.value == 21
            ? this.generalInfoStep.get('brokerClient')?.value
            : null,
        idBranch:
          (this.generalInfoStep.get('participant').value != role.visitor
            ? this.generalInfoStep.get('listClientBranch')?.value
            : this.generalInfoStep.get('listBranch')?.value) || null,
        clientContractType:
          this.generalInfoStep.get('participant').value == role.broker
            ? this.generalInfoStep.get('contractType')?.value
            : null,
      };
      // this.generalInfoStep.get('participant').value == role.broker && this.generalInfoStep.get('contractType')?.value == 20 ? this.user?.userInfo?.firmId
      this.createOfferService
        .CheckDemoffOwnerState(this.user?.token, body)
        .then((res: any) => {
          this.errorBrokerClientMessage = '';
          if (res.isStateExceptional != null) {
            this.messageError = res.stateMessage.replace(/\n\r?/g, '<br />');
            const error: IServiceError = {
              error: true,
              errorStatus: SERVER_ERROR_CODE,
              messageError: this.messageError,
              errorState: res.isStateExceptional
            };
            this.errorServiceService.callErrorPopup(error);
            if (res.isStateExceptional === ErrorStates.error) {
              this.errorBrokerClientMessage = this.messageError;
            }
          }
        });
    }
  }

  changeContractType(e: any) {
    if (e.value) {
      this.delivScope = [];
      this.generalInfoStep.get('contractType')?.patchValue(e.value);
      if (this.generalInfoStep.get('contractType').value != null)
        this.contractTypeChoose = this.contractType.find(
          (el) =>
            el.refBookKey == this.generalInfoStep.controls.contractType.value
        ).refBookValue;

      this.generalInfoStep.controls.brokerClient.patchValue(null);
      if (e.value == 20) {
        this.CheckDemoffOwnerState();
      }
      // this.GetListClientsContract();
      this.getBrokerClient();
    }
  }

  //----------------------------ШАГ 2----------------------------//

  onChangeSelectBox(e: any, str: string) {
    if (!e.value || e.value.length == 0) {
      switch (str) {
        case 'broker': {
          this.generalInfoStep.controls.listClientBranch.setValue(null);
          this.listBranchChoose = null;
          break;
        }
        case 'nomenclaturesWithGroups': {
          this.chooseGood.controls.goodsGroup.setValue(null);
          this.listPropertiesStr = [];
          break;
        }
        case 'nomenclaturesWithGroupsNSI': {
          this.addGoodNSIForm.controls['goodsGroup'].setValue(null);
          break;
        }
        case 'goodsGroup': {
          this.chooseGood.controls.goods.setValue(null);
          if (this.listPropertiesStr?.includes(REF_ID.GOODS_GROUP)) {
            //если в массиве есть -3 - id справочника тов. группы
            let index = this.listPropertiesStr.indexOf(REF_ID.GOODS_GROUP); // Находим индекс id справочника
            if (index !== -1) {
              this.listPropertiesStr.splice(index - 1, 2);
            }
          }
          break;
        }
        case 'goodsGroupNSI': {
          this.addGoodNSIForm.controls['goods'].setValue(null);
          break;
        }

        case 'goods': {
          this.refs = [];
          this.listPropertiesInt = [];
          if (this.listPropertiesStr?.includes(REF_ID.GOODS)) {
            //если в массиве есть -4 - id справочника товара
            let indexTG = this.listPropertiesStr.indexOf(REF_ID.GOODS_GROUP);
            this.listPropertiesStr.splice(
              indexTG + 1,
              this.listPropertiesStr.length
            );
          }
          break;
        }

        case 'goodsNSI': {
          this.allCharacteristics.forEach((item) => {
            this.characteristicsNSI.removeControl(item.id.toString());
          });
          this.allCharacteristics = [];
          this.addNsiGoodService.setAllCharacteristics(this.allCharacteristics);
          this.addNsiGoodService.setCharacteristicsNSI(this.characteristicsNSI);
          this.NSIlistProperty = [];
          this.addNsiGoodService.setNsiListProperty(this.NSIlistProperty);
          break;
        }
      }
    } else {
      switch (str) {
        case 'broker': {
          this.onChooseBroker();
          this.generalInfoStep.controls.listBranch.setValue(null);
          this.generalInfoStep.controls.listClientBranch.setValue(null);

          if (this.generalInfoStep.controls.contractType.value == 21)
            this.GetListBranchesClients();
          break;
        }

        case 'nomenclaturesWithGroups': {
          // this.listProperties.splice(this.listProperties.indexOf(e.previousValue), 1)
          this.chooseGood.controls.goodsGroup.setValue(null);

          if (this.chooseGood.get('nomenclaturesWithGroups')?.value) {
            this.goodsGroup = this.nomenclaturesWithGroups?.find(
              (el) =>
                el.idValue ==
                this.chooseGood.get('nomenclaturesWithGroups')?.value
            )?.groups;

            if (this.goodsGroup.length == 1) {
              this.chooseGood.controls.goodsGroup.setValue(
                this.goodsGroup[0].idValue
              );
            }
            this.listPropertiesStr = [e.value].concat(
              REF_ID.NOMENCLATURES_WITH_GROUPS
            );
          }
          break;
        }
        case 'nomenclaturesWithGroupsNSI': {
          this.addGoodNSIForm.controls['goodsGroup'].setValue(null);
          if (this.addGoodNSIForm.get('nomenclaturesWithGroups')?.value) {
            this.goodsGroup = this.nomenclaturesWithGroups?.find(
              (el) =>
                el.idValue ==
                this.addGoodNSIForm.get('nomenclaturesWithGroups')?.value
            )?.groups;

            if (this.goodsGroup.length == 1) {
              this.addGoodNSIForm.controls['goodsGroup'].setValue(
                this.goodsGroup[0].idValue
              );
            }
          }
          break;
        }

        case 'goodsGroup': {
          // this.listProperties.splice(this.listProperties.indexOf(e.previousValue), 1)
          this.chooseGood.controls['goods'].setValue(null);

          if (this.chooseGood.get('goodsGroup')?.value) {
            let goodsGroupIdLink = this.goodsGroup?.find(
              (el) => el.idValue == this.chooseGood.get('goodsGroup')?.value
            )?.idLink;
            this.createOfferService
              .GetGoodsListSubmission(
                this.user?.token,
                this.sectionId,
                this.modelId,
                goodsGroupIdLink
              )
              .then((res: IGoods) => {
                this.goodsValue = res.goods;

                if (this.listPropertiesStr?.includes(REF_ID.GOODS_GROUP)) {
                  //если в массиве есть -3 - id справочника тов. группы
                  let index = this.listPropertiesStr.indexOf(
                    REF_ID.GOODS_GROUP
                  ); // Находим индекс id справочника
                  if (index !== -1) {
                    // Заменяем пред. id ТГ
                    this.listPropertiesStr.splice(index - 1, 1, e.value);
                  }
                } else {
                  this.listPropertiesStr = this.listPropertiesStr.concat(
                    [e.value].concat(REF_ID.GOODS_GROUP)
                  );
                }

                if (this.goodsValue.length == 1) {
                  this.chooseGood.controls.goods.setValue(
                    this.goodsValue[0].idValue
                  );
                }
              });
          }
          break;
        }

        case 'goodsGroupNSI':
        case 'goodsGroupNSISameVariety': {
          this.addGoodNSIForm.controls['goods'].setValue(null);

          if (this.addGoodNSIForm.get('goodsGroup')?.value) {
            let goodsGroupIdLink = this.goodsGroup?.find(
              (el) => el.idValue == this.addGoodNSIForm.get('goodsGroup')?.value
            )?.idLink;
            this.createOfferService
              .GetGoodsListSubmission(
                this.user?.token,
                this.sectionId,
                this.modelId,
                goodsGroupIdLink
              )
              .then((res: IGoods) => {
                this.goodsValue = res.goods;
                if (this.goodsValue.length == 1) {
                  this.addGoodNSIForm.controls['goods'].setValue(
                    this.goodsValue[0]
                  );
                }
                if (str === 'goodsGroupNSISameVariety') {
                  let good = this.goodsValue.find(el => el.idValue === this.goodsList[0].idGoodName);
                  if (good) {
                    this.addGoodNSIForm.controls['goods'].setValue(good);
                    this.onChangeSelectBox({ value: this.addGoodNSIForm.controls['goods'].value }, 'goodsNSI');
                  }
                }
              });
          }
          break;
        }

        case 'goods': {
          if (this.listPropertiesStr?.includes(REF_ID.GOODS)) {
            //если в массиве есть -4 - id справочника товара
            let index = this.listPropertiesStr.indexOf(REF_ID.GOODS); // Находим индекс id справочника
            if (index !== -1) {
              // Заменяем пред. id ТГ
              this.listPropertiesStr
                .splice(index - 1, 1, e.value)
                .splice(index + 1, this.listPropertiesStr.length);
            }
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              [e.value].concat(REF_ID.GOODS)
            );
          }

          if (this.chooseGood.get('goods')?.value) {
            let goodsIdLink = this.goodsValue?.find(
              (el) => el.idValue == this.chooseGood.get('goods')?.value
            )?.idLink;
            this.createOfferService
              .getNomenclatureRefsSubmission(
                this.user?.token,
                this.sectionId,
                goodsIdLink
              )
              .subscribe((res) => {
                this.refs = res.references;
                this.refs.forEach((i) => {
                  this.createOfferService
                    .getFilterRefValuesSubmission(
                      this.user?.token,
                      this.sectionId,
                      i.id,
                      goodsIdLink
                    )
                    .subscribe((res) => {
                      i.values = res.values;
                      i.isHidden = false; //для скрытия фильтра
                      i.start = res.values[0].rangeBoundLeft; //для слайдеров
                      i.end = res.values[0].rangeBoundRight; //для слайдеров
                    });
                });
                this.listPropertiesInt = [];
              });
          }
          break;
        }
        case 'goodsNSI': {
          this.addNsiGoodService.getGoodCharacteristics(
            this.user,
            this.sectionId,
            this.addGoodNSIForm.get('goods')?.value,
            this.isAnalogAddedNSI()
          );
          break;
        }
      }
    }
  }

  public getFullInfoWithSameVariety(): void {
    if (this.createOfferService.isComplexLotBySameCharacteristics(this.demandsModal.complexLotProductTypes)
      && this.goodsList?.length > 0
    ) {
      this.addGoodNSIForm.controls['nomenclaturesWithGroups'].patchValue(
        this.goodsList[0].idNomenclatureGroup
      );
      this.onChangeSelectBox({ value: this.addGoodNSIForm.controls['nomenclaturesWithGroups'].value }, 'nomenclaturesWithGroupsNSI');
      this.addGoodNSIForm.controls['goodsGroup'].patchValue(
        this.goodsList[0].idGoodGroup
      );
      this.onChangeSelectBox({ value: this.addGoodNSIForm.controls['goodsGroup'].value }, 'goodsGroupNSISameVariety');

      this.sidebarService
        .GetGoodDescriptionFull(this.user.token, this.goodsList[0].id)
        .subscribe((res: GoodDescriptionFull) => {
          this.fullData = res.goodDescriptions.filter(el => el.idReference !== Number(COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES));
          this.isFullDataReady = true;
        });
    } else {
      this.fullData = null;
      this.isFullDataReady = true;
    }
  }

  public addWithAnalog(event: addGoodFromNSI): void {
    this.NSIlistProperty = event.NSIlistProperty;
    this.characteristicsNSI = event.characteristicsNSI;

    const listProperties: number[] = Object.keys(this.characteristicsNSI.value)
      .filter(key =>
        Number(key) !== GOOD_REF_ID &&
        !key.startsWith('analogs') &&
        this.characteristicsNSI.value[key] != null &&
        (!Array.isArray(this.characteristicsNSI.value[key]) || this.characteristicsNSI.value[key].length > 0) &&
        this.characteristicsNSI.value[`analogs${key}`] !== true)
      .reduce((res: number[], key: string) => {
        return [...res, ...this.characteristicsNSI.value[key], -Number(key)];
      }, []);

    if (listProperties?.length > 0) {
      const body: CheckAnalogRequirements = {
        idSection: Number(this.sectionId),
        idSession: Number(this.sessionId),
        idGoodName: this.addGoodNSIForm.controls['goods']?.value?.idValue,
        listProperties: listProperties
      };
      this.createOfferService.checkAnalogRequirements(this.user?.token, body).subscribe(res => {
        if (res.isAnyProductExist) {
          this.addGoodFromNSI(event);
        } else {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'createOffer.invalidValueOfCharacteristics'
          );
        }
      });
    } else {
      this.addGoodFromNSI(event);
    }
  }

  public addGoodFromNSI(event): void {
    const e = event.event;
    this.NSIlistProperty = event.NSIlistProperty;
    this.characteristicsNSI = event.characteristicsNSI;
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let oneValue = true;
      let analogs = false;
      this.allCharacteristics =
        this.addNsiGoodService.allCharacteristicsSubject.getValue();

      this.allCharacteristics.forEach((item) => {
        if (
          this.characteristicsNSI.controls[item.id.toString()].value?.length !=
          1
        ) {
          oneValue = false;
        }
        if (
          this.characteristicsNSI.controls['analogs' + item.id.toString()].value
        ) {
          analogs = true;
        }
      });

      if (
        oneValue &&
        !analogs &&
        this.characteristicsNSI.controls[GOOD_REF_ID]?.value?.length == 1 &&
        !this.characteristicsNSI.controls['analogs' + GOOD_REF_ID]?.value
      ) {
        //Добавление в каталог
        let listGood = [];

        this.goodsList.forEach((el) => {
          if (!el?.characteristicsNSI) listGood.push(el.id);
        });
        let body = {
          idSection: this.sectionId,
          idNomenclatureGroup:
            this.addGoodNSIForm.controls['nomenclaturesWithGroups']?.value,
          idGoodGroup: this.addGoodNSIForm.controls['goodsGroup']?.value,
          idGoodName: this.addGoodNSIForm.controls['goods']?.value?.idValue,
          listProperty: this.NSIlistProperty,
          idModel: this.modelId,
          listAddedGoods: listGood,
        };

        if (this.getListClient != null)
          body['listClients'] = this.getListClient;

        this.filtersService
          .AddToGeneralCatalog(this.user?.token, body)
          .subscribe((resGood: AddGoodToCatalogResult) => {
            if (resGood.idGood) {
              let good = {};
              let properties = [];
              this.sidebarService
                .GetGoodDescriptionFull(this.user.token, resGood.idGood)
                .subscribe((res: GoodDescriptionFull) => {
                  properties = res.goodDescriptions;
                  good = {
                    id: resGood.idGood,
                    idNomenclatureGroup:
                      this.addGoodNSIForm.controls['nomenclaturesWithGroups']
                        ?.value,
                    idGoodGroup:
                      this.addGoodNSIForm.controls['goodsGroup']?.value,
                    idGoodName:
                      this.addGoodNSIForm.controls['goods']?.value?.idValue,
                    name: this.addGoodNSIForm.controls['goods']?.value
                      ?.valueName,
                    nomenclature: this.nomenclaturesWithGroups.find(
                      (el) =>
                        el.idValue ==
                        this.addGoodNSIForm.controls['nomenclaturesWithGroups']
                          ?.value
                    )?.valueName,
                    group: this.goodsGroup.find(
                      (el) =>
                        el.idValue ==
                        this.addGoodNSIForm.controls['goodsGroup']?.value
                    )?.valueName,
                    properties: properties,
                  };
                  this.onChooseGood(good);
                  this.hiddenPopupAddGood();
                });
            }
          });
      } else {
        //создаем товар
        let properties = [];
        this.allCharacteristics.forEach((item) => {
          let value = [];
          if (
            this.characteristicsNSI.controls[item.id.toString()]?.value
              ?.length > 0
          ) {
            this.characteristicsNSI.controls[item.id.toString()].value.forEach(
              (ch) => {
                value.push(item.values.find((el) => el.id == ch).name);
              }
            );
          }

          properties.push({
            propertyName: item.name,
            propertyValue: value,
            isAllowAnalogs:
              this.characteristicsNSI.controls['analogs' + item.id.toString()]
                .value,
          });
        });

        if (this.characteristicsNSI.controls[GOOD_REF_ID]?.value?.length === 1 &&
          this.characteristicsNSI.controls['analogs' + GOOD_REF_ID]?.value) {
          properties.unshift({
            propertyName: getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'general.nameProduct'
            ),
            propertyValue: [this.addGoodNSIForm.controls['goods']?.value
              ?.valueName],
            isAllowAnalogs: true,
          });
        }

        let good = {
          id: Number(new Date()),
          idNomenclatureGroup:
            this.addGoodNSIForm.controls['nomenclaturesWithGroups']?.value,
          idGoodGroup: this.addGoodNSIForm.controls['goodsGroup']?.value,
          idGoodName: this.addGoodNSIForm.controls['goods']?.value?.idValue,
          name: this.addGoodNSIForm.controls['goods']?.value?.valueName,
          nomenclature: this.nomenclaturesWithGroups.find(
            (el) =>
              el.idValue ==
              this.addGoodNSIForm.controls['nomenclaturesWithGroups']?.value
          )?.valueName,
          group: this.goodsGroup.find(
            (el) =>
              el.idValue == this.addGoodNSIForm.controls['goodsGroup']?.value
          )?.valueName,
          properties: properties,
          characteristicsNSI: this.characteristicsNSI.value,
        };

        this.onChooseGood(good);
        this.hiddenPopupAddGood();
      }
    }
  }

  hiddenPopupAddGood() {
    if (this.addGoodNSI && this.allCharacteristics?.length > 0) {
      this.addNsiGoodService.clearAddGoodNSI(
        this.addGoodNSIForm.get('goods')?.value?.idValue
      );
    }
    this.chooseGoodForm = false;
    this.addFromCatalog = false;
    this.addGoodNSI = false;
    this.chooseAddGoodForm.controls.chooseAddGood.patchValue('catalog');
    this.onChangeSelectBox({ value: null }, 'goodsNSI');
    this.fullData = null;
  }

  onChooseBroker() {
    this.brokerClientChoose = [];
    this.listBranchChoose = null;
    if (
      this.generalInfoStep.controls.contractType.value == 21 &&
      this.generalInfoStep.controls.brokerClient?.value
    ) {
      this.brokerClientChoose.push(
        this.brokerClient.find(
          (el) =>
            el.firmClient == this.generalInfoStep.controls.brokerClient?.value
        )?.regNumberWithNameShort
      );
    } else if (this.generalInfoStep.controls.brokerClient?.value) {
      this.generalInfoStep.controls.brokerClient.value.forEach((broker) => {
        this.brokerClientChoose.push(
          this.brokerClient.find((el) => el.firmClient == broker)
            ?.regNumberWithNameShort
        );
      });
    }

    if (this.brokerClientChoose?.length == 1) {
      this.delivScope = [];
    }

    this.updateDelivScopesWithSelectedBrokers();
  }

  public updateDelivScopesWithSelectedBrokers(): void {
    if (this.delivScope?.length > 0) {
      this.delivScope = this.delivScope
        .filter(scope => this.generalInfoStep.controls.brokerClient?.value.includes(scope.idBroker))
        .map(scope => ({ ...scope }));

      const scopeMap = new Map(
        this.delivScope.map(scope => [scope.idBroker, scope])
      );

      this.delivScope = this.generalInfoStep.controls.brokerClient?.value.map((id: number) => {
        if (scopeMap.has(id)) {
          return { ...scopeMap.get(id) };
        } else {
          const goodsArray: ScopesGood[] = (this.delivScope && this.delivScope.length > 0)
            ? this.delivScope[0].goods.map(good => ({
              ...good,
              volume: 0
            }))
            : [];
          return {
            idBroker: id,
            nameBroker: this.brokerClient.find((el) => Number(el.firmClient) === Number(id))?.regNumberWithNameShort,
            goods: goodsArray,
            volume: 0
          };
        }
      });
    }
  }

  onChooseClient() {
    this.listBranchChoose = null;
    if (
      this.generalInfoStep.controls.participant.value == role.broker &&
      this.listClientBranch.length > 0
    ) {
      this.listBranchChoose = this.listClientBranch?.find(
        (el) =>
          el.idFirmBranch ==
          this.generalInfoStep.controls.listClientBranch?.value
      )?.nameShort;
    } else if (
      this.listBranch?.length > 0 &&
      this.generalInfoStep.controls.listBranch.value
    ) {
      this.listBranchChoose = this.listBranch?.find(
        (el) =>
          el.idFirmBranch == this.generalInfoStep.controls.listBranch.value
      ).nameShort;
    }
  }

  public onChooseNomenclature(): Observable<INomenclaturesWithGroups> {
    return this.createOfferService
      .GetNomenclaturesWithGroups(
        this.user?.token,
        this.sectionId,
        this.modelId
      ).pipe(
        tap((res: INomenclaturesWithGroups) => {
          this.nomenclaturesWithGroups = res.nomenclaturesWithGroups;

          if (this.nomenclaturesWithGroups.length === 1 && this.addFromCatalog) {
            this.chooseGood.controls.nomenclaturesWithGroups.setValue(
              this.nomenclaturesWithGroups[0].idValue
            );
          }

          if (this.nomenclaturesWithGroups.length === 1 && this.addGoodNSI) {
            this.addGoodNSIForm.controls['nomenclaturesWithGroups'].setValue(
              this.nomenclaturesWithGroups[0].idValue
            );
          }
        })
      );
  }

  chooseRefsValue(e, id, type, idCh?) {
    if (type === 'checkbox') {
      //обработка чекбокса

      if (e.value) {
        //ставим
        if (this.listPropertiesStr?.includes(-id)) {
          //если в конечном массиве есть id справочника
          // Находим индекс id справочника
          let index = this.listPropertiesStr.indexOf(-id);
          // Добавляем idCh !обязательно перед! id справочника (id справочника служит разделителем)
          if (index !== -1) {
            this.listPropertiesStr.splice(index, 0, idCh[idCh.length - 1]);
          }
        } else {
          if (this.listPropertiesStr.length == 0) {
            this.listPropertiesStr = idCh.concat(id * -1);
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              idCh.concat(id * -1)
            );
          }
        }
      } else {
        //удаляем
        this.listPropertiesStr = this.listPropertiesStr.filter(
          (el) => el !== idCh[0]
        ); //удаляем id хар-ки
        for (let i = 0; i < this.listPropertiesStr.length; i++) {
          //удаляем id самого спраовчника если удалили все id хар-к
          if (
            this.listPropertiesStr[i] === -id &&
            ((i > 0 && this.listPropertiesStr[i - 1] < 0) ||
              (i < this.listPropertiesStr.length - 1 &&
                this.listPropertiesStr[i + 1] < 0))
          ) {
            this.listPropertiesStr.splice(i, 1);
          }
        }
      }
    }

    if (type === 'str') {
      //обработка дропдауна

      if (e.value.length > e.previousValue.length) {
        //добавление
        if (this.listPropertiesStr?.includes(-id)) {
          //если в конечном массиве есть id справочника
          // Находим индекс id справочника
          let index = this.listPropertiesStr.indexOf(-id);
          // Добавляем value !обязательно перед! id справочника (id справочника служит разделителем)
          if (index !== -1) {
            this.listPropertiesStr.splice(
              index,
              0,
              e.value[e.value.length - 1]
            );
          }
        } else {
          if (this.listPropertiesStr.length == 0) {
            this.listPropertiesStr = e.value.concat(id * -1);
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              e.value.concat(id * -1)
            );
          }
          //добавляем значение в formGroup
          /* this.chooseGood.addControl(id.toString(),
          this.formBuilder.control(null, null));*/
        }
      } else {
        //удаление
        if (e.value.length > 0) {
          //находим удаленный id
          let missingElem = e.previousValue.filter(
            (element) => !e.value.includes(element)
          );
          this.listPropertiesStr = this.listPropertiesStr.filter(
            (el) => el !== missingElem[0]
          );
        }

        if (e.value.length == 0) {
          let indexG = this.listPropertiesStr.indexOf(REF_ID.GOODS); // Находим индекс товара
          let indexTG = this.listPropertiesStr.indexOf(-id); // Находим индекс id справочника

          if (indexG !== -1 && indexTG !== -1 && indexTG > indexG) {
            // удаляем элементы между id справочника и -4
            this.listPropertiesStr.splice(indexG + 1, indexTG - indexG + 1);
          }
        }
      }

      //записываем значение, чтобы при открытии формы отображалось в фильтре данные
      // this.chooseGood?.controls[id]?.patchValue(e.value)
    }

    if (type === 'range') {
      //обработка слайдеров
      if (e.value) {
        if (this.listPropertiesInt?.includes(-id)) {
          //если в массиве есть id справочника
          let index = this.listPropertiesInt.indexOf(-id);
          if (index !== -1) {
            this.listPropertiesInt.splice(index - 2, 2, e.start, e.end);
          }
        } else {
          if (this.listPropertiesInt.length == 0) {
            this.listPropertiesInt = e.value.concat(id * -1);
          } else {
            this.listPropertiesInt = this.listPropertiesInt.concat(
              e.value.concat(id * -1)
            );
          }
          // добавляем значение в formGroup
          //  this.chooseGood.addControl(id.toString(), this.formBuilder.control(false))

          //this.chooseGood.addControl(id.toString(),  this.formBuilder.control(null))
        }
      }

      //записываем значение, чтобы при открытии формы отображалось в фильтре данные
      //  this.chooseGood?.controls[id.toString()]?.patchValue(e.value)
    }

    /* if (e.value) {
      this.listProperties.push(e.value);
      !!e.previousValue ? this.listProperties.splice(this.listProperties.indexOf(e.previousValue), 1) : null
    } else {
      this.listProperties.splice(this.listProperties.indexOf(e.previousValue), 1)
    } */
  }

  onUpdated() {
    window.scrollTo(0, 0);
  }

  isAnalogAddedNSI(): boolean {
    if (!this.isAnalogSession || this.direction !== IdDirection.buy) {
      return false;
    }

    const analogues = this.modelsResult?.analogues?.[0]?.products || [];

    if (analogues?.length === 0) {
      return false;
    }

    return (
      this.checkLevelMatch(
        analogues,
        levelProductBlock.good,
        this.addGoodNSIForm.get('goods')?.value?.idValue
      ) ||
      this.checkLevelMatch(
        analogues,
        levelProductBlock.productGroup,
        this.addGoodNSIForm.get('goodsGroup')?.value
      ) ||
      this.checkLevelMatch(
        analogues,
        levelProductBlock.nomenclatureGroup,
        this.addGoodNSIForm.get('nomenclaturesWithGroups')?.value
      )
    );
  }

  private checkLevelMatch(
    products: any[],
    level: number,
    valueId: number
  ): boolean {
    const levelProducts = products.filter((product) => product.level === level);
    return (
      levelProducts?.length > 0 &&
      levelProducts.some((product) => product.valueId === valueId)
    );
  }

  public onAddGoodClick(): void {
    this.addFromCatalog = false;
    this.addGoodNSI = true;
    this.choosenPopup = popupDeminsionsEnum.ADD_GOOD_NSI;
    this.allCharacteristics = [];
    this.addNsiGoodService.setAllCharacteristics(this.allCharacteristics);
    this.addGoodNSIForm.reset();
    this.chooseAddGoodForm.reset();
    this.isFullDataReady = false;
    this.getFullInfoWithSameVariety();
  }

  public addGoodNext(): void {
    this.chooseAddGood = false;
    this.onChooseNomenclature().subscribe(() => {
      if (this.chooseAddGoodForm.controls.chooseAddGood.value === 'catalog') {
        this.addFromCatalog = true;
        this.choosenPopup = popupDeminsionsEnum.ADD_FROM_CATALOG;
        this.onShowProducts();
      } else {
        this.onAddGoodClick();
      }
    });
  }

  onShowProducts() {
    this.catalogProducts = [];
    this.totalPages = 0;
    this.totalCount = 0;
    let ListGoods = [];
    this.goodsList?.forEach((item) => {
      if (!item?.characteristicsNSI) {
        ListGoods.push(item.id);
      }
    });
    if (!this.chooseAddGood) {
      if (this.chooseGood.get('catalogTypes').value == 'personal') {
        this.createOfferService
          .GetPersonalCatalogSubmissionWithDesc(
            this.user?.token,
            this.sectionId,
            this.modelId,
            this.currentPage,
            this.chooseGood.controls.searchParameters?.value || undefined,
            this.listPropertiesStr,
            this.listPropertiesInt,
            ListGoods
          )
          .then((res: any) => {
            this.catalogProducts = res.goods;
            this.totalPages = res.totalPages;
            this.totalCount = res.totalCount;
            document.getElementById('scrollView').scrollIntoView();
          });
      } else {
        this.createOfferService
          .GetGlobalCatalogSubmission(
            this.user?.token,
            this.sectionId,
            this.modelId,
            this.currentPage,
            this.chooseGood.controls.searchParameters?.value || undefined,
            this.listPropertiesStr,
            this.listPropertiesInt,
            ListGoods
          )
          .then((res: any) => {
            this.catalogProducts = res.goods;
            this.totalPages = res.totalPages;
            this.totalCount = res.totalCount;
            document.getElementById('scrollView').scrollIntoView();
          });
      }
    }
  }

  clearChooseGood() {
    this.chooseGood.controls.nomenclaturesWithGroups.setValue(null);
    this.chooseGood.controls.goodsGroup.setValue(null);
    this.chooseGood.controls.goods.setValue(null);
    this.chooseGood.controls.searchParameters.setValue(null);
    this.listPropertiesInt = [];
    this.listPropertiesStr = [];
    this.onShowProducts();
  }

  /* закрытие попап окна для выбора товара, в зависимотси есть или нет боковая панель*/
  @ViewChild(DxPopupComponent) popup: DxPopupComponent;

  @HostListener('document:keydown.escape', ['$event'])
  onKeydownHandler(event: Event) {
    if (this.chooseGoodForm && !this.isOpenSidebar) {
      this.popup.instance.hide();
    }

    if (document.getElementById('mySidebar')?.style.opacity === '0') {
      this.isOpenSidebar = false;
    }
  }

  public openChoosenPopup(): void {
    this.chooseGoodForm = true;
    this.chooseAddGood = true;
    this.choosenPopup = popupDeminsionsEnum.CHOOSE_ADD_GOOD;
  }

  onInitializedPopup(e) {
    //запрещаем закрывать попап по клавише esc
    e.component.registerKeyHandler('escape', function (arg) {
      arg.preventDefault();
    });
  }

  isOpenSidebar = false; //открыта ли боковая панель
  openSidebar(i: any) {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
  }

  clearOfferForGood() {
    this.popupForm = false;
    this.onChooseGoodContinue();
  }

  onChooseGood(good) {
    this.good = good;
    if (
      this.deliveryBasis?.length > 0 ||
      this.deliveryTermForm?.controls?.startDelivery?.value ||
      this.termsPaymentForm?.controls?.termsPayment?.value
    ) {
      this.popupForm = true;
      this.popupTitle =
        this.translate.store.currentLang == 'RU'
          ? RU['login_form'].notification
          : EN['login_form'].notification;
      this.popupMessage =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].addGoodAfterData
          : EN['errors'].addGoodAfterData;
      this.popupButton = false;
    } else {
      this.onChooseGoodContinue();
    }
  }

  onChooseGoodContinue() {
    if (this.intersections()) {
      this.chooseGoodForm = false;
      this.goodInfo = true;
      this.editInfoGood = null;
      this.viewInfoGood = null;

      let cancelButton = document.getElementById('cancelButton');
      cancelButton.setAttribute('disabled', 'true');
      let nextButton = document.getElementById('nextButton');
      nextButton.setAttribute('disabled', 'true');
    }
  }

  findBlock(good) {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    this.demandsModal.blocks.forEach((block) => {
      block.products
        .filter((prod) => prod.level == 3)
        .forEach((item) => {
          if (item.valueId == good.idGoodName) {
            blockFind = block;
            return;
          }
        });

      block.products
        .filter((prod) => prod.level == 2)
        .forEach((item) => {
          if (item.valueId == good.idGoodGroup) {
            blockFind = block;
            return;
          }
        });
      block.products
        .filter((prod) => prod.level == 1)
        .forEach((item) => {
          if (item.valueId == good.idNomenclatureGroup) {
            blockFind = block;
            return;
          }
        });
    });
    return blockFind;
  }

  deletedGoodFromModel: boolean = false; //параметр отвечающий за наличие удаленного товара в модели!

  intersections(loading?) {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    blockFind = this.findBlock(this.good);

    let deliveryConditionsPrev = JSON.parse(
        JSON.stringify(this.deliveryConditions)
      ),
      deliverySchedulePrev = JSON.parse(JSON.stringify(this.deliverySchedule)),
      deliveryTermPrev = JSON.parse(JSON.stringify(this.deliveryTerm)),
      termsConditionsPaymentPrev = JSON.parse(
        JSON.stringify(this.termsConditionsPayment)
      ),
      currencyConditionsPrev = JSON.parse(
        JSON.stringify(this.currencyConditions)
      ),
      vatConditionsPrev = JSON.parse(JSON.stringify(this.vatConditions)),
      financeSourcesConditionsPrev = JSON.parse(
        JSON.stringify(this.financeSourcesConditions)
      ),
      currencyQuotesConditionsPrev = JSON.parse(
        JSON.stringify(this.currencyQuotesConditions)
      );

    if (Object.keys(blockFind).length != 0) {
      /*  if (str == 'addGood') {                                //при добавлении товара
          if (this.blockModal != blockFind) {                  //сравниваю блок предыдущий с новым найденым
            this.intersectionsBlocks(blockFind);
          }
        }
        else                      */ //при удалении товара
      this.intersectionsBlocks(blockFind, loading);
    } else if (!this.isArchiveSubmit)
      //если не нашли товар в блоке модели
      this.error = true;

    if (this.error) {
      this.errorState = ErrorStates.error;

      if (this.nameField.length > 0) {
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['errors'].changeValueForOffer +
              `\n${this.nameField.join('\r\n')}`
            : EN['errors'].changeValueForOffer +
              `\n${this.nameField.join('\r\n')}`;
      } else
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['errors'].noIntersectionsSpecialBlocks
            : EN['errors'].noIntersectionsSpecialBlocks;

      if (!loading) {
        this.deliveryConditions = deliveryConditionsPrev;
        this.deliverySchedule = deliverySchedulePrev;
        this.deliveryTerm = deliveryTermPrev;
        this.termsConditionsPayment = termsConditionsPaymentPrev;
        this.currencyConditions = currencyConditionsPrev;
        this.vatConditions = vatConditionsPrev;
        this.financeSourcesConditions = financeSourcesConditionsPrev;
        this.currencyQuotesConditions = currencyQuotesConditionsPrev;
      } else {
        if (this.goodsList?.length > 0) {
          let fibdFourBlock = this.goodsList[0].fields.find(
            (el) => el[0] == 4
          )[1];
          fibdFourBlock.find((el) => el.interfaceField.fieldId == 4)
            ? (fibdFourBlock.find(
                (el) => el.interfaceField.fieldId == 4
              ).dataSource = this.currencyConditions)
            : null; //у первого товара меняем dataSource на пересечения
          fibdFourBlock.find((el) => el.interfaceField.fieldId == 5)
            ? (fibdFourBlock.find(
                (el) => el.interfaceField.fieldId == 5
              ).dataSource = this.vatConditions)
            : null; //у первого товара меняем dataSource на пересечения
          fibdFourBlock.find((el) => el.interfaceField.fieldId == 55)
            ? (fibdFourBlock.find(
                (el) => el.interfaceField.fieldId == 55
              ).dataSource = this.currencyQuotesConditions)
            : null; //у первого товара меняем dataSource на пересечения
          if (
            this.goodsList[0].fields.find((el) => el[0] == 7) &&
            this.goodsList[0].fields
              .find((el) => el[0] == 7)[1]
              .find((el) => el.interfaceField.fieldId == 11)
          )
            this.goodsList[0].fields
              .find((el) => el[0] == 7)[1]
              .find((el) => el.interfaceField.fieldId == 11).dataSource =
              this.financeSourcesConditions; //у первого товара меняем dataSource на пересечения
        }
        this.blockModal = blockFind;
      }
      return false;
    } else {
      if (this.goodsList?.length > 0) {
        let fibdFourBlock = this.goodsList[0].fields.find(
          (el) => el[0] == 4
        )[1];
        fibdFourBlock.find((el) => el.interfaceField.fieldId == 4)
          ? (fibdFourBlock.find(
              (el) => el.interfaceField.fieldId == 4
            ).dataSource = this.currencyConditions)
          : null; //у первого товара меняем dataSource на пересечения
        fibdFourBlock.find((el) => el.interfaceField.fieldId == 5)
          ? (fibdFourBlock.find(
              (el) => el.interfaceField.fieldId == 5
            ).dataSource = this.vatConditions)
          : null; //у первого товара меняем dataSource на пересечения
        fibdFourBlock.find((el) => el.interfaceField.fieldId == 55)
          ? (fibdFourBlock.find(
              (el) => el.interfaceField.fieldId == 55
            ).dataSource = this.currencyQuotesConditions)
          : null; //у первого товара меняем dataSource на пересечения
        if (
          this.goodsList[0].fields.find((el) => el[0] == 7) &&
          this.goodsList[0].fields
            .find((el) => el[0] == 7)[1]
            .find((el) => el.interfaceField.fieldId == 11)
        )
          this.goodsList[0].fields
            .find((el) => el[0] == 7)[1]
            .find((el) => el.interfaceField.fieldId == 11).dataSource =
            this.financeSourcesConditions; //у первого товара меняем dataSource на пересечения
      }
      this.blockModal = blockFind;
      return true;
    }
  }

  isMinPriceOnBasicBasis = null;
  isNotSpecified = null;
  nameField = [];

  public intersectionsBlocks(blockFind, loading?: boolean): void {
    this.nameField = [];
    for (let i = 0; i < 10; i++) {
      if (!this.error) {
        switch (i) {
          //проверка пересечений по специальным блокам (условия поставки, срок поставки, график поставки, условия и срок оплаты)
          case 0: {
            if (this.deliverySchedule.length == 0) {
              //график поставки может быть не заполнен (это необязательное поле)
              this.deliverySchedule = JSON.parse(
                JSON.stringify(blockFind.deliverySchedule.selectedValues)
              ); //заполнение deliverySchedule значением из блока модели
              if (this.schedule.length > 0) {
                //если уже заполнен график поставки и вернулись добавить товар
                this.isChooseValueInIntersectionsSchedule();
              }
            } else {
              this.deliverySchedule = this.deliverySchedule.filter((a) =>
                blockFind.deliverySchedule?.selectedValues.some(
                  (b) => a.id === b.id
                )
              );

              if (this.deliverySchedule.length == 0) {
                //если нет пересечения
                this.error = true;
              }
              if (!this.error && this.schedule.length > 0) {
                //если уже заполнен график поставки и вернулись добавить товар
                this.isChooseValueInIntersectionsSchedule();
              }
            }
            break;
          }

          case 1: {
            //условия поставки
            if (
              this.deliveryConditions.length == 0 &&
              this.isNotSpecified == undefined
            ) {
              this.isMinPriceOnBasicBasis =
                blockFind.deliveryConditions.selectedValues.isMinPriceOnBasicBasis;
              this.isNotSpecified =
                blockFind.deliveryConditions.selectedValues.isNotSpecified;
              this.deliveryConditions = JSON.parse(
                JSON.stringify(
                  blockFind.deliveryConditions.selectedValues.bases
                )
              );
              if (this.deliveryBasis?.length > 0) {
                this.isChooseValueInIntersectionsBasis();
              }
            } else {
              this.deliveryConditionsIntersections(blockFind);
            }

            break;
          }
          case 2: {
            //срок поставки
            if (this.deliveryTerm.length == 0) {
              this.deliveryTerm = JSON.parse(
                JSON.stringify(blockFind.deliveryTerm.selectedValues)
              );
              if (
                this.deliveryTermForm?.controls?.startDelivery?.value &&
                this.deliveryTermConcated.length > 0
              ) {
                this.isChooseValueInIntersectionsDeliveryTerm();
              }
            } else {
              this.deliveryTermIntersections(blockFind);
            }
            break;
          }

          case 3: {
            //условия и срок оплаты
            this.termsConditionsPayment =
              this.termsConditionsPayment.length == 0
                ? JSON.parse(
                    JSON.stringify(
                      blockFind.termsConditionsPayment.selectedValues
                    )
                  )
                : this.termsConditionsPayment.filter((a) =>
                    blockFind.termsConditionsPayment.selectedValues.some(
                      (b) => {
                        if (
                          a.delayMomentId == b.delayMomentId &&
                          a.paymentConditionId == b.paymentConditionId &&
                          a.paymentVolumeId == b.paymentVolumeId &&
                          a.prepayMomentId == b.prepayMomentId
                        ) {
                          //a.dayTypeId == b.dayTypeId

                          if (a?.dayTypeId?.length > 0) {
                            a.dayTypeId = a?.dayTypeId.filter((ad) =>
                              b?.dayTypeId.find(
                                (bd) => JSON.stringify(ad) == JSON.stringify(bd)
                              )
                            );
                            if (a?.dayTypeId?.length > 0) return true;
                          } else if (!a?.dayTypeId && !b?.dayTypeId) {
                            return true;
                          }
                        }

                        //a.dayTypeId?.filter(ad=> b.dayTypeId?.some(bd => JSON.stringify(ad) == JSON.stringify(bd)))
                      }
                    )
                  );
            if (this.termsConditionsPayment.length == 0) {
              this.error = true;
            }
            //если уже заполнены условия и вернулись добавить товар
            if (
              !this.error &&
              this.termsPaymentForm?.controls?.termsPayment?.value &&
              this.paymentTermConcated.length > 0
            ) {
              let findTerm = this.termsConditionsPayment.filter(
                (el) =>
                  el.paymentConditionId ==
                    this.termsPaymentForm.controls.termsPayment.value &&
                  el.paymentVolumeId ==
                    this.termsPaymentForm.controls.volume.value &&
                  el.prepayMomentId ==
                    this.termsPaymentForm.controls.momentPrepayment.value &&
                  el.delayMomentId ==
                    this.termsPaymentForm.controls.momentDelay.value
              );
              if (findTerm.length == 0) {
                this.termsPaymentForm.reset();
                this.paymentTermConcated = '';
              }
            }
            break;
          }
          //пересечения по полям: валюта заявки, ставка НДС, источник финансирования, корректируемая цена, валюта котировки
          case 4: {
            let currency = blockFind?.fields.find(
              (el) => el.interfaceField.fieldId == 4
            ); //валюта

            if (currency) {
              if (this.currencyConditions.length == 0) {
                this.currencyConditions = currency.selectedValues
                  ? JSON.parse(JSON.stringify(currency.selectedValues))
                  : JSON.parse(
                      JSON.stringify(currency.interfaceField.allowedValues)
                    );
              } else {
                this.currencyConditions = this.currencyConditions.filter((a) =>
                  currency.selectedValues
                    ? currency?.selectedValues?.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                    : currency.interfaceField.allowedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                );
              }

              if (this.currencyConditions?.length == 0) this.error = true;
            } else {
              //если в одном блоке валюта была,а в другом - нет
              if (this.currencyConditions?.length > 0) this.error = true;
            }
            if (
              !this.error &&
              this.goodsList.length > 0 &&
              currency &&
              !this.isArchiveSubmit
            ) {
              //проверка выбранного значения в первом товаре и его наличия в пересечениях
              // field['4'].find(el=> el.interfaceField.fieldId == 4).dataSource = this.currencyConditions
              if (
                !this.currencyConditions.find(
                  (el) => el.id == this.goodsList[0]?.currency?.id
                )
              ) {
                let listValues = '';
                this.currencyConditions.forEach((item) => {
                  listValues = listValues + item.name + ';';
                });
                let string =
                  this.translate.store.currentLang == 'RU'
                    ? '<b>' +
                      RU['createOffer'].goodInfo.currency +
                      `</b> на: ${listValues}`
                    : '<b>' +
                      EN['createOffer'].goodInfo.currency +
                      `</b> to:  ${listValues}`;
                this.nameField.push(string);
              }
            }
            break;
          }

          case 5: {
            let vat = blockFind?.fields.find(
              (el) => el.interfaceField.fieldId == 5
            ); //ставка НДС
            if (vat) {
              if (this.vatConditions.length == 0) {
                this.vatConditions = vat.selectedValues
                  ? JSON.parse(JSON.stringify(vat.selectedValues))
                  : JSON.parse(
                      JSON.stringify(vat.interfaceField.allowedValues)
                    );
              } else {
                this.vatConditions = this.vatConditions?.filter((a) =>
                  vat?.selectedValues
                    ? vat.selectedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                    : vat.interfaceField.allowedValues.some(
                        (b) => JSON.stringify(a) == JSON.stringify(b)
                      )
                );
              }

              if (this.vatConditions?.length == 0) this.error = true;
            } else {
              //если в одном блоке ставка НДС была, а в другом - нет
              if (this.vatConditions?.length > 0) this.error = true;
            }
            if (
              !this.error &&
              this.goodsList.length > 0 &&
              vat &&
              this.vatConditions?.length > 0 &&
              !this.isArchiveSubmit
            ) {
              //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (
                !this.vatConditions.find(
                  (el) => el.id == this.filledFields.vat?.id
                )
              ) {
                let listValues = '';
                this.vatConditions.forEach((item) => {
                  listValues = listValues + item.name + ';';
                });
                let string =
                  this.translate.store.currentLang == 'RU'
                    ? '<b>' +
                      RU['createOffer'].total.VAT +
                      `</b> на: ${listValues}`
                    : '<b>' +
                      EN['createOffer'].total.VAT +
                      `</b> to:  ${listValues}`;
                this.nameField.push(string);
              }
            }
            break;
          }

          case 6: {
            let financeSources = blockFind.fields.find(
              (el) => el.interfaceField.fieldId == 11
            ); //источник финансирования

            if (financeSources) {
              if (this.financeSourcesConditions.length == 0) {
                this.financeSourcesConditions = financeSources?.selectedValues
                  ? JSON.parse(JSON.stringify(financeSources?.selectedValues))
                  : JSON.parse(
                      JSON.stringify(
                        financeSources.interfaceField.allowedValues
                      )
                    );
              } else {
                this.financeSourcesConditions =
                  this.financeSourcesConditions?.filter((a) =>
                    financeSources.selectedValues
                      ? financeSources.selectedValues.some(
                          (b) => JSON.stringify(a) == JSON.stringify(b)
                        )
                      : financeSources.interfaceField.allowedValues.some(
                          (b) => JSON.stringify(a) == JSON.stringify(b)
                        )
                  );
              }

              if (this.financeSourcesConditions?.length == 0) this.error = true;
            } else {
              if (this.financeSourcesConditions?.length > 0) this.error = true;
            }
            if (
              !this.error &&
              this.goodsList.length > 0 &&
              financeSources &&
              this.financeSourcesConditions?.length > 0 &&
              !this.isArchiveSubmit
            ) {
              //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (
                this.filledFields?.finance &&
                !this.financeSourcesConditions?.find(
                  (el) => el?.id == this.filledFields?.finance
                )
              ) {
                let listValues = '';
                this.financeSourcesConditions.forEach((item) => {
                  listValues = listValues + item.name + ';';
                });
                let string =
                  this.translate.store.currentLang == 'RU'
                    ? '<b>' +
                      RU['createOffer'].goodInfo.sourceFinancing +
                      `</b> на: ${listValues}`
                    : '<b>' +
                      EN['createOffer'].goodInfo.sourceFinancing +
                      `</b> to:  ${listValues}`;
                this.nameField.push(string);
              }
            }
            break;
          }

          case 7: {
            let currencyQuotes = blockFind.fields?.find(
              (el) => el.interfaceField.fieldId == 55
            ); //валюта котировки

            if (currencyQuotes) {
              if (this.currencyQuotesConditions.length == 0) {
                this.currencyQuotesConditions = currencyQuotes.selectedValues
                  ? JSON.parse(JSON.stringify(currencyQuotes.selectedValues))
                  : JSON.parse(
                      JSON.stringify(
                        currencyQuotes.interfaceField.allowedValues
                      )
                    );
              } else {
                this.currencyQuotesConditions =
                  this.currencyQuotesConditions?.filter((a) =>
                    currencyQuotes.selectedValues
                      ? currencyQuotes.selectedValues.some(
                          (b) => JSON.stringify(a) == JSON.stringify(b)
                        )
                      : currencyQuotes.interfaceField.allowedValues.some(
                          (b) => JSON.stringify(a) == JSON.stringify(b)
                        )
                  );
              }

              if (this.currencyQuotesConditions?.length == 0) this.error = true;
            } else {
              if (this.currencyQuotesConditions?.length > 0) this.error = true;
            }
            if (
              !this.error &&
              this.goodsList.length > 0 &&
              currencyQuotes &&
              this.currencyQuotesConditions.length > 0 &&
              !this.isArchiveSubmit
            ) {
              //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (
                !this.currencyQuotesConditions?.find(
                  (el) => el?.id == this.filledFields.currencyQuotes
                )
              ) {
                let listValues = '';
                this.currencyQuotesConditions.forEach((item) => {
                  listValues = listValues + item.name + ';';
                });
                let string =
                  this.translate.store.currentLang == 'RU'
                    ? '<b>' +
                      RU['createOffer'].goodInfo.currencyQuotes +
                      `</b> на: ${listValues}`
                    : '<b>' +
                      EN['createOffer'].goodInfo.currencyQuotes +
                      `</b> to:  ${listValues}`;
                this.nameField.push(string);
              }
            }
            break;
          }
          case 8: {
            let adjustablePrice = blockFind.fields?.find(
              (el) => el.interfaceField.fieldId == 47
            ); //Корректируемая цена
            if (this.goodsList.length == 0 || this.goodsList[0] == this.good) {
              this.adjustablePriceConditions = adjustablePrice;
            } else {
              if (
                JSON.stringify(this.adjustablePriceConditions) !=
                JSON.stringify(adjustablePrice)
              )
                this.error = true;
            }
            break;
          }
          //поле 62 Место назначения
          case 9: {
            let destination = !!blockFind.fields?.find(
              (el) => el.interfaceField.fieldId == 62
            ); //Место назначения
            if (this.goodsList.length == 0 || this.goodsList[0] == this.good) {
              this.destinationConditions = destination;
            } else {
              if (
                JSON.stringify(this.destinationConditions) !=
                JSON.stringify(destination)
              )
                this.error = true;
            }
            break;
          }
        }
      } else break;
    }
    if (this.nameField.length > 0 && !loading) {
      this.error = true;
    }
  }

  public isChooseValueInIntersectionsSchedule(): void {
    if (
      !this.deliverySchedule.find((el) => el.id == this.deliveryTermSchedule)
    ) {
      this.schedule = [];
      this.deliveryTermSchedule = '';
      if (this.isArchiveSubmit) {
        this.error = true;
        this.errorState = ErrorStates.warning;
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].paymentDeliveryTerms.deliveryScheduleCleared
            : EN['createOffer'].paymentDeliveryTerms.deliveryScheduleCleared;
      }
    }
  }

  deliveryConditionsIntersections(blockFind) {
    if (
      this.isMinPriceOnBasicBasis ==
      blockFind.deliveryConditions.selectedValues.isMinPriceOnBasicBasis
    ) {
      //сравнение чекбокса isMinPriceOnBasicBasis
      if (
        this.isNotSpecified ==
        blockFind.deliveryConditions.selectedValues.isNotSpecified
      ) {
        //сравнение чекбокса isNotSpecified
        //сравнение массива значений
        this.deliveryConditions = this.deliveryConditions?.filter((a) =>
          blockFind.deliveryConditions.selectedValues.bases?.some((b) => {
            let equal = false;
            if (
              a.linkId == b.linkId &&
              a.minAddBasisPlaces == b.minAddBasisPlaces &&
              a.minAddBasis == b.minAddBasis &&
              a.isRequiredPlace == b.isRequiredPlace
            ) {
              if (a?.children?.length > 0) {
                a.children = a?.children.filter((child) =>
                  b?.children.find(
                    (Bchild) => JSON.stringify(child) == JSON.stringify(Bchild)
                  )
                );

                if (
                  a?.children?.length > 0 &&
                  a?.children?.length >= a.minAddBasis
                ) {
                  equal = true;
                }
              } else if (a?.children?.length == 0 && b?.children?.length == 0) {
                equal = true;
              }
            }
            return equal;
          })
        );

        if (this.deliveryConditions.length == 0 && !this.isNotSpecified) {
          this.error = true;
        }
      } else this.error = true;
    } else this.error = true;
    if (!this.error && this.deliveryBasis.length > 0) {
      //Заполнены условия поставки и вернулись добавить еще один товар
      this.isChooseValueInIntersectionsBasis();
    }
  }

  public isChooseValueInIntersectionsBasis(): void {
    let findBasis = this.deliveryConditions.find(
      (el) =>
        el.linkId == this.deliveryBasis[0].idBasisLink &&
        el.valueId == this.deliveryBasis[0].idBasisValue
    );
    if (findBasis) {
      for (let i = 1; i < this.deliveryBasis.length; i++) {
        if (
          !findBasis.children.find(
            (el) => el.linkId == this.deliveryBasis[i].basis
          )
        ) {
          this.deliveryBasis.splice(i, 1);
          i = i--;
        }
      }
    } else {
      this.deliveryBasis = [];
    }
  }

  deliveryTermIntersections(blockFind) {
    this.deliveryTerm = this.deliveryTerm.filter((a) =>
      blockFind.deliveryTerm.selectedValues.some((b) => {
        let equal = false;
        if (
          a.deliveryStartId == b.deliveryStartId &&
          a.deliveryTermId == b.deliveryTermId
        ) {
          if (a.dayValues) {
            //проверка данных массива дней
            a.dayValues = a.dayValues.filter((aDays) =>
              b.dayValues.includes(aDays)
            ); //записываем только общие данные в массив
            if (a.dayValues.length != 0) equal = true;
          }

          if (a.monthValues) {
            //проверка данных массива месяцев
            a.monthValues = a.monthValues.filter((aMonth) =>
              b.monthValues.includes(aMonth)
            ); //записываем только общие данные в массив
            if (a.monthValues.length != 0) equal = true;
          }
          if (
            a.endDeliveryDate == b.endDeliveryDate ||
            a.startDeliveryDate == b.startDeliveryDate
          ) {
            equal = true;
          }
        }
        return equal;
      })
    );

    if (this.deliveryTerm.length == 0) {
      this.error = true;
    }
    //Если заполнен Срок поставки и вернулись добавить еще один товар
    if (
      !this.error &&
      this.deliveryTermForm?.controls?.startDelivery?.value &&
      this.deliveryTermConcated.length > 0
    ) {
      this.isChooseValueInIntersectionsDeliveryTerm();
    }
  }

  public isChooseValueInIntersectionsDeliveryTerm(): void {
    let filterValues = this.deliveryTerm.filter(
      (el) =>
        el.deliveryStartId ==
          this.deliveryTermForm.controls.startDelivery.value &&
        el.deliveryTermId == this.deliveryTermForm.controls.deliveryType.value
    );
    if (filterValues.length > 0) {
      if (
        filterValues[0]?.dayValues?.length > 0 &&
        this.deliveryTermForm.controls.deliveryTerm?.value
      ) {
        if (
          !filterValues[0]?.dayValues.includes(
            this.deliveryTermForm.controls.deliveryTerm?.value
          )
        ) {
          this.schedule = [];
          this.deliveryTermSchedule = '';
          this.deliveryTermForm.reset();
          this.deliveryTermConcated = '';
        }
      }
      if (
        filterValues[0].monthValues?.length > 0 &&
        this.deliveryTermForm.controls.deliveryTerm?.value
      ) {
        if (
          !filterValues[0]?.monthValues.includes(
            this.deliveryTermForm.controls.deliveryTerm?.value
          )
        ) {
          this.schedule = [];
          this.deliveryTermSchedule = '';
          this.deliveryTermForm.reset();
          this.deliveryTermConcated = '';
        }
      }
    } else {
      this.schedule = [];
      this.deliveryTermSchedule = '';
      this.deliveryTermForm.reset();
      this.deliveryTermConcated = '';
    }
  }

  addGood(item: any) {
    this.goodInfo = false;
    this.editInfoGood = null;
    this.firstElement = false;
    let temp = this.goodsList.findIndex((g) => g.id == this.good.id); //ищем товар в списке добавленных
    if (item === false) {
      //ничего не пришло-удаляем
      this.OnDelete(temp, this.good);
    } else if (!item) {
      //отмена редактирования
      if (
        (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
        this.good.isUnvalidField
      ) {
        //если архивная заявка и товар весь в порядке
        this.checkUnvalidFields(this.good, '');
      }
      if (temp == -1) {
        //закрыть
        this.deliveryConditions = [];
        this.deliverySchedule = [];
        this.deliveryTerm = [];
        this.termsConditionsPayment = [];
        this.currencyConditions = [];
        this.vatConditions = [];
        this.financeSourcesConditions = [];
        this.currencyQuotesConditions = [];
        this.adjustablePriceConditions = undefined;
        this.isNotSpecified = undefined;

        if (this.goodsList.length > 0) {
          this.goodsList.forEach((good) => {
            this.good = good;
            this.intersections();
          });
        }
      }
      let cancelButton = document.getElementById('cancelButton');
      cancelButton.removeAttribute('disabled');
      let nextButton = document.getElementById('nextButton');
      nextButton.removeAttribute('disabled');
      return;
    } else {
      if (this.good.idOfferGood && !this.addBasisValue) {
        this.good.idOfferGood = null;
      }

      this.filledFields = {};

      if (this.good.isUnvalidField) {
        //если архивная заявка и сохранили товар, то ознакомились с ним и исправили
        this.good.isUnvalidField = false;
      }

      let amountVATValue,
        costNoVATValue,
        costVATValue,
        volume = {},
        cost = {},
        units = {},
        currency,
        quoteCurrency = {},
        quotation = {},
        amendment = {},
        priceAdjustment = {},
        minPriceField = {};
      item[3]?.forEach((i) => {
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.QUANTITY) {
          volume = { volume: i.selectedValues };
          this.volumePrecision = i.interfaceField.fieldPrecision;
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.UNIT) {
          units = {
            units: i.interfaceField.allowedValues.find(
              (u) => u.id == i.selectedValues
            ),
          };
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.MIN_PRICE) {
          minPriceField = {
            minPriceField: i.selectedValues,
            isRequiredMinPrice: i.isRequired,
          };
        }
      });

      item[4]?.forEach((i) => {
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT) {
          this.currencyPrecision = i.interfaceField.fieldPrecision;
          cost = { cost: i.selectedValues };
        }
        if (i.costVAT) {
          cost = Object.assign(cost, { costVAT: i.costVAT });
          costVATValue = i.costVAT;
        }
        if (i.amountVAT || i.amountVAT == 0) {
          amountVATValue = Number(i.amountVAT + 0);
        }
        if (i.costNoVAT) {
          costNoVATValue = i.costNoVAT;
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.CURRENCY) {
          //валюта
          this.filledFields = Object.assign(this.filledFields, {
            currency: i.selectedValues,
          });
          currency = {
            currency: i.interfaceField.allowedValues.find(
              (c) => c.id == i.selectedValues
            ),
          };
          this.commonService
            .GetPrecision(this.user?.token, i.selectedValues)
            .subscribe((res) => {
              this.currencyPrecision = res;
            });
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.VAT_RATE) {
          //ставка НДС
          this.filledFields = Object.assign(this.filledFields, {
            vat: i.interfaceField.allowedValues.find(
              (v) => v.id == i.selectedValues
            ),
          });
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.ADJUSTED_PRICE) {
          //корректируемая цена
          this.filledFields = Object.assign(this.filledFields, {
            adjustedPrice: i.selectedValues,
          });
        }
        if (i.interfaceField.fieldId == ID_INTERFACE_FIELD.QUOTE_CURRENCY) {
          //валюта котировки
          this.filledFields = Object.assign(this.filledFields, {
            currencyQuotes: i.selectedValues,
          });
          quoteCurrency = {
            quoteCurrency: i.interfaceField.allowedValues.find(
              (c) => c.id == i.selectedValues
            ),
          };
          this.commonService
            .GetPrecision(this.user?.token, i.selectedValues)
            .subscribe((res) => {
              this.quoteCurrencyPrecision = res;
            });
        }
        if (i.interfaceField.fieldId == 56) {
          //котировкa
          // this.filledFields = Object.assign(this.filledFields, {quotation : i.selectedValues});
          this.quoteCurrencyPrecision = i.interfaceField.fieldPrecision;
          quotation = { quotation: i.selectedValues };
        }
        if (i.interfaceField.fieldId == 54) {
          //поправка
          // this.filledFields = Object.assign(this.filledFields, {quotation : i.selectedValues});
          amendment = { amendment: i.selectedValues };
        }
        if (i.interfaceField.fieldId == 53) {
          //тип поправки
          this.filledFields = Object.assign(this.filledFields, {
            priceAdjustment: i.selectedValues,
          });
          priceAdjustment = {
            priceAdjustment: i.interfaceField.allowedValues.find(
              (c) => c.id == i.selectedValues
            ),
          };
        }
      });

      item[7]?.forEach((i) => {
        if (i.interfaceField.fieldId == 11) {
          //источник финансирования
          this.filledFields = Object.assign(this.filledFields, {
            finance: i.selectedValues,
          });
        }
      });

      const costWithoutVAT = this.totalForm.controls.costWithoutVat?.value
        ? Number(
            this.totalForm.controls.costWithoutVat?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const amountVAT = this.totalForm.controls.amountVAT?.value
        ? Number(
            this.totalForm.controls.amountVAT?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const costVAT = this.totalForm.controls.costVat?.value
        ? Number(
            this.totalForm.controls.costVat?.value
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
      const quantity =
        this.totalForm.controls.quantity?.value &&
        this.totalForm.controls.quantity?.value != '-'
          ? Number(
              this.totalForm.controls.quantity?.value
                .replace(this.goodsList[0].units.name, '')
                .replaceAll(/[^,\d]/g, '', '')
                .replace(/,/, '.')
            )
          : 0;

      if (temp != -1) {
        //редактируем товар
        let costVATValuePrevious;
        let amountVATValuePrevious;
        let costNoVATValuePrevious;
        let quantityPrevious;

        //получение предыдущих значений по товару для формы Итого по заявке
        this.good.fields.forEach((block) => {
          for (let i = 0; i < block[1].length; i++) {
            if (block[1][i].costVAT) {
              costVATValuePrevious = block[1][i].costVAT;
            }
            if (block[1][i].amountVAT || block[1][i].amountVAT == 0) {
              amountVATValuePrevious = block[1][i].amountVAT;
            }
            if (block[1][i].costNoVAT) {
              costNoVATValuePrevious = block[1][i].costNoVAT;
            }
            if (block[1][i].interfaceField.fieldId == 1) {
              quantityPrevious = block[1][i].selectedValues;
            }
          }
        });

        if (this.goodsList.findIndex((el) => el.id == this.good.id) == 0) {
          //если изменяли первый товар
          for (let j = 1; j < this.goodsList.length; j++) {
            this.goodsList[j].currency = currency?.currency;
            this.goodsList[j].fields.forEach((block) => {
              let costNoVATValue, amountVATValue;
              for (let i = 0; i < block[1].length; i++) {
                if (block[1][i].interfaceField.fieldId == 4) {
                  block[1][i].selectedValues = this.filledFields.currency;
                }
                if (block[1][i].interfaceField.fieldId == 5) {
                  block[1][i].selectedValues = this.filledFields.vat.id;
                }
                if (block[1][i].interfaceField.fieldId == 47) {
                  block[1][i].selectedValues = this.filledFields.adjustedPrice;
                }
                if (block[1][i].interfaceField.fieldId == 55) {
                  block[1][i].selectedValues = this.filledFields.currencyQuotes;
                }
                if (block[1][i].interfaceField.fieldId == 11) {
                  block[1][i].selectedValues = this.filledFields.finance;
                }
                if (block[1][i].interfaceField.fieldId == 53) {
                  block[1][i].selectedValues =
                    this.filledFields.priceAdjustment;
                }

                //Один товар с разными характеристиками:Сорт => предзаполняем все поля других товаров
                if (
                  this.demandsModal.complexLotProductTypes?.length == 1 &&
                  this.demandsModal.complexLotProductTypes.find(
                    (el) =>
                      el.typeId == COMPLEX_LOT_PRODUCT_TYPE_ID &&
                      el.referenceIds ==
                        COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
                  )
                ) {
                  if (
                    block[1][i].interfaceField.fieldId &&
                    (block[1][i].interfaceField.isAccessibleForWorker ||
                      [
                        ID_INTERFACE_FIELD.UNIT,
                        ID_INTERFACE_FIELD.CFEA,
                      ].includes(block[1][i].interfaceField.fieldId)) &&
                    ![
                      ...ACTUAL_SIZE_FIELDS,
                      ID_INTERFACE_FIELD.MIN_PRICE,
                      ID_INTERFACE_FIELD.THRESHOLD_PRICE_WITHOUT_VAT,
                    ].includes(block[1][i].interfaceField.fieldId.toString())
                  ) {
                    block[1][i].selectedValues = item[block[0]].find(
                      (field) =>
                        field.interfaceField.fieldId ==
                        block[1][i].interfaceField.fieldId
                    ).selectedValues;

                    if (
                      ID_INTERFACE_FIELD.UNIT ===
                      block[1][i].interfaceField.fieldId
                    ) {
                      this.goodsList[j].units = block[1][
                        i
                      ].interfaceField.allowedValues.find(
                        (u) => u.id == block[1][i].selectedValues
                      );
                    }
                  }
                }
                //пересчет формы итого
                if (block[1][i].costNoVAT) {
                  costNoVATValue = block[1][i].costNoVAT;
                }
                if (block[1][i].amountVAT || block[1][i].amountVAT == 0) {
                  amountVATValue = this.commonService.round(
                    (costNoVATValue *
                      Number(
                        this.filledFields.vat.name.replace(/[^0-9]/g, '')
                      )) /
                      100,
                    this.currencyPrecision
                  );
                  this.totalForm.controls.amountVAT.patchValue(
                    (
                      Number(
                        this.totalForm.controls.amountVAT?.value
                          .replaceAll(/[^,\d]/g, '', '')
                          .replace(/,/, '.')
                      ) -
                      Number(block[1][i].amountVAT) +
                      Number(amountVATValue)
                    ).toLocaleString('ru', {
                      minimumFractionDigits: this.currencyPrecision,
                      maximumFractionDigits: this.currencyPrecision,
                    })
                  );
                  block[1][i].amountVAT = block[1][i].selectedValues =
                    amountVATValue;
                }
                if (block[1][i].costVAT) {
                  let costVat = this.commonService.round(
                    amountVATValue + costNoVATValue,
                    this.currencyPrecision
                  );
                  this.totalForm.controls.costVat.patchValue(
                    (
                      Number(
                        this.totalForm.controls.costVat?.value
                          .replaceAll(/[^,\d]/g, '', '')
                          .replace(/,/, '.')
                      ) -
                      Number(block[1][i].costVAT) +
                      Number(costVat)
                    ).toLocaleString('ru', {
                      minimumFractionDigits: this.currencyPrecision,
                      maximumFractionDigits: this.currencyPrecision,
                    })
                  );
                  this.goodsList[j].costVAT =
                    block[1][i].costVAT =
                    block[1][i].selectedValues =
                      costVat;
                }
              }
              // this.goodsList[j].fields = Object.assign(this.goodsList[j].fields, block[1])
            });
          }
        }

        this.goodsList[temp] = Object.assign(
          this.good,
          { fields: Object.entries(item) },
          volume,
          cost,
          units,
          currency,
          quoteCurrency,
          quotation,
          amendment,
          priceAdjustment,
          minPriceField
        );

        // пересчет формы Итого по заявке
        this.totalForm.controls.costWithoutVat.patchValue(
          Number(
            Number(costWithoutVAT) -
              Number(costNoVATValuePrevious) +
              Number(costNoVATValue)
          ).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.amountVAT.patchValue(
          amountVATValue
            ? Number(
                Number(
                  this.totalForm.controls.amountVAT?.value
                    .replaceAll(/[^,\d]/g, '', '')
                    .replace(/,/, '.')
                ) -
                  Number(amountVATValuePrevious) +
                  Number(amountVATValue)
              ).toLocaleString('ru', {
                minimumFractionDigits: this.currencyPrecision,
                maximumFractionDigits: this.currencyPrecision,
              }) +
                ' ' +
                currency['currency'].name
            : Number('0').toLocaleString('ru', {
                minimumFractionDigits: this.currencyPrecision,
                maximumFractionDigits: this.currencyPrecision,
              }) +
                ' ' +
                currency['currency'].name
        );
        this.totalForm.controls.costVat.patchValue(
          (
            Number(
              this.totalForm.controls.costVat?.value
                .replaceAll(/[^,\d]/g, '', '')
                .replace(/,/, '.')
            ) -
            Number(costVATValuePrevious) +
            Number(costVATValue)
          ).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        if (this.onSameUnits() || this.goodsList.length == 1) {
          if (!quantity) {
            let volumeSum = 0;
            this.goodsList.forEach((item) => {
              volumeSum = volumeSum + Number(item.volume);
            });
            this.totalForm.controls.quantity.patchValue(
              Number(volumeSum).toLocaleString('ru', {
                maximumFractionDigits: this.volumePrecision,
              }) +
                ' ' +
                units['units'].name
            );
          } else
            this.totalForm.controls.quantity.patchValue(
              (
                Number(quantity) -
                Number(quantityPrevious) +
                Number(volume['volume'])
              ).toLocaleString('ru', {
                maximumFractionDigits: this.volumePrecision,
              }) +
                ' ' +
                units['units'].name
            );
        } else this.totalForm.controls.quantity.patchValue('-');
      } else {
        //добавляем новый товар
        this.goodsList.push(
          Object.assign(
            this.good,
            { fields: Object.entries(item) },
            volume,
            cost,
            units,
            currency,
            quoteCurrency,
            quotation,
            amendment,
            priceAdjustment,
            minPriceField
          )
        );

        // пересчет формы Итого по заявке
        this.totalForm.controls.costWithoutVat.patchValue(
          (Number(costWithoutVAT) + Number(costNoVATValue)).toLocaleString(
            'ru',
            { minimumFractionDigits: this.currencyPrecision }
          ) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.amountVAT.patchValue(
          amountVATValue || amountVATValue == 0
            ? (Number(amountVAT) + Number(amountVATValue)).toLocaleString(
                'ru',
                {
                  minimumFractionDigits: this.currencyPrecision,
                  maximumFractionDigits: this.currencyPrecision,
                }
              ) +
                ' ' +
                currency['currency'].name
            : Number('0').toLocaleString('ru', {
                minimumFractionDigits: this.currencyPrecision,
                maximumFractionDigits: this.currencyPrecision,
              }) +
                ' ' +
                currency['currency'].name
        );
        this.totalForm.controls.costVat.patchValue(
          (Number(costVAT) + Number(costVATValue)).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        if (this.onSameUnits() || this.goodsList.length == 1) {
          this.totalForm.controls.quantity.patchValue(
            (Number(quantity) + Number(volume['volume'])).toLocaleString('ru', {
              maximumFractionDigits: this.volumePrecision,
            }) +
              ' ' +
              units['units'].name
          );
        } else this.totalForm.controls.quantity.patchValue('-');
      }

      if (this.goodsList?.findIndex((el) => el.id == this.good.id) == 0) {
        this.totalForm.controls.vat.patchValue(
          this.filledFields.vat.name.replace('%', '')
        );
      }
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });

    if (
      this.deliveryBasis.length > 0 ||
      this.schedule.length > 0 ||
      this.delivScope.length > 0
    ) {
      if (this.deliveryBasis.length > 0 && !this.addBasisValue) {
        //при изменении товаров когда добавлены базисы
        let vat =
          this.filledFields.vat.id != 1 ? this.totalForm.controls.vat.value : 0;
        this.deliveryBasis.forEach((basis) => {
          this.goodsList.forEach((good) => {
            let find = basis.goods.find(
              (bg) => bg.id == good.id || bg.id === good?.oldId
            );
            if (!find) {
              basis.goods.push({
                id: good.id,
                name: good.name,
                volume: good.volume,
                units: good.units.name,
                cost: basis.coreBasis ? good.cost : 0,
                currency: good.currency.name,
                quotation: good.quotation,
                quoteCurrency: good.quoteCurrency,
                priceAdjustment: good.priceAdjustment?.id,
                amendment: basis.coreBasis ? good.amendment : 0,
                costVAT: basis.coreBasis
                  ? this.commonService.round(
                      good.cost * good.volume,
                      this.currencyPrecision
                    ) +
                    this.commonService.round(
                      (good.cost * good.volume * vat) / 100,
                      this.currencyPrecision
                    )
                  : 0,
                minPriceField: good.minPriceField,
                isRequiredMinPrice: good.isRequiredMinPrice,
              });
            } else {
              find.id = good.id;
              find.name = good.name;
              find.volume = good.volume;
              find.units = good.units.name;
              find.cost = basis.coreBasis ? good.cost : find.cost;
              find.currency = good.currency.name;
              find.quotation = good.quotation;
              find.quoteCurrency = good.quoteCurrency;
              find.priceAdjustment = good.priceAdjustment?.id;
              find.amendment = basis.coreBasis
                ? good.amendment
                : find.amendment;
              find.minPriceField = good.minPriceField;
              find.costVAT =
                this.commonService.round(
                  find.cost * good.volume,
                  this.currencyPrecision
                ) +
                this.commonService.round(
                  (find.cost * good.volume * vat) / 100,
                  this.currencyPrecision
                );
            }
          });
        });
      }

      if (this.schedule.length > 0) {
        this.schedule.forEach((sch) => {
          this.goodsList.forEach((good) => {
            let find = sch.goods.find(
              (s) => s.id == good.id || s.id === good?.oldId
            );
            if (find) {
              find.id = good.id;
              find.name = good.name;
              find.units = good.units;
            }

            if (this.sumVolumeGoodSchedule?.length > 0) {
              const sumFind = this.sumVolumeGoodSchedule.find(
                (sumSch) =>
                  Number(sumSch.id) === good.id ||
                  Number(sumSch.id) === good?.oldId
              );
              if (sumFind) {
                sumFind.id = good.id;
              }
            }
          });
        });
      }
      if (this.delivScope.length > 0) {
        this.delivScope.forEach((scope) => {
          this.goodsList.forEach((good) => {
            let find = scope.goods.find(
              (s) => s.goodId == good.id || s.goodId === good?.oldId
            );
            if (find) {
              find.goodId = good.id;
              find.goodName = good.name;
              find.goodUnits = good.units.name;
            }
          });
        });
      }
      setTimeout(() => {
        //для того чтобы экран проехал вверх и затем вывелся тост
        this.toastMessage =
          this.translate.store.currentLang == 'RU'
            ? RU['errors'].changeInfoGood
            : EN['errors'].changeInfoGood;
        this.isVisibleToast = true;
      }, 200);
    }

    let cancelButton = document.getElementById('cancelButton');
    cancelButton.removeAttribute('disabled');
    let nextButton = document.getElementById('nextButton');
    nextButton.removeAttribute('disabled');
  }

  public isDisabledEditGood(i: number): boolean {
    return (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
      this.goodsList[0].isUnvalidField &&
      i !== 0;
  }

  checkUnvalidFields(good, comeFrom) {
    good.isUnvalidField = false;
    good.fields.forEach((block) => {
      block[1].forEach((field) => {
        if (field.interfaceField.controlFieldType === 'dxSelectBox') {
          if (field.selectedValues) {
            //Проверка входят ли значения в выпадающий список
            if (!field.interfaceField.isAvailableFreeInput) {
              if (!field.interfaceField.isAvailableMultiSelection) {
                if (
                  !field.dataSource.find(
                    (el) => el.id === field.selectedValues.toString()
                  )
                ) {
                  good.isUnvalidField = true;
                  field.selectedValues = null;
                }
              } else {
                field.selectedValues.forEach((value) => {
                  if (
                    !field.dataSource.find((el) => el.id === value.toString())
                  ) {
                    good.isUnvalidField = true;
                    field.selectedValues = null;
                  }
                });
              }
            }
          }
        }
        if (!field.selectedValues) {
          if (field.selectedValues != 0) {
            if (field.isRequired && comeFrom != 'fromFirstStep') {
              good.isUnvalidField = true;
            } else if (comeFrom == 'fromFirstStep') {
              good.isUnvalidField = true;
            }
          }
        }
      });
    });
  }

  onSameUnits() {
    let count = 0;
    this.goodsList.forEach((item) => {
      if (item.units.id == this.goodsList[0].units.id) {
        count = count + 1;
      }
    });
    return count == this.goodsList.length;
  }

  OnDelete(index, good) {
    const costWithoutVAT = this.totalForm.controls.costWithoutVat?.value
      ? Number(
          this.totalForm.controls.costWithoutVat?.value
            .replaceAll(/[^,\d]/g, '', '')
            .replace(/,/, '.')
        )
      : 0;
    const amountVAT = this.totalForm.controls.amountVAT?.value
      ? Number(
          this.totalForm.controls.amountVAT?.value
            .replaceAll(/[^,\d]/g, '', '')
            .replace(/,/, '.')
        )
      : 0;
    const costVAT = this.totalForm.controls.costVat?.value
      ? Number(
          this.totalForm.controls.costVat?.value
            .replaceAll(/[^,\d]/g, '', '')
            .replace(/,/, '.')
        )
      : 0;
    const volume =
      this.totalForm.controls.quantity?.value &&
      this.totalForm.controls.quantity?.value != '-'
        ? Number(
            this.totalForm.controls.quantity?.value
              .replace(this.goodsList[0].units.name, '')
              .replaceAll(/[^,\d]/g, '', '')
              .replace(/,/, '.')
          )
        : 0;
    let costVATValue;
    let amountVATValue;
    let costNoVATValue;

    good.fields.forEach((block) => {
      for (let i = 0; i < block[1].length; i++) {
        if (block[1][i].costVAT) {
          costVATValue = block[1][i].costVAT;
        }
        if (block[1][i].amountVAT || block[1][i].amountVAT == 0) {
          amountVATValue = block[1][i].amountVAT;
        }
        if (block[1][i].costNoVAT) {
          costNoVATValue = block[1][i].costNoVAT;
        }
      }
    });

    this.totalForm.controls.costWithoutVat.patchValue(
      (Number(costWithoutVAT) - Number(costNoVATValue)).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
        ' ' +
        good.currency.name
    );
    this.totalForm.controls.amountVAT.patchValue(
      (Number(amountVAT) - Number(amountVATValue)).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
        ' ' +
        good.currency.name
    );
    this.totalForm.controls.costVat.patchValue(
      (Number(costVAT) - Number(costVATValue)).toLocaleString('ru', {
        minimumFractionDigits: this.currencyPrecision,
        maximumFractionDigits: this.currencyPrecision,
      }) +
        ' ' +
        good.currency.name
    );
    if (volume)
      this.totalForm.controls.quantity?.patchValue(
        (Number(volume) - Number(good.volume)).toLocaleString('ru', {
          maximumFractionDigits: this.volumePrecision,
        }) +
          ' ' +
          good.units.name
      );

    this.goodsList.splice(index, 1);

    if (this.onSameUnits() || this.goodsList.length == 1) {
      if (!volume) {
        let volumeSum = 0;
        this.goodsList.forEach((item) => {
          volumeSum = volumeSum + Number(item.volume);
        });
        this.totalForm.controls.quantity.patchValue(
          Number(volumeSum).toLocaleString('ru', {
            maximumFractionDigits: this.volumePrecision,
          }) +
            ' ' +
            this.goodsList[0].units.name
        );
      }
    }

    if (this.goodsList.length == 0) {
      this.totalForm.controls.vat.reset(null);
      this.totalForm.controls.costWithoutVat.reset(null);
      this.totalForm.controls.amountVAT.reset(null);
      this.totalForm.controls.costVat.reset(null);
      this.totalForm.controls.quantity.reset(null);
      this.isNotSpecified = undefined;
    }

    this.deliveryConditions = [];
    this.deliverySchedule = [];
    this.deliveryTerm = [];
    this.termsConditionsPayment = [];
    this.currencyConditions = [];
    this.vatConditions = [];
    this.financeSourcesConditions = [];
    this.currencyQuotesConditions = [];
    this.adjustablePriceConditions = undefined;
    this.isNotSpecified = undefined;

    this.goodsList.forEach((good) => {
      this.good = good;
      this.intersections();
    });

    if (this.deliveryBasis.length > 0) {
      //при изменении товаров когда добавлены базисы
      this.deliveryBasis.forEach((basis) => {
        const basisIndex = basis.goods.findIndex((el) => el.id == good.id);
        basis.goods.splice(basisIndex, 1);
      });
    }

    if (this.sumVolumeGoodSchedule?.length > 0) {
      const schIndex = this.sumVolumeGoodSchedule.findIndex(
        (el) => el.id == good.id
      );
      this.sumVolumeGoodSchedule.splice(schIndex, 1);
    }
    if (this.schedule.length > 0) {
      this.schedule.forEach((sch) => {
        const schIndex = sch.goods.findIndex((el) => el.id == good.id);
        sch.goods.splice(schIndex, 1);
      });
    }
    if (this.delivScope?.length > 0) {
      this.delivScope.forEach(scope => {
          const scopeIndex = scope.goods.findIndex(g => g.goodId === good.id);
          if (scopeIndex !== -1) {
            scope.goods.splice(scopeIndex, 1);
          }
        }
      );
    }

    this.deleteGood = false;
  }

  onEdit(good: any) {
    this.editInfoGood = good.id;
    this.viewInfoGood = null;
    this.good = good;
    if (this.idOffer) {
      this.blockModal = this.findBlock(this.good);
    }
    if (this.goodsList.findIndex((el) => el == this.good) == 0) {
      this.firstElement = true;
    }

    let cancelButton = document.getElementById('cancelButton');
    cancelButton.setAttribute('disabled', 'true');
    let nextButton = document.getElementById('nextButton');
    nextButton.setAttribute('disabled', 'true');
  }

  onViewInfo(good) {
    this.viewInfoGood = good.id;
    this.editInfoGood = null;
    this.goodInfo = false;
    let cancelButton = document.getElementById('cancelButton');
    cancelButton.removeAttribute('disabled');
    let nextButton = document.getElementById('nextButton');
    nextButton.removeAttribute('disabled');
  }

  valueSelectBox(field) {
    let string = '';
    if (!field.interfaceField.isAvailableMultiSelection) {
      if (field.interfaceField.allowedValues) {
        string = field.interfaceField.allowedValues.find(
          (item) => item.id == field.selectedValues
        )?.name;
      } else {
        string = field.dataSource?.find(
          (item) => item.id == field.selectedValues
        )?.name;
      }
    } else {
      field.selectedValues.forEach(function (id, idx) {
        if (field.interfaceField.allowedValues) {
          string =
            string +
            field.interfaceField.allowedValues.find((item) => item.id == id)
              ?.name +
            (idx == field.selectedValues.length - 1 ? '' : '; ');
        } else {
          string =
            string +
            field.dataSource.find((item) => item.id == id)?.name +
            (idx == field.selectedValues.length - 1 ? '' : '; ');
        }
      });
    }
    return string;
  }

  openBasis = [];
  deleteBasis = false;
  deleteGood = false;

  deleteBasisId: number;
  deleteCoreBasis: boolean;
  deletePlaceName: string;
  uniqueDeliveryTerm: any[];
  deliveryTermSchedule: string; // вид графика поставки

  isMinPrice() {
    //проверка есть ли минимальная цена в заявке для добавления колонки в базисы
    const result = this.goodsList[0].fields
      .flatMap(([, fields]) => fields)
      .find((field) => field.interfaceField?.fieldId === 9);
    return result;
  }

  calculateGroupValue(this: any, rowData: any) {
    //группировка таблицы по двум колонкам basis и enterPlaceName
    const sortValue = rowData.basis;
    const displayValue = rowData.enterPlaceName;
    return sortValue + ', ' + displayValue;
  }

  onCreateBasis() {
    this.addBasisValue = true;
    let cancelButton = document.getElementById('cancelButton');
    cancelButton.setAttribute('disabled', 'true');
    let nextButton = document.getElementById('nextButton');
    nextButton.setAttribute('disabled', 'true');
  }

  saveBasis(item) {
    let cancelButton = document.getElementById('cancelButton');
    cancelButton.removeAttribute('disabled');
    let nextButton = document.getElementById('nextButton');
    nextButton.removeAttribute('disabled');
    if (!item) {
      this.openBasis = [];
      this.addBasisValue = false;
      return;
    }
    this.deliveryBasis = item;
    if (this.dataGrid) this.dataGrid.instance.refresh();

    if (this.isActiveCorridor) {
      this.isPriceRangeWarning = false;
      this.deliveryBasis.forEach((basis) => {
        basis.goods.forEach((good) => {
          //проверка на соответствии ценового коридора
          if (
            (good.minPrice && good.cost < good.minPrice) ||
            (good.maxPrice && good.cost > good.maxPrice)
          ) {
            //если не входит в ценовой коридор
            good.range = true;
            this.isPriceRangeWarning = true;
          } else good.range = false;
        });
      });
    }
    if (
      (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
      this.openBasis[0]?.isUnvalidBasis
    ) {
      this.openBasis[0].isUnvalidBasis = false;
    }
    //если поменяли цену товара в основном базисе, то заменяем цену в массиве товаров
    if (
      this.openBasis?.length > 0 &&
      this.openBasis[0]?.coreBasis &&
      this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation
    ) {
      //при редактировании
      this.changePriceInMainBasis(this.openBasis);
    }
    if (
      this.deliveryBasis?.length == 1 &&
      this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation
    ) {
      //при добавлении основного базиса
      this.changePriceInMainBasis(this.deliveryBasis);
    }

    this.openBasis = [];
    this.addBasisValue = false;
  }

  changePriceInMainBasis(array) {
    //изменение цены в основном базисе
    array[0].goods.forEach((g) => {
      this.good = this.goodsList.find((el) => el.id == g.id);
      let goodFromGoodsList = JSON.parse(JSON.stringify(this.good));
      let vat,
        goodFromGoodsListField = goodFromGoodsList.fields.find(
          (item) => item[0] == 4
        )
          ? goodFromGoodsList.fields.find((item) => item[0] == 4)[1]
          : null,
        goodFromGoodsListField3 = goodFromGoodsList.fields.find(
          (item) => item[0] == 3
        )
          ? goodFromGoodsList.fields.find((item) => item[0] == 3)[1]
          : null,
        VAT = goodFromGoodsList.fields
          .find((item) => item[0] == 4)[1]
          .find((j) => j.interfaceField.fieldId == ID_INTERFACE_FIELD.VAT_RATE);

      if (
        goodFromGoodsListField.find(
          (j) =>
            j.interfaceField.fieldId == ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT
        ).selectedValues != g.cost
      ) {
        //если цены не равны
        if (VAT.selectedValues != 1) {
          vat = Number(
            VAT.dataSource
              .find((el) => el.id == VAT.selectedValues)
              .name.replace(/[^0-9]/g, '')
          );
        } else vat = 0;

        goodFromGoodsListField.find(
          (j) =>
            j.interfaceField.fieldId === ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT
        ).selectedValues = g.cost; //поле Цена без НДС в полях заявки
        let costWithoutVAT = g.cost * g.volume,
          costVAT = costWithoutVAT + costWithoutVAT * (vat / 100);
        goodFromGoodsListField.find((j) => j.costNoVAT).costNoVAT =
          goodFromGoodsListField.find((j) => j.costNoVAT).selectedValues =
            costWithoutVAT; //Стоимость без НДС в полях заявки
        goodFromGoodsListField.find(
          (j) => j.amountVAT || j.amountVAT == 0
        ).amountVAT = goodFromGoodsListField.find(
          (j) => j.amountVAT || j.amountVAT == 0
        ).selectedValues = costWithoutVAT * (vat / 100);
        goodFromGoodsListField.find((j) => j.costVAT).costVAT =
          goodFromGoodsListField.find((j) => j.costVAT).selectedValues =
            costVAT;
        this.editFields(goodFromGoodsList);
      }

      let minPriceField = goodFromGoodsListField3.find(
        (j) => j.interfaceField.fieldId == ID_INTERFACE_FIELD.MIN_PRICE
      );
      if (minPriceField && minPriceField.selectedValues != g.minPriceField) {
        minPriceField.selectedValues = g.minPriceField; //поле мин. цена без НДС в полях заявки
        this.editFields(goodFromGoodsList);
      }
    });
  }

  public editFields(goodFromGoodsList): void {
    let editFields = {};
    goodFromGoodsList.fields.forEach((el) => {
      editFields[el[0]] = el[1];
    });
    this.addGood(editFields);
  }

  deleteGoodIndex: number;
  deleteGoodGood: any;

  onDeleteGoodPopup(i, good) {
    this.deleteGood = true;
    this.deleteGoodIndex = i;
    this.deleteGoodGood = good;
  }

  onDeleteBasisPopup(item, e?) {
    e.event.stopPropagation();
    this.deleteBasis = true;
    this.deleteBasisId = item.basis;
    this.deleteCoreBasis = item.coreBasis;
    this.deletePlaceName = item.enterPlaceName;
  }

  onDeleteBasis() {
    if (this.deleteCoreBasis) {
      this.deliveryBasis.length = 0;
    } else {
      let deleteArray = this.deliveryBasis.filter(
        (el) =>
          el.basis == this.deleteBasisId &&
          el.enterPlaceName === this.deletePlaceName
      );
      this.deliveryBasis = this.deliveryBasis.filter(
        (el) => !deleteArray.includes(el)
      );
    }

    this.openBasis = [];
    this.deleteBasis = false;
    this.addBasisValue = false;
  }

  onEditBasis(e, b, id, place) {
    e.event.stopPropagation();
    this.addBasisValue = true;
    this.openBasis = this.deliveryBasis.filter(
      (el) => el.basis == id && el.enterPlaceName === place
    );

    let cancelButton = document.getElementById('cancelButton');
    cancelButton.setAttribute('disabled', 'true');
    let nextButton = document.getElementById('nextButton');
    nextButton.setAttribute('disabled', 'true');
  }

  OnSaveDeliverySchedule(e) {
    if (e) {
      this.schedule = e.schedule;
      this.deliveryTermSchedule = e.term;
      this.deliveryTermScheduleChoose = this.deliverySchedule?.find(
        (el) => el.id == this.deliveryTermSchedule
      ).name;
      this.sumVolumeGoodSchedule = e.sumVolumeGoodTerm;
    }
    this.deliverySchedulePopup = false;
  }

  OnSaveDeliveryScope(e) {
    //грузополучатели
    if (e) {
      this.delivScope = e;
    }
    this.delivScopePopup = false;
  }

  deliveryTermValue = [];
  deliveryTermConcated: string;

  deliveryTermStartChange(str) {
    this.schedule = [];
    switch (str) {
      case 'deliveryStart': {
        //фильтрация deliveryTermType в соответствии с тем, что выбрано в "Начало поставки"
        this.deliveryTermType = this.deliveryTerm.filter(
          (el) =>
            el.deliveryStartId ==
            this.deliveryTermForm.controls?.startDelivery?.value
        );
        //очистка всей формы
        this.deliveryTermForm.controls.deliveryType.reset();
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').reset();
        this.deliveryTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;
        //если найдена всего одна запись - сразу отображается заполненый select-box
        if (this.deliveryTermType.length == 1) {
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.deliveryTermType[0].deliveryTermId
          );
        }

        if (
          this.idOffer &&
          !this.deliveryTermForm.controls.deliveryType.value &&
          !this.isEditedDeliveryTerm
        ) {
          const foundTerm = this.deliveryTermType.find(el => el.deliveryTermId === this.offerDeliveryPeriod.idDeliveryType?.toString());
          this.deliveryTermForm.controls.deliveryType.patchValue(
            foundTerm ? (this.offerDeliveryPeriod.idDeliveryType?.toString() || null) : null
          );
          this.deliveryTermStartChange('deliveryType');
        }

        break;
      }
      case 'deliveryType': {
        //очищаются все значения
        this.deliveryTermValue = [];
        this.deliveryTermForm.get('startDate').setValue(null);
        this.deliveryTermForm.get('endDate').setValue(null);
        this.deliveryTermForm.get('deliveryTerm').setValue(null);
        this.deliveryTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

        //если период «Календарные дни» или «Месяцы»
        if (
          this.deliveryTermForm.controls.deliveryType.value == 1 ||
          this.deliveryTermForm.controls.deliveryType.value == 2
        ) {
          let during =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].deliveryTime.during
              : EN['createOffer'].deliveryTime.during;
          if (
            this.deliveryTermForm.controls.deliveryType?.value ==
            ID_DELIVERY_TERM_TYPE.CALENDAR_DAYS
          ) {
            //дни
            //формирование массива "В течение Х дней"
            let days = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls.deliveryType?.value
            ).dayValues;
            for (let i = 0; i < days.length; i++) {
              this.deliveryTermValue.push({
                id: days[i],
                value:
                  during +
                  ' ' +
                  days[i] +
                  ' ' +
                  (this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].deliveryTime.calendarDays
                    : EN['createOffer'].deliveryTime.calendarDays),
              });
            }
          }
          if (
            this.deliveryTermForm.controls.deliveryType?.value ==
            ID_DELIVERY_TERM_TYPE.MONTHS
          ) {
            //месяца
            // формирование массива "В течение Х месяцев"
            let months = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ===
                this.deliveryTermForm.controls.deliveryType?.value
            )?.monthValues;
            for (let i = 0; i < months?.length; i++) {
              this.deliveryTermValue.push({
                id: months[i],
                value:
                  during +
                  ' ' +
                  months[i] +
                  ' ' +
                  (this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].deliveryTime.months
                    : EN['createOffer'].deliveryTime.months),
              });
            }
          }

          if (
            this.idOffer &&
            !this.deliveryTermForm.controls.deliveryTerm.value &&
            !this.isEditedDeliveryTerm
          ) {
            if (
              !(
                this.isArchiveSubmit &&
                !this.deliveryTermValue.find(
                  (el) => el.id == this.offerDeliveryPeriod.periodTypeValue
                )
              )
            ) {
              if (this.createOfferService.isValueInTheArray(this.deliveryTermValue, this.offerDeliveryPeriod.periodTypeValue)) {
                this.deliveryTermForm.controls.deliveryTerm.patchValue(
                  this.offerDeliveryPeriod.periodTypeValue
                );
              }
            }
          }

          this.deliveryTermValue.sort((a, b) => a.id - b.id); //сортировка по id
          if (this.deliveryTermValue.length === 1) {
            this.deliveryTermForm.controls.deliveryTerm.patchValue(
              this.deliveryTermValue[0].id
            );
            this.onCreateString();
          }
        }
        break;
      }
    }
  }

  isDate() {
    return this.deliveryTermType.find(
      (el) =>
        el.deliveryTermId.toString() ==
        this.deliveryTermForm.controls.deliveryType.value
    );
  }

  // getDaysCount
  // Получить расчетный период в днях (период вида <дата начала>-<дата окончания> --> дни; месяцы --> дни;)
  getDaysCount(startDate, endDate, daysCnt, monthCnt) {
    var daysCounter = 0;

    var _startDate = null;
    var _endDate = null;

    var _deliveryTermType = 0;

    if (daysCnt > 0) {
      _deliveryTermType = 1; // на вход пришел период в днях (ничего делать не будем - вренем обратно)
    } else if (monthCnt > 0) {
      _deliveryTermType = 2; // на вход пришел период в месяцах
    } else if (startDate != null && endDate != null) {
      _deliveryTermType = 3; // на вход пришел период вида <Дата начала>-<Дата окончания>
    }

    switch (_deliveryTermType) {
      //календарные дни
      case 1:
        if (daysCnt > 0) {
          daysCounter = daysCnt;
        }
        break;
      // месяцы
      case 2:
        if (startDate != null && monthCnt > 0) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');

          var a = moment(_startDate, 'DD-MM-YYYY');
          var b = moment(a).add(monthCnt, 'M');

          daysCounter = b.diff(a, 'days');
        }
        break;
      //дата
      case 3:
        if (startDate != null && endDate != null) {
          _startDate = moment.unix(startDate / 1000).format('DD-MM-YYYY');
          _endDate = moment.unix(endDate / 1000).format('DD-MM-YYYY');

          daysCounter = moment(_endDate, 'DD-MM-YYYY').diff(
            moment(_startDate, 'DD-MM-YYYY'),
            'days'
          );
        }
        break;
    }
    return daysCounter;
  }

  onCreateString() {
    if (
      this.deliveryTermForm.controls.startDelivery.value ==
      ID_DELIVERY_TERM.NOT_SET_START_DELIVERY
    ) {
      //если начало поставки «Начало поставки не задано»
      if (this.deliveryTermForm.controls.endDate.value) {
        //проверка заполнение поля «Дата окончания поставки»
        this.GetDeliveryTermConcated();
      }
    } else {
      //если начало поставки «С даты регистрации договора на бирже», «С даты начала поставки», «С даты поступления предоплаты»
      switch (this.deliveryTermForm.controls.deliveryType.value) {
        case '1':
        case '2': {
          //если период «Календарные дни» или «Месяцы»
          if (this.deliveryTermForm.controls.deliveryTerm.value) {
            //проверка заполнение поля срок поставки
            this.deliveryTermForm.controls.startDelivery.value ==
              ID_DELIVERY_TERM.DATE_OF_DELIVERY &&
            !this.deliveryTermForm.controls.startDate?.value
              ? null
              : this.GetDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                this.deliveryTermForm.controls.deliveryType.value == '1'
                  ? this.deliveryTermForm.controls.deliveryTerm.value == null
                    ? 0
                    : this.deliveryTermForm.controls.deliveryTerm.value
                  : 0,
                this.deliveryTermForm.controls.deliveryType.value == '2'
                  ? this.deliveryTermForm.controls.deliveryTerm.value == null
                    ? 0
                    : this.deliveryTermForm.controls.deliveryTerm.value
                  : 0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
        case '3': {
          //если Период "Дата"
          if (
            this.deliveryTermForm.controls.startDate?.value &&
            this.deliveryTermForm.controls.endDate?.value
          ) {
            //проверка заполнения полей «Дата начала поставки» и «Дата окончания поставки»
            this.GetDeliveryTermConcated();

            this.isDaysCountCorrect =
              this.getDaysCount(
                this.deliveryTermForm.controls.startDate?.value,
                this.deliveryTermForm.controls.endDate?.value,
                0,
                0
              ) >= minDeliveryScheduleDaysCount;
          }
          break;
        }
      }
    }
    if (this.deliverySchedule?.length == 0 || this.disabledButtonSchedule())
      this.schedule = [];
  }

  GetDeliveryTermConcated() {
    this.createOfferService
      .GetDeliveryTermConcated(
        this.user?.token,
        this.deliveryTermForm.controls.startDelivery.value,
        this.deliveryTermForm.controls.deliveryType.value,
        this.deliveryTermForm.controls.deliveryTerm?.value,
        this.deliveryTermForm.controls.startDate?.value
          ? this.commonService.toOADate(
              this.deliveryTermForm.controls.startDate?.value
            )
          : null,
        this.deliveryTermForm.controls.endDate?.value
          ? this.commonService.toOADate(
              this.deliveryTermForm.controls.endDate?.value
            )
          : null
      )
      .then((res: any) => {
        this.deliveryTermConcated = this.commonService.ucFirst(res.result);

        if (
          this.deliveryTermConcated?.length > 0 &&
          this.paymentTermConcated?.length > 0
        ) {
          this.getDeadlines();
        }
      });
  }

  disabledButtonSchedule() {
    if (
      this.idOffer &&
      this.offerDelivSchPeriods.length > 0 &&
      this.deliveryTermForm.controls.startDelivery?.value == 2 &&
      !this.isEditedDeliveryTerm &&
      JSON.parse(this.filledFields?.adjustedPrice.toString().toLowerCase())
    ) {
      return false;
    } else {
      return !(
        this.deliveryTerm.length > 0 &&
        this.deliveryTermForm.controls.startDelivery?.value &&
        this.deliveryTermForm.controls.startDelivery?.value == 2 &&
        this.deliveryTermForm.controls.deliveryType.value &&
        this.isDaysCountCorrect &&
        this.deliveryTermForm.controls.startDate.value &&
        (this.deliveryTermForm.controls.deliveryType.value == 3
          ? this.deliveryTermForm.controls.endDate.value
          : this.deliveryTermForm.controls.deliveryTerm.value) &&
        (this.deliveryTermForm.controls.endDate.value
          ? this.deliveryTermForm.controls.endDate.value >=
            this.deliveryTermForm.controls.startDate.value
          : true) &&
        this.adjustablePriceConditions &&
        JSON.parse(this.filledFields?.adjustedPrice.toString().toLowerCase())
      );
    }
  }

  validateEndDate = () => {
    return this.deliveryTermForm.controls.startDate.value;
  };

  /*Условия оплаты*/
  momentPrepayment: any;
  momentDelay: any;
  readOnlyDefermentAmount = true;
  paymentTermConcated: string;
  termsConditionsPaymentValue = [];
  termsConditions: any;
  volumeTerms: any = [];
  volumeTermsPayment: any;
  termsConditionsFilter: any; //условия оплаты отфильтрованные по условиям оплаты из пересечения
  termsConditionsVolumesFilter: any; //условия оплаты отфильтрованные по условиям оплаты и объему из пересечения

  timberTicket = false; //до выдачи лесорубочного билета

  momentPrepaymentValues = [];
  momentDelayValues = [];
  dayType = []; //тип дней (календарные/банковские) в выбранном условии

  onTermsPaymentChange(str: string) {
    switch (str) {
      case 'termsPayment': {
        this.termsPaymentForm.controls.volume.reset();
        this.termsPaymentForm.controls.prepaymentAmount.reset();
        this.termsPaymentForm.controls.dayTypeId.reset();
        this.volumeTerms = [];
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

        //выбранное значение условия оплаты
        this.termsConditions = this.termsConditionsPaymentValue.find(
          (el) => el.id == this.termsPaymentForm.controls.termsPayment.value
        );
        //условия оплаты отфильторованные по условиям оплаты из пересечения
        this.termsConditionsFilter = this.termsConditionsPayment.filter(
          (el) =>
            el.paymentConditionId ==
            this.termsPaymentForm.controls.termsPayment.value
        );
        //формирование массива объема доступных для выбора
        this.termsConditions.volumes.forEach((item) => {
          if (
            this.termsConditionsFilter.find(
              (el) => el.paymentVolumeId == item.id
            ) &&
            !this.volumeTerms.find((el) => el.id == item.id)
          )
            this.volumeTerms.push(item);
        });
        //если одно значение в массиве объема
        if (this.volumeTerms.length == 1) {
          this.termsPaymentForm.controls.volume.setValue(
            this.volumeTerms[0].id
          );
          this.onTermsPaymentChange('volume');
        }

        if (
          this.idOffer &&
          !this.termsPaymentForm.controls.volume.value &&
          !this.isEditedTermsPayment
        ) {
          if (this.createOfferService.isValueInTheArray(this.volumeTerms, this.offerPaymentCond.idShipmentVolume.toString())) {
            this.termsPaymentForm.controls.volume.setValue(
              this.offerPaymentCond.idShipmentVolume.toString()
            );
            this.onTermsPaymentChange('volume');
          }
        }
        break;
      }
      case 'volume': {
        this.termsPaymentForm.controls.momentPrepayment.setValue(null);
        this.termsPaymentForm.controls.prepaymentAmount.setValue(null);
        this.termsPaymentForm.controls.momentDelay.setValue(null);
        this.termsPaymentForm.controls.defermentAmount.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.readOnlyDefermentAmount = true;
        this.momentPrepayment = null;
        this.momentDelay = null;
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;
        this.momentDelayValues = [];
        this.momentPrepaymentValues = [];

        if (this.termsPaymentForm.controls.volume.value) {
          //выбранное значение объема
          this.volumeTermsPayment = this.termsConditions.volumes.find(
            (el) => el.id == this.termsPaymentForm.controls.volume.value
          );

          //условия оплаты отфильтрованы по условиям оплаты и объему из пересечения
          this.termsConditionsVolumesFilter = this.termsConditionsFilter.filter(
            (el) =>
              el.paymentVolumeId == this.termsPaymentForm.controls.volume.value
          );

          //Условие оплаты в форме заявки = «Предоплата 100%» или Оплата через счета биржи
          if (
            this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.prepayment100 ||
            this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.paymentThroughExchange
          ) {
            this.termsPaymentForm.controls.prepaymentAmount.setValue(100); //Размер предоплаты
          }
          //Условие оплаты в форме заявки = «Отсрочка»
          if (
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.paymentDeferment
          ) {
            this.termsPaymentForm.controls.defermentAmount.setValue(100); //Размер отсрочки
          }

          // «Условие оплаты» в форме заявке = «Предоплата 100%» или «Частичная предоплата»;
          if (
            this.termsPaymentForm.controls.termsPayment?.value !=
            termsConditionsPaymentConst.paymentDeferment
          ) {
            //предоплата
            this.volumeTermsPayment.prepayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.prepayMomentId == item.id
                ) &&
                !this.momentPrepaymentValues.find((el) => el.id == item.id)
              )
                this.momentPrepaymentValues.push(item);
            });
            if (this.idOffer && !this.isEditedTermsPayment) {
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.momentPrepaymentValues.find(
                    (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                  )
                )
              ) {
                if (this.createOfferService.isValueInTheArray(this.momentPrepaymentValues, this.offerPaymentCond.firstPaymentMomentId?.toString())) {
                  this.termsPaymentForm.controls.momentPrepayment.setValue(
                    this.offerPaymentCond.firstPaymentMomentId?.toString()
                  );
                  this.termsPaymentForm.controls.prepaymentAmount.setValue(
                    this.offerPaymentCond?.firstPercent
                  );
                  this.onTermsPaymentChange('momentPrepayment');
                }
                break;
              }
            }
            if (this.momentPrepaymentValues.length == 1) {
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.momentPrepaymentValues[0].id
              );
              this.onTermsPaymentChange('momentPrepayment');
              break;
            }
          } else {
            //отсрочка
            this.volumeTermsPayment.delayMoments.forEach((item) => {
              if (
                this.termsConditionsVolumesFilter.find(
                  (el) => el.delayMomentId == item.id
                ) &&
                !this.momentDelayValues.find((el) => el.id == item.id)
              )
                this.momentDelayValues.push(item);
            });

            if (
              this.idOffer &&
              (!this.termsPaymentForm.controls.momentDelay.value ||
                !this.termsPaymentForm.controls.defermentAmount.value) &&
              !this.isEditedTermsPayment
            ) {
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.momentDelayValues.find(
                    (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                  )
                )
              ) {
                if (
                  Number(this.termsPaymentForm.controls.momentPrepayment?.value) !== TIMBER_TICKET &&
                  this.createOfferService.isValueInTheArray(this.momentDelayValues, this.offerPaymentCond.firstPaymentMomentId?.toString())
                ) {
                  this.termsPaymentForm.controls.momentDelay.setValue(
                    this.offerPaymentCond.firstPaymentMomentId?.toString()
                  );
                  this.onTermsPaymentChange('momentDelay');
                }
                break;
              }
            }

            if (this.momentDelayValues.length == 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange('momentDelay');
              break;
            }
          }
        }
        break;
      }
      case 'momentPrepayment': {
        this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(null);
        this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;
        this.readOnlyDefermentAmount = true; //при переключении с лесорубочного надругое значение. дизейблим размер отсрочки

        this.timberTicket = false;
        if (this.termsPaymentForm.controls.momentPrepayment.value) {
          this.momentPrepayment = this.volumeTermsPayment.prepayMoments.find(
            (el) =>
              el.id == this.termsPaymentForm.controls.momentPrepayment.value
          );
          if (this.momentPrepayment?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                  this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                  this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                  this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                  this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;
            if (this.dayType?.length == 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            this.idOffer &&
            !(
              this.termsPaymentForm.controls.prepaymentPeriodNumber.value ||
              this.termsPaymentForm.controls.prepaymentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment &&
            this.offerPaymentCond.firstPaymentMomentId != 7
          ) {
            if (
              !(
                this.isArchiveSubmit &&
                !this.momentPrepaymentValues.find(
                  (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                )
              )
            ) {
              let date: any = this.offerPaymentCond?.firstPeriodValueDate
                ? (this.offerPaymentCond?.firstPeriodValueDate - 25569) *
                  24 *
                  3600 *
                  1000
                : null;
              this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(
                this.offerPaymentCond.firstPeriodValueNumber?.toString()
              );
              this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(
                date
              );
              this.onSetValueDayType();
            }
            //Условие оплаты в форме заявки = «Предоплата 100%»
            if (
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.paymentThroughExchange
            ) {
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.momentPrepaymentValues.find(
                    (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                  )
                )
              ) {
                this.paymentTermConcated = this.commonService.ucFirst(
                  this.offerGeneral.concatedPaymentConditions
                );
                //todo
              } else {
                this.getPaymentTermConcatedString();
              }
            }
          }

          //«Условие оплаты» в форме заявки = «Частичная предоплата»
          if (
            this.termsPaymentForm.controls.termsPayment.value ==
            termsConditionsPaymentConst.partialPrepayment
          ) {
            this.momentDelayValues = this.momentPrepayment.delayMoments;
            //  this.termsPaymentForm.controls.prepaymentAmount.setValue(null);
            //   this.termsPaymentForm.controls.defermentAmount.setValue(null);
            this.onPrepaymentAmountChange();
            if (
              this.idOffer &&
              !this.termsPaymentForm.controls.momentDelay.value &&
              !this.isEditedTermsPayment
            ) {
              this.termsPaymentForm.controls.defermentAmount.setValue(
                this.offerPaymentCond.secondPercent
              );
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.momentDelayValues.find(
                    (el) => el.id == this.offerPaymentCond.secondPaymentMomentId
                  )
                )
              ) {
                if (this.createOfferService.isValueInTheArray(this.momentDelayValues, this.offerPaymentCond.secondPaymentMomentId?.toString())) {
                  this.termsPaymentForm.controls.momentDelay.setValue(
                    this.offerPaymentCond.secondPaymentMomentId?.toString()
                  );
                  this.onTermsPaymentChange('momentDelay');
                }
              }
              /*    if (this.offerPaymentCond.firstPaymentMomentId != 7)
                this.termsPaymentForm.controls.momentDelay.setValue(this.offerPaymentCond.firstPaymentMomentId?.toString())
              else this.termsPaymentForm.controls.momentDelay.setValue(this.offerPaymentCond.secondPaymentMomentId?.toString());*/

              break;
            }
            if (this.momentDelayValues.length == 1) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.momentDelayValues[0].id
              );
              this.onTermsPaymentChange('momentDelay');
              break;
            }
          }
          //формирование строки для «Условие оплаты» в форме заявке = «Предоплата 100%» и Момент предоплаты = «до выдачи лесорубочного билета»
          if (
            (this.termsPaymentForm.controls.termsPayment.value ==
              termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.paymentThroughExchange) &&
            this.termsPaymentForm.controls.momentPrepayment?.value == 7
          ) {
            this.timberTicket = true;
            this.getPaymentTermConcatedString();
          }
        }

        break;
      }
      case 'momentDelay': {
        this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(null);
        this.termsPaymentForm.controls.defermentPeriodDate?.setValue(null);
        this.termsPaymentForm.controls.dayTypeId?.setValue(null);
        this.paymentTermConcated = '';
        this.deadlineDelivery = null;
        this.deadlinePayment = null;

        if (this.termsPaymentForm.controls.momentDelay.value) {
          if (
            this.termsPaymentForm.controls.termsPayment.value ==
            termsConditionsPaymentConst.partialPrepayment
          ) {
            this.momentDelay = this.momentPrepayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );
          } else
            this.momentDelay = this.volumeTermsPayment.delayMoments.find(
              (el) => el.id == this.termsPaymentForm.controls.momentDelay.value
            );

          if (this.momentDelay?.options.applicableDayCount) {
            this.dayType = this.termsConditionsPayment.find(
              (el) =>
                el.paymentConditionId ==
                  this.termsPaymentForm.controls.termsPayment.value &&
                el.paymentVolumeId ==
                  this.termsPaymentForm.controls.volume.value &&
                el.prepayMomentId ==
                  this.termsPaymentForm.controls.momentPrepayment.value &&
                el.delayMomentId ==
                  this.termsPaymentForm.controls.momentDelay.value
            )?.dayTypeId;
            if (this.dayType?.length == 1) {
              this.termsPaymentForm.controls.dayTypeId.setValue(
                this.dayType[0]
              );
            }
          }

          if (
            this.idOffer &&
            !(
              this.termsPaymentForm.controls.defermentPeriodNumber.value ||
              this.termsPaymentForm.controls.defermentPeriodDate.value
            ) &&
            !this.isEditedTermsPayment
          ) {
            if (
              this.offerPaymentCond?.idPaymentType !=
              termsConditionsPaymentConst.partialPrepayment
            ) {
              //если это предоплата или отсрочка
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.momentDelayValues.find(
                    (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                  )
                )
              ) {
                let date: any = this.offerPaymentCond?.firstPeriodValueDate
                  ? (this.offerPaymentCond?.firstPeriodValueDate - 25569) *
                    24 *
                    3600 *
                    1000
                  : null;
                this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                  this.offerPaymentCond?.firstPeriodValueNumber?.toString()
                );
                this.termsPaymentForm.controls.defermentPeriodDate?.setValue(
                  date
                );
              }
            } else {
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.offerPaymentCond?.secondPeriodValueNumber.toString()
              );
            }
            this.onSetValueDayType();
            if (
              !(
                this.isArchiveSubmit &&
                (!this.momentDelayValues.find(
                  (el) => el.id == this.offerPaymentCond.firstPaymentMomentId
                ) ||
                  (this.offerPaymentCond?.idDayType &&
                    !this.dayTypePaymentConfig.find(
                      (el) => el.id == this.offerPaymentCond?.idDayType
                    )))
              )
            ) {
              this.paymentTermConcated = this.commonService.ucFirst(
                this.offerGeneral.concatedPaymentConditions
              );
              //todo
            } else this.getPaymentTermConcatedString();
          }
        }

        //«Момент предоплаты» = «до выдачи лесорубочного билета»
        if (
          this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
          this.isEditedTermsPayment
        ) {
          this.termsPaymentForm.controls.defermentPeriodNumber.setValue(30);
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.momentDelayValues[0].id
          );
          this.termsPaymentForm.controls.defermentPeriod2.setValue(60);
        }
        if (
          this.idOffer &&
          this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
          !(
            this.termsPaymentForm.controls.momentDelay2.value ||
            this.termsPaymentForm.controls.defermentPeriod2.value
          ) &&
          !this.isEditedTermsPayment
        ) {
          if (
            !(
              this.isArchiveSubmit &&
              !this.momentDelayValues.find(
                (el) => el.id == this.offerPaymentCond.secondPaymentMomentId
              )
            )
          ) {
            if (this.createOfferService.isValueInTheArray(this.momentDelayValues, this.offerPaymentCond.secondPaymentMomentId?.toString())) {
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.offerPaymentCond.secondPaymentMomentId?.toString()
              );
              this.termsPaymentForm.controls.momentDelay2.setValue(
                this.offerPaymentCond.secondPaymentMomentId?.toString()
              );
            }
            this.termsPaymentForm.controls.defermentAmount.setValue(
              this.offerPaymentCond.secondPercent
            );
            this.termsPaymentForm.controls.prepaymentAmount.setValue(
              this.offerPaymentCond.firstPercent
            );
            this.termsPaymentForm.controls.defermentPeriodNumber.setValue(
              this.offerPaymentCond?.secondPeriodValueNumber
            );
            this.termsPaymentForm.controls.defermentPeriod2.setValue(
              this.offerPaymentCond?.thirdPeriodValueNumber
            );
            if (this.createOfferService.isValueInTheArray(this.dayTypePaymentConfig, this.offerPaymentCond?.idDayType)) {
              this.termsPaymentForm.controls.dayTypeId?.setValue(
                this.offerPaymentCond?.idDayType
              );
            }
            this.timberTicket = true;
            this.onChangedefermentAmount();
          }
        }

        break;
      }
    }
  }

  public onSetValueDayType(): void {
    if (
      this.dayType &&
      !(
        this.isArchiveSubmit &&
        !this.dayTypePaymentConfig.find(el => el.id === this.offerPaymentCond?.idDayType)
      ) &&
      this.dayType.includes(this.offerPaymentCond?.idDayType)
    ) {
      this.termsPaymentForm.controls.dayTypeId?.setValue(
        this.offerPaymentCond?.idDayType
      );
    }
  }

  //проверка на добавление 2 этапа при Момент предоплаты = «до выдачи лесорубочного билета»
  conditionSecondStage() {
    return (
      this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
      100 - this.termsPaymentForm.controls.prepaymentAmount?.value > 40 &&
      this.termsPaymentForm.controls.defermentAmount2?.value
    );
  }

  onPrepaymentAmountChange() {
    //Условие оплаты в форме заявки = «Частичная предоплата» и (или) «Момент предоплаты» = «до выдачи лесорубочного билета»;
    if (
      this.termsPaymentForm.controls.termsPayment?.value ==
        termsConditionsPaymentConst.partialPrepayment &&
      this.termsPaymentForm.controls.momentPrepayment?.value == 7
    ) {
      let value = 100 - this.termsPaymentForm.controls.prepaymentAmount?.value;

      //«Размер отсрочки» <= 40%, то поле недоступно для изменения и содержит рассчитанное значение
      if (value <= 40) {
        this.termsPaymentForm.controls.defermentAmount.setValue(value);
        this.readOnlyDefermentAmount = true;
      }
      //«Размер отсрочки» >40% (оплата может быть произведена в один или два этапа), то поле заполняется значением по умолчанию - 40% и остается доступным для редактирования
      else {
        this.termsPaymentForm.controls.defermentAmount.setValue(40);
        this.readOnlyDefermentAmount = false;
        this.termsPaymentForm.controls.defermentAmount2.setValue(
          value - this.termsPaymentForm.controls.defermentAmount.value
        );
      }
      this.termsPaymentForm.controls.momentDelay2.setValue(
        this.termsPaymentForm.controls.momentDelay.value
      );
    } else
      this.termsPaymentForm.controls.defermentAmount.setValue(
        100 - this.termsPaymentForm.controls.prepaymentAmount?.value
      );
    if (
      !(
        this.termsPaymentForm.controls.termsPayment?.value ==
          termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  onChangedefermentAmount() {
    let defermentAmount2 =
      100 -
      this.termsPaymentForm.controls.prepaymentAmount?.value -
      this.termsPaymentForm.controls.defermentAmount.value;
    if (defermentAmount2 >= 0)
      this.termsPaymentForm.controls.defermentAmount2.setValue(
        defermentAmount2
      );
    else {
      this.conditionSecondStage();
      this.termsPaymentForm.controls.defermentAmount2.setValue(null);
      this.termsPaymentForm.controls.prepaymentAmount.patchValue(
        100 - this.termsPaymentForm.controls.defermentAmount.value
      );
    }

    if (
      !(
        this.termsPaymentForm.controls.termsPayment?.value ==
          termsConditionsPaymentConst.partialPrepayment &&
        !this.termsPaymentForm.controls.momentDelay?.value
      )
    )
      //выбираем частичную предоплату и значение начинает рассчитываться без учета момента отсрочки
      this.getPaymentTermConcatedString();
  }

  changeDayType(e) {
    this.termsPaymentForm.controls.dayTypeId.setValue(e.value);
  }

  getPaymentTermConcatedString() {
    let IdPaymentCondition;
    if (
      this.validationGroup?.instance.validate().isValid ||
      (this.timberTicket && this.validationGroup?.instance.validate().isValid)
    ) {
      this.createOfferService
        .DeterminePaymentCondId(
          this.user?.token,
          this.termsPaymentForm.controls.termsPayment?.value,
          this.termsPaymentForm.controls.volume?.value,
          this.termsPaymentForm.controls.momentPrepayment?.value || null,
          this.termsPaymentForm.controls.momentDelay?.value || null
        )
        .then((res: any) => {
          IdPaymentCondition = res.id;

          this.createOfferService
            .GetPaymentTermConcated(
              this.user.token,
              this.termsPaymentForm.controls.termsPayment?.value,
              IdPaymentCondition,
              this.termsPaymentForm.controls.termsPayment?.value !=
                termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                    ?.value || null
                : this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                    null,
              this.termsPaymentForm.controls.termsPayment?.value !=
                termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentAmount?.value
                : 0,
              this.termsPaymentForm.controls.termsPayment?.value !=
                termsConditionsPaymentConst.paymentDeferment
                ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                  ? this.commonService.toOADate(
                      this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                    )
                  : null
                : this.termsPaymentForm.controls.defermentPeriodDate?.value
                ? this.commonService.toOADate(
                    this.termsPaymentForm.controls.defermentPeriodDate?.value
                  )
                : null,
              this.termsPaymentForm.controls.termsPayment?.value !=
                termsConditionsPaymentConst.prepayment100 ||
                this.termsPaymentForm.controls.termsPayment?.value !=
                  termsConditionsPaymentConst.paymentThroughExchange
                ? this.termsPaymentForm.controls.defermentAmount?.value || null
                : null,
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.partialPrepayment
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                    null
                : null,
              this.conditionSecondStage()
                ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
                : null,
              this.termsPaymentForm.controls.dayTypeId?.value || null
            )
            .then((res: any) => {
              this.paymentTermConcated = this.commonService.ucFirst(res.result);

              if (
                this.paymentTermConcated.length > 0 &&
                this.deliveryTermConcated?.length > 0
              ) {
                this.getDeadlines();
              }

              this.timberTicket = false;
            });
        });
    }
  }

  deadlinePayment: number | string;
  deadlineDelivery: number | string;
  deadlineErrorMess: string;

  getDeadlines() {
    this.createOfferService
      .GetPayDelivDeadlines(
        this.user?.token,
        this.sectionId,
        this.sessionId,
        false,
        this.termsPaymentForm.controls.termsPayment?.value,
        this.termsPaymentForm.controls.termsPayment?.value !=
          termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.momentPrepayment?.value
          : null,
        this.termsPaymentForm.controls.termsPayment?.value ==
          termsConditionsPaymentConst.paymentDeferment ||
          this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.momentDelay?.value
          : null,
        this.termsPaymentForm.controls.dayTypeId?.value || null,
        this.termsPaymentForm.controls.termsPayment?.value !=
          termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value || null
          : this.termsPaymentForm.controls.defermentPeriodNumber?.value || null,
        this.termsPaymentForm.controls.termsPayment?.value !=
          termsConditionsPaymentConst.paymentDeferment
          ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
            ? this.commonService.toOADate(
                this.termsPaymentForm.controls.prepaymentPeriodDate?.value
              )
            : null
          : this.termsPaymentForm.controls.defermentPeriodDate?.value
          ? this.commonService.toOADate(
              this.termsPaymentForm.controls.defermentPeriodDate?.value
            )
          : null,
        this.termsPaymentForm.controls.termsPayment?.value ==
          termsConditionsPaymentConst.partialPrepayment
          ? this.termsPaymentForm.controls.defermentPeriodNumber?.value || null
          : null,
        this.conditionSecondStage()
          ? this.termsPaymentForm.controls.defermentPeriod2?.value || null
          : null,
        this.deliveryTermForm.controls.startDelivery.value,
        this.deliveryTermForm.controls.deliveryType.value,
        this.deliveryTermForm.controls.deliveryTerm?.value,
        this.deliveryTermForm.controls.startDate?.value
          ? this.commonService.toOADate(
              this.deliveryTermForm.controls.startDate?.value
            )
          : null,
        this.deliveryTermForm.controls.endDate?.value
          ? this.commonService.toOADate(
              this.deliveryTermForm.controls.endDate?.value
            )
          : null
      )
      .then((res: any) => {
        this.deadlineErrorMess = '';
        this.deadlinePayment = res.deadlinePayment || '-';
        this.deadlineDelivery = res.deadlineDelivery || '-';
      })
      .catch((error) => {
        this.deadlineErrorMess = error.title || error.detail;
      });
  }

  onFileAddDrag(files: Array<any>, str) {
    for (let item of files) {
      this.File(item, str);
    }
  }

  onFileAdd(event, str) {
    let addFile = [].slice.call(event.target.files);
    addFile.forEach((item) => {
      this.File(item, str);
    });
  }

  deleteFile(file, str) {
    if (this.idOffer) {
      if (this.offerDocuments.find((f) => f.idDocument == file.idDocument)) {
        this.deleteDocuments.push(file.idDocument);
      }
    }
    if (str == 'commonFiles')
      this.commonFiles.splice(this.commonFiles.indexOf(file), 1);
    else this.hiddenFiles.splice(this.hiddenFiles.indexOf(file), 1);

    this.countSizeBatch(str);
  }

  isFilesSizeMore = false;

  //проверка общего размера всех файлов
  countSizeBatch(str) {
    this.isFilesSizeMore = false;
    let sumSize = 0;
    if (str == 'commonFiles') {
      this.commonFiles.forEach((item) => {
        if (!item.idDemandOffer)
          //если файл не был раньше добавлен
          sumSize += item.size;
      });
    } else {
      this.hiddenFiles.forEach((item) => {
        if (!item.idDemandOffer)
          //если файл не был раньше добавлен
          sumSize += item.size;
      });
    }

    if (sumSize < this.maxSizeBatch * 1048576 + 1) {
      this.isFilesSizeMore = false;
    } else {
      this.isFilesSizeMore = true;
      this.errorState = ErrorStates.error;
      this.error = true;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].maximumSizeFiles
          : EN['errors'].maximumSizeFiles;
    }
  }

  async File(item, str) {
    return await new Promise(() => {
      const reader = new FileReader();
      reader.readAsDataURL(item);
      reader.onload = () => {
        if (str == 'commonFiles') {
          this.commonFiles.push({
            idDocument: this.commonFiles.length,
            content: reader.result,
            filename: item.name,
            size: item.size,
          });
        } else {
          this.hiddenFiles.push({
            idDocument: this.commonFiles.length,
            content: reader.result,
            filename: item.name,
            size: item.size,
          });
        }
        this.countSizeBatch(str);
      };
    });
  }

  niceBytes(x) {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let l = 0,
      n = parseInt(x, 10) || 0;
    while (n >= 1024 && ++l) {
      n = n / 1024;
    }
    return n.toFixed(n < 10 && l > 0 ? 2 : 0) + ' ' + units[l];
  }

  maxFileSize(file) {
    return file.size > this.maxSingleSize * 1048576;
  }

  fileZeroSize(file) {
    return file.size == 0;
  }

  fileNotValidType(file) {
    return !this.extensions.includes(
      file.filename.split('.').reverse()[0].toLowerCase()
    );
  }

  hasDoubleExtension(file): boolean {
    const parts = file.filename.split('.');
    return parts.length > 2;
  }

  domesticCondition() {
    return this.demandsModal.marketTypeIds.some((el) =>
      ['DOMESTIC', 'IMPORT'].includes(el)
    );
  }

  foreignCondition() {
    return this.demandsModal.marketTypeIds.some((el) =>
      ['FOREIGN', 'EXPORT'].includes(el)
    );
  }

  downloadFile(file) {
    let url;
    if (file?.idDemandOffer) {
      let type = file.filename.split('.').reverse()[0];
      url = 'data:application/' + type + ';base64,' + file.content;
    } else url = file.content;
    let a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = file.filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  hasDeletedGoods() {
    return this.compatibilityGoodsInfo.some((item) => item.isDeleted);
  }

  isSimilarToFirstGoods() {
    return this.compatibilityGoodsInfo.some((item) => !item.isSimilarToFirst);
  }

  hasDeletedFromModelGoods() {
    return this.compatibilityGoodsInfo.some((item) => item.isDeletedFromModel);
  }

  public onContinueWithDeletedGoods(): void {
    this.error = false;
    this.isFirstStep = false;
    this.errorDeletedGood = false;
    this.goToNextStep();
  }

  get isViewScopeButton() {
    return (
      this.goodsList?.length > 0 &&
      this.generalInfoStep.controls.contractType?.value ==
        ID_DOCUMENT.COMMISSION_AGREEMENT &&
      (this.generalInfoStep.controls.brokerClient?.value?.length > 1 ||
        (this.user?.IsWorker && this.brokerClientChoose?.length > 1)) &&
      (!this.isCreateCopy || !this.isArchiveSubmit) &&
      this.activeStep != 6
    );
  }

  public isDifferentPeriod = () => {
    let error = false;
    if (
      localeDependentDate(
        this.deliveryTermForm.controls.startDate?.value
      ) !== this.schedule[0].startDate
    ) {
      error = true;
    }
    //если стоит с даты по дату
    if (
      (this.deliveryTermForm.controls.startDelivery.value ==
        ID_DELIVERY_TERM.DATE_OF_DELIVERY &&
        this.deliveryTermForm.controls.deliveryType?.value ==
          ID_DELIVERY_TERM_TYPE.DAYS) ||
      (this.deliveryTermForm.controls.startDelivery.value ==
        ID_DELIVERY_TERM.NOT_SET_START_DELIVERY &&
        this.deliveryTermForm.controls.deliveryType?.value)
    ) {
      if (
        localeDependentDate(
          this.deliveryTermForm.controls?.endDate?.value
        ) !==
        this.schedule[this.schedule.length - 1].endDate
      ) {
        error = true;
      }
    } //выпадающий список
    else {
      let endDate = moment(this.deliveryTermForm.controls.startDate?.value);

      if (
        this.deliveryTermForm.controls.deliveryType?.value ==
        ID_DELIVERY_TERM_TYPE.CALENDAR_DAYS
      ) {
        //дни
        endDate = endDate.add(
          this.deliveryTermForm.controls.deliveryTerm.value,
          'days'
        );
      } else if (
        this.deliveryTermForm.controls.deliveryType?.value ==
        ID_DELIVERY_TERM_TYPE.MONTHS
      ) {
        //месяца
        endDate = endDate.add(
          this.deliveryTermForm.controls.deliveryTerm.value,
          'months'
        );
      }

      if (
        endDate.format('DD.MM.YYYY') !=
        this.schedule[this.schedule.length - 1].endDate
      )
        error = true;
    }
    return error;
  };

  public resetAdjustedPrice(): void {
    this.popupForm = false;
    this.filledFields.adjustedPrice = 'false';
    this.goodsList.forEach((good) => {
      const blockFields = good.fields.find(
        (el) => el[0] === BLOCK_ID_FIELDS.PRICE_BLOCK
      );
      blockFields[1].find(
        (field) =>
          field.interfaceField.fieldId === ID_INTERFACE_FIELD.ADJUSTED_PRICE
      ).selectedValues = 'false';
    });
    this.isVisibleToast = true;
    this.toastMessage =
      this.translate.store.currentLang == 'RU'
        ? RU['createOffer'].paymentDeliveryTerms.adjustablePriceReset
        : EN['createOffer'].paymentDeliveryTerms.adjustablePriceReset;
    this.activeStep++;
    this.isAdjustedPriceResetError = false;
  }

  goToNextStep() {
    //проверки до перехода на шаг
    switch (this.activeStep) {
      case 1: {
        if (!this.generalInfoValidationGroup.instance.validate().isValid) {
          return;
        }
        if (this.errorBrokerClientMessage?.length > 0) {
          //результат контекстной проверки
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError = this.errorBrokerClientMessage;
          return;
        }
        if (
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          this.isFirstStep &&
          (this.hasDeletedGoods() ||
            this.isSimilarToFirstGoods() ||
            this.hasDeletedFromModelGoods())
        ) {
          //если среди товаров есть удаленный - предупреждаем пользователя
          this.errorDeletedGood = true;
          this.error = true;
          this.errorState = ErrorStates.warning;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].good.deletedGoodsMess
              : EN['createOffer'].good.deletedGoodsMess;
          return;
        }
        break;
      }
      case 2: {
        if (this.goodsList.length == 0) {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].nextSecondStepError
              : EN['createOffer'].nextSecondStepError;
          return;
        }
        if (
          this.demandsModal.complexLotTypeId == 3 &&
          this.goodsList.length == 1
        ) {
          //Только сборные лоты и при этом выбран один товар
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].nextSecondStepErrorComplexLot +
                ' ' +
                RU['createOffer'].nextSecondStepError
              : EN['createOffer'].nextSecondStepErrorComplexLot +
                ' ' +
                EN['createOffer'].nextSecondStepError;
          return;
        }
        if (this.goodsList.some((good) => good.isUnvalidField)) {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].good.checkGoodMess
              : EN['createOffer'].good.checkGoodMess;
          return;
        }

        break;
      }
      case 3: {
        if (
          !this.deliveryTermValidationGroup.instance.validate().isValid ||
          !this.validationGroup.instance.validate().isValid
        ) {
          return;
        }
        if (this.deadlineErrorMess?.length > 0) {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError = this.deadlineErrorMess;
          return;
        }
        if (!this.deadlineDelivery || !this.deadlinePayment) {
          return;
        }

        if (this.schedule?.length > 0) {
          this.error = this.isDifferentPeriod();

          if (this.error) {
            this.errorState = ErrorStates.error;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['errors'].deliveryScheduleNotDeliveryTime
                : EN['errors'].deliveryScheduleNotDeliveryTime;
            return;
          }
        }

        if (this.schedule?.length > 0 && !this.disabledButtonSchedule()) {
          if (this.goodsList.length != this.sumVolumeGoodSchedule.length) {
            //  если разное количество товаров в графике и в заявке
            this.errorState = ErrorStates.error;
            this.error = true;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].paymentDeliveryTerms.variousQuantity
                : EN['createOffer'].paymentDeliveryTerms.variousQuantity;
          } else {
            this.goodsList.forEach((good) => {
              let findGood = this.sumVolumeGoodSchedule.find(
                (el) => el.id == good.id
              );
              if (!findGood) {
                //удалили один товар и добавили другой
                this.errorState = ErrorStates.error;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule
                    : EN['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule;
              } else if (Number(good.volume) !== Number(findGood.sumValue) && !this.isSameGradesInSaleOffer) {
                // не совпадают значения объема
                this.errorState = ErrorStates.error;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].paymentDeliveryTerms.variousQuantity
                    : EN['createOffer'].paymentDeliveryTerms.variousQuantity;
              }
            });
          }
          if (
            this.isSameGradesInSaleOffer &&
            this.sumVolumePipe.transform(this.goodsList, 'volume') !==
            this.sumVolumePipe.transform(this.schedule, 'periodVolume')
          ) {
            this.errorState = ErrorStates.error;
            this.error = true;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].paymentDeliveryTerms.variousQuantity
                : EN['createOffer'].paymentDeliveryTerms.variousQuantity;
          }
        }

        if (
          this.filledFields?.adjustedPrice?.toString() === 'true' &&
          (this.schedule?.length === 0 || this.disabledButtonSchedule())
        ) {
          this.popupForm = true;
          this.popupButton = false;
          this.popupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['login_form'].notification
              : EN['login_form'].notification;
          this.isAdjustedPriceResetError = true;
          this.popupMessage =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].adjustedPriceReset
              : EN['errors'].adjustedPriceReset;
          return;
        }

        break;
      }
      case 4: {
        if (!this.isNotSpecified) {
          //если базисы не надо добавлять
          if (this.deliveryBasis?.length == 0) {
            this.error = true;
            this.errorState = ErrorStates.error;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].nextThirdStepError
                : EN['createOffer'].nextThirdStepError;
            return;
          }

          if (this.isMinPriceOnBasicBasis && this.deliveryBasis?.length > 1) {
            let error = false;
            for (let i = 1; i < this.deliveryBasis.length; i++) {
              this.deliveryBasis[i].goods.forEach((g) => {
                let findGoodCost = this.goodsList.find(
                  (el) => el.id == g.id
                )?.cost;
                if (g.cost <= findGoodCost) {
                  error = true;
                }
              });
            }
            if (error) {
              this.error = true;
              this.errorState = ErrorStates.error;
              this.messageError =
                this.translate.store.currentLang == 'RU'
                  ? RU['createOffer'].paymentDeliveryTerms.messageErrorMinPrice
                  : EN['createOffer'].paymentDeliveryTerms.messageErrorMinPrice;
              return;
            }
          }

          if (
            this.modelsResult?.pricingTypeId !=
            pricingType?.formulaWithoutQuotation
          ) {
            let isPriceQuoteError = false; //показывает есть не соответствие цены с котировкой в товаре

            this.deliveryBasis.forEach((item) => {
              //проверка на минимальную цену можно не делать, потому что там 0 , а когда внутри, то уже есть проверка
              if (!item.goods.every((g) => g.cost > 0)) {
                this.error = true;
                this.errorState = ErrorStates.error;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].termsDeliveryTime.price0Error1 +
                      ' ' +
                      (this.demandsModal.pricingTypeId == 1
                        ? RU['createOffer'].goodInfo.priceWithoutVAT
                        : RU['createOffer'].goodInfo.amendment) +
                      ' ' +
                      RU['createOffer'].termsDeliveryTime.price0Error2
                    : EN['createOffer'].termsDeliveryTime.price0Error1 +
                      ' ' +
                      (this.demandsModal.pricingTypeId == 1
                        ? EN['createOffer'].goodInfo.priceWithoutVAT
                        : EN['createOffer'].goodInfo.amendment) +
                      ' ' +
                      EN['createOffer'].termsDeliveryTime.price0Error2;
                return;
              }

              if (this.modelsResult?.pricingTypeId == pricingType?.price) {
                if (this.isActiveQuotation) {
                  //проверка на соответствии котировки
                  item.goods.forEach((good) => {
                    if (good.quotation && good.cost != good.quotation) {
                      good.error = true;
                      isPriceQuoteError = true;
                    }
                  });
                }
              }
            });
            if (isPriceQuoteError) {
              this.error = true;
              this.errorState = ErrorStates.error;
              this.messageError =
                this.translate.store.currentLang == 'RU'
                  ? RU['createOffer'].termsDeliveryTime.priceQuoteError2
                  : EN['createOffer'].termsDeliveryTime.priceQuoteError2;
              return;
            }
          }

          let minAddBasis = this.deliveryBasis.find(
            (el) => el.coreBasis == true
          )?.minAddBasis;
          //поиск количества дополнительных базисов:
          //количество всех базисов отнимаем 1 (основной базис)
          let countAddBasis = this.deliveryBasis.length - 1;
          if (minAddBasis && countAddBasis < minAddBasis) {
            this.error = true;
            this.errorState = ErrorStates.error;
            this.messageError =
              (this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].termsDeliveryTime.minAddBasisError
                : EN['createOffer'].termsDeliveryTime.minAddBasisError) +
              ' ' +
              minAddBasis;
            return;
          }

          //проверка по полям необязательности в базисе
          if (
            (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
            this.deliveryBasis?.length > 0
          ) {
            this.deliveryBasis.forEach((basis) => {
              if (basis.isUnvalidBasis) {
                this.error = true;
                this.errorState = ErrorStates.error;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].termsDeliveryTime
                        .changedBasisRuleArchiveMess
                    : EN['createOffer'].termsDeliveryTime
                        .changedBasisRuleArchiveMess;
                return;
              }
            });
            if (this.error) return;
          }
        }
        break;
      }
      case 5: {
        if (
          document
            .getElementById('idCommon')
            ?.getElementsByClassName('colorError')?.length > 0
        ) {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].fileError
              : EN['errors'].fileError;
          return;
        }

        if (
          document
            .getElementById('idHidden')
            ?.getElementsByClassName('colorError').length > 0
        ) {
          this.error = true;
          this.errorState = ErrorStates.error;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].fileError
              : EN['errors'].fileError;
          return;
        }

        const isEmptyDelivScopeTrader: boolean = this.delivScope?.length === 0 &&
          this.generalInfoStep.controls.brokerClient?.value?.length > 1 &&
          this.UserRole !== role.worker;

        const isEmptyDelivScopeWorker: boolean =
          this.generalInfoStep.controls.brokerClientWorker?.value?.length > 1 &&
          this.generalInfoStep.controls.contractType?.value === ID_DOCUMENT.COMMISSION_AGREEMENT &&
          this.delivScope?.length === 0 ||
          this.delivScope?.[0]?.goods?.length === 0;         //поменялся вид сборности

        if (isEmptyDelivScopeTrader || isEmptyDelivScopeWorker) {
          //если не заполнили грузоотправителей
          this.errorState = ErrorStates.error;
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].delivScope.errorMessEmptyScope
              : EN['createOffer'].delivScope.errorMessEmptyScope;
        }

        if (this.delivScope?.length > 0) {
          if (!this.isSameGradesInSaleOffer) {
            if (
              this.generalInfoStep.controls.brokerClient?.value?.length > 1 &&
              this.UserRole !== role.worker
            ) {
              if (this.delivScope[0].goods.length !== this.goodsList.length) {
                //если удалили товар
                this.error = true;
              } else {
                let sumVolumeGood: sumVolumeGood[] = [];
                this.goodsList.forEach((good) => {
                  let sumGoodVolume: number = 0;
                  this.delivScope.forEach((scope) => {
                    sumGoodVolume =
                      sumGoodVolume +
                      Number(
                        scope.goods?.find((g) => g.goodId === good.id)?.volume
                      ) || 0;
                  });
                  sumVolumeGood.push({
                    id: good.id,
                    sumValue: sumGoodVolume,
                  });
                });
                this.goodsList.forEach((good) => {
                  let findGood: sumVolumeGood = sumVolumeGood.find((el) => el.id === good.id);
                  if (!findGood) {
                    //удалили один товар и добавили другой
                    this.error = true;
                  } else {
                    if (good.volume !== findGood.sumValue) {
                      // не совпадают значения объема
                      this.error = true;
                    }
                  }
                });
              }

              if (
                this.delivScope?.length !==
                this.generalInfoStep.controls.brokerClient?.value?.length
              ) {
                this.error = true;
              } else {
                this.generalInfoStep.controls.brokerClient.value.forEach((br) => {
                  let findBroker: DelivScope = this.delivScope.find((el) => el.idBroker === br);
                  if (!findBroker) {
                    this.error = true;
                  }
                });
              }
              if (this.error) {
                this.errorState = ErrorStates.error;
                this.messageError = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'createOffer.delivScope.errorMessDelivScope'
                );
              }

              if (this.delivScope?.some(scope => this.sumVolumePipe.transform(scope.goods, 'volume') === 0)) {
                this.errorState = ErrorStates.error;
                this.error = true;
                this.messageError = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'createOffer.delivScope.errorMessSumVolume'
                );
              }
            }
          } else {
            if (
              this.sumVolumePipe.transform(this.delivScope, 'volume') !==
              this.sumVolumePipe.transform(this.goodsList, 'volume')
            ) {
              this.errorState = ErrorStates.error;
              this.error = true;
              this.messageError = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'createOffer.delivScope.errorMessDelivScope'
              );
            }

            if (this.delivScope?.some(el => el.volume === 0)) {
              this.errorState = ErrorStates.error;
              this.error = true;
              this.messageError = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'createOffer.delivScope.errorMessSumVolume'
              );
            }
          }
        }
      }
    }

    if (!this.error) {
      this.onDestroyWaiting();
      this.activeStep++;
    } else {
      this.store.dispatch(setLoading(({ isLoading: false })));
    }

    //после перехода на шаг
    switch (this.activeStep) {
      case 2: {
        if (
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason) &&
          this.isFirstStep
        ) {
          this.goodsList.forEach((good) => {
            this.checkUnvalidFields(good, 'fromFirstStep');
            if (good.isUnvalidField) {
              this.error = true;
              this.errorState = ErrorStates.warning;
              this.messageError =
                this.translate.store.currentLang == 'RU'
                  ? RU['createOffer'].good.checkGoodMess
                  : EN['createOffer'].good.checkGoodMess;
            }
          });
        }
        this.isFirstStep = false;
        break;
      }
      case 3: {
        this.createOfferService
          .GetModelsDeliveryConfig(this.user?.token)
          .then((res: any) => {
            //дополнение массива deliveryTerm названиями периодов и срока поставки
            this.deliveryTerm.forEach((item) => {
              let termData = res.data.find((n) => n.id == item.deliveryStartId);
              item.deliveryStartName = termData.name;
              let terms = termData.terms.find(
                (t) => t.id == item.deliveryTermId
              );
              item.deliveryTermName = terms.name;
              item.endDeliveryDateValue = terms.options.endDeliveryDate;
              item.startDeliveryDateValue = terms.options.startDeliveryDate;
            });

            this.uniqueDeliveryTerm = [
              ...new Map(
                this.deliveryTerm.map(
                  (
                    item //уникальные значения в массиве по названию начало поставки
                  ) => [item['deliveryStartId'], item]
                )
              ).values(),
            ];

            //при редактировании заявки
            if (
              this.idOffer &&
              !this.deliveryTermForm.controls.startDelivery.value &&
              !this.isEditedDeliveryTerm
            ) {
              if (
                this.createOfferService.isValueInTheArray(
                  this.uniqueDeliveryTerm,
                  this.offerDeliveryPeriod.idDeliveryMoment?.toString(),
                  'deliveryStartId'
                )
              ) {
                this.deliveryTermForm.controls.startDelivery.patchValue(
                  this.offerDeliveryPeriod.idDeliveryMoment?.toString()
                );
              }
              if (
                !(
                  this.isArchiveSubmit &&
                  !this.deliveryTermType.find(
                    (el) =>
                      el.deliveryTermId ==
                      this.offerDeliveryPeriod.idDeliveryType
                  )
                )
              ) {
                this.deliveryTermStartChange('deliveryStart');
                let dateBegin: any = this.offerDeliveryPeriod?.dateBegin
                  ? (this.offerDeliveryPeriod?.dateBegin - 25569) *
                    24 *
                    3600 *
                    1000
                  : null;
                let dateEnd: any = this.offerDeliveryPeriod?.dateEnd
                  ? (this.offerDeliveryPeriod?.dateEnd - 25569) *
                    24 *
                    3600 *
                    1000
                  : null;
                this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
                this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
                //? убрать после тестирования  this.deliveryTermConcated = this.offerGeneral.concatedDeliveryPeriod;
                this.onCreateString();
              }
              this.getSchedule(true);
            }

            //если одно значение - сразу заполняется select-box
            if (this.uniqueDeliveryTerm.length == 1) {
              this.deliveryTermForm.controls.startDelivery.patchValue(
                this.uniqueDeliveryTerm[0].deliveryStartId
              );
            }
          });
        this.termsConditionsPaymentValue = [];
        //получение массива условий оплаты с учетом пересечений
        this.paymentConfig.forEach((item) => {
          if (
            this.termsConditionsPayment?.find(
              (el) => el.paymentConditionId == item.id
            ) &&
            !this.termsConditionsPaymentValue?.find((el) => el.id == item.id)
          ) {
            this.termsConditionsPaymentValue.push(item);
          }
        });
        //если одно значение в массиве и при этом он ранее не был заполнен
        // (для проверки при котором все поля предзаполнены (имеют только одно значение), кроме срока поставки и он сбрасывался при переходе с 3-его на этот шаг)
        if (
          this.termsConditionsPaymentValue.length == 1 &&
          !this.termsPaymentForm.controls.volume.value
        ) {
          this.termsPaymentForm.controls.termsPayment.patchValue(
            this.termsConditionsPaymentValue[0].id
          );
          this.onTermsPaymentChange('termsPayment');
        }

        //при редактировании заявки
        if (
          this.idOffer &&
          !this.termsPaymentForm.controls.termsPayment.value &&
          !this.isEditedTermsPayment
        ) {
          if (
            !(
              this.isArchiveSubmit &&
              !this.termsConditionsPaymentValue.find(
                (el) => el.id == this.offerPaymentCond.idPaymentType
              )
            )
          ) {
            if (this.createOfferService.isValueInTheArray(this.termsConditionsPaymentValue, this.offerPaymentCond.idPaymentType.toString())) {
              this.termsPaymentForm.controls.termsPayment.patchValue(
                this.offerPaymentCond.idPaymentType.toString()
              );
              this.onTermsPaymentChange('termsPayment');
            }
          } else this.getPaymentTermConcatedString();
        }

        break;
      }
      case 4: {
        if (
          this.deliveryBasis?.length > 0 &&
          (this.isArchiveSubmit || this.offerGeneral?.rejectionReason)
        ){
          this.deliveryBasis.forEach((basis) => {
            if (
              basis.isRequiredPlace &&
              (basis.enterPlaceName?.length == 0 || !basis.enterPlaceName)
            ) {
              basis.isUnvalidBasis = true;
              this.error = true;
              this.errorState = ErrorStates.warning;
              this.messageError =
                this.translate.store.currentLang == 'RU'
                  ? RU['createOffer'].termsDeliveryTime
                      .changedBasisRuleArchiveMess
                  : EN['createOffer'].termsDeliveryTime
                      .changedBasisRuleArchiveMess;
            }
          });
        }

        this.checkActiveQuotationCorridor();
        break;
      }
      case STEPS_TO_APPLY.COMMON_PARAM: {
        if (
          this.offerGeneral?.rejectionReason &&
          !this.isCreateCopy &&
          this.deleteDocuments?.length > 0 &&
          this.isFirstOnCommonStep
        ) {
          this.error = true;
          this.errorState = ErrorStates.warning;
          this.messageError = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'createOffer.commonParameters.attachedFilesRemoved'
          );
          this.isFirstOnCommonStep = false;
          return;
        }
        this.isFirstOnCommonStep = false;
        break;
      }
      case STEPS_TO_APPLY.PREVIEW_SUBMISSION: {
        this.previewVisible = true;
        break;
      }
    }
  }

  goToPrevStep() {
    this.activeStep--;

    if (
      this.activeStep === STEPS_TO_APPLY.DELIVERY_TERMS &&
      (this.isActiveQuotation || this.isActiveCorridor)
    ) {
      this.checkActiveQuotationCorridor();
    }
  }

  public checkActiveQuotationCorridor(): void {
    if (
      this.deliveryBasis?.length > 0 &&
      Number(this.modelsResult?.pricingTypeId) === pricingType?.price
    ) {
      this.isCheckingComplete = false;
      const promises: Promise<boolean | void>[] = [];

      this.deliveryBasis.forEach((item) => {
        if (this.isActiveQuotation) {
          //проверка на соответствии котировки
          item.goods.forEach((good) => {
            const promise: Promise<boolean | void> =
              this.offerManagementService
                .getPriceLimitQuotation(
                  this.createOffer.sectionId,
                  this.createOffer.sessionId,
                  this.createOffer.modelId,
                  this.createOffer.direction,
                  good.id,
                  this.goodsList[0].currency.id,
                  this.filledFields.vat.id !== ID_WITHOUT_VAT
                    ? Number(this.filledFields.vat.name.replace('%', ''))
                    : 0,
                  this.goodsList.find((gL) => gL.id === good.id).units.id,
                  good.volume,
                  this.termsPaymentForm.controls.termsPayment?.value,
                  item.idBasisValue,
                  item.idPlaceLink,
                  item.idPlaceLink == null && item.idPlaceValue == null
                    ? item.enterPlaceName
                    : item.specifyingLocation
                )
                .then((res: PriceLimitQuotation) => {
                  good.error = false;
                  good.quotation = res.priceWithoutVat;
                  if (res.priceWithoutVat && good.cost !== res.priceWithoutVat) {
                    good.error = true;
                  }
                })
                .catch(() => good.error = false);
            promises.push(promise);
          });
        }

        if (this.isActiveCorridor) {
          //проверка на соответствии ценового коридора
          this.isPriceRangeWarning = false;
          item.goods.forEach((good) => {
            const promise: Promise<boolean | void> =
              this.offerManagementService
                .getPriceLimitCorridor(
                  this.createOffer.sectionId,
                  this.createOffer.sessionId,
                  this.createOffer.modelId,
                  this.createOffer.direction,
                  good.id,
                  this.goodsList[0].currency.id,
                  this.filledFields.vat.id !== ID_WITHOUT_VAT
                    ? Number(this.filledFields.vat.name.replace('%', ''))
                    : 0,
                  this.goodsList.find((gL) => gL.id === good.id).units.id,
                  good.volume,
                  this.termsPaymentForm.controls.termsPayment?.value,
                  item.idBasisValue,
                  item.idPlaceLink,
                  item.idPlaceLink == null && item.idPlaceValue == null
                    ? item.enterPlaceName
                    : item.specifyingLocation
                )
                .then((res: PriceLimitCorridor) => {
                  const minPrice: number = res.leftBound;
                  const maxPrice: number = res.rightBound;
                  good.minPrice = minPrice;
                  good.maxPrice = maxPrice;
                  //если не входит в ценовой коридор
                  if (
                    (minPrice && good.cost < minPrice) ||
                    (maxPrice && good.cost > maxPrice)
                  ) {
                    good.range = true;
                    this.isPriceRangeWarning = true;
                  }
              })
              .catch(() => good.range = false);
            promises.push(promise);
          });
        }
      });

      this.completePromisesErrors(promises);
    } else {
      this.isCheckingComplete = true;
    }
  }

  public completePromisesErrors(promises: Promise<boolean | void>[]): void {
    // Ждем выполнения всех промисов
    Promise.all(promises).then(() => {
      this.isCheckingComplete = true;

      // Проверяем ошибки после выполнения
      let hasErrors: boolean = false;
      this.deliveryBasis?.forEach((item) => {
        item.goods.forEach((good) => {
          if (good.error) {
            hasErrors = true;
          }
        });
      });

      if (hasErrors || this.isPriceRangeWarning) {
        this.error = true;
        this.errorState = this.isPriceRangeWarning ? ErrorStates.warning : ErrorStates.error;
        this.messageError = getTranslateResultByCurrentLang(this.translate.store.currentLang,
          hasErrors ?
            'createOffer.termsDeliveryTime.priceQuoteError2' :
            'createOffer.termsDeliveryTime.warningPriceRange');
        this.store.dispatch(setLoading(({ isLoading: false })));
      }
    });
  }

  req: {};

  checkOffer(e, type?) {
    if (e.validationGroup.validate().isValid) {
      this.req = this.createObjectForRule();
      this.checkOfferMessages = [];

      this.createOfferService
        .ApplyRules(this.user?.token, this.sectionId, this.req)
        .then((res: any) => {
          if (res.data.messages.length > 0) {
            this.checkOfferMessages = res.data.messages;
            this.checkOfferMessages.forEach((item) => {
              if (item.messageType == 1) {
                this.checkOfferError = true;
                this.checkButtons = true;
              }
            });
          } else this.checkButtons = false;
          if (type != 'submit') {
            this.checkOfferError = true;
          } else if (!this.checkOfferError) {
            if (this.modelsResult?.type === 'editAuctionOffer')
              this.finalSave();
            else this.submitOffer(e);
          }
        });
    }
  }

  public createObjectForRule(): object {
    return {
      model: this.demandsModal,
      modelId: this.modelId,
      values: createEndObjectForRule(
        this.goodsList,
        this.termsPaymentForm,
        this.momentPrepayment,
        this.isNotSpecified,
        this.deliveryBasis,
        this.deliveryTermForm,
        this.schedule,
        this.disabledButtonSchedule(),
        this.commonService
      ),
      sessionsParams: {
        tradeTypeId: this.demandsModal.tradeTypeId.toString(),
        marketTypeIds: this.demandsModal.marketTypeIds,
      },
      generalParams: {
        //!добавить свое
        validityPeriod: null,
        isMoveToNextSession: false,
      },
      demandParams: {
        //!добавить свое
        directionId: this.direction,
        marketTypeIds: null, //this.demandsModal.marketTypeIds
        startDate: null,
      },
    };
  }

  public onPrepareDataForObject(): {
    endListGoods: any[];
    priceAdjustmentForChecking: number;
    idVatQuoteForChecking: number;
    financeForChecking: number;
    objectForValues: {};
    endDeliveryBasis: any[];
    endDelivScope: DemandDelivScope[] | OfferDelivScope[];
    delivScopeGraded: DeliveryScopeGraded[];
    endDeliverySchedule: DemandDelivSchPeriod[] | OfferDelivSchPeriod[];
    delivSchPeriodsGraded: DeliverySchedulePeriodGraded[];
  } {
    let endListGoods = []; //массив для goods
    let priceAdjustmentForChecking; // тип поправки в боди
    let idVatQuoteForChecking; // котировка в боди
    let financeForChecking; // источник финансирования в боди
    let objectForValues = {};
    this.documents = [
      ...this.buildDocuments(this.commonFiles, false),
      ...this.buildDocuments(this.hiddenFiles, true),
    ];

    this.goodsList.forEach((item) => {
      let endProperties = [];
      item.fields.forEach((block) => {
        const blockFields = block[1];

        for (let i = 0; i < blockFields.length; i++) {
          if (
            (blockFields[i].interfaceField.controlFieldType == 'dxCheckBox' ||
              blockFields[i].interfaceField.controlFieldType == 'dxNumberBox' ||
              blockFields[i].interfaceField.controlFieldType == 'dxSelectBox' ||
              blockFields[i].interfaceField.controlFieldType == 'dxTextBox') &&
            blockFields[i].selectedValues != null
          ) {
            // учитываем лишь те поля, которые есть в модели
            //если есть поле 22 и оно введено вручную - заполняем для него только fieldValueString, иначе и fieldValueString и fieldValueNumber
            const blockFind = this.findBlock(item);
            let blField = blockFind.fields.find(
              (blField) =>
                blField.interfaceField.fieldId ==
                blockFields[i].interfaceField.fieldId
            );
            if (blField) {
              endProperties.push({
                idInterfaceField: blockFields[i].interfaceField.fieldId,
                fieldValueNumber:
                  (blockFields[i].interfaceField.controlFieldType ==
                    'dxSelectBox' &&
                    !blockFields[i].interfaceField.isAvailableMultiSelection &&
                    !blockFields[i].interfaceField.isAvailableFreeInput) ||
                  blockFields[i].interfaceField.controlFieldType ==
                    'dxNumberBox'
                    ? Number(blockFields[i].selectedValues)
                    : blockFields[i].interfaceField.fieldId ==
                        ID_INTERFACE_FIELD.PRODUCT_LOCATION &&
                      !blockFields[i].isFreeInput &&
                      blockFields[i].idSelectedValues
                    ? Number(blockFields[i].idSelectedValues)
                    : null,
                fieldValueString:
                  blockFields[i].interfaceField.controlFieldType ==
                    'dxTextBox' ||
                  blockFields[i].interfaceField.controlFieldType ==
                    'dxCheckBox' ||
                  (blockFields[i].interfaceField.controlFieldType ==
                    'dxSelectBox' &&
                    blockFields[i].interfaceField.isAvailableFreeInput)
                    ? blockFields[i].selectedValues.toString()
                    : null,
                listFieldValues:
                  blockFields[i].interfaceField.controlFieldType ==
                    'dxSelectBox' &&
                  blockFields[i].interfaceField.isAvailableMultiSelection
                    ? blockFields[i].selectedValues
                    : '',
              });
            }
          }
          if (
            blockFields[i].interfaceField.fieldId ==
            ID_INTERFACE_FIELD.AMENDMENT_TYPE
          ) {
            //тип поправки
            priceAdjustmentForChecking = blockFields[i].selectedValues;
          }
          if (
            blockFields[i].interfaceField.fieldId ==
            ID_INTERFACE_FIELD.QUOTE_CURRENCY
          ) {
            //валюта котировки
            idVatQuoteForChecking = blockFields[i].selectedValues;
          }
          if (
            blockFields[i].interfaceField.fieldId ==
            ID_INTERFACE_FIELD.FINANCE_SOURCE
          ) {
            //источник финансирования
            financeForChecking = blockFields[i].selectedValues;
          }
        }
      });

      let nsiGoodValues = [];
      if (item.characteristicsNSI) {
        for (let ch in item.characteristicsNSI) {
          if (!ch.toString().startsWith('analogs')) {
            let val = item.characteristicsNSI[ch];
            // if (val?.length > 0) {
            nsiGoodValues.push({
              idReference: ch,
              listValues: item.characteristicsNSI[ch],
              isAllowAnalogs: item.characteristicsNSI['analogs' + ch],
            });
            // }
          }
        }
      }

      endListGoods.push({
        idGood: nsiGoodValues?.length > 0 ? null : item.id,
        idGoodFromFront: item.id,
        nsiGoodValues: nsiGoodValues,
        idGoodName: item.idGoodName,
        idGoodGroup: item.idGoodGroup,
        idNomenclature: item.idNomenclatureGroup,
        properties: endProperties,
      });
      let objForReq = {};
      objForReq[this.goodsList.indexOf(item)] = objectForValues;
    });

    let endDeliveryBasis = []; // массив для  delivConditions

    if (!this.isNotSpecified) {
      this.deliveryBasis.forEach((item) => {
        let goodsForBasis = [];
        item.goods.forEach((el) => {
          let good = this.goodsList.find((g) => g.id == el.id);
          let nsiGoodValues = [];
          if (good?.characteristicsNSI) {
            for (let ch in good?.characteristicsNSI) {
              if (!ch.toString().startsWith('analogs')) {
                let val = good.characteristicsNSI[ch];
                //  if (val?.length > 0) {
                nsiGoodValues.push({
                  idReference: ch,
                  listValues: good.characteristicsNSI[ch],
                  isAllowAnalogs: good.characteristicsNSI['analogs' + ch],
                });
                // }
              }
            }
          }

          goodsForBasis.push({
            idGood: nsiGoodValues?.length > 0 ? null : el.id,
            idGoodFromFront: el.id,
            nsiGoodValues: nsiGoodValues,
            idGoodName: good.idGoodName,
            idGoodGroup: good.idGoodGroup,
            idNomenclature: good.idNomenclatureGroup,
            priceWithoutVat: el.cost,
            priceAdjustment: el.amendment,
            minPriceWithoutVat: el.minPriceField || null,
          });
        });

        endDeliveryBasis.push({
          goods: goodsForBasis,
          isMain: item.coreBasis,
          idBasisLink: item.idBasisLink,
          idBasisValue: item.idBasisValue,
          idPlaceLink: item.idPlaceLink,
          idPlaceValue: item.idPlaceValue,
          placeDetails:
            item.idPlaceLink == null && item.idPlaceValue == null
              ? item.enterPlaceName
              : item.specifyingLocation,
        });
      });
    }

    let endDeliverySchedule: DemandDelivSchPeriod[] | OfferDelivSchPeriod[] = []; // массив для  delivSchPeriods
    let delivSchPeriodsGraded: DeliverySchedulePeriodGraded[] = []; // массив для  delivSchPeriodsGraded

    if (this.schedule.length > 0 && !this.disabledButtonSchedule()) {
      if (!this.isSameGradesInSaleOffer) {
        this.schedule.forEach((item) => {
          let goodsForSchedule = [];
          item.goods.forEach((el) => {
            let good = this.goodsList.find((g) => g.id == el.id);
            let nsiGoodValues = [];
            if (good?.characteristicsNSI) {
              for (let ch in good.characteristicsNSI) {
                if (!ch.toString().startsWith('analogs')) {
                  let val = good.characteristicsNSI[ch];
                  nsiGoodValues.push({
                    idReference: ch,
                    listValues: good.characteristicsNSI[ch],
                    isAllowAnalogs: good.characteristicsNSI['analogs' + ch],
                  });
                }
              }
            }

            let placeOfWorkValue: number;
            good.fields.forEach((field) => {
              field[1].forEach((idField) => {
                if (
                  idField.interfaceField.fieldId &&
                  idField.interfaceField.fieldId ===
                  ID_INTERFACE_FIELD.PLACE_OF_WORK
                ) {
                  placeOfWorkValue = idField.selectedValues;
                }
              });
            });

            const idGood =
              this.modelsResult?.type === 'editAuctionOffer'
                ? good.idDemandOfferGood
                : good.id;
            goodsForSchedule.push({
              idGood: nsiGoodValues?.length > 0 ? null : idGood,
              idGoodFromFront: idGood,
              nsiGoodValues: nsiGoodValues,
              idGoodName: good.idGoodName,
              idGoodGroup: good.idGoodGroup,
              idNomenclature: good.idNomenclatureGroup,
              periodVolume: el.volume,
              ...(this.direction === IdDirection.buy &&
                this.modelsResult?.type === 'editAuctionOffer' && {
                  minPriceWithoutVat: good.minPriceField,
                  locationService: placeOfWorkValue,
                }),
            });
          });

          let start = item.startDate.split('.');
          let end = item.endDate.split('.');

          endDeliverySchedule.push({
            goods: goodsForSchedule,
            periodDateBegin: this.commonService.toOADate(
              Date.parse(start[1] + '.' + start[0] + '.' + start[2])
            ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
            periodDateEnd: this.commonService.toOADate(
              Date.parse(end[1] + '.' + end[0] + '.' + end[2])
            ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
            idPeriod: item.idPeriod,
          });
        });
      } else {
        this.schedule.forEach((item) => {
          let start = item.startDate.split('.');
          let end = item.endDate.split('.');

          delivSchPeriodsGraded.push(
            {
              periodDateBegin: this.commonService.toOADate(
                Date.parse(start[1] + '.' + start[0] + '.' + start[2])
              ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
              periodDateEnd: this.commonService.toOADate(
                Date.parse(end[1] + '.' + end[0] + '.' + end[2])
              ), //приводим дату к формату MM.DD.YYYY, затем преобразовываем в дабл
              periodVolume: item.periodVolume,
              idPeriod: item.idPeriod
            }
          );
        });
      }
    }

    let endDelivScope: DemandDelivScope[] | OfferDelivScope[] = []; //массив грузополучателей для body
    let delivScopeGraded: DeliveryScopeGraded[] = [];

    if (
      this.delivScope.length > 0 ||
      (this.generalInfoStep.controls.contractType.value === ID_DOCUMENT.COMMISSION_AGREEMENT &&
        this.generalInfoStep.controls.brokerClient?.value?.length === 1)
    ) {
      if (
        this.delivScope.length > 0 &&
        this.generalInfoStep.controls.brokerClient?.value?.length !== 1
      ) {
        if (!this.isSameGradesInSaleOffer) {
          this.delivScope.forEach((scope) => {
            let goods = [];
            scope.goods.forEach((g) => {
              let good = this.goodsList.find((el) => el.id == g.goodId);
              let nsiGoodValues: NsiGoodValue[] = [];
              if (good?.characteristicsNSI) {
                for (let ch in good.characteristicsNSI) {
                  if (!ch.toString().startsWith('analogs')) {
                    nsiGoodValues.push({
                      idReference: Number(ch),
                      listValues: good.characteristicsNSI[ch],
                      isAllowAnalogs: good.characteristicsNSI['analogs' + ch],
                    });
                  }
                }
              }

              let placeOfWorkValue: number;
              good.fields.forEach((field) => {
                field[1].forEach((idField) => {
                  if (
                    idField.interfaceField.fieldId &&
                    idField.interfaceField.fieldId ===
                    ID_INTERFACE_FIELD.PLACE_OF_WORK
                  ) {
                    placeOfWorkValue = idField.selectedValues;
                  }
                });
              });

              const idGood =
                this.modelsResult?.type === 'editAuctionOffer'
                  ? good.idDemandOfferGood
                  : g.goodId;
              goods.push({
                idGood: nsiGoodValues?.length > 0 ? null : idGood,
                idGoodFromFront: idGood,
                nsiGoodValues: nsiGoodValues,
                idGoodName: good.idGoodName,
                idGoodGroup: good.idGoodGroup,
                idNomenclature: good.idNomenclatureGroup,
                volume: Number(g.volume),
                ...(this.direction == IdDirection.buy &&
                  this.modelsResult?.type === 'editAuctionOffer' && {
                    minPriceWithoutVat: g.minPriceField,
                    locationService: placeOfWorkValue,
                  }),
              });
            });

            endDelivScope.push({
              idFirmClient: scope.idBroker,
              goods: goods,
            });
          });
        } else {
          delivScopeGraded = this.delivScope.map(scope => ({
            idFirmClient: scope.idBroker,
            volume: scope.volume
          }));
        }
      } else {
        if (!this.isSameGradesInSaleOffer) {
          let goods = [];
          this.goodsList.forEach((g) => {
            let nsiGoodValues = [];
            if (g?.characteristicsNSI) {
              for (let ch in g.characteristicsNSI) {
                if (!ch.toString().startsWith('analogs')) {
                  let val = g.characteristicsNSI[ch];
                  // if (val?.length > 0) {
                  nsiGoodValues.push({
                    idReference: ch,
                    listValues: g.characteristicsNSI[ch],
                    isAllowAnalogs: g.characteristicsNSI['analogs' + ch],
                  });
                  //}
                }
              }
            }

            let placeOfWorkValue: number;
            g.fields.forEach((field) => {
              field[1].forEach((idField) => {
                if (
                  idField.interfaceField.fieldId &&
                  idField.interfaceField.fieldId ===
                  ID_INTERFACE_FIELD.PLACE_OF_WORK
                ) {
                  placeOfWorkValue = idField.selectedValues;
                }
              });
            });

            const idGood =
              this.modelsResult?.type === 'editAuctionOffer'
                ? g.idDemandOfferGood
                : g.id;
            goods.push({
              idGood: nsiGoodValues?.length > 0 ? null : idGood,
              idGoodFromFront: idGood,
              nsiGoodValues: nsiGoodValues,
              idGoodName: g.idGoodName,
              idGoodGroup: g.idGoodGroup,
              idNomenclature: g.idNomenclatureGroup,
              volume: Number(g.volume),
              ...(this.direction == IdDirection.buy &&
                this.modelsResult?.type === 'editAuctionOffer' && {
                  minPriceWithoutVat: g.minPriceField,
                  locationService: placeOfWorkValue,
                }),
            });
          });
          endDelivScope.push({
            idFirmClient: this.generalInfoStep.controls.brokerClient.value[0],
            goods: goods,
          });
        } else {
          delivScopeGraded.push({
            idFirmClient: this.generalInfoStep.controls.brokerClient.value[0],
            volume: this.sumVolumePipe.transform(this.goodsList, 'volume')
          });
        }
      }
    }

    return {
      endListGoods: endListGoods,
      priceAdjustmentForChecking: priceAdjustmentForChecking,
      idVatQuoteForChecking: idVatQuoteForChecking,
      financeForChecking: financeForChecking,
      objectForValues: objectForValues,
      endDeliveryBasis: endDeliveryBasis,
      endDelivScope: endDelivScope,
      delivScopeGraded: delivScopeGraded,
      endDeliverySchedule: endDeliverySchedule,
      delivSchPeriodsGraded: delivSchPeriodsGraded,
    };
  }

  private buildDocuments(
    files: DocumentItem[],
    isPrivate: boolean
  ): DocumentItemRefresh[] {
    return files
      .filter(
        (item) =>
          this.isArchiveSubmit ||
          this.isCreateCopy ||
          !(
            this.idOffer &&
            this.offerDocuments?.some((f) => f.idDocument === item.idDocument)
          )
      )
      .map((item) => ({
        idSection: this.sectionId,
        idSession: this.sessionId,
        documentName: item.filename,
        documentExtension: '.' + item.filename.split('.').pop()!,
        documentContent: item.content.includes('base64,')
          ? item.content.split('base64,')[1]
          : item.content,
        isPrivate,
      }));
  }

  public onCreateObjectForOffer(
    rulesArray: {},
    goodArray?: any[],
    finishDeliveryBasis?: any[]
  ) {
    const prepareGoodValue = this.onPrepareDataForObject();
    return {
      idDirection: this.direction,
      idSection: Number(this.sectionId),
      setDemandOffer: {
        idDemandOffer:
          this.isCreateCopy || this.isArchiveSubmit
            ? null
            : Number(this.idOffer) || null,
        idSession: Number(this.sessionId),
        idModel: Number(this.modelId),
        idFirmClient:
          this.generalInfoStep.get('participant').value == role.visitor
            ? null
            : this.generalInfoStep.get('contractType')?.value == '21'
            ? this.generalInfoStep.get('brokerClient')?.value
            : null,
        idClientContractType:
          this.generalInfoStep.get('participant').value == role.visitor
            ? null
            : this.generalInfoStep.get('contractType')?.value,
        idBranch:
          this.generalInfoStep.get('participant').value == role.visitor &&
          this.generalInfoStep.get('listBranch')?.value != 0
            ? this.generalInfoStep.get('listBranch')?.value
            : this.generalInfoStep.get('listClientBranch')?.value &&
              this.generalInfoStep.get('listClientBranch')?.value != 0
            ? this.generalInfoStep.get('listClientBranch')?.value
            : null,
        idCurrency: Number(this.goodsList[0].currency.id),
        vatPercent:
          this.filledFields.vat.id != 1
            ? Number(this.filledFields.vat.name.replace('%', ''))
            : null,
        idPriceAdjustment: prepareGoodValue.priceAdjustmentForChecking, //тип поправки
        isPriceAdjusted: this.filledFields?.adjustedPrice
          ? JSON.parse(
              this.filledFields?.adjustedPrice.toString().toLowerCase()
            )
          : this.filledFields?.adjustedPrice, //корректируeмая цена
        idFinance: prepareGoodValue.financeForChecking || null, //источник финансирования
        detailsImportDomestic: this.commonParametersForm.get(
          'additionalTermsDomestic'
        )?.value,
        detailsExportForeign: this.commonParametersForm.get(
          'additionalTermsForeign'
        )?.value,
        listDeletedDocuments:
          this.isCreateCopy || this.isArchiveSubmit
            ? null
            : this.deleteDocuments, //массив id удаленных док-тов при редактировании
        idDeliveryScheduleType: this.deliveryTermSchedule || null, //id графика поставки
      },
      goods: goodArray || prepareGoodValue.endListGoods,
      payCondFull: this.getPayCondFull(),
      paymentPart: this.getPaymentPart(),
      deliveryPeriod: this.getDeliveryPeriod(),
      delivConditions: finishDeliveryBasis || prepareGoodValue.endDeliveryBasis,
      delivScope: prepareGoodValue.endDelivScope,
      delivScopeGraded: prepareGoodValue.delivScopeGraded,
      delivSchPeriods: prepareGoodValue.endDeliverySchedule,
      delivSchPeriodsGraded: prepareGoodValue.delivSchPeriodsGraded,
      documents: this.documents,
      idVatPercent: this.filledFields.vat.id,
      idVatQuote: prepareGoodValue.idVatQuoteForChecking || 0,
      rules: rulesArray,
    };
  }

  submitOffer(e) {
    if (!this.error) {
      try {
        const body = this.onCreateObjectForOffer(this.req);
        this.createOfferService
          .CollectOfferDataAndSend(
            this.user?.token,
            body,
            Number(this.sectionId)
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: CollectOfferResponse) => {
              if (res.idDemandOffer !== NO_DEMAND_OFFER_ID) {
                this.isChangesSaved = true;

                if (!this.isCreateCopy) {
                  if (this.idOffer) {
                    this.createOfferService.idOffer = res.idDemandOffer;
                    this.createOfferService.direction = this.direction;
                  }

                  this.message =
                    this.idOffer && !this.isArchiveSubmit
                      ? this.translate.store.currentLang === 'RU'
                        ? `${RU['errors'].offer} ${res.lotNumber} ${RU['general'].offerEdited}`
                        : `${EN['errors'].message} ${res.lotNumber} ${EN['general'].offerEdited}`
                      : this.translate.store.currentLang === 'RU'
                      ? `${RU['errors'].offer} ${res.lotNumber} ${RU['errors'].submitted}`
                      : `${EN['errors'].message} ${res.lotNumber} ${EN['errors'].submitted}`;

                  this.isVisible = true;
                } else {
                  this.message =
                    this.translate.store.currentLang === 'RU'
                      ? `${RU['errors'].offer} ${res.lotNumber} ${RU['errors'].submitted}`
                      : `${EN['errors'].message} ${res.lotNumber} ${EN['errors'].submitted}`;
                  this.isVisible = true;
                }
              } else {
                this.error = true;
                this.errorState = ErrorStates.error;
                this.messageError = 'Не найдены пересечения!';
              }
            },

            error: (error) => {
              if (error?.statusCode === VALIDATION_ERROR) {
                //error of validation offer (message from BE)
                this.error = true;
                this.errorState = ErrorStates.error;
                this.messageError = error?.title;
              }
            },
          });
      } catch (error) {
        console.log(error);
      }
    }
  }

  public getPayCondFull(): PayCondFull | null {
    return this.termsPaymentForm.controls.termsPayment?.value !=
      termsConditionsPaymentConst.partialPrepayment
      ? {
          idPaymentType: this.termsPaymentForm.controls.termsPayment?.value,
          idDayType: this.termsPaymentForm.controls.dayTypeId?.value || null,
          idShipmentVolume: this.termsPaymentForm.controls.volume?.value,
          idPaymentMoment:
            this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.prepayment100 ||
            this.termsPaymentForm.controls.termsPayment?.value ==
              termsConditionsPaymentConst.paymentThroughExchange
              ? this.termsPaymentForm.controls.momentPrepayment?.value
              : this.termsPaymentForm.controls.momentDelay?.value,
          periodValueNumber:
            this.termsPaymentForm.controls.termsPayment?.value !=
            termsConditionsPaymentConst.paymentDeferment
              ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value ||
                null
              : this.termsPaymentForm.controls.defermentPeriodNumber?.value ||
                null,
          periodValueDate:
            this.termsPaymentForm.controls.termsPayment?.value !=
            termsConditionsPaymentConst.paymentDeferment
              ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                ? this.commonService.toOADate(
                    this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                  )
                : null
              : this.termsPaymentForm.controls.defermentPeriodDate?.value
              ? this.commonService.toOADate(
                  this.termsPaymentForm.controls.defermentPeriodDate?.value
                )
              : null,
        }
      : null;
  }

  public getPaymentPart(): PaymentPart | null {
    return this.termsPaymentForm.controls.termsPayment?.value ==
      termsConditionsPaymentConst.partialPrepayment
      ? {
          idDayType: this.termsPaymentForm.controls.dayTypeId?.value || null,
          idShipmentVolume: this.termsPaymentForm.controls.volume?.value,
          idPaymentMomentPrepay:
            this.termsPaymentForm.controls.momentPrepayment?.value,
          firstPercent: this.termsPaymentForm.controls.prepaymentAmount?.value,
          firstPeriodValueNumber:
            this.termsPaymentForm.controls.momentPrepayment?.value != 7
              ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
              : null,
          idPaymentMomentDelay:
            this.termsPaymentForm.controls.momentDelay?.value,
          secondPercent: this.termsPaymentForm.controls.defermentAmount?.value,
          secondPeriodValueNumber:
            this.termsPaymentForm.controls.defermentPeriodNumber?.value || null,
          thirdPeriodValueNumber:
            this.termsPaymentForm.controls.momentPrepayment?.value == 7 &&
            this.termsPaymentForm.controls.prepaymentAmount?.value < 60
              ? this.termsPaymentForm.controls.defermentPeriod2?.value
              : null,
        }
      : null;
  }

  public getDeliveryPeriod(): DeliveryTerms {
    return {
      idDeliveryMoment: this.deliveryTermForm.value.startDelivery,
      idPeriodType: this.deliveryTermForm.value.deliveryType,
      periodTypeValue: this.deliveryTermForm.value.deliveryTerm,
      dateBegin: this.deliveryTermForm.value?.startDate
        ? this.commonService.toOADate(this.deliveryTermForm.value?.startDate)
        : null,
      dateEnd: this.deliveryTermForm.value?.endDate
        ? this.commonService.toOADate(this.deliveryTermForm.value?.endDate)
        : null,
    };
  }

  getNumber(value) {
    return Number(value);
  }

  public closeSubmitPopup(): void {
    if (this.modelsResult?.type !== 'editAuctionOffer') {
      this.offerManagementService.sessionId = this.sessionId;
      this.offerManagementService.sectionId = this.sectionId;
      this.offerManagementService.typeOfSession = 'current';
      if (this.createOfferService.isArchiveSubmit) {
        this.createOfferService.isArchiveSubmit = false;
      }

      const cache = JSON.parse(
        sessionStorage.getItem('OFFER_MANAGEMENT') || '{}'
      );
      if (cache?.filters) {
        cache.filters.session = this.sessionId; // новый sessionId
      }
      sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(cache));

      this.router.navigate(['/offer-management'], {
        queryParams: {
          idSection: this.sectionId,
          type: 'current',
        },
      });
    } else {
      const cache = JSON.parse(
        sessionStorage.getItem('OFFER_MANAGEMENT') || '{}'
      );
      if (cache?.filters) {
        cache.filters.session = this.sessionId; // новый sessionId
      }
      sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(cache));

      this.location.back();
      /*const auctionType = this.modelsResult.idAuctionType === AUCTION_TYPE.SIMPLE_BUYER_AUCTION ?
        'dutch-down-auction' :
        'english-upgrading-auction'
      const url = this.router.serializeUrl(
        this.router.createUrlTree(
          [`${this.config.auctions}/${auctionType}/main-page`],
          {
            queryParams: {
              isExistsViolations: res.isExistsViolations,
              idDirection: res.idDirection,
              idSection: this.sectionId,
              idSession: this.sessionId,
            },
          }
        )
      );
      this.router.navigate([`/`], {skipLocationChange: true}).then(() => {
        window.history.replaceState(null, '', window.location.href);
        window.location.href = url;
      });*/
    }
  }

  reload() {
    window.location.reload();
  }

  submitAnotherApplication() {
    this.chooseTheWay = true;
    this.createOfferService.sectionId = this.sectionId;
    this.createOfferService.sessionId = this.sessionId;
    this.createOfferService.direction = this.direction;
    this.chooseSession = [
      {
        sectionId: this.sectionId,
        sessionId: this.sessionId,
        sessionName: this.sessionName,
        sessionDateTime: this.sessionDateTime,
        sectionName: this.sectionName,
        concatedMarketTypes: this.choosenMarketType,
      },
    ];
  }

  public openPopup(str: string): void {
    switch (str) {
      case 'cancel': {
        this.popupTitle =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelForm
            : EN['createOffer'].cancelForm;
        this.popupMessage =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelFormMess
            : EN['createOffer'].cancelFormMess;
        break;
      }
      case 'cancelEdit': {
        this.popupTitle =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelForm
            : EN['createOffer'].cancelForm;
        this.popupMessage =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelEditFormMess
            : EN['createOffer'].cancelEditFormMess;
        break;
      }
      case 'exitWithoutSaving': {
        this.popupTitle =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelForm
            : EN['createOffer'].cancelForm;
        this.popupMessage =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].exitWithoutSaving
            : EN['createOffer'].exitWithoutSaving;
        break;
      }
    }

    this.popupForm = true;
    this.popupButton = true;
  }

  public formGoodsFinishArray(
    item,
    endProperties,
    goodArray,
    isRemains?
  ): void {
    let placeOfWorkValue: number;
    item.fields.forEach((field) => {
      field[1].forEach((idField) => {
        if (idField.interfaceField.fieldId && idField.selectedValues) {
          if (
            idField.interfaceField.fieldId === ID_INTERFACE_FIELD.PLACE_OF_WORK
          ) {
            placeOfWorkValue = idField.selectedValues;
          }

          if (
            idField.interfaceField.fieldId === ID_INTERFACE_FIELD.ADJUSTED_PRICE
          ) {
            idField.selectedValues = this.filledFields?.adjustedPrice
              ? JSON.parse(
                  this.filledFields?.adjustedPrice.toString().toLowerCase()
                )
              : this.filledFields?.adjustedPrice;
          }
          const isSingle = !idField.interfaceField.isAvailableMultiSelection;
          const isSelectBox =
            idField.interfaceField.controlFieldType === 'dxSelectBox';
          const isNumberBox =
            idField.interfaceField.controlFieldType === 'dxNumberBox';
          const isTextBox =
            idField.interfaceField.controlFieldType === 'dxTextBox';
          const isCheckBox =
            idField.interfaceField.controlFieldType === 'dxCheckBox';

          const isProductLocation =
            idField.interfaceField.fieldId ===
            ID_INTERFACE_FIELD.PRODUCT_LOCATION;
          const isQuantity =
            idField.interfaceField.fieldId === ID_INTERFACE_FIELD.QUANTITY;

          const isSpecialProductLocation =
            isSelectBox && isProductLocation && !idField.isFreeInput;

          const isRegularSelect = isSelectBox && !isProductLocation;

          let fieldValueNumber = this.createFieldValueNumber(
            item,
            idField,
            isSingle,
            isSpecialProductLocation,
            isRegularSelect,
            isNumberBox,
            isRemains,
            isQuantity
          );

          //при записи в остаточный массив если поле количество - то от количества которое пришло отнимаем текущее количество
          endProperties.push({
            idInterfaceField: idField.interfaceField.fieldId,
            fieldValueNumber: fieldValueNumber,
            fieldValueString:
              isSingle &&
              (isTextBox || isCheckBox || (isSelectBox && isProductLocation))
                ? idField.selectedValues
                : null,
            listFieldValues: !isSingle ? idField.selectedValues : '',
          });
        }
      });
    });

    let nsiGoodValues = [];
    if (item?.characteristicsNSI) {
      for (let ch in item.characteristicsNSI) {
        if (!ch.toString().startsWith('analogs')) {
          let val = item.characteristicsNSI[ch];
          // if (val?.length > 0) {
          nsiGoodValues.push({
            idReference: ch,
            listValues: item.characteristicsNSI[ch],
            isAllowAnalogs: item.characteristicsNSI['analogs' + ch],
          });
        }
      }
    }

    goodArray.push({
      idGood: nsiGoodValues?.length > 0 ? null : item.idDemandOfferGood,
      idGoodFromFront: item.idDemandOfferGood,
      nsiGoodValues: nsiGoodValues,
      idGoodName: item.idGoodName,
      idGoodGroup: item.idGoodGroup,
      idNomenclature: item.idNomenclatureGroup,
      properties: endProperties,
      ...(this.direction == IdDirection.buy && {
        minPriceWithoutVat: item.minPriceField,
        locationService: placeOfWorkValue,
      }),
    });
  }

  private createFieldValueNumber(
    item,
    idField,
    isSingle: boolean,
    isSpecialProductLocation: boolean,
    isRegularSelect: boolean,
    isNumberBox: boolean,
    isRemains: boolean,
    isQuantity: boolean
  ): number {
    let fieldValueNumber: number = null;

    if (isSingle) {
      if (isSpecialProductLocation) {
        fieldValueNumber = idField.idSelectedValues ? Number(idField.idSelectedValues) : null;
      } else if (isRegularSelect || isNumberBox) {
        if (isRemains && isQuantity) {
          fieldValueNumber =
            item.maxQuantity - idField.interfaceField.selectedValues;
        } else {
          fieldValueNumber = idField.selectedValues;
        }
      }
    }
    return fieldValueNumber;
  }

  public onCreateFinishBasis(): any[] {
    let finishDeliveryBasis = [];

    if (!this.isNotSpecified) {
      this.deliveryBasis.forEach((item) => {
        let goodsForBasis = [];
        item.goods.forEach((el) => {
          let good = this.goodsList.find((g) => g.id == el.id);

          if (good.volume !== 0) {
            let nsiGoodValues = [];
            if (good?.characteristicsNSI) {
              for (let ch in good?.characteristicsNSI) {
                if (!ch.toString().startsWith('analogs')) {
                  nsiGoodValues.push({
                    idReference: ch,
                    listValues: good.characteristicsNSI[ch],
                    isAllowAnalogs: good.characteristicsNSI['analogs' + ch],
                  });
                }
              }
            }

            let placeOfWorkValue: number;
            good.fields.forEach((field) => {
              field[1].forEach((idField) => {
                if (
                  idField.interfaceField.fieldId &&
                  idField.interfaceField.fieldId ===
                    ID_INTERFACE_FIELD.PLACE_OF_WORK
                ) {
                  placeOfWorkValue = idField.selectedValues;
                }
              });
            });

            goodsForBasis.push({
              idGood: nsiGoodValues?.length > 0 ? null : good.idDemandOfferGood,
              idGoodFromFront: good.idDemandOfferGood,
              nsiGoodValues: nsiGoodValues,
              idGoodName: good.idGoodName,
              idGoodGroup: good.idGoodGroup,
              idNomenclature: good.idNomenclatureGroup,
              priceWithoutVat: el.cost,
              priceAdjustment: el.amendment,
              ...(this.direction == IdDirection.buy && {
                minPriceWithoutVat: el.minPriceField || null,
                locationService: placeOfWorkValue,
              }),
            });
          }
        });

        finishDeliveryBasis.push({
          goods: goodsForBasis,
          isMain: item.coreBasis,
          idBasisLink: item.idBasisLink,
          idBasisValue: item.idBasisValue,
          idPlaceLink: item.idPlaceLink,
          idPlaceValue: item.idPlaceValue,
          placeDetails:
            item.idPlaceLink === null && item.idPlaceValue === null
              ? item.enterPlaceName
              : item.specifyingLocation,
        });
      });
    }
    return finishDeliveryBasis;
  }

  public finalSave(): void {
    if (!this.error) {
      try {
        let goodCurrent = [];
        this.goodsList.forEach((item) => {
          let endPropertiesCurrentOffer = [];
          this.formGoodsFinishArray(
            item,
            endPropertiesCurrentOffer,
            goodCurrent
          );
        });
        const finishDeliveryBasis = this.onCreateFinishBasis(); //Для проверки, если один товар занулили
        let rules = this.createObjectForRule();

        let body;
        if (
          this.modelsResult.idAuctionType === AUCTION_TYPE.SIMPLE_BUYER_AUCTION
        ) {
          body = {
            currentDemand: this.onCreateObjectForOffer(
              rules,
              goodCurrent,
              finishDeliveryBasis
            ),
            remainsDemand: null,
          };
        } else {
          body = {
            currentOffer: this.onCreateObjectForOffer(
              rules,
              goodCurrent,
              finishDeliveryBasis
            ),
            remainsOffer: null,
          };
        }

        if (
          this.modelsResult.idAuctionType !== AUCTION_TYPE.SIMPLE_BUYER_AUCTION
        ) {
          this.createOfferService
            .editOffer(this.user?.token, body)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res: EditOfferDemandResponse) => {
                this.finishEdit(res);
              },
              error: (error) => {
                if (error?.statusCode === VALIDATION_ERROR) {
                  this.error = true;
                  this.errorState = ErrorStates.error;
                  this.messageError = error?.title;
                }
              },
            });
        } else {
          this.createOfferService
            .editDemand(this.user?.token, body)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res: EditOfferDemandResponse) => {
                this.finishEdit(res);
              },
              error: (error) => {
                if (error?.statusCode === VALIDATION_ERROR) {
                  this.error = true;
                  this.errorState = ErrorStates.error;
                  this.messageError = error?.title;
                }
              },
            });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  public finishEdit(res): void {
    if (res.idDemandOffer !== NO_DEMAND_OFFER_ID) {
      this.isChangesSaved = true;
      this.message =
        this.translate.store.currentLang === 'RU'
          ? `${RU['errors'].offer} ${res.lotNumberCurrent} ${RU['general'].offerEdited}`
          : `${EN['errors'].offer} ${res.lotNumberCurrent} ${EN['general'].offerEdited}`;
      this.isVisible = true;
    } else {
      this.error = true;
      this.errorState = ErrorStates.error;
      this.messageError = 'Не найдены пересечения!';
    }
  }

  cancelForm() {
    this.isChangesSaved = true;
    this.ngOnDestroy();
    history.back();
  }

  public ngOnDestroy() {
    sessionStorage.removeItem('createOffer');
    sessionStorage.removeItem('editOffer');
    this.destroy$.next();
    this.destroy$.complete();
    this.onDestroyWaiting();
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (this.isChangesSaved || !localStorage.getItem('user')) return true;
    else
      return custom({
        showTitle: true,
        title:
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelForm
            : EN['createOffer'].cancelForm,
        message: `<div>${
          this.idOffer && !this.isCreateCopy && !this.isArchiveSubmit
            ? this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].cancelEditFormMess
              : EN['createOffer'].cancelEditFormMess
            : this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].cancelFormMess
            : EN['createOffer'].cancelFormMess
        }</div>`,
        buttons: [
          {
            template: `<div class="flexContent8 ai-c">${
              this.idOffer && !this.isCreateCopy && !this.isArchiveSubmit
                ? this.translate.store.currentLang == 'RU'
                  ? RU['btns'].cancelEdit
                  : EN['btns'].cancelEdit
                : this.translate.store.currentLang == 'RU'
                ? RU['btns'].cancelFilling
                : EN['btns'].cancelFilling
            }</div>`,
            onClick: () => true,
            focusStateEnabled: false,
          },
          {
            template: `<div class="flexContent8 ai-c">${
              this.translate.store.currentLang == 'RU'
                ? RU['btns'].close
                : EN['btns'].close
            }</div>`,
            elementAttr: { class: 'w-50' },
            onClick: () => false,
            focusStateEnabled: false,
          },
        ],
      })
        .show()
        .then((dialogResult: boolean) => dialogResult);
  }
}
