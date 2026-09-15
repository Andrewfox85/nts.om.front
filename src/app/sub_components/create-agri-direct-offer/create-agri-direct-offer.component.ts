/* eslint-disable */
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FiltersService } from '../filters/filters.service';
import { User } from '../../core/classes/user';
import { CommonService, IContractType } from '../../core/services/common-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { CreateOfferService, GoodsSpecification } from '../../core/services/create-offer-service.service';
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
  ID_DELIVERY_TERM,
  ID_DELIVERY_TERM_TYPE,
  ErrorStates,
  ID_DOCUMENT,
} from 'src/app/api.constants';
import { SessionsScheduleService } from 'src/app/core/services/sessions-schedule.service';
import { SidebarService } from 'src/app/core/services/sidebar-service.service';
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
import { Observable, Subject } from 'rxjs';
import { custom } from 'devextreme/ui/dialog';
import { CatalogService } from '../../core/services/catalog-service.service';
import { AppConfigService } from '../../app-config.service';
import { ComponentCanDeactivate } from '../../core/guard/redirect.guard';
import { ID_INTERFACE_FIELD } from '../../shared/enums';
import { GoodsItemModel } from '../../core/interfaces/goods';
import { DataSourceOption } from "../../core/interfaces/interface";
import { buildField } from "../../core/helpers/goodsFields";
import { GOODS_FIELDS_BLOCK } from "../create-offer/enums";
import { localeDependentDate } from "../../core/helpers/locale-dependent-date";

@Component({
  selector: 'app-create-agri-direct-offer',
  templateUrl: './create-agri-direct-offer.component.html',
  styleUrls: ['./create-agri-direct-offer.component.scss']
})
export class CreateAgriDirectOfferComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  @ViewChild('dataGridDeliveryCondition', { static: false })
  dataGrid: DxDataGridComponent;
  @ViewChild('generalInfoSeller', { static: false })
  generalInfoSellerValidationGroup: DxValidationGroupComponent;
  @ViewChild('generalInfoBuyer', { static: false })
  generalInfoBuyerValidationGroup: DxValidationGroupComponent;
  @ViewChild('deliveryTerm', { static: false })
  deliveryTermValidationGroup: DxValidationGroupComponent;
  @ViewChild('termsPayment', { static: false })
  validationGroup: DxValidationGroupComponent;

  public readonly minDate = new Date();
  user: User;
  locale: string;

  role: any;
  UserRoleSeller: number;
  contractTypeSeller: any;
  disabledAssignmentsSeller = true;
  disabledCommissionSeller = true;

  listBranchSeller = [];
  brokerClientSeller = [];
  listClientBranchSeller = [];
  branchesFirmsOfAllClients = [];

  UserRoleBuyer: number;
  /*ListBranchesAllClientsSeller: any;
  ListBranchesFirmSeller: any;*/
  contractTypeBuyer: any;
  disabledAssignmentsBuyer = false;
  disabledCommissionBuyer = true;

  listBranchBuyer = [];
  brokerClientBuyer = [];
  listClientBranchBuyer: any;
  destinationConditions = false;

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
  IdDirection = IdDirection;
  pricingType = pricingType;

  generalInfoStep = this.formBuilder.group({
    participantSeller: [],
    contractTypeSeller: [],
    brokerClientSeller: [null],
    listClientBranchSeller: [null],
    listBranchSeller: [null],
    brokerClientWorkerSeller: [],
    listClientBranchWorkerSeller: [],
    listBranchWorkerSeller: [],
    participantBuyer: [],
    participantBuyerInfo: [],
    contractTypeBuyer: [],
    brokerClientBuyer: [null],
    listClientBranchBuyer: [null],
    listBranchBuyer: [null],
    brokerClientWorkerBuyer: [],
    listClientBranchWorkerBuyer: [],
    listBranchWorkerBuyer: []
  });

  totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: []
  });

  firstElement = false; // первый элемент в массиве товаров
  // пересечения
  deliveryConditions = [];
  deliverySchedule = [];
  deliveryTerm = [];
  termsConditionsPayment = [];
  currencyConditions = [];
  vatConditions = [];
  financeSourcesConditions = [];
  currencyQuotesConditions = [];
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

  //срок поставки
  deliveryTermForm = this.formBuilder.group({
    startDelivery: [null, [Validators.required]],
    deliveryType: [null, [Validators.required]],
    deliveryTerm: [40, [Validators.required]],
    startDate: [new Date(), [Validators.required]],
    endDate: [new Date(), [Validators.required]]
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
    dayTypeId: []
  });

  termsConditionsPaymentConst: any;
  paymentConfig: any;

  commonParametersForm = this.formBuilder.group({
    additionalTermsDomestic: [],
    additionalTermsForeign: []
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

  changeGoodInfo = false;
  previewVisible = false;

  contractTypeChooseSeller;
  brokerClientChooseSeller = [];
  listBranchChooseSeller;
  deliveryTermScheduleChoose;

  contractTypeChooseBuyer;
  brokerClientChooseBuyer = [];
  listBranchChooseBuyer;

  volumePrecision; //точность количества
  currencyPrecision; //точность валюты
  quoteCurrencyPrecision; //точность валюты котировки
  createOffer: any;

  isChangesSaved: boolean = false; //сохранены ли изменения

  goodsList: GoodsItemModel[] = [];

  goods = [];

  good: any;
  chooseGoodForm = false;
  goodInfo = false;
  viewInfoGood = null;
  editInfoGood = null;

  refs = [];
  nomenclaturesWithGroups = [];
  goodsGroup = [];
  goodsValue = [];
  searchIcon: any;

  chooseGood = this.formBuilder.group({
    catalogTypes: ['global'],
    searchParameters: [''],
    nomenclaturesWithGroups: [],
    goodsGroup: [],
    goods: []
  });

  error = false;
  messageError: string;
  errorState: number;

  errorFromEdit: any; //Любая ошибка при редактировании, при которой не смогли не загрузиться данные

  popupForm = false;
  popupMessage: string;
  popupTitle: string;
  popupButton = true;

  /*  РЕДАКТИРОВАНИЕ ЗАЯВКИ*/
  idOffer: number; //idOffer для редактирования заявки и для подачи (id архивной заявки)
  offerGeneral: any; // общая информация по заявке
  offerGoods = []; // информация по товарам по заявке
  offerDeliveryScopes = []; // грузоотправители/ грузополучатели по заявке
  offerDelivSchPeriods = []; //график поставки по заявке
  offerDeliveryConditions = []; //условия поставки по заявке
  offerDocuments = []; //документы по заявке
  offerDeliveryPeriod: any; //срок оплаты по заявке
  offerPaymentCond: any; //условия оплаты по заявке

  disabledContractTypeSeller = false; //задизэйблить тип договора
  disabledContractTypeBuyer = false; //задизэйблить тип договора

  deleteDocuments = []; //массив удаленных документов

  isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты
  allCharacteristics = [];
  dayTypePaymentConfig: any; //Справочник календарных и банковских дней
  DateSession: any;
  DateSessionPlusDay: Date;
  idMarketType: string;

  type: string; //чтоб отличить подаем мы или редактируем заявку, учитвыя что idOffer у нас есть всегда
  archiveIdOfferGood: number; //id главного базового !архивного! товара

  public isOpenSidebar = false; //открыта ли боковая панель

  constructor(
    private formBuilder: FormBuilder,
    private createOfferService: CreateOfferService,
    public translate: TranslateService,
    public commonService: CommonService,
    public catalogService: CatalogService,
    private location: Location,
    public filtersService: FiltersService,
    public offerManagementService: OfferManagementService,
    public router: Router,
    public config: AppConfigService,
    public sidebarService: SidebarService
  ) {
    this.locale = this.translate.currentLang;
    //для перевода времени
    registerLocaleData(localeRu);
    this.termsConditionsPaymentConst = termsConditionsPaymentConst;
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.searchIcon = searchIcon;
    this.role = role;

    const urlParams = new URLSearchParams(window.location.search);
    const offerParam = urlParams.get('offer');

    if (offerParam) {
      this.createOffer = JSON.parse(decodeURIComponent(offerParam));
      sessionStorage.setItem('createOffer', JSON.stringify(this.createOffer));
    }

    //если в таблице выбора заявки выбрали новую заявку, то перезаписываем localStorage, а не берем все инфу из него
    this.createOffer = this.createOfferService.idOffer
      ? JSON.parse(sessionStorage.getItem('createOffer'))?.idOffer ==
        this.createOfferService.idOffer
        ? JSON.parse(sessionStorage.getItem('createOffer'))
        : {
            idOffer: this.createOfferService.idOffer,
            sessionName: this.createOfferService.sessionName,
            sectionName: this.createOfferService.sectionName,
            sessionDateTime: this.createOfferService.sessionDateTime,
            sessionId: this.createOfferService.sessionId,
            sectionId: this.createOfferService.sectionId,
            direction: this.createOfferService.direction,
            modelsResult: this.createOfferService.modelResult,
            demandsModal: this.createOfferService.demandsModal
          }
      : JSON.parse(sessionStorage.getItem('createOffer'));

    this.idOffer = this.createOffer?.idOffer;

    if (!this.idOffer) {
      this.error = true;
      this.errorState = ErrorStates.error;
      this.errorFromEdit = true;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['createOffer'].duplicateMessage
          : EN['createOffer'].duplicateMessage;
      return;
    }

    this.direction = this.createOffer.direction;
    this.sessionName = this.createOffer.sessionName;
    this.sectionId = Number(this.createOffer.sectionId);
    this.sectionName = this.commonService.choosenSection(
      this.sectionId,
      this.translate.store.currentLang
    );
    this.sessionId = Number(this.createOffer.sessionId);
    this.sessionDateTime = this.createOffer.sessionDateTime;
    this.modelsResult = this.createOffer.modelsResult;
    this.demandsModal = this.createOffer.demandsModal;

    this.GetRoleSeller();
    this.type = JSON.parse(sessionStorage.getItem('createOffer'))?.type;

    if (this.idOffer && this.direction) {
      //РЕДАКТИРОВНАИЕ
      this.getFullInfo();
    }

    if (this.createOfferService.sessionId) {
      sessionStorage.setItem('createOffer', JSON.stringify(this.createOffer));
    }

    this.DateSession = new Date(
      (this.sessionDateTime - 25569) * 24 * 3600 * 1000
    );
    this.DateSessionPlusDay = new Date(
      this.DateSession.getFullYear(),
      this.DateSession.getMonth(),
      this.DateSession.getDate() + 1
    );
    this.initContractTypeSeller();

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

    this.createOfferService
      .GetUploadFilesRestrict(this.user?.token)
      .then((res: any) => {
        this.maxSingleSize = res.fileMaxSizeSingle;
        this.extensions = res.fileExtensions;
        this.maxSizeBatch = res.fileMaxSizeBatch;
      });
  }

  offerArchiveGoods;

  public getFullInfo(): void {
    if (!this.type) {
      this.createOfferService
        .GetArchiveOfferFullInfo(
          this.user?.token,
          IdDirection.sale,
          this.sectionId,
          this.sessionId,
          this.idOffer
        )
        .subscribe((res: any) => {
          this.modelId = res.generalInfo.idModel;
          this.offerGeneral = res.generalInfo;
          this.modelsResult.isAllowedFilesPrivate =
            this.offerGeneral.isAllowedFilesPrivate;
          this.modelsResult.isAllowedFilesPublic =
            this.offerGeneral.isAllowedFilesPublic;
          this.offerGoods = res.goods;
          this.offerDeliveryScopes = res.deliveryScopes;
          this.offerDelivSchPeriods = res.delivSchPeriods;
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
        });
    } else {
      this.createOfferService
        .GetOfferFullInfo(
          this.user?.token,
          this.sectionId,
          this.sessionId,
          this.idOffer
        )
        .then((res: any) => {
          this.modelId = res.generalInfo.idModel;
          this.offerGeneral = res.generalInfo;
          this.modelsResult.isAllowedFilesPrivate =
            this.offerGeneral.isAllowedFilesPrivate;
          this.modelsResult.isAllowedFilesPublic =
            this.offerGeneral.isAllowedFilesPublic;
          this.offerGoods = res.goods;
          this.offerDeliveryScopes = res.deliveryScopes;
          this.offerDelivSchPeriods = res.delivSchPeriods;
          this.offerDeliveryConditions = res.deliveryConditions;
          this.offerDocuments = res.documents;
          this.offerDeliveryPeriod = res.deliveryPeriod;
          this.offerPaymentCond = res.paymentCond;
          sessionStorage.setItem('editOffer', JSON.stringify(res));

          this.createOfferService
            .GetArchiveOfferFullInfo(
              this.user?.token,
              IdDirection.sale,
              this.sectionId,
              this.sessionId,
              this.offerGeneral?.idOfferBasedOn
            )
            .subscribe((res: any) => {
              this.offerArchiveGoods = res.goods;

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
        });
    }
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

        this.choosenMarketType = this.translate.store.currentLang === 'EN'
        ? this.demandsModal?.concatedMarketTypesEn
        : this.demandsModal?.concatedMarketTypes;

        const createOffer = JSON.parse(sessionStorage.getItem('createOffer'));
        createOffer['demandsModal'] = this.demandsModal;
        sessionStorage.setItem('createOffer', JSON.stringify(createOffer));

        if (this.createOfferService.demandsModal.blocks.length == 0) {
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].loadingApplicationData
              : EN['errors'].loadingApplicationData;
        } else {
          this.GetDeliveryBasesTreeByModelId();
        }
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

  editOfferSetValue() {
    try {
      if (this.offerGeneral) {
        if (this.UserRoleSeller == role.worker) {
          this.getParticipantFromWorkerSeller();
          this.getParticipantFromWorkerBuyer();
        } else {
          if (!this.type) {
            //подача
            this.submitParticipantFromTraderSeller();
          } else {
            //редактирование
            this.getParticipantFromTraderSeller();
            this.getParticipantFromTraderBuyer();
          }
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
      if(this.type) { //редактируем (обращаемся к методу получения доков из торгов)
        this.offerDocuments.forEach((file) => {
          this.commonService
            .GetOfferDocumentContent(
              this.user?.token,
              file.idDemandOffer,
              file.idDocument,
              this.direction,
              true
            )
            .subscribe((res) => {
              const updatedFile = { ...file, content: res.content };
              if (file.isPrivate) {
                this.hiddenFiles.push(updatedFile);
              } else {
                this.commonFiles.push(updatedFile);
              }
            });
        });
      } else { //создаем
        this.offerDocuments.forEach((file) => {
          this.createOfferService
            .getArchiveOfferDocumentContent(
              this.user?.token,
              this.direction,
              file.idDemandOffer,
              file.idDocument
            )
            .subscribe((res) => {
              const updatedFile = { ...file, content: res.content };
              if (file.isPrivate) {
                this.hiddenFiles.push(updatedFile);
              } else {
                this.commonFiles.push(updatedFile);
              }
            });
        });
      }

      /*  Грузоотправители/грузополучатели  */
      if (this.offerDeliveryScopes.length > 0) {
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

        this.offerDeliveryScopes.forEach((scope) => {
          let goods = [];
          scope[1].forEach((good) => {
            goods.push({
              goodId: good.idGood,
              goodName: good.goodName,
              volume: good.volume,
              goodUnits: good.unitName,
              properties: good.properties,
            });
          });

          this.delivScope.push({
            idBroker: scope[1][0].idFirmClient,
            nameBroker: scope[1][0].firmClientName,
            goods: goods,
          });
        });
      }

      /*------  УСЛОВИЯ ПОСТАВКИ  ------*/

      if (this.offerDeliveryConditions.length > 0) {
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
                vat = Number(this.filledFields.vat.name.replace(/[^0-9]/g, ''));
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
              (ch) => ch.linkId == offer[1][0].idBasisLink
            );
            let goods = [];
            for (let i = 0; i < offer[1].length; i++) {
              let good = this.goodsList.find(
                (good) => good.idOfferGood == offer[1][i].idDemandOfferGood
              );
              let vat;

              if (this.filledFields.vat.id != 1) {
                vat = Number(this.filledFields.vat.name.replace(/[^0-9]/g, ''));
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
        });
      }
    } catch (error) {
      this.error = true;
      this.errorState = 1;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].loadingApplicationData
          : EN['errors'].loadingApplicationData;
      this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
      this.errorFromEdit = true;
    }
  }

  public editOffer(): void {
    this.error = false;
    if (this.errorFromEdit) {
      this.isChangesSaved = true;
      if (!document.referrer) {
        this.router.navigateByUrl('/')
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
    }
  }

  async getGoodsByIdOffer() {
    //товары при редактировании
    let currency, cost, costWithoutVAT, costVAT;
    this.offerGoods.forEach((item) => {
      //переделываем this.offerGoods в структуру для goodsList
      currency = item.goodsSpecifications.find(
        (el) => el.idInterfaceField == 4
      ); //валюта
      let quoteCurrency = item.goodsSpecifications.find(
        (el) => el.idInterfaceField == 55
      ); //валюта котировки
      let quotation =
        item.goodsSpecifications.find((el) => el.idInterfaceField == 56)
          ?.fieldValueNumber || null; //котировка
      let amendment =
        item.goodsSpecifications.find((el) => el.idInterfaceField == 54)
          ?.fieldValueNumber || null; //поправка
      let priceAdjustment =
        item.goodsSpecifications.find((el) => el.idInterfaceField == 53) ||
        null; //Тип поправки
      let volume = item.goodsSpecifications.find(
        (el) => el.idInterfaceField == 1
      ); //количество
      let basicArchiveVolume = item.goodsSpecifications.find(
        (el) => el.idInterfaceField == 1
      ); //исходное кол-во из архивной заявки
      let VAT = item.goodsSpecifications.find((el) => el.idInterfaceField == 5); //ставка НДС
      let vat;
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
          (el) => el.idInterfaceField == 3
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
        (key) => Array.isArray(groupFields[key]) && groupFields[key].length > 1
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

      fields.push(...item.goodsSpecifications
        .filter((field) => !field.isVirtual)
        .map(buildField));
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
        basicArchiveVolume: basicArchiveVolume.fieldValueNumber,
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
        isBaseGood: !this.type
          ? item.isBaseGood
          : this.offerArchiveGoods.find((archGood) => archGood.idGood == idGood)
              .isBaseGood, //при редактировании заявки инфу о базовости берем из АРХИВНОЙ
        isMainBaseGood: !this.type
          ? false
          : this.offerArchiveGoods.find((archGood) => archGood.idGood == idGood)
              ?.goodsSpecifications[0].idDemandOfferGood ==
            this.offerGeneral.idOfferGoodMain
          ? true
          : false,
      });
    });
    this.goodsList.forEach((good) => {
      //поиск пересечений и return допустимых значений для выпадающего списка
      this.good = good;
      this.intersections();

      const costWithoutVATgood = this.totalForm.controls.costWithoutVat?.value
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
      const costVATgood = this.totalForm.controls.costVat?.value
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
                .replace(this.good.units.name, '')
                .replaceAll(/[^,\d]/g, '', '')
                .replace(/,/, '.')
            )
          : 0;

      let amountVATValue = this.commonService.round(
        (this.good.costWithoutVAT *
          Number(this.filledFields.vat.name.replace(/[^0-9]/g, ''))) /
          100,
        this.currencyPrecision
      );

      this.totalForm.controls.costWithoutVat.patchValue(
        (
          Number(costWithoutVATgood) + Number(this.good.costWithoutVAT)
        ).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          this.good.currency.name
      );
      this.totalForm.controls.amountVAT.patchValue(
        amountVATValue
          ? (Number(amountVAT) + Number(amountVATValue)).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.good.currency.name
          : Number('0').toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.good.currency.name
      );
      this.totalForm.controls.costVat.patchValue(
        (Number(costVATgood) + Number(this.good.costVAT)).toLocaleString('ru', {
          minimumFractionDigits: this.currencyPrecision,
          maximumFractionDigits: this.currencyPrecision,
        }) +
          ' ' +
          this.good.currency.name
      );

      this.totalForm.controls.quantity.patchValue(
        (Number(quantity) + Number(this.good.volume)).toLocaleString('ru', {
          maximumFractionDigits: this.volumePrecision,
        }) +
          ' ' +
          this.good.units.name
      );

      //Сопоставление полей из заявки и из модели. Удаление полей из заявки при отсутствии в модели
      this.good.fields.forEach((block) => {
        block[1].forEach((field, index) => {
          if (
            !field.costNoVAT &&
            !field.amountVAT &&
            !(field.amountVAT == 0) &&
            !field.costVAT
          ) {
            let blField = this.blockModal.fields.find(
              (blField) =>
                blField.interfaceField.fieldId == field.interfaceField.fieldId
            );
            if (blField) {
              //если не нашли поле в модели, то удаляем его из товара
              if (field.interfaceField.controlFieldType == 'dxSelectBox') {
                // this.getDataSourceSelectBox(blField)
                if (!(
                  [
                    ID_INTERFACE_FIELD.UNIT,
                    ID_INTERFACE_FIELD.OKRB007,
                    ID_INTERFACE_FIELD.CFEA,
                    ID_INTERFACE_FIELD.DESTINATION
                  ].includes(field.interfaceField.fieldId) ||
                  ((field.interfaceField.referenceId || field.interfaceField.referenceAlias) &&
                    field.interfaceField.isAvailableFreeInput)))
                  //ОКРБ 007-2012 и ед. измр.
                {
                  field.dataSource = blField.selectedValues
                    ? blField.selectedValues
                    : blField.interfaceField.allowedValues;
                } else if (field.interfaceField.fieldId === ID_INTERFACE_FIELD.DESTINATION) {   //в выпадающем списке только то, что выбрано было в архивной заявке
                  let dataSourceFromModel: DataSourceOption[] = blField.selectedValues
                    ? blField.selectedValues
                    : blField.interfaceField.allowedValues;
                  const selectedValuesArray: string[] = Array.isArray(field.selectedValues)
                    ? field.selectedValues
                    : [field.selectedValues.toString()];
                  field.dataSource = dataSourceFromModel.filter(el => selectedValuesArray.includes(el.id));
                }
                else {
                  if (field.interfaceField.fieldId === ID_INTERFACE_FIELD.UNIT) {
                    //пересечение с классифаером ед.изм.
                    this.commonService
                      .GetRefbookByName(
                        '',
                        'units',
                        undefined,
                        this.good.idGoodName
                      )
                      .then((res: any) => {
                        let dataSourceFromModel =
                          blField.selectedValues &&
                          blField.selectedValues?.length > 0
                            ? blField.selectedValues
                            : blField.interfaceField.allowedValues;
                        field.dataSource =
                          res.refbooks.length == 0
                            ? dataSourceFromModel
                            : dataSourceFromModel.filter((el) =>
                                res.refbooks.map((v) => v.id).includes(el.id)
                              );
                      });
                  } else {
                    this.commonService
                      .GetRefbookByName(
                        '',
                        blField.interfaceField.referenceAlias,
                        undefined,
                        this.good.idGoodName
                      )
                      .then((res: any) => {
                        field.dataSource = res.refbooks;
                      });
                  }
                }
                field.interfaceField.allowedValues =
                  blField.interfaceField.allowedValues;
              }
              field.interfaceField.fieldSize = blField.interfaceField.fieldSize;
              field.interfaceField.isAvailableFreeInput = blField.interfaceField.isAvailableFreeInput;
              field.interfaceField.fieldDataType =
                blField.interfaceField.fieldDataType;
              field.isRequired = blField.isRequired;
              field.interfaceField.referenceAlias =
                blField.interfaceField.referenceAlias;
              field.interfaceField.referenceId = blField.interfaceField.referenceId;
              field.interfaceField.isAvailableMultiSelection =
                blField.interfaceField.isAvailableMultiSelection;
              field.selectedValues =
                blField.interfaceField.isAvailableMultiSelection &&
                typeof field.selectedValues == 'number'
                  ? [field.selectedValues]
                  : field.selectedValues;
            }
          }
        });
      });

      //Добавление полей в товар, которые отсутствуют в заявке
      this.blockModal.fields.forEach((blField) => {
        this.good.fields.forEach((block) => {
          if (block[0] == blField.interfaceField.blockId) {
            let fieldOffer = block[1].find(
              (el) =>
                el.interfaceField.fieldId == blField.interfaceField.fieldId
            );
            if (!fieldOffer) {
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
                    .GetRefbookByName(
                      '',
                      'units',
                      undefined,
                      this.good.idGoodName
                    )
                    .then((res: any) => {
                      let dataSourceFromModel =
                        blField.selectedValues &&
                        blField.selectedValues?.length > 0
                          ? blField.selectedValues
                          : blField.interfaceField.allowedValues;
                      dataSource =
                        res.refbooks.length == 0
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
                  isAvailableFreeInput:
                  blField.interfaceField.isAvailableFreeInput,
                  fieldDataType: blField.interfaceField.fieldDataType,
                  isAvailableMultiSelection:
                    blField.interfaceField.isAvailableMultiSelection,
                  referenceAlias: blField.interfaceField.referenceAlias,
                  referenceId: blField.interfaceField.referenceId,
                },
                selectedValues: null,
                isRequired: blField.isRequired,
                sortBy: block[0].length,
              });
            }
          }
        });
      });

      /*    this.blockModal.fields.forEach(blField => {
      this.good.fields.forEach(block => {
        block[1].forEach(field => {
          if (!field.costNoVAT && !field.amountVAT && !(field.amountVAT == 0) && !field.costVAT) {
            if (blField.interfaceField.fieldId == field.interfaceField.fieldId) {
              if (field.interfaceField.controlFieldType == "dxSelectBox") {
                // this.getDataSourceSelectBox(blField)
                if (![2, 12, 63].includes(field.interfaceField.fieldId))                              //ОКРБ 007-2012 и ед. измр.
                  field.dataSource = blField.selectedValues ? blField.selectedValues : blField.interfaceField.allowedValues;
                else {
                  if(field.interfaceField.fieldId == 2){
                    //пересечение с классифаером ед.изм.
                    this.commonService.GetRefbookByName('', 'units', undefined, this.good.idGoodName).then((res: any) => {
                      let dataSourceFromModel = blField.selectedValues && blField.selectedValues?.length > 0 ? blField.selectedValues : blField.interfaceField.allowedValues
                      field.dataSource = res.refbooks.length == 0 ? dataSourceFromModel : dataSourceFromModel.filter(el => res.refbooks.map(v => v.id).includes(el.id));
                    })
                  }
                  else{
                    this.commonService.GetRefbookByName('', blField.interfaceField.referenceAlias, undefined, this.good.idGoodName).then((res: any) => {
                      field.dataSource = res.refbooks;
                    })
                  }
                }
                field.interfaceField.allowedValues = blField.interfaceField.allowedValues
              }
              field.interfaceField.fieldSize = blField.interfaceField.fieldSize
              field.interfaceField.fieldDataType = blField.interfaceField.fieldDataType
              field.isRequired = blField.isRequired
              field.interfaceField.referenceAlias = blField.interfaceField.referenceAlias
              field.interfaceField.isAvailableMultiSelection = blField.interfaceField.isAvailableMultiSelection
              field.selectedValues = blField.interfaceField.isAvailableMultiSelection &&  typeof field.selectedValues == 'number' ? [field.selectedValues] : field.selectedValues
            }
          }
        })
      })
    })*/

      /*      this.good.fields.forEach(block => {
            block[1].forEach(field => {
              if (!field.costNoVAT && !field.amountVAT && !(field.amountVAT == 0) && !field.costVAT) {
                let blField = this.blockModal.fields.find(blField => blField.interfaceField.fieldId == field.interfaceField.fieldId)
                if (field.interfaceField.controlFieldType == "dxSelectBox") {
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
            })
          })*/
    });
    this.totalForm.controls.vat.patchValue(
      this.filledFields.vat.name.replace('%', '')
    );
  }

  /* -----------------шаг 1---------------------- */

  //Продавец
  initContractTypeSeller() {
    if (
      this.disabledAssignmentsSeller == true &&
      this.disabledCommissionSeller == false
    ) {
      this.generalInfoStep.controls.contractTypeSeller.patchValue(ID_DOCUMENT.COMMISSION_AGREEMENT);
    } else {
      this.generalInfoStep.controls.contractTypeSeller.patchValue(ID_DOCUMENT.AGENCY_AGREEMENT);
    }

    const commission: IContractType = this.commonService.getContractOption(
      ID_DOCUMENT.COMMISSION_AGREEMENT,
      this.translate.store.currentLang,
      'general.commissionAgreement',
      this.disabledCommissionSeller
    );
    const agency: IContractType = this.commonService.getContractOption(
      ID_DOCUMENT.AGENCY_AGREEMENT,
      this.translate.store.currentLang,
      'general.agencyAgreement',
      this.disabledAssignmentsSeller
    );

    this.contractTypeSeller = [commission, agency];
  }

  GetRoleSeller() {
    this.createOfferService.GetRole(this.user?.token).subscribe((res: any) => {
      this.UserRoleSeller = res.role;
      let openRole =
        this.UserRoleSeller == role.broker ||
        this.UserRoleSeller == role.brokerVisitor
          ? role.broker
          : this.UserRoleSeller == role.visitor
          ? role.visitor
          : null;

      this.generalInfoStep.get('participantSeller')?.patchValue(openRole);
      if (openRole == role.visitor) {
        this.GetBranchesListFirmSeller();
        this.getContractorsVisitors();
      }
      if (openRole == role.broker) {
        this.GetBranchesFirmsOfAllClients();
      }
    });
  }

  getParticipantFromWorkerSeller() {
    //редактирование работником
    let openRole = this.offerGeneral?.sellerInfo.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participantSeller')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractTypeSeller.patchValue(
        this.offerGeneral.sellerInfo.idClientContractType
      );
      this.disabledContractTypeSeller = true;
      let brockerString;
      if (this.offerGeneral.sellerInfo.idClientContractType === ID_DOCUMENT.COMMISSION_AGREEMENT) {
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
          array.push(item.idFirmClient);
        });

        this.generalInfoStep.controls.brokerClientSeller.patchValue(array);
        brockerString =
          this.translate.store.currentLang == 'RU'
            ? uniqueOfferDeliveryScopes.length + ' ' + RU['filters'].selected
            : uniqueOfferDeliveryScopes.length + ' ' + EN['filters'].selected;
        uniqueOfferDeliveryScopes.every((el) =>
          this.brokerClientChooseSeller.push(el.firmClientName)
        );
      } else {
        brockerString = this.offerGeneral.sellerInfo.clientName;
        this.generalInfoStep.controls.listClientBranchWorkerSeller.patchValue(
          this.offerGeneral.sellerInfo.branchName
        );
        if (
          this.listClientBranchSeller?.length > 0 &&
          !this.offerGeneral.sellerInfo.branchId
        ) {
          //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
          this.generalInfoStep.controls.listClientBranchSeller.patchValue(
            this.listClientBranchSeller[0].idFirmBranch
          );
          this.listBranchChooseSeller =
            this.listClientBranchSeller[0].nameShort;
        } else {
          this.generalInfoStep.controls.listClientBranchSeller.patchValue(
            this.offerGeneral.sellerInfo.branchId
          );
          this.listBranchChooseSeller = this.offerGeneral.sellerInfo.branchName;
        }
        this.brokerClientChooseSeller.push(
          this.offerGeneral?.sellerInfo.clientName
        );
        this.generalInfoStep.controls.brokerClientSeller.patchValue(
          this.offerGeneral.sellerInfo.clientId
        );
      }
      this.generalInfoStep.controls.brokerClientWorkerSeller.patchValue(
        brockerString
      );
      this.contractTypeChooseSeller = this.contractTypeSeller.find(
        (el) =>
          el.refBookKey ==
          this.generalInfoStep.controls.contractTypeSeller.value
      ).refBookValue;
    } else {
      if (this.offerGeneral.sellerInfo.branchId) {
        this.generalInfoStep.controls.listBranchWorkerSeller.patchValue(
          this.offerGeneral.sellerInfo.branchName
        );
        this.generalInfoStep.controls.listBranchSeller.patchValue(
          this.offerGeneral.sellerInfo.branchId
        );
        this.listBranchChooseSeller = this.offerGeneral.sellerInfo.branchName;
      }
    }
  }

  getParticipantFromTraderSeller() {
    //редактирование трейдером
    let openRole = this.offerGeneral.sellerInfo.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participantSeller')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractTypeSeller.patchValue(
        this.offerGeneral.sellerInfo.idClientContractType
      );
      if (this.offerGeneral.sellerInfo.idClientContractType == 20) {
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
          array.push(item.idFirmClient);
        });
        this.generalInfoStep.controls.brokerClientSeller.patchValue(array);
        this.brokerClientChooseSeller = [];
        uniqueOfferDeliveryScopes.every((el) =>
          this.brokerClientChooseSeller.push(el.firmClientName)
        );
      } else {
        this.generalInfoStep.controls.brokerClientSeller.patchValue(
          this.offerGeneral.sellerInfo.clientId
        );
        if (
          this.listClientBranchSeller?.length > 0 &&
          !this.offerGeneral.sellerInfo.branchId
        ) {
          //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
          this.generalInfoStep.controls.listClientBranchSeller.patchValue(
            this.listClientBranchSeller[0].idFirmBranch
          );
          this.listBranchChooseSeller =
            this.listClientBranchSeller[0].nameShort;
        } else {
          this.generalInfoStep.controls.listClientBranchSeller.patchValue(
            this.offerGeneral.sellerInfo.branchId
          );
          this.listBranchChooseSeller = this.offerGeneral.sellerInfo.branchName;
        }
      }
      this.contractTypeChooseSeller = this.contractTypeSeller.find(
        (el) =>
          el.refBookKey ==
          this.generalInfoStep.controls.contractTypeSeller.value
      ).refBookValue;
    } else {
      this.GetBranchesListFirmSeller();
      if (this.offerGeneral.sellerInfo.branchId) {
        this.generalInfoStep.controls.listBranchSeller.patchValue(
          this.offerGeneral.sellerInfo.branchId
        );
        this.listBranchChooseSeller = this.offerGeneral.sellerInfo.branchName;
      }
    }
  }

  submitParticipantFromTraderSeller() {
    //подача трейдером
    let openRole = this.offerGeneral.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participantSeller')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractTypeSeller.patchValue(
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
          array.push(item.idFirmClient);
        });
        this.generalInfoStep.controls.brokerClientSeller.patchValue(array);
        this.brokerClientChooseSeller = [];
        uniqueOfferDeliveryScopes.every((el) =>
          this.brokerClientChooseSeller.push(el.firmClientName)
        );
      } else {
        this.generalInfoStep.controls.brokerClientSeller.patchValue(
          this.offerGeneral.clientId
        );
        this.generalInfoStep.controls.listClientBranchSeller.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChooseSeller = this.offerGeneral.branchName;
      }
      this.contractTypeChooseSeller = this.contractTypeSeller.find(
        (el) =>
          el.refBookKey ==
          this.generalInfoStep.controls.contractTypeSeller.value
      ).refBookValue;
    } else {
      this.GetBranchesListFirmSeller();
      this.getContractorsVisitors();
      if (this.offerGeneral.branchId) {
        this.generalInfoStep.controls.listBranchSeller.patchValue(
          this.offerGeneral.branchId
        );
        this.listBranchChooseSeller = this.offerGeneral.branchName;
      }
    }
  }

  //посетитель - структурные
  async GetBranchesListFirmSeller() {
    // this.CheckDemoffOwnerStateSeller()
    const body = {
      isOnlyActive: true,
    };
    await this.commonService
      .GetBranchesListFirm(this.user?.token, body)
      .then((res: any) => {
        this.listBranchSeller = res.branchesFirms;
      });
  }

  GetBranchesFirmsOfAllClients() {
    let body = {
      isOnlyActiveBranchesClient: true,
    };
    this.commonService
      .GetBranchesFirmsOfAllClients(this.user?.token, body)
      .then((res: any) => {
        this.branchesFirmsOfAllClients = res.branchesFirmsOfAllClients;
        if (
          this.branchesFirmsOfAllClients.filter((el) => Number(el.contractType) === ID_DOCUMENT.COMMISSION_AGREEMENT)
            ?.length != 0
        ) {
          this.disabledCommissionSeller = false;
        }
        if (
          this.branchesFirmsOfAllClients.filter((el) => Number(el.contractType) === ID_DOCUMENT.AGENCY_AGREEMENT)
            ?.length != 0
        ) {
          this.disabledAssignmentsSeller = false;
        }
        this.getBrokerClientSeller();
      });
  }

  getBrokerClientSeller() {
    this.brokerClientSeller = this.branchesFirmsOfAllClients.filter(
      (el) =>
        Number(el.contractType) === Number(this.generalInfoStep.controls.contractTypeSeller.value)
    );
  }

  GetListBranchesClientsSeller() {
    this.listClientBranchSeller = this.brokerClientSeller.find(
      (el) =>
        el.firmClient == this.generalInfoStep.controls.brokerClientSeller.value
    )?.branchesClients;
    if (
      this.idOffer &&
      this.listClientBranchSeller?.length > 0 &&
      !this.offerGeneral.branchId
    ) {
      //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
      this.generalInfoStep.controls.listClientBranchSeller.patchValue(
        this.listClientBranchSeller[0].idFirmBranch
      );
      this.listBranchChooseSeller = this.listClientBranchSeller[0].nameShort;
    }
  }

  //контекстная проверка
  /* CheckDemoffOwnerStateSeller() {
  const body = {
    idSection: this.sectionId,
    idSession: this.sessionId,
    idModel: this.modelId,
    contractType: this.generalInfoStep.get('participantSeller').value == role.visitor ? null : this.generalInfoStep.get('contractTypeSeller')?.value || null,
    idFirmClient: this.generalInfoStep.get('participantSeller').value == role.broker && this.generalInfoStep.get('contractTypeSeller')?.value == 21 ? this.generalInfoStep.get('brokerClientSeller')?.value : null,
    idBranch: (this.generalInfoStep.get('participantSeller').value != role.visitor ? this.generalInfoStep.get('listClientBranchSeller')?.value : this.generalInfoStep.get('listBranchSeller')?.value) || null
  }
  // this.generalInfoStep.get('participantSeller').value == role.broker && this.generalInfoStep.get('contractTypeSeller')?.value == 20 ? this.user?.userInfo?.firmId
  this.createOfferService.CheckStateSeller(this.user?.token, body).then((res: any) => {
    this.errorBrokerClientMessageSeller = '';
    if (res.isStateExceptional != null) {
      this.errorState = res.isStateExceptional
      this.error = true;
      this.messageError = res.stateMessage;
      this.messageError = this.messageError.replace(/\n\r?/g, '<br />')
      if (this.errorState == 1) {
        this.errorBrokerClientMessageSeller = this.messageError;
      }
    }
  })
} */

  changeContractTypeSeller(e: any) {
    if (e.value) {
      this.delivScope = [];
      this.generalInfoStep.get('contractTypeSeller')?.patchValue(e.value);
      if (this.generalInfoStep.get('contractTypeSeller').value != null)
        this.contractTypeChooseSeller = this.contractTypeSeller.find(
          (el) =>
            el.refBookKey ==
            this.generalInfoStep.controls.contractTypeSeller.value
        ).refBookValue;
      if (e.value == 20) {
        //   this.CheckDemoffOwnerStateSeller()
        this.getContractorsVisitors();
      }
      //  this.GetListClientsContractSeller();
      this.getBrokerClientSeller();
      this.generalInfoStep.controls.brokerClientSeller.patchValue(null);
    }
  }

  onChooseBrokerSeller() {
    this.brokerClientChooseSeller = [];
    this.listBranchChooseSeller = null;
    if (
      this.generalInfoStep.controls.contractTypeSeller.value == 21 &&
      this.generalInfoStep.controls.brokerClientSeller?.value
    ) {
      this.brokerClientChooseSeller.push(
        this.brokerClientSeller.find(
          (el) =>
            el.idClient ==
            this.generalInfoStep.controls.brokerClientSeller?.value
        )?.regNumShortName
      );
    } else if (this.generalInfoStep.controls.brokerClientSeller?.value) {
      this.generalInfoStep.controls.brokerClientSeller.value.forEach(
        (broker) => {
          this.brokerClientChooseSeller.push(
            this.brokerClientSeller.find((el) => el.idClient == broker)
              ?.regNumShortName
          );
        }
      );
    }

    if (this.brokerClientChooseSeller?.length == 1) {
      this.delivScope = [];
    }
  }

  onChooseClientSeller() {
    this.listBranchChooseSeller = null;
    if (
      this.generalInfoStep.controls.participantSeller.value == role.broker &&
      this.listClientBranchSeller.length > 0
    ) {
      this.listBranchChooseSeller = this.listClientBranchSeller?.find(
        (el) =>
          el.idFirmBranch ==
          this.generalInfoStep.controls.listClientBranchSeller?.value
      )?.nameShort;
    } else if (
      this.listBranchSeller?.length > 0 &&
      this.generalInfoStep.controls.listBranchSeller.value
    ) {
      this.listBranchChooseSeller = this.listBranchSeller?.find(
        (el) =>
          el.idFirmBranch ==
          this.generalInfoStep.controls.listBranchSeller.value
      ).nameShort;
    }
  }

  //Покупатель
  visitorsList = [];
  isVisitor: boolean;
  getContractorsVisitors() {
    //если это работник (а это может быть только редактирование) - передавать идентификатор владельца заявки - иначе оставлять поле пустым, бэк сам подставит данные
    this.createOfferService
      .GetContractorsVisitors(
        this.user?.token,
        this.generalInfoStep.get('participantSeller').value == role.broker &&
          this.generalInfoStep.get('contractTypeSeller').value == '21'
          ? this.generalInfoStep.controls.brokerClientSeller?.value
          : this.user?.IsWorker
          ? this.offerGeneral.sellerInfo.firmId
          : ''
      )
      .then((res: any) => {
        let visitors = res.visitors.reduce(function (r, a) {
          //сгруппированы поля по blockId
          r[a.buyerInfo.idFirm] = r[a.buyerInfo.idFirm] || [];
          r[a.buyerInfo.idFirm].push(a);
          return r;
        }, {});
        visitors = Object.entries(visitors);
        this.visitorsList = [];
        visitors.forEach((visitor) => {
          let branchArray = [];
          visitor[1].forEach((v) => {
            if (!v.branchInfo.idFirmBranch) {
              v.branchInfo.branchNameShort = '-';
            }
            branchArray.push(v.branchInfo);
          });
          this.visitorsList.push({
            buyerInfo: visitor[1][0].buyerInfo,
            isVisitorRoleApplicable: visitor[1][0].isVisitorRoleApplicable,
            branch: branchArray,
          });
        });
      });
  }

  initContractTypeBuyer() {
    const agency: IContractType = this.commonService.getContractOption(
      ID_DOCUMENT.AGENCY_AGREEMENT,
      this.translate.store.currentLang,
      'general.agencyAgreement',
      this.disabledAssignmentsBuyer
    );

    this.contractTypeBuyer = [agency];
    this.generalInfoStep.controls.contractTypeBuyer.patchValue(ID_DOCUMENT.AGENCY_AGREEMENT);
  }

  async GetRoleBuyer(e) {
    this.generalInfoStep.get('participantBuyer')?.patchValue(null);
    this.generalInfoStep.get('brokerClientBuyer')?.patchValue(null);
    this.generalInfoStep.get('listBranchBuyer')?.patchValue(null);
    if (e.value) {
      this.isVisitor = this.visitorsList.find(
        (el) =>
          el.buyerInfo.idFirm ==
          this.generalInfoStep.controls.participantBuyerInfo?.value
      )?.isVisitorRoleApplicable;
      this.initContractTypeBuyer();
      this.GetContractorsClients();
      this.UserRoleBuyer = this.user?.IsWorker ? role.worker : null;
    }
  }

  getParticipantFromWorkerBuyer() {
    //редактирование работником
    this.getContractorsVisitors();
    let openRole = this.offerGeneral?.buyerInfo.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participantBuyer')?.patchValue(openRole);
    this.generalInfoStep
      .get('participantBuyerInfo')
      ?.patchValue(this.offerGeneral.buyerInfo.idFirm);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractTypeBuyer.patchValue(
        this.offerGeneral.buyerInfo.idClientContractType
      );
      this.disabledContractTypeBuyer = true;
      this.generalInfoStep.controls.listClientBranchWorkerBuyer.patchValue(
        this.offerGeneral.buyerInfo.branchName
      );
      this.brokerClientChooseBuyer.push(
        this.offerGeneral?.buyerInfo.concatedClientName
      );
      if (
        this.listClientBranchBuyer?.length > 0 &&
        !this.offerGeneral.buyerInfo.branchId
      ) {
        //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
        this.generalInfoStep.controls.listClientBranchBuyer.patchValue(
          this.listClientBranchBuyer[0].idFirmBranch
        );
        this.listBranchChooseBuyer = this.listClientBranchBuyer[0].nameShort;
      } else {
        this.generalInfoStep.controls.listClientBranchBuyer.patchValue(
          this.offerGeneral.buyerInfo.branchId
        );
        this.listBranchChooseBuyer = this.offerGeneral.buyerInfo.branchName;
      }

      this.generalInfoStep.controls.brokerClientWorkerBuyer.patchValue(
        this.offerGeneral.buyerInfo.concatedClientName
      );
      this.generalInfoStep.controls.brokerClientBuyer.patchValue(
        this.offerGeneral.buyerInfo.clientId
      );
      this.contractTypeChooseBuyer = this.contractTypeBuyer.find(
        (el) =>
          el.refBookKey == this.generalInfoStep.controls.contractTypeBuyer.value
      ).refBookValue;
    } else {
      if (this.offerGeneral.buyerInfo.branchId) {
        this.generalInfoStep.controls.listBranchWorkerBuyer.patchValue(
          this.offerGeneral.buyerInfo.branchName
        );
        this.generalInfoStep.controls.listBranchBuyer.patchValue(
          this.offerGeneral.buyerInfo.branchId
        );
        this.listBranchChooseBuyer = this.offerGeneral.buyerInfo.branchName;
      }
    }
  }

  getParticipantFromTraderBuyer() {
    //редактирование трейдером
    this.getContractorsVisitors();
    this.generalInfoStep
      .get('participantBuyerInfo')
      ?.patchValue(this.offerGeneral.buyerInfo.idFirm);
    let openRole = this.offerGeneral.buyerInfo.idClientContractType
      ? role.broker
      : role.visitor;
    this.generalInfoStep.get('participantBuyer')?.patchValue(openRole);
    if (openRole == role.broker) {
      this.generalInfoStep.controls.contractTypeBuyer.patchValue(
        this.offerGeneral.buyerInfo.idClientContractType
      );
      this.generalInfoStep.controls.brokerClientBuyer.patchValue(
        this.offerGeneral.buyerInfo.clientId
      );
      /*if(this.listClientBranchBuyer?.length > 0 && !this.offerGeneral.buyerInfo.branchId) {         //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
      this.generalInfoStep.controls.listClientBranchBuyer.patchValue(this.listClientBranchBuyer[0].idFirmBranch)
      this.listBranchChooseBuyer = this.listClientBranchBuyer[0].nameShort
    }
    else{*/
      this.generalInfoStep.controls.listClientBranchBuyer.patchValue(
        this.offerGeneral.buyerInfo.branchId
      );
      this.listBranchChooseBuyer = this.offerGeneral.buyerInfo.branchName;

      this.contractTypeChooseBuyer = this.contractTypeBuyer.find(
        (el) =>
          el.refBookKey == this.generalInfoStep.controls.contractTypeBuyer.value
      ).refBookValue;
      this.getBranchContractorsClient();
      this.CheckDemoffOwnerStateBuyer();
    } else {
      this.GetBranchesListFirmBuyer();
      if (this.offerGeneral.buyerInfo.branchId) {
        this.generalInfoStep.controls.listBranchBuyer.patchValue(
          this.offerGeneral.buyerInfo.branchId
        );
        this.listBranchChooseBuyer = this.offerGeneral.buyerInfo.branchName;
      }
    }
  }

  //клиенты брокера
  GetContractorsClients() {
    // if(this.generalInfoStep.get('participantSeller').value == role.broker && this.generalInfoStep.get('contractTypeSeller').value == '21') {
    this.createOfferService
      .GetContractorsClients(
        this.user?.token,
        this.generalInfoStep.get('participantSeller').value == role.broker &&
          this.generalInfoStep.get('contractTypeSeller').value == '21'
          ? this.generalInfoStep.controls.brokerClientSeller?.value
          : '',
        this.generalInfoStep.controls.participantBuyerInfo?.value
      )
      .then((res: any) => {
        this.brokerClientBuyer = [];
        let clients = res.clients.reduce(function (r, a) {
          //сгруппированы поля по blockId
          r[a.buyerInfo.idFirm] = r[a.buyerInfo.idFirm] || [];
          r[a.buyerInfo.idFirm].push(a);
          return r;
        }, {});
        clients = Object.entries(clients);
        clients.forEach((client) => {
          let branchArray = [];
          client[1].forEach((v) => {
            if (!v.branchInfo.idFirmBranch) {
              v.branchInfo.branchNameShort = '-';
            }
            branchArray.push(v.branchInfo);
          });
          this.brokerClientBuyer.push({
            buyerInfo: client[1][0].buyerInfo,
            branch: branchArray,
          });
        });
        let openRole =
          this.brokerClientBuyer?.length > 0
            ? role.broker
            : this.isVisitor
            ? role.visitor
            : null;
        this.generalInfoStep.get('participantBuyer')?.patchValue(openRole);
        if (openRole == role.visitor) this.GetBranchesListFirmBuyer();
      });
    // }
  }

  getBranchContractorsClient() {
    this.generalInfoStep.controls.listClientBranchBuyer.patchValue(null);
    this.listClientBranchBuyer = [];
    this.listClientBranchBuyer = this.brokerClientBuyer.find(
      (el) =>
        el.buyerInfo.idFirm ==
        this.generalInfoStep.controls.brokerClientBuyer?.value
    )?.branch;
    if (
      this.listClientBranchBuyer?.length == 1 &&
      this.listClientBranchBuyer[0].idFirmBranch == null
    ) {
      this.listClientBranchBuyer = [];
    }
    if (
      this.idOffer &&
      this.listClientBranchBuyer?.length > 0 &&
      !this.offerGeneral.branchId
    ) {
      //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
      this.generalInfoStep.controls.listClientBranchBuyer.patchValue(
        this.listClientBranchBuyer[0].idFirmBranch
      );
      this.listBranchChooseBuyer = this.listClientBranchBuyer[0].nameShort;
    }
    if (this.listClientBranchBuyer?.length == 1) {
      this.generalInfoStep.controls.listClientBranchBuyer.patchValue(
        this.listClientBranchBuyer[0].idFirmBranch
      );
    }
  }

  checkBuyer(openRole) {
    this.delivScope = [];
    this.generalInfoStep.get('brokerClientBuyer').patchValue(null);
    this.generalInfoStep.get('listClientBranchBuyer').patchValue(null);
    this.generalInfoStep.get('listBranchBuyer').patchValue(null);
    this.generalInfoStep.get('participantBuyer').patchValue(openRole);
    if (openRole == role.visitor) {
      this.GetBranchesListFirmBuyer();
      this.generalInfoStep.controls.brokerClientBuyer.setValue(null);
      this.generalInfoStep.controls.listClientBranchBuyer.setValue(null);
      this.generalInfoStep.controls.contractTypeBuyer.setValue(null);
    } else {
      this.generalInfoStep.controls.contractTypeBuyer.patchValue(21);
      if (
        this.generalInfoStep.get('participantSeller').value == role.broker &&
        this.generalInfoStep.get('contractTypeSeller').value == '21'
      ) {
        this.GetContractorsClients();
      }
    }
  }

  //посетитель - структурные
  GetBranchesListFirmBuyer() {
    this.CheckDemoffOwnerStateBuyer();
    this.listBranchBuyer = [];
    this.listBranchBuyer = this.visitorsList.find(
      (el) =>
        el.buyerInfo.idFirm ==
        this.generalInfoStep.controls.participantBuyerInfo?.value
    )?.branch;
    if (
      this.listBranchBuyer?.length == 1 &&
      this.listBranchBuyer[0].idFirmBranch == null
    ) {
      this.listBranchBuyer = [];
    }
    //   this.listBranchBuyer = this.listBranchBuyer?.idFirmBranch ? [this.listBranchBuyer]
  }

  errorBrokerClientMessageSeller: string;
  errorBrokerClientMessageBuyer: string;

  //контекстная проверка
  CheckDemoffOwnerStateBuyer() {
    const body = {
      idSection: this.sectionId,
      idSession: this.sessionId,
      idModel: this.modelId,
      contractTypeSeller:
        this.generalInfoStep.get('participantSeller').value == role.visitor
          ? null
          : this.generalInfoStep.get('contractTypeSeller')?.value,
      listClientsSeller:
        this.generalInfoStep.get('participantSeller').value == role.visitor
          ? null
          : this.generalInfoStep.get('contractTypeSeller')?.value == 21
          ? [this.generalInfoStep.get('brokerClientSeller')?.value]
          : this.generalInfoStep.get('brokerClientSeller')?.value,
      idFirmBrokerBuyer:
        this.generalInfoStep.controls.participantBuyerInfo.value,
      idFirmClientBuyer:
        this.generalInfoStep.controls.participantBuyer?.value == role.broker
          ? this.generalInfoStep.controls.brokerClientBuyer?.value
          : null,
      idBranchBuyer:
        this.generalInfoStep.controls.participantBuyer?.value == role.visitor &&
        this.generalInfoStep.get('listBranchBuyer')?.value != 0
          ? this.generalInfoStep.get('listBranchBuyer')?.value
          : this.generalInfoStep.get('listClientBranchBuyer')?.value &&
            this.generalInfoStep.get('listClientBranchBuyer')?.value != 0
          ? this.generalInfoStep.get('listClientBranchBuyer')?.value
          : null,
    };
    // this.generalInfoStep.get('participantSeller').value == role.broker && this.generalInfoStep.get('contractTypeSeller')?.value == 20 ? this.user?.userInfo?.firmId
    this.createOfferService
      .CheckStateBuyer(this.user?.token, body)
      .then((res: any) => {
        this.errorBrokerClientMessageBuyer = '';
        if (res.isStateExceptional != null) {
          this.errorState = res.isStateExceptional;
          this.error = true;
          this.messageError = res.stateMessage;
          this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
          if (this.errorState == 1) {
            this.errorBrokerClientMessageBuyer = this.messageError;
          }
        }
        this.idMarketType = res.idMarketType;
      });
  }

  changeContractTypeBuyer(e: any) {
    if (e.value) {
      this.delivScope = [];
      this.generalInfoStep.get('contractTypeBuyer')?.patchValue(e.value);
      if (this.generalInfoStep.get('contractTypeBuyer').value != null)
        this.contractTypeChooseBuyer = this.contractTypeBuyer.find(
          (el) =>
            el.refBookKey ==
            this.generalInfoStep.controls.contractTypeSeller.value
        ).refBookValue;
      if (e.value == 20) {
        this.CheckDemoffOwnerStateBuyer();
      }
      if (
        this.generalInfoStep.get('participantSeller').value == role.broker &&
        this.generalInfoStep.get('contractTypeSeller').value == '21'
      ) {
        this.GetContractorsClients();
      }
      this.generalInfoStep.controls.brokerClientBuyer.patchValue(null);
    }
  }

  onChooseBrokerBuyer() {
    this.brokerClientChooseBuyer = [];
    this.listBranchChooseBuyer = null;
    if (
      this.generalInfoStep.controls.contractTypeBuyer.value == 21 &&
      this.generalInfoStep.controls.brokerClientBuyer?.value
    ) {
      this.brokerClientChooseBuyer.push(
        this.brokerClientBuyer.find(
          (el) =>
            el.idClient ==
            this.generalInfoStep.controls.brokerClientBuyer?.value
        )?.regNumShortName
      );
    } else if (this.generalInfoStep.controls.brokerClientBuyer?.value) {
      this.generalInfoStep.controls.brokerClientBuyer.value.forEach(
        (broker) => {
          this.brokerClientChooseBuyer.push(
            this.brokerClientBuyer.find((el) => el.idClient == broker)
              ?.regNumShortName
          );
        }
      );
    }

    if (this.brokerClientChooseBuyer?.length == 1) {
      this.delivScope = [];
    }
  }

  isDisabledBuyer() {
    return !this.generalInfoSellerValidationGroup?.instance?.validate().isValid;
  }

  onChooseClientBuyer() {
    this.listBranchChooseBuyer = null;
    if (
      this.generalInfoStep.controls.participantBuyer.value == role.broker &&
      this.listClientBranchBuyer.length > 0
    ) {
      this.listBranchChooseBuyer = this.listClientBranchBuyer?.find(
        (el) =>
          el.idFirmBranch ==
          this.generalInfoStep.controls.listClientBranchBuyer?.value
      )?.nameShort;
    } else if (
      this.listBranchBuyer?.length > 0 &&
      this.generalInfoStep.controls.listBranchBuyer.value
    ) {
      this.listBranchChooseBuyer = this.listBranchBuyer?.find(
        (el) =>
          el.idFirmBranch == this.generalInfoStep.controls.listBranchBuyer.value
      ).nameShort;
    }
  }
  /* -------------------------шаг 2---------------------------- */

  intersections() {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    blockFind = this.findBlock();

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
      this.intersectionsBlocks(blockFind);
    } //если не нашли товар в блоке модели
    else this.error = true;

    if (this.error) {
      this.errorState = 1;
      this.deliveryConditions = deliveryConditionsPrev;
      this.deliverySchedule = deliverySchedulePrev;
      this.deliveryTerm = deliveryTermPrev;
      this.termsConditionsPayment = termsConditionsPaymentPrev;
      this.currencyConditions = currencyConditionsPrev;
      this.vatConditions = vatConditionsPrev;
      this.financeSourcesConditions = financeSourcesConditionsPrev;
      this.currencyQuotesConditions = currencyQuotesConditionsPrev;

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

  findBlock() {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    this.demandsModal.blocks.forEach((block) => {
      block.products
        .filter((prod) => prod.level == 3)
        .forEach((item) => {
          if (item.valueId == this.good.idGoodName) {
            blockFind = block;
            return;
          }
        });

      block.products
        .filter((prod) => prod.level == 2)
        .forEach((item) => {
          if (item.valueId == this.good.idGoodGroup) {
            blockFind = block;
            return;
          }
        });
      block.products
        .filter((prod) => prod.level == 1)
        .forEach((item) => {
          if (item.valueId == this.good.idNomenclatureGroup) {
            blockFind = block;
            return;
          }
        });
    });
    return blockFind;
  }

  isMinPriceOnBasicBasis = null;
  isNotSpecified = null;
  nameField = [];

  intersectionsBlocks(blockFind) {
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
              /*       if(!this.error && this.schedule.length > 0) {                        //если уже заполнен график поставки и вернулись добавить товар
                     if(!this.deliverySchedule.find(el => el.id == this.deliveryTermSchedule)){
                       // let string = (this.translate.store.currentLang == 'RU' ? (RU["createOffer"].paymentDeliveryTerms.currency + ` на: ${listValues}`): (EN["createOffer"].goodInfo.currency + ` to:  ${listValues}`))
                       let string = 'график поставки'
                       this.nameField.push(string)
                     }
                   }*/
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
            /*          if(!this.error && this.termsPaymentForm?.controls?.termsPayment?.value && this.paymentTermConcated.length >0) {                        //если уже заполнены условия и вернулись добавить товар
             let findTerm = this.termsConditionsPayment.filter(el => el.paymentConditionId == this.termsPaymentForm.controls.termsPayment.value
               && el.paymentVolumeId == this.termsPaymentForm.controls.volume.value && el.prepayMomentId == this.termsPaymentForm.controls.momentPrepayment.value
               && el.delayMomentId == this.termsPaymentForm.controls.momentDelay.value)
             if(findTerm.length == 0){
               let string = 'условия оплаты'
               this.nameField.push(string)
             }
           }*/
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
            if (!this.error && this.goodsList.length > 0 && currency) {
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
              this.vatConditions?.length > 0
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
              this.financeSourcesConditions?.length > 0
            ) {
              //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (
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
              this.currencyQuotesConditions.length > 0
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
            ); //валюта котировки
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
    if (this.nameField.length > 0) {
      this.error = true;
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
    /*    if(!this.error && this.deliveryBasis.length > 0){           //Заполнены условия поставки и вернулись добавить еще один товар
       let findBasis = this.deliveryConditions.find(el=> el.linkId == this.deliveryBasis[0].idBasisLink && el.valueId == this.deliveryBasis[0].idBasisValue)
        if(findBasis){
          for(let i=1; i< this.deliveryBasis.length; i++){
            if(!findBasis.children.find(el => el.linkId == this.deliveryBasis[i].basis)){
              let string = 'базисы'
              this.nameField.push(string)
            }
          }
        }
        else{
          let string = 'базисы'
          this.nameField.push(string)
        }
      }*/
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
    /*    if(!this.error && this.deliveryTermForm?.controls?.startDelivery?.value && this.deliveryTermConcated.length > 0){          //Если заполнен Срок поставки и вернулись добавить еще один товар
        let filterValues = this.deliveryTerm.filter(el => el.deliveryStartId == this.deliveryTermForm.controls.deliveryTerm.value && el.deliveryTermId == this.deliveryTermForm.controls.deliveryType.value)
        if(filterValues.length > 0){
          if(filterValues[0]?.dayValues.length > 0 )
          {
            if(!filterValues[0]?.dayValues.includes(this.deliveryTermForm.controls.startDelivery.value)){
              let string = 'срок поставки'
              this.nameField.push(string)
            }
          }
          if(filterValues[0].monthValues.length > 0) {
            if (!filterValues[0]?.monthValues.includes(this.deliveryTermForm.controls.startDelivery.value)) {
              let string = 'срок поставки'
              this.nameField.push(string)
            }
          }
        }
        else {
          let string = 'срок поставки'
          this.nameField.push(string)
        }
      }*/
  }

  onChangeSelectBox(e: any, str: string) {
    if (!e.value || e.value.length == 0) {
      switch (str) {
        case 'broker': {
          this.generalInfoStep.controls.listClientBranchSeller.setValue(null);
          this.listBranchChooseSeller = null;
          break;
        }
      }
    } else {
      switch (str) {
        case 'broker': {
          this.onChooseBrokerSeller();
          this.generalInfoStep.controls.listBranchSeller.setValue(null);
          this.generalInfoStep.controls.listClientBranchSeller.setValue(null);
          this.getContractorsVisitors();
          if (this.generalInfoStep.controls.contractTypeSeller.value == 21)
            this.GetListBranchesClientsSeller();
          break;
        }
      }
    }
  }

  getNumber(value) {
    return Number(value);
  }

  onChooseGood(good) {
    this.good = good;
    if (this.deliveryBasis?.length > 0) {
      this.popupForm = true;
      this.popupTitle =
        this.translate.store.currentLang == 'RU'
          ? RU['login_form'].notification
          : EN['login_form'].notification;
      this.popupMessage =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].addGoodAfterBasis
          : EN['errors'].addGoodAfterBasis;
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

  clearOfferForGood() {
    this.deliveryBasis = [];
    this.schedule = [];
    this.deliveryTermSchedule = '';
    this.termsPaymentForm.reset();
    this.deliveryTermForm.reset();
    this.deliveryTermConcated = '';
    this.paymentTermConcated = '';
    this.popupForm = false;
    this.onChooseGoodContinue();
  }

  addGood(obj: any) {
    let item = obj.modal;
    let volumes = obj.volumes;
    this.goodInfo = false;
    this.editInfoGood = null;
    this.firstElement = false;
    let temp = this.goodsList.findIndex((g) => g.id == this.good.id); //ищем товар в списке добавленных
    if (!item) {
      //отмена редактирования
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
        priceAdjustment = {};
      item[3]?.forEach((i) => {
        if (i.interfaceField.fieldId == 1) {
          volume = { volume: i.selectedValues };
          this.volumePrecision = i.interfaceField.fieldPrecision;
        }
        if (i.interfaceField.fieldId == 2) {
          units = {
            units: i.interfaceField.allowedValues.find(
              (u) => u.id == i.selectedValues
            ),
          };
        }
      });

      item[4]?.forEach((i) => {
        if (i.interfaceField.fieldId == 3) {
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
        if (i.interfaceField.fieldId == 4) {
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
        if (i.interfaceField.fieldId == 5) {
          //ставка НДС
          this.filledFields = Object.assign(this.filledFields, {
            vat: i.interfaceField.allowedValues.find(
              (v) => v.id == i.selectedValues
            ),
          });
        }
        /*   if (i.interfaceField.fieldId == 47) {                                 //корректируемая цена
          this.filledFields = Object.assign(this.filledFields, {adjustedPrice: i.selectedValues});
        }
        if (i.interfaceField.fieldId == 55) {                                 //валюта котировки
          this.filledFields = Object.assign(this.filledFields, {currencyQuotes: i.selectedValues});
          quoteCurrency = {quoteCurrency: i.interfaceField.allowedValues.find(c => c.id == i.selectedValues)}
          this.commonService.GetPrecision(this.user?.token, i.selectedValues).subscribe((res) => {
            this.quoteCurrencyPrecision = res;
          })
        }
        if (i.interfaceField.fieldId == 56) {                                 //котировкa
          // this.filledFields = Object.assign(this.filledFields, {quotation : i.selectedValues});
          this.quoteCurrencyPrecision = i.interfaceField.fieldPrecision
          quotation = {quotation: i.selectedValues}
        }
        if (i.interfaceField.fieldId == 54) {                                 //поправка
          // this.filledFields = Object.assign(this.filledFields, {quotation : i.selectedValues});
          amendment = {amendment: i.selectedValues}
        }
        if (i.interfaceField.fieldId == 53) {                                 //тип поправки
          this.filledFields = Object.assign(this.filledFields, {priceAdjustment: i.selectedValues});
          priceAdjustment = {priceAdjustment: i.interfaceField.allowedValues.find(c => c.id == i.selectedValues)}
        } */
      });

      /*   item[7]?.forEach(i => {
        if (i.interfaceField.fieldId == 11) {                                 //источник финансирования
          this.filledFields = Object.assign(this.filledFields, {finance: i.selectedValues});
        }
      })
 */
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

        this.goodsList.forEach((el) => {
          let findedGood = volumes.find((v) => v.goodId == el.id);
          el.volume = findedGood.volume;
          el.isMainBaseGood = findedGood.isMainBasic;
          let block3 = el.fields.find((el) => el[0] == 3);
          if (block3) {
            block3[1]?.forEach((i) => {
              if (i.interfaceField.fieldId == 1) {
                i.selectedValues = findedGood.volume;
              }
            });
          }

          item[7]?.forEach((i) => {
            //когда изменили местоназначение
            if (i.interfaceField.fieldId == 62) {
              let IdsDestination = i.selectedValues;
              el.destinationError = IdsDestination?.length > 1 ? true : false;
            }
          });
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
          priceAdjustment
        );

        this.goodsList.forEach((el) => {
          let block4 = el.fields.find((el) => el[0] == 4); //когда изменили цену - снимаем предупрждение
          block4[1]?.forEach((i) => {
            if (i.interfaceField.fieldId == 3) {
              el.priceError =
                el.priceAgriStatistics > i.selectedValues ? true : false;
              el.noPriceLimit = false;
            }
          });
        });

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
            let find = basis.goods.find((bg) => bg.id == good.id);
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
              });
            } else {
              find.volume = good.volume;
              find.units = good.units.name;
              find.cost = basis.coreBasis ? good.cost : 0;
              find.currency = good.currency.name;
              find.quotation = good.quotation;
              find.quoteCurrency = good.quoteCurrency;
              find.priceAdjustment = good.priceAdjustment?.id;
              find.amendment = basis.coreBasis ? good.amendment : 0;
              find.costVAT = basis.coreBasis
                ? this.commonService.round(
                    good.cost * good.volume,
                    this.currencyPrecision
                  ) +
                  this.commonService.round(
                    (good.cost * good.volume * vat) / 100,
                    this.currencyPrecision
                  )
                : 0;
            }
          });
        });

        if (this.schedule.length > 0) {
          this.schedule.forEach(sch => {
            this.goodsList.forEach(good => {
              let find = sch.goods.find(s => s.id == good.id)
              if (find) {
                find.units = good.units;
              }

            })
          })
        }
        if (this.delivScope.length > 0) {
          this.delivScope.forEach((scope) => {
            this.goodsList.forEach((good) => {
              let find = scope.goods.find((s) => s.goodId == good.id);
              if (find) {
                find.goodUnits = good.units.name;
              }
            });
          });
        }
      }
      setTimeout(() => {
        //для того, чтобы экран проехал вверх и затем вывелся тост
        this.changeGoodInfo = true;
      }, 200);
    }
    let cancelButton = document.getElementById('cancelButton');
    cancelButton.removeAttribute('disabled');
    let nextButton = document.getElementById('nextButton');
    nextButton.removeAttribute('disabled');
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
        basis.goods.splice(index, 1);
      });
    }

    this.deleteGood = false;
  }

  onEdit(good: any) {
    this.editInfoGood = good.id;
    this.viewInfoGood = null;
    this.good = good;
    if (this.idOffer) {
      this.blockModal = this.findBlock();
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
        string = field.dataSource.find(
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

  /* ------------------- шаг 3------------------------ */

  deliveryTermSchedule: string; // вид графика поставки

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
        //фильтрация deliveryTermType в соответствии с тем, что выбрано в "Начало посавки"
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
          this.deliveryTermForm.controls.deliveryType.patchValue(
            this.offerDeliveryPeriod.idDeliveryType?.toString() || null
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
          if (this.deliveryTermForm.controls.deliveryType?.value == ID_DELIVERY_TERM_TYPE.CALENDAR_DAYS) {
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
          if (this.deliveryTermForm.controls.deliveryType?.value == ID_DELIVERY_TERM_TYPE.MONTHS) {
            //месяца
            // формирование массива "В течение Х месяцев"
            let months = this.deliveryTermType.find(
              (el) =>
                el.deliveryTermId ==
                this.deliveryTermForm.controls.deliveryType?.value
            ).monthValues;
            for (let i = 0; i < months.length; i++) {
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
            this.deliveryTermForm.controls.deliveryTerm.patchValue(
              this.offerDeliveryPeriod.periodTypeValue
            );
          }

          this.deliveryTermValue.sort((a, b) => a.id - b.id); //сортировка по id
          if (this.deliveryTermValue.length == 1) {
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
    if (this.deliverySchedule?.length == 0 || this.disabledButtonSchedule())
      this.schedule = [];

    if (this.deliveryTermForm.controls.startDelivery.value == 3) {
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
            this.deliveryTermForm.controls.startDelivery.value == 2 &&
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
          this.termsPaymentForm.controls.volume.setValue(
            this.offerPaymentCond.idShipmentVolume.toString()
          );
          this.onTermsPaymentChange('volume');
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
              this.termsPaymentForm.controls.momentPrepayment.setValue(
                this.offerPaymentCond.firstPaymentMomentId?.toString()
              );
              this.termsPaymentForm.controls.prepaymentAmount.setValue(
                this.offerPaymentCond?.firstPercent
              );
              this.onTermsPaymentChange('momentPrepayment');
              break;
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
              // this.termsPaymentForm.controls.momentDelay.setValue(this.offerPaymentCond.secondPaymentMomentId?.toString());
              if (this.termsPaymentForm.controls.momentPrepayment?.value != 7)
                this.termsPaymentForm.controls.momentDelay.setValue(
                  this.offerPaymentCond.firstPaymentMomentId?.toString()
                );
              // this.termsPaymentForm.controls.defermentAmount.setValue(this.offerPaymentCond.firstPercent);
              this.onTermsPaymentChange('momentDelay');
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
            let date: any = this.offerPaymentCond?.firstPeriodValueDate
              ? (this.offerPaymentCond?.firstPeriodValueDate - 25569) *
                24 *
                3600 *
                1000
              : null;
            this.termsPaymentForm.controls.prepaymentPeriodNumber?.setValue(
              this.offerPaymentCond.firstPeriodValueNumber?.toString()
            );
            this.termsPaymentForm.controls.prepaymentPeriodDate?.setValue(date);
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.offerPaymentCond?.idDayType
            );

            //Условие оплаты в форме заявки = «Предоплата 100%»
            if (
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.prepayment100 ||
              this.termsPaymentForm.controls.termsPayment?.value ==
                termsConditionsPaymentConst.paymentThroughExchange
            ) {
              this.paymentTermConcated = this.commonService.ucFirst(
                this.offerGeneral.concatedPaymentConditions
              );
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
              this.termsPaymentForm.controls.momentDelay.setValue(
                this.offerPaymentCond.secondPaymentMomentId?.toString()
              );
              /*    if (this.offerPaymentCond.firstPaymentMomentId != 7)
                    this.termsPaymentForm.controls.momentDelay.setValue(this.offerPaymentCond.firstPaymentMomentId?.toString())
                  else this.termsPaymentForm.controls.momentDelay.setValue(this.offerPaymentCond.secondPaymentMomentId?.toString());*/
              this.onTermsPaymentChange('momentDelay');
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
            } else {
              this.termsPaymentForm.controls.defermentPeriodNumber?.setValue(
                this.offerPaymentCond?.secondPeriodValueNumber.toString()
              );
            }
            this.termsPaymentForm.controls.dayTypeId?.setValue(
              this.offerPaymentCond?.idDayType
            );
            this.paymentTermConcated = this.commonService.ucFirst(
              this.offerGeneral.concatedPaymentConditions
            );
          }
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
          this.termsPaymentForm.controls.momentDelay.setValue(
            this.offerPaymentCond.secondPaymentMomentId?.toString()
          );
          this.termsPaymentForm.controls.momentDelay2.setValue(
            this.offerPaymentCond.secondPaymentMomentId?.toString()
          );
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
          this.termsPaymentForm.controls.dayTypeId?.setValue(
            this.offerPaymentCond?.idDayType
          );
          this.onChangedefermentAmount();
        }

        break;
      }
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
      this.validationGroup?.instance.validate().isValid
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
        true,
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

  /* ---------------------  шаг 4 ---------------------- */
  openBasis = [];
  deleteGood = false;

  uniqueDeliveryTerm: any[];

  /* ----------------------- шаг 5---------------------- */
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
      this.errorState = 1;
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

  /* ---------------------------------------- */

  priceAgriStatistics;
  priceLimitationName;

  hasPriceAgriStatistics() {
    return this.goodsList.some((item) => item.priceAgriStatistics);
  }

  async goToNextStep(type?: string) {
    //проверки до перехода на шаг
    switch (this.activeStep) {
      case 1: {
        if (
          !this.generalInfoSellerValidationGroup.instance.validate().isValid ||
          !this.generalInfoBuyerValidationGroup.instance.validate().isValid
        ) {
          return;
        }
        if (this.errorBrokerClientMessageSeller?.length > 0) {
          //результат контекстной проверки
          this.error = true;
          this.errorState = 1;
          this.messageError = this.errorBrokerClientMessageSeller;
          return;
        }
        if (this.errorBrokerClientMessageBuyer?.length > 0) {
          //результат контекстной проверки
          this.error = true;
          this.errorState = 1;
          this.messageError = this.errorBrokerClientMessageBuyer;
          return;
        }
        break;
      }
      case 2: {
        if (this.goodsList.length == 0) {
          this.error = true;
          this.errorState = 1;
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
          this.errorState = 1;
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

        this.goodsList.forEach((good) => {
          //смотрим чтоб не было >1 значения в месте назначения
          let block7 = good.fields.find((el) => el[0] == 7);
          if (block7) {
            block7[1]?.forEach((i) => {
              if (i.interfaceField.fieldId == 62) {
                let IdsDestination = i.selectedValues;

                if (IdsDestination?.length > 1) {
                  //Array.isArray(IdsDestination)
                  good.destinationError = true;
                  this.error = true;
                  this.errorState = 1;
                  this.messageError =
                    this.translate.store.currentLang == 'RU'
                      ? RU['directOffers'].destinationError
                      : EN['directOffers'].destinationError;
                } else {
                  good.destinationError = false;
                }
              }
            });
          }
        });

        if (!this.goodsList.some((item) => item.destinationError)) {
          //если с местоназначением все ок

          if (type != 'noChecking') {
            for (const good of this.goodsList) {
              // запрашиваем минимальную цену

              let mineGood = this.offerGoods.find((el) => el.idGood == good.id);
              let block7 = good.fields.find((el) => el[0] == 7);
              let IdDestination =
                block7[1].find((i) => i.interfaceField.fieldId == 62)
                  ?.selectedValues || null;
              let IdCnfea = mineGood.goodsSpecifications.find(
                (el) => el.idInterfaceField == 63
              )?.fieldValueNumber;

              await this.createOfferService
                .GetArchiveStatisticsPriceLimit(
                  this.user?.token,
                  this.sectionId,
                  this.sessionId,
                  !this.type ? this.idOffer : this.offerGeneral.idOfferBasedOn,
                  this.termsPaymentForm.controls.termsPayment?.value
                    ? this.termsPaymentForm.controls.termsPayment?.value
                    : this.offerPaymentCond.idPaymentType,
                  this.goodsList[0].currency.id,
                  good.id,
                  this.goodsList[0].units.id,
                  this.deliveryBasis[0].idBasisValue,
                  this.deliveryBasis[0]?.idPlaceLink,
                  IdCnfea,
                  IdDestination
                )
                .then((res: any) => {
                  good.priceAgriStatistics = res.priceWithoutVat;
                  good.priceLimitationName = res.priceLimitationName;

                  if (good.priceAgriStatistics != null) {
                    //если цена пришла смотрим и сравниваем с нашими
                    let block4 = good.fields.find((el) => el[0] == 4);
                    if (block4) {
                      block4[1]?.forEach((i) => {
                        if (i.interfaceField.fieldId == 3) {
                          good.priceError =
                            good.priceAgriStatistics > i.selectedValues
                              ? true
                              : false;
                        }
                      });
                    }
                    if (this.goodsList.some((item) => item.priceError)) {
                      //где-то неверная цена - предупреждаем
                      this.error = true;
                      this.errorState = 0;
                      let limitationName = this.goodsList.find(
                        (el) => el.priceError == true
                      ).priceLimitationName;
                      let price = this.goodsList.find(
                        (el) => el.priceError == true
                      ).priceAgriStatistics;
                      this.messageError = `Цена без НДС не соответствует ценовому контролю. Минимально допустимая цена: ${limitationName} ${price} ${this.goodsList[0].currency.name}/${this.goodsList[0].units.name}`;
                    }
                  } else {
                    //если цена null сразу тотальная ошибка
                    good.noPriceLimit = true;
                    this.error = true;
                    this.errorState = 1;
                    this.messageError =
                      this.translate.store.currentLang == 'RU'
                        ? RU['directOffers'].noLimitationMess
                        : EN['directOffers'].noLimitationMess;
                  }
                });

              if (this.error && this.errorState == 1) return;
            }
          } else {
            this.error = false;
          }
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
          this.errorState = 1;
          this.messageError = this.deadlineErrorMess;
          return;
        }
        if (!this.deadlineDelivery || !this.deadlinePayment) {
          return;
        }

        if (this.schedule?.length > 0) {
          if (
            localeDependentDate(
              this.deliveryTermForm.controls.startDate?.value
            ) !== this.schedule[0].startDate
          ) {
            this.error = true;
          }

          //если стоит с даты по дату
          if (
            (this.deliveryTermForm.controls.startDelivery.value == ID_DELIVERY_TERM.DATE_OF_DELIVERY &&
              this.deliveryTermForm.controls.deliveryType?.value == ID_DELIVERY_TERM_TYPE.DAYS) ||
            (this.deliveryTermForm.controls.startDelivery.value == ID_DELIVERY_TERM.NOT_SET_START_DELIVERY &&
              this.deliveryTermForm.controls.deliveryType?.value)
          ) {
            if (
              localeDependentDate(
                this.deliveryTermForm.controls?.endDate?.value
              ) !==
              this.schedule[this.schedule.length - 1].endDate
            ) {
              this.error = true;
            }
          } //выпадающий список
          else {
            let endDate = moment(
              this.deliveryTermForm.controls.startDate?.value
            );

            if (this.deliveryTermForm.controls.deliveryType?.value == ID_DELIVERY_TERM_TYPE.CALENDAR_DAYS) {
              //дни
              endDate = endDate.add(
                this.deliveryTermForm.controls.deliveryTerm.value,
                'days'
              );
            } else if (
              this.deliveryTermForm.controls.deliveryType?.value == ID_DELIVERY_TERM_TYPE.MONTHS
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
              this.error = true;
          }

          if (this.error) {
            this.errorState = 1;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['errors'].deliveryScheduleNotDeliveryTime
                : EN['errors'].deliveryScheduleNotDeliveryTime;
            return;
          }
        }
        break;
      }
      case 4: {
        if (!this.isNotSpecified) {
          //если базисы не надо добавлять
          if (this.deliveryBasis.length == 0) {
            this.error = true;
            this.errorState = 1;
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
              this.errorState = 1;
              this.messageError =
                this.translate.store.currentLang == 'RU'
                  ? RU['createOffer'].paymentDeliveryTerms.messageErrorMinPrice
                  : EN['createOffer'].paymentDeliveryTerms.messageErrorMinPrice;
              return;
            }
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
          this.errorState = 1;
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
          this.errorState = 1;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].fileError
              : EN['errors'].fileError;
          return;
        }

        if (this.schedule?.length > 0 && !this.disabledButtonSchedule()) {
          if (this.goodsList.length != this.sumVolumeGoodSchedule.length) {
            //  если разное количество товаров в графике и в заявке
            this.errorState = 1;
            this.error = true;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].paymentDeliveryTerms.errorMessageSchedule
                : EN['createOffer'].paymentDeliveryTerms.errorMessageSchedule;
          } else {
            this.goodsList.forEach((good) => {
              let findGood = this.sumVolumeGoodSchedule.find(
                (el) => el.id == good.id
              );
              if (!findGood) {
                //удалили один товар и добавили другой
                this.errorState = 1;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule
                    : EN['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule;
              } else if (good.volume != findGood.sumValue) {
                // не совпадают значения объема
                this.errorState = 1;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule
                    : EN['createOffer'].paymentDeliveryTerms
                        .errorMessageSchedule;
              }
            });
          }
        }

        if (
          this.delivScope?.length == 0 &&
          this.generalInfoStep.controls.brokerClientSeller?.value?.length > 1 &&
          this.UserRoleSeller != role.worker
        ) {
          //если не заполнили грузоотправителей
          this.errorState = 1;
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].delivScope.errorMessEmptyScope
              : EN['createOffer'].delivScope.errorMessEmptyScope;
        }

        if (
          this.delivScope?.length > 0 &&
          this.generalInfoStep.controls.brokerClientSeller?.value?.length > 1 &&
          this.UserRoleSeller != role.worker
        ) {
          if (this.delivScope[0].goods.length != this.goodsList.length) {
            //если удалили товар
            this.errorState = 1;
            this.error = true;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].delivScope.errorMessDelivScope
                : EN['createOffer'].delivScope.errorMessDelivScope;
          } else {
            let sumVolumeGood = [];
            this.goodsList.forEach((good) => {
              let sumGoodVolume = 0;
              this.delivScope.forEach((scope) => {
                sumGoodVolume =
                  sumGoodVolume +
                    scope.goods?.find((g) => g.goodId == good.id)?.volume || 0;
              });
              sumVolumeGood.push({
                id: good.id,
                sumValue: sumGoodVolume,
              });
            });
            this.goodsList.forEach((good) => {
              let findGood = sumVolumeGood.find((el) => el.id == good.id);
              if (!findGood) {
                //удалили один товар и добавили другой
                this.errorState = 1;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].delivScope.errorMessDelivScope
                    : EN['createOffer'].delivScope.errorMessDelivScope;
              } else {
                if (good.volume != findGood.sumValue) {
                  // не совпадают значения объема
                  this.errorState = 1;
                  this.error = true;
                  this.messageError =
                    this.translate.store.currentLang == 'RU'
                      ? RU['createOffer'].delivScope.errorMessDelivScope
                      : EN['createOffer'].delivScope.errorMessDelivScope;
                }
              }
            });
          }

          if (
            this.delivScope?.length !=
            this.generalInfoStep.controls.brokerClientSeller?.value?.length
          ) {
            this.errorState = 1;
            this.error = true;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].delivScope.errorMessDelivScope
                : EN['createOffer'].delivScope.errorMessDelivScope;
          } else {
            this.generalInfoStep.controls.brokerClientSeller.value.forEach(
              (br) => {
                let findBroker = this.delivScope.find(
                  (el) => el.idBroker == br
                );
                if (!findBroker) {
                  this.errorState = 1;
                  this.error = true;
                  this.messageError =
                    this.translate.store.currentLang == 'RU'
                      ? RU['createOffer'].delivScope.errorMessDelivScope
                      : EN['createOffer'].delivScope.errorMessDelivScope;
                }
              }
            );
          }
        }
        break;
      }
    }

    if (!this.error) {
      this.activeStep++;
    }

    //после перехода на шаг
    switch (this.activeStep) {
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
              this.deliveryTermForm.controls.startDelivery.patchValue(
                this.offerDeliveryPeriod.idDeliveryMoment?.toString()
              );
              this.deliveryTermStartChange('deliveryStart');
              let dateBegin: any = this.offerDeliveryPeriod?.dateBegin
                ? (this.offerDeliveryPeriod?.dateBegin - 25569) *
                  24 *
                  3600 *
                  1000
                : null;
              let dateEnd: any = this.offerDeliveryPeriod?.dateEnd
                ? (this.offerDeliveryPeriod?.dateEnd - 25569) * 24 * 3600 * 1000
                : null;

              this.deliveryTermForm.controls.startDate.patchValue(dateBegin);
              this.deliveryTermForm.controls.endDate.patchValue(dateEnd);
              this.deliveryTermConcated =
                this.offerGeneral.concatedDeliveryPeriod;

              if (
                this.offerDelivSchPeriods.length > 0 &&
                !this.isEditedDeliveryTerm
              ) {
                //график поставки
                if (this.offerGoods.length == this.goodsList.length) {
                  // проверка все ли товары совпадают
                  let sum = 0;
                  this.goodsList.forEach((good) => {
                    if (this.offerGoods.find((el) => el.idGood == good.id))
                      sum++;
                  });

                  if (sum == this.offerGoods.length) {
                    const datepipe: DatePipe = new DatePipe('en-US'); //задает формат даты
                    this.offerDelivSchPeriods.forEach((sch) => {
                      // добавление полей необходимых для товаров
                      this.goodsList.forEach((good) => {
                        if (good.idDemandOfferGood == sch.idDemandOfferGood) {
                          Object.assign(sch, {
                            idGood: good.id,
                            goodName: good.name,
                            unit: good.units,
                            properties: good.properties,
                          });
                        }
                      });
                    });
                    //формирования массива с суммой объема по товарам из графика поставки
                    let sumGoodsVolume = this.offerDelivSchPeriods.reduce(
                      function (r, a) {
                        //сгруппированы поля по idOffer
                        r[a.idGood] = r[a.idGood] || [];
                        r[a.idGood].push(a);
                        return r;
                      },
                      {}
                    );
                    sumGoodsVolume = Object.entries(sumGoodsVolume);
                    sumGoodsVolume.forEach((good) => {
                      let sum = 0;
                      good[1].forEach((item) => {
                        sum = sum + item.periodVolume;
                      });
                      this.sumVolumeGoodSchedule.push({
                        id: good[0],
                        sumValue: sum.toFixed(4),
                      });
                    });

                    this.offerDelivSchPeriods =
                      this.offerDelivSchPeriods.reduce(function (r, a) {
                        //сгруппированы поля по periodDateBegin
                        r[a.periodDateBegin] = r[a.periodDateBegin] || [];
                        r[a.periodDateBegin].push(a);
                        return r;
                      }, {});
                    this.offerDelivSchPeriods = Object.entries(
                      this.offerDelivSchPeriods
                    );

                    this.offerDelivSchPeriods.sort(function (a, b) {
                      //сортировка по дате начала по возрастанию, чтобы отображался график в правильном порядке
                      return a[0] - b[0];
                    });

                    this.offerDelivSchPeriods.forEach((sch, index) => {
                      let goods = [];
                      sch[1].forEach((good) => {
                        goods.push({
                          id: good.idGood,
                          name: good.goodName,
                          volume: good.periodVolume,
                          units: good.unit,
                          properties: good.properties,
                        });
                      });

                      this.schedule.push({
                        numberPeriod: index + 1,
                        startDate: datepipe.transform(
                          (sch[1][0].periodDateBegin - 25569) *
                            24 *
                            3600 *
                            1000,
                          'dd.MM.yyyy'
                        ),
                        endDate: datepipe.transform(
                          (sch[1][0].periodDateEnd - 25569) * 24 * 3600 * 1000,
                          'dd.MM.yyyy'
                        ),
                        goods: goods,
                        idPeriod:
                          this.offerGeneral.idDeliveryScheduleType.toString(),
                      });
                    });
                    this.deliveryTermSchedule =
                      this.offerGeneral.idDeliveryScheduleType.toString();
                    this.deliveryTermScheduleChoose =
                      this.deliverySchedule?.find(
                        (el) => el.id == this.deliveryTermSchedule
                      ).name;
                  }
                }
              }
              this.onCreateString();
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
          this.termsPaymentForm.controls.termsPayment.patchValue(
            this.offerPaymentCond.idPaymentType.toString()
          );
          this.onTermsPaymentChange('termsPayment');
          // this.termsPaymentForm.controls.prepaymentAmount.setValue(this.offerPaymentCond.firstPercent)
          // this.termsPaymentForm.controls.defermentAmount.setValue(this.offerPaymentCond.secondPercent);

          this.paymentTermConcated =
            this.offerGeneral.concatedPaymentConditions;
        }
        break;
      }
      case 4: {
        break;
      }
      case 6: {
        this.previewVisible = true;
        break;
      }
    }
  }

  goToPrevStep() {
    this.activeStep--;
  }

  openPopup(str: string) {
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

  openSidebar(i: any) {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
  }

  cancelForm() {
    this.isChangesSaved = true;
    this.cleanupBeforeClose();
    history.back();
  }

  req: {};

  checkOffer(e, type?) {
    if (this.goodsList.some((item) => item.priceError)) {
      //где-то неверная цена - предупреждаем
      this.error = true;
      this.errorState = 1;
      let limitationName = this.goodsList.find(
        (el) => el.priceError == true
      ).priceLimitationName;
      let price = this.goodsList.find(
        (el) => el.priceError == true
      ).priceAgriStatistics;
      this.messageError = `Цена без НДС не соответствует ценовому контролю. Минимально допустимая цена: ${limitationName} ${price} ${this.goodsList[0].currency.name}/${this.goodsList[0].units.name}`;
      return;
    }

    if (e.validationGroup.validate().isValid) {
      let objForReq = {}; //объект для записи в боди
      this.goodsList.forEach((item) => {
        let endKeys = [];
        let endValues = [];
        let objectForValues = {}; //объект заполненных полей 1 товара

        item.fields.forEach((block) => {
          for (let i = 0; i < block[1].length; i++) {
            if (block[1][i].interfaceField.fieldId) {
              endKeys.push(
                'field' +
                  block[1][i].interfaceField.blockId +
                  'n' +
                  block[1][i].interfaceField.fieldId
              );
              endValues.push(block[1][i].selectedValues);
            }
          }
          objectForValues = Object.assign(
            {},
            ...endKeys.map((n, i) => ({ [n]: endValues[i] }))
          );
        });

        objectForValues['products'] = null;

        if (this.goodsList[0] == item) {
          objectForValues['termsConditionsPayment'] = {
            paymentConditionId:
              this.termsPaymentForm.controls.termsPayment?.value,
            paymentVolumeId: this.termsPaymentForm.controls.volume?.value,
            prepayMomentId:
              this.termsPaymentForm.controls.momentPrepayment?.value || null,
            delayMomentId:
              this.termsPaymentForm.controls.momentDelay?.value || null,
            dayTypeId: this.termsPaymentForm.controls.dayTypeId?.value || null,
            delayValue:
              this.termsPaymentForm.controls.defermentAmount?.value || 0,
            delayValue2:
              this.termsPaymentForm.controls.defermentAmount2?.value || null,
            prepayValue:
              this.termsPaymentForm.controls.prepaymentAmount?.value || 0,
            delayTerm: {
              applicableDayCount: this.momentPrepayment?.options
                .applicableDayCount
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                : null,
              // calendarDayCount: this.momentPrepayment?.options.calendarDayCount ? this.termsPaymentForm.controls.defermentPeriodNumber?.value : null,
              calendarDayCount2:
                this.termsPaymentForm.controls.defermentPeriod2?.value || null,
              // bankDayCount: this.momentPrepayment?.options.bankDayCount ? this.termsPaymentForm.controls.defermentPeriodNumber?.value : null,
              dayOfMonth: this.momentPrepayment?.options.dayOfMonth
                ? this.termsPaymentForm.controls.defermentPeriodNumber?.value
                : null,
              date: this.momentPrepayment?.options.date
                ? this.termsPaymentForm.controls.defermentPeriodDate?.value
                : null,
            },
            prepayTerm: {
              applicableDayCount: this.momentPrepayment?.options
                .calendarDayCount
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                : null,
              /* calendarDayCount: this.momentPrepayment?.options.calendarDayCount ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value : null,
               bankDayCount: this.momentPrepayment?.options.bankDayCount ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value : null,*/
              dayOfMonth: this.momentPrepayment?.options.dayOfMonth
                ? this.termsPaymentForm.controls.prepaymentPeriodNumber?.value
                : null,
              date: this.momentPrepayment?.options.date
                ? this.termsPaymentForm.controls.prepaymentPeriodDate?.value
                : null,
            },
          };

          if (!this.isNotSpecified) {
            let extra = [];
            let main = {};
            this.deliveryBasis?.forEach((item) => {
              if (item.coreBasis) {
                main = {
                  minAddBasisPlaces: item.minAddBasisPlaces,
                  contradictoryValueId: item.contradictoryValueId,
                  contradictoryBasisName: item.contradictoryBasisName,
                  isRequiredPlace: item.isRequiredPlace,
                  isRequiredAddBasis: item.isRequiredAddBasis,
                  minAddBasis: item.minAddBasis,
                  placeName: item.enterPlaceName,
                  placeTypeId: item.placeTypeId,
                  parentId: item.parentId,
                  linkId: item.idBasisLink,
                  valueId: item.idBasisValue,
                  level: item.level,
                  hasChildren: item.hasChildren,
                  basisId: item.basisId,
                  basisName: item.basisName,
                };
              } else {
                extra.push({
                  minAddBasisPlaces: item.minAddBasisPlaces,
                  contradictoryValueId: item.contradictoryValueId,
                  contradictoryBasisName: item.contradictoryBasisName,
                  isRequiredPlace: item.isRequiredPlace,
                  isRequiredAddBasis: item.isRequiredAddBasis,
                  minAddBasis: item.minAddBasis,
                  placeName: item.enterPlaceName,
                  placeTypeId: item.placeTypeId,
                  parentId: item.parentId,
                  linkId: item.idBasisLink,
                  valueId: item.idBasisValue,
                  level: item.level,
                  hasChildren: item.hasChildren,
                  basisId: item.basisId,
                  basisName: item.basisName,
                });
              }
            });
            objectForValues['deliveryCondition'] = Object.assign(
              { main: main },
              { extra: extra }
            );
          }

          objectForValues['deliveryTerm'] = {
            deliveryStartId: this.deliveryTermForm.value.startDelivery,
            deliveryTermId: this.deliveryTermForm.value.deliveryType,
            dayValue:
              this.deliveryTermForm.value.deliveryType == 1
                ? this.deliveryTermForm.value.deliveryTerm
                : null,
            monthValue:
              this.deliveryTermForm.value.deliveryType == 2
                ? this.deliveryTermForm.value.deliveryTerm
                : null,
            startDeliveryDate: this.deliveryTermForm.value?.startDate
              ? this.commonService.toOADate(
                  this.deliveryTermForm.value?.startDate
                )
              : null,
            endDeliveryDate: this.deliveryTermForm.value?.endDate
              ? this.commonService.toOADate(
                  this.deliveryTermForm.value?.endDate
                )
              : null,
          };

          if (this.schedule.length > 0 && !this.disabledButtonSchedule()) {
            let periods = [];
            this.schedule.forEach((item) => {
              for (let i = 0; i < item.goods.length; i++) {
                periods.push({
                  number: item.numberPeriod,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  volume: item.goods[i].volume,
                  unit: item.goods[i].units.name,
                });
              }
            });

            objectForValues['deliverySchedule'] = Object.assign(
              {
                periodType: {
                  id: this.schedule[0]?.idPeriod,
                  name: '',
                },
              },
              { periods: periods }
            );
          }
        }

        let endObject = {}; //объект с индексом товара
        endObject[this.goodsList.indexOf(item)] = objectForValues;
        objForReq = Object.assign(endObject, objForReq);
      });

      this.req = {
        model: this.demandsModal,
        modelId: this.modelId,
        values: objForReq,
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
            this.submitOffer(e);
          }
        });
    }
  }

  submitOffer(e) {
    if (!this.error) {
      try {
        this.documents = [];
        if (this.commonFiles.length > 0) {
          this.commonFiles.forEach((item) => {
            if (
              !(
                this.type &&
                this.offerDocuments?.find(
                  (f) => f.idDocument == item.idDocument
                )
              )
            ) {
              this.documents.push({
                idSection: this.sectionId,
                idSession: this.sessionId,
                documentName: item.filename,
                documentExtension: '.' + item.filename.split('.').reverse()[0],
                documentContent: item.content.includes('base64,')
                ? item.content.split('base64,')[1]
                : item.content,
                isPrivate: false,
              });
            }
          });
        }
        if (this.hiddenFiles.length > 0) {
          this.hiddenFiles.forEach((item) => {
            if (
              !(
                this.type &&
                this.offerDocuments?.find(
                  (f) => f.idDocument == item.idDocument
                )
              )
            ) {
              this.documents.push({
                idSection: this.sectionId,
                idSession: this.sessionId,
                documentName: item.filename,
                documentExtension: '.' + item.filename.split('.').reverse()[0],
                documentContent: item.content.includes('base64,')
                ? item.content.split('base64,')[1]
                : item.content,
                isPrivate: true,
              });
            }
          });
        }

        let endListGoods = []; //массив для goods
        let idVatQuoteForChecking; // котировка в боди
        let financeForChecking; // источник финансирования в боди
        let objectForValues = {};
        this.goodsList.forEach((item) => {
          let endProperties = [];
          item.fields.forEach((block) => {
            for (let i = 0; i < block[GOODS_FIELDS_BLOCK.FIELD_INFO].length; i++) {
              if (
                (block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType === 'dxCheckBox' ||
                  block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                    'dxNumberBox' ||
                  block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                    'dxSelectBox' ||
                  block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType === 'dxTextBox') &&
                block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues != null
              ) {
                endProperties.push({
                  idInterfaceField: block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.fieldId,
                  fieldValueNumber:
                    (block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                      'dxSelectBox' &&
                      !block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.isAvailableMultiSelection &&
                      !block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.isAvailableFreeInput) ||
                    block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType === 'dxNumberBox'
                      ? Number(block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues)
                      : block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.fieldId ===
                      ID_INTERFACE_FIELD.PRODUCT_LOCATION &&
                      block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].idSelectedValues
                        ? Number(block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].idSelectedValues)
                        : null,
                  fieldValueString:
                      block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                      'dxTextBox' ||
                      block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType === 'dxCheckBox' ||
                      (block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                        'dxSelectBox' &&
                        block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.isAvailableFreeInput)
                        ? block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues.toString()
                        : null,
                  listFieldValues:
                    block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.controlFieldType ===
                    'dxSelectBox' &&
                    block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.isAvailableMultiSelection
                      ? block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues
                      : '',
                });
              }
              if (block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.fieldId === ID_INTERFACE_FIELD.QUOTE_CURRENCY) {
                //валюта котировки
                idVatQuoteForChecking = block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues;
              }
              if (block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].interfaceField.fieldId === ID_INTERFACE_FIELD.FINANCE_SOURCE) {
                //источник финансирования
                financeForChecking = block[GOODS_FIELDS_BLOCK.FIELD_INFO][i].selectedValues;
              }
            }
          });

          endListGoods.push({
            idGood: item.id,
            idGoodFromFront: item.id,
            nsiGoodValues: [],
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

              goodsForBasis.push({
                idGood: el.id,
                idGoodFromFront: el.id,
                nsiGoodValues: [],
                idGoodName: good.idGoodName,
                idGoodGroup: good.idGoodGroup,
                idNomenclature: good.idNomenclatureGroup,
                priceWithoutVat: el.cost,
                priceAdjustment: el.amendment,
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

        let endDeliverySchedule = []; // массив для  delivSchPeriods

        if (this.schedule.length > 0 && !this.disabledButtonSchedule()) {
          this.schedule.forEach((item) => {
            let goodsForSchedule = [];
            item.goods.forEach((el) => {
              let good = this.goodsList.find((g) => g.id == el.id);
              goodsForSchedule.push({
                idGood: el.id,
                idGoodFromFront: el.id,
                nsiGoodValues: [],
                idGoodName: good.idGoodName,
                idGoodGroup: good.idGoodGroup,
                idNomenclature: good.idNomenclatureGroup,
                periodVolume: el.volume,
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
        }

        let endDelivScope = []; //массив грузополучателей для body

        if (
          this.delivScope.length > 0 ||
          (this.generalInfoStep.controls.contractTypeSeller.value == 20 &&
            this.generalInfoStep.controls.brokerClientSeller?.value?.length ==
              1)
        ) {
          if (
            this.delivScope.length > 0 &&
            this.generalInfoStep.controls.brokerClientSeller?.value.length != 1
          ) {
            this.delivScope.forEach((scope) => {
              let goods = [];
              scope.goods.forEach((g) => {
                let good = this.goodsList.find((el) => el.id == g.goodId);

                goods.push({
                  idGood: g.goodId,
                  idGoodFromFront: g.goodId,
                  nsiGoodValues: [],
                  idGoodName: good.idGoodName,
                  idGoodGroup: good.idGoodGroup,
                  idNomenclature: good.idNomenclatureGroup,
                  volume: g.volume,
                });
              });

              endDelivScope.push({
                idFirmClient: scope.idBroker,
                goods: goods,
              });
            });
          } else {
            let goods = [];
            this.goodsList.forEach((g) => {
              goods.push({
                idGood: g.id,
                idGoodFromFront: g.id,
                nsiGoodValues: [],
                idGoodName: g.idGoodName,
                idGoodGroup: g.idGoodGroup,
                idNomenclature: g.idNomenclatureGroup,
                volume: g.volume,
              });
            });
            endDelivScope.push({
              idFirmClient:
                this.generalInfoStep.controls.brokerClientSeller.value[0],
              goods: goods,
            });
          }
        }

        if (this.offerArchiveGoods?.length > 0) {
          let archiveGood = this.offerArchiveGoods.find(
            (archGood) =>
              archGood.idGood ==
              this.goodsList.find((g) => g.isMainBaseGood)?.id
          );
          this.archiveIdOfferGood =
            archiveGood?.goodsSpecifications[0].idDemandOfferGood;
        } else {
          this.archiveIdOfferGood = this.goodsList.find(
            (g) => g.isMainBaseGood
          )?.idDemandOfferGood;
        }

        const body = {
          idDirection: this.direction || IdDirection.sale,
          idSection: Number(this.sectionId),
          setDemandOffer: {
            idDemandOffer: !this.type ? null : this.idOffer,
            idSession: Number(this.sessionId),
            idModel: Number(this.modelId),
            idCurrency: Number(this.goodsList[0].currency.id),
            vatPercent:
              this.filledFields.vat.id != 1
                ? Number(this.filledFields.vat.name.replace('%', ''))
                : 0,
            isPriceAdjusted: this.filledFields?.adjustedPrice
              ? JSON.parse(
                  this.filledFields?.adjustedPrice.toString().toLowerCase()
                )
              : this.filledFields?.adjustedPrice, //корректируeмая цена
            idFinance: financeForChecking || null, //источник финансирования
            detailsImportDomestic: this.commonParametersForm.get(
              'additionalTermsDomestic'
            )?.value,
            detailsExportForeign: this.commonParametersForm.get(
              'additionalTermsForeign'
            )?.value,
            listDeletedDocuments: this.deleteDocuments, //массив id удаленных док-тов при редактировании
            idDeliveryScheduleType: this.deliveryTermSchedule || null, //id графика поставки
            contractTypeSeller:
              this.generalInfoStep.get('participantSeller').value ==
              role.visitor
                ? null
                : this.generalInfoStep.get('contractTypeSeller')?.value,
            listClientsSeller:
              this.generalInfoStep.get('participantSeller').value ==
              role.visitor
                ? null
                : this.generalInfoStep.get('contractTypeSeller')?.value == 21
                ? [this.generalInfoStep.get('brokerClientSeller')?.value]
                : this.generalInfoStep.get('brokerClientSeller')?.value,
            idBranchSeller:
              this.generalInfoStep.get('participantSeller').value ==
                role.visitor &&
              this.generalInfoStep.get('listBranchSeller')?.value != 0
                ? this.generalInfoStep.get('listBranchSeller')?.value
                : this.generalInfoStep.get('listClientBranchSeller')?.value &&
                  this.generalInfoStep.get('listClientBranchSeller')?.value != 0
                ? this.generalInfoStep.get('listClientBranchSeller')?.value
                : null,
            idFirmBrokerBuyer:
              this.generalInfoStep.controls.participantBuyerInfo.value,
            idFirmClientBuyer:
              this.generalInfoStep.controls.participantBuyer?.value ==
              role.broker
                ? this.generalInfoStep.controls.brokerClientBuyer?.value
                : null,
            idBranchBuyer:
              this.generalInfoStep.controls.participantBuyer?.value ==
                role.visitor &&
              this.generalInfoStep.get('listBranchBuyer')?.value != 0
                ? this.generalInfoStep.get('listBranchBuyer')?.value
                : this.generalInfoStep.get('listClientBranchBuyer')?.value &&
                  this.generalInfoStep.get('listClientBranchBuyer')?.value != 0
                ? this.generalInfoStep.get('listClientBranchBuyer')?.value
                : null,
            idOfferBasedOn: !this.type
              ? this.idOffer
              : this.offerGeneral.idOfferBasedOn,
            idOfferGoodMain: this.archiveIdOfferGood || null,
          },
          goods: endListGoods,
          payCondFull:
            this.termsPaymentForm.controls.termsPayment?.value !=
            termsConditionsPaymentConst.partialPrepayment
              ? {
                  idPaymentType:
                    this.termsPaymentForm.controls.termsPayment?.value,
                  idDayType:
                    this.termsPaymentForm.controls.dayTypeId?.value || null,
                  idShipmentVolume:
                    this.termsPaymentForm.controls.volume?.value,
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
                      ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                          ?.value || null
                      : this.termsPaymentForm.controls.defermentPeriodNumber
                          ?.value || null,
                  periodValueDate:
                    this.termsPaymentForm.controls.termsPayment?.value !=
                    termsConditionsPaymentConst.paymentDeferment
                      ? this.termsPaymentForm.controls.prepaymentPeriodDate
                          ?.value
                        ? this.commonService.toOADate(
                            this.termsPaymentForm.controls.prepaymentPeriodDate
                              ?.value
                          )
                        : null
                      : this.termsPaymentForm.controls.defermentPeriodDate
                          ?.value
                      ? this.commonService.toOADate(
                          this.termsPaymentForm.controls.defermentPeriodDate
                            ?.value
                        )
                      : null,
                }
              : null,
          paymentPart:
            this.termsPaymentForm.controls.termsPayment?.value ==
            termsConditionsPaymentConst.partialPrepayment
              ? {
                  idDayType:
                    this.termsPaymentForm.controls.dayTypeId?.value || null,
                  idShipmentVolume:
                    this.termsPaymentForm.controls.volume?.value,
                  idPaymentMomentPrepay:
                    this.termsPaymentForm.controls.momentPrepayment?.value,
                  firstPercent:
                    this.termsPaymentForm.controls.prepaymentAmount?.value,
                  firstPeriodValueNumber:
                    this.termsPaymentForm.controls.momentPrepayment?.value != 7
                      ? this.termsPaymentForm.controls.prepaymentPeriodNumber
                          ?.value
                      : null,
                  idPaymentMomentDelay:
                    this.termsPaymentForm.controls.momentDelay?.value,
                  secondPercent:
                    this.termsPaymentForm.controls.defermentAmount?.value,
                  secondPeriodValueNumber:
                    this.termsPaymentForm.controls.defermentPeriodNumber
                      ?.value || null,
                  thirdPeriodValueNumber:
                    this.termsPaymentForm.controls.momentPrepayment?.value ==
                      7 &&
                    this.termsPaymentForm.controls.prepaymentAmount?.value < 60
                      ? this.termsPaymentForm.controls.defermentPeriod2?.value
                      : null,
                }
              : null,
          deliveryPeriod: {
            idDeliveryMoment: this.deliveryTermForm.value.startDelivery,
            idPeriodType: this.deliveryTermForm.value.deliveryType,
            periodTypeValue: this.deliveryTermForm.value.deliveryTerm,
            dateBegin: this.deliveryTermForm.value?.startDate
              ? this.commonService.toOADate(
                  this.deliveryTermForm.value?.startDate
                )
              : null,
            dateEnd: this.deliveryTermForm.value?.endDate
              ? this.commonService.toOADate(
                  this.deliveryTermForm.value?.endDate
                )
              : null,
          },
          delivConditions: endDeliveryBasis,
          delivScope: endDelivScope,
          delivSchPeriods: endDeliverySchedule,
          documents: this.documents,
          idVatPercent: this.filledFields.vat.id,
          idVatQuote: idVatQuoteForChecking || 0,
          rules: this.req,
        };

        this.createOfferService
          .SetOfferTargeted(this.user?.token, body)
          .then((res: any) => {
            if (res.idOffer != 0) {
              this.isChangesSaved = true;
              this.message =
                this.idOffer && !this.type
                  ? this.translate.instant(
                      'createOffer.successfulCreateDirectOffer',
                      { lotNumber: res.lotNumber }
                    )
                  : this.translate.instant(
                      'createOffer.successfulEditDirectOffer',
                      { lotNumber: res.lotNumber }
                    );
              this.isVisible = true;
            } else {
              this.error = true;
              this.errorState = 1;
              this.messageError = 'Не найдены пересечения!';
            }
          });
      } catch (error) {
        console.log(error);
      }
    }
  }

  closeSubmitPopup() {
    if (this.idOffer && this.type) {
      this.cancelForm()
    } else {
      this.commonService
        .SessionLogin(
          this.user?.token,
          Number(this.sectionId),
          Number(this.sessionId)
        )
        .then((res: any) => {
          this.cleanupBeforeClose()
          const url = this.router.serializeUrl(
            this.router.createUrlTree(
              [`${this.config.auctions}/english-upgrading-auction/main-page`],
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
          window.location.href = url;
          //  let strAuctions = `${this.config.domain}${this.config.auctions}/english-upgrading-auction/main-page?idSection=${this.sectionId}&idSession=${this.sessionId}`;
      /*    this.router.navigate([`/`], { skipLocationChange: true }).then(() => {
            window.history.replaceState(null, '', window.location.href);
            window.location.href = url;
          });*/
        });
    }
    // this.router.navigate(['/sessions-schedule']);
  }

  public cleanupBeforeClose(): void {
    sessionStorage.removeItem('createOffer');
    sessionStorage.removeItem('editOffer');
  }

  public ngOnDestroy() {
    sessionStorage.removeItem('createOffer');
    sessionStorage.removeItem('editOffer');
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
          this.idOffer
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
              this.idOffer
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
