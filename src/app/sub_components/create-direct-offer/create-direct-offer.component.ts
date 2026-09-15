/* eslint-disable */
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { FiltersService } from '../filters/filters.service';
import { User } from '../../core/classes/user';
import { CommonService, IContractType } from '../../core/services/common-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import {
  CreateOfferService, IGoods,
  INomenclaturesWithGroups,
  NomenclaturesWithGroups
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
  sectionID,
  ErrorStates,
  ID_DELIVERY_TERM,
  ID_DELIVERY_TERM_TYPE,
  BLOCK_ID_FIELDS,
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
import {ID_INTERFACE_FIELD} from "../../shared/enums";
import { createEndObjectForRule } from "../../core/helpers/createObjectForRules";
import { localeDependentDate } from "../../core/helpers/locale-dependent-date";

@Component({
  selector: 'app-create-direct-offer',
  templateUrl: './create-direct-offer.component.html',
  styleUrls: ['./create-direct-offer.component.scss'],
})
export class CreateDirectOfferComponent
  implements OnInit, OnDestroy, ComponentCanDeactivate
{
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

  user: User;
  locale: string;

  role: any;
  UserRoleSeller: number;
  /*ListBranchesAllClientsSeller: any;
  ListBranchesFirmSeller: any;*/
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
  disabledAssignmentsBuyer = false; //todo
  disabledCommissionBuyer = true;

  listBranchBuyer = [];
  brokerClientBuyer = [];
  listClientBranchBuyer: any = [];
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

  public refs = [];
  refsValues = [];
  public catalogProducts = [];

  // sections = [];
  public nomenclaturesWithGroups: NomenclaturesWithGroups[] = [];
  public goodsGroup = [];
  public goodsValue = [];
  public searchIcon: any;

  public error = false;
  public messageError: string;
  public errorState: number;

  public errorFromEdit: any; //Любая ошибка при редактировании, при которой не смогли не загрузиться данные

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
    listBranchWorkerBuyer: [],
  });

  sectionDescription: any;
  currentPage: number = 1;
  totalPages: number;
  totalCount: number;

  listProperties = [];

  listPropertiesStr = [];
  listPropertiesInt = [];

  firstElement = false; // первый элемент в массиве товаров
  // пересечения
  deliveryConditions = [];
  deliverySchedule = [];
  deliveryTerm = [];
  termsConditionsPaymentIntersections = [];
  termsConditionsPayment = [];
  /* currencyConditions = [];
  vatConditions = [];
  financeSourcesConditions = [];
  currencyQuotesConditions = [];*/
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

  disabledContractTypeSeller = false; //задизэйблить тип договора
  disabledContractTypeBuyer = false; //задизэйблить тип договора

  deleteDocuments = []; //массив удаленных документов

  isEditedDeliveryTerm = false; // при редактировании заявки отредактировано ли что-нибудь в срок поставки
  isEditedTermsPayment = false; // при редактировании заявки отредактировано ли что-нибудь в срок оплаты

  allCharacteristics = [];
  dayTypePaymentConfig: any; //Справочник календарных и банковских дней
  todayPlusDay: Date;
  idMarketType: string;
  public readonly sectionID = sectionID;
  isAdjustedPriceResetError = false;

  constructor(
    private formBuilder: FormBuilder,
    public commonService: CommonService,
    public router: Router,
    private createOfferService: CreateOfferService,
    public translate: TranslateService,
    private sidebarService: SidebarService,
    private location: Location,
    public catalogService: CatalogService,
    public offerManagementService: OfferManagementService,
    public config: AppConfigService
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

    this.createOffer = JSON.parse(sessionStorage.getItem('createOffer')) || {
      idOffer: this.createOfferService.idOffer,
      sessionName: this.createOfferService.sessionName,
      sectionName: this.createOfferService.sectionName,
      sessionDateTime: this.createOfferService.sessionDateTime,
      sessionId: this.createOfferService.sessionId,
      sectionId: this.createOfferService.sectionId,
      modelId: this.createOfferService.modelId,
      choosenMarketType: this.createOfferService.choosenMarketType,
      direction: this.createOfferService.direction,
      modelsResult: this.createOfferService.modelResult,
      demandsModal: this.createOfferService.demandsModal,
    };

    this.idOffer = this.createOffer.idOffer;
    this.direction = this.createOffer.direction;
    this.sessionName = this.createOffer.sessionName;
    this.sectionId = Number(this.createOffer.sectionId);
    this.sectionName = this.commonService.choosenSection(this.sectionId, this.translate.store.currentLang);
    this.sessionId = Number(this.createOffer.sessionId);
    this.sessionDateTime = this.createOffer.sessionDateTime;
    this.modelId = this.createOffer.modelId;
    this.modelsResult = this.createOffer.modelsResult;
    this.demandsModal = this.createOffer.demandsModal;

    if (!this.sessionId) {
      this.error = true;
      this.errorState = ErrorStates.error;
      this.errorFromEdit = true;
      this.messageError = this.translate.store.currentLang == 'RU'
        ? RU['createOffer'].duplicateMessage
        : EN['createOffer'].duplicateMessage;
      return;
    }

    this.GetRoleSeller();

    if (this.idOffer && this.direction) {
      //РЕДАКТИРОВНАИЕ
      this.getFullInfo();
    }

    if (this.createOfferService.sessionId) {
      sessionStorage.setItem('createOffer', JSON.stringify(this.createOffer));
    }
    this.todayPlusDay = new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate() + 1
    );

    this.initContractTypeSeller();

    this.createOfferService
      .GetPaymentConfig(this.user.token, this.sectionId)
      .then((res: any) => {
        this.paymentConfig = res.data;
      });

    // получаем справочник календарные и банковские дни
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

    if (!this.idOffer) this.getDemandsModal();
  }

  async getFullInfo() {
    await this.createOfferService
      .GetOfferFullInfo(
        this.user?.token,
        this.sectionId,
        this.sessionId,
        this.idOffer
      )
      .then((res: any) => {
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
  }

  editOfferSetValue() {
    try {
      if (this.offerGeneral) {
        if (this.UserRoleSeller == role.worker) {
          this.getParticipantFromWorkerSeller();
          this.getParticipantFromWorkerBuyer();
        } else {
          this.getParticipantFromTraderSeller();
          this.getParticipantFromTraderBuyer();
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
      this.offerDocuments.forEach((file) => {
        this.commonService
          .GetDirectOfferDocumentContent(
            this.user?.token,
            file.idDemandOffer,
            file.idDocument,
            this.direction
          )
          .subscribe((res: any) => {
            if (file.isPrivate) {
              this.hiddenFiles.push(
                Object.assign(file, { content: res.content })
              );
            } else {
              this.commonFiles.push(
                Object.assign(file, { content: res.content })
              );
            }
          });
      });

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

      item.goodsSpecifications.forEach((field) => {
        fields.push({
          interfaceField: {
            blockId: [40, 57, 58, 59, 21].includes(field.idInterfaceField)
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
          selectedValues: field.selectedValues
            ? field.selectedValues
            : field.fieldValueNumber
            ? field.fieldValueNumber
            : field.fieldValueString,
        });
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
      });
    });
    //this.goodsList.forEach(good => {                      //поиск пересечений и return допустимых значений для выпадающего списка
    this.good = this.goodsList[0];
    await this.intersections();

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
                ].includes(field.interfaceField.fieldId) ||
                ((field.interfaceField.referenceId || field.interfaceField.referenceAlias) &&
                  field.interfaceField.isAvailableFreeInput)))
                field.dataSource = blField.selectedValues
                  ? blField.selectedValues
                  : blField.interfaceField.allowedValues;
              else {
                if (field.interfaceField.fieldId == 2) {
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
            field.interfaceField.isAvailableFreeInput =
              blField.interfaceField.isAvailableFreeInput;
            field.interfaceField.fieldDataType =
              blField.interfaceField.fieldDataType;
            field.isRequired = blField.isRequired;
            field.interfaceField.referenceAlias =
              blField.interfaceField.referenceAlias;
            field.interfaceField.referenceId =
              blField.interfaceField.referenceId;
            field.interfaceField.isAvailableMultiSelection =
              blField.interfaceField.isAvailableMultiSelection;
            field.interfaceField.isAccessibleForWorker =
              blField.interfaceField.isAccessibleForWorker;
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
        let blockId = [40, 57, 58, 59, 21].includes(
          blField.interfaceField.fieldId
        )
          ? 0
          : blField.interfaceField.blockId;
        if (block[0] == blockId) {
          let fieldOffer = block[1].find(
            (el) => el.interfaceField.fieldId == blField.interfaceField.fieldId
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
                fieldDataType: blField.interfaceField.fieldDataType,
                isAvailableFreeInput:
                blField.interfaceField.isAvailableFreeInput,
                isAvailableMultiSelection:
                  blField.interfaceField.isAvailableMultiSelection,
                referenceAlias: blField.interfaceField.referenceAlias,
                isAccessibleForWorker:
                  blField.interfaceField.isAccessibleForWorker,
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

    /*      this.blockModal.fields.forEach(blField => {
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
    //  })
    this.totalForm.controls.vat.patchValue(
      this.filledFields.vat.name.replace('%', '')
    );
    this.getSchedule()
  }

  public getSchedule(): void {
    if (
      this.offerDelivSchPeriods.length > 0 &&
      !this.isEditedDeliveryTerm
    ) {
      //график поставки
      if (this.offerGoods.length == this.goodsList.length) {
        // проверка все ли товары совпадают
        let sum = 0;
        this.goodsList.forEach((good) => {
          if (good?.characteristicsNSIOfferGood) {
            if (
              JSON.stringify(good?.characteristicsNSIOfferGood) ==
              JSON.stringify(good?.characteristicsNSI)
            )
              sum++;
          } else {
            if (this.offerGoods.find((el) => el.idGood == good.id))
              sum++;
          }
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
          this.sumVolumeGoodSchedule = [];
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

          let offerSchedule =
            this.offerDelivSchPeriods.reduce(function (r, a) {
              //сгруппированы поля по periodDateBegin
              r[a.periodDateBegin] = r[a.periodDateBegin] || [];
              r[a.periodDateBegin].push(a);
              return r;
            }, {});
          offerSchedule = Object.entries(
            offerSchedule
          );

          offerSchedule.sort(function (a, b) {
            //сортировка по дате начала по возрастанию, чтобы отображался график в правильном порядке
            return a[0] - b[0];
          });

          offerSchedule.forEach((sch, index) => {
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
  }

  //----------------------------ШАГ 1----------------------------//

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

  GetDeliveryBasesTreeByModelId() {
    this.createOfferService
      .GetDeliveryBasesTreeByModelId(
        this.user.token,
        this.modelId,
        this.sectionId
      )
      .then((res: any) => {
        for (let item in res.data) {
          this.demandsModal.blocks.forEach((block) => {
            if (block.id == item) {
              //выбираем уникальные значения базисов без учёта древовидности
              block.deliveryConditions.selectedValues.bases = [
                ...new Map(
                  res.data[item].map(
                    (
                      item //уникальные значения в массиве deliveryConditionsParent
                    ) => [item['basisName'], item]
                  )
                ).values(),
              ];
            }
          });
        }
        if (this.idOffer) this.editOfferSetValue();
      });
  }

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

  checkSeller(openRole) {
    this.delivScope = [];
    this.generalInfoStep.get('brokerClientSeller').patchValue(null);
    this.generalInfoStep.get('listClientBranchSeller').patchValue(null);
    this.generalInfoStep.get('participantBuyerInfo').patchValue(null);
    this.generalInfoStep.get('participantBuyer').patchValue(null);
    this.generalInfoStep.get('listBranchSeller').patchValue(null);
    this.generalInfoStep.get('participantSeller').patchValue(openRole);

    if (openRole == role.visitor) {
      // this.generalInfoStep.controls.contractTypeSeller.patchValue(null)
      this.GetBranchesListFirmSeller();
      this.generalInfoStep.controls.brokerClientSeller.setValue(null);
      this.generalInfoStep.controls.listClientBranchSeller.setValue(null);
      this.generalInfoStep.controls.contractTypeSeller.setValue(null);
      this.getContractorsVisitors();
    } else {
      if (
        this.disabledAssignmentsSeller == true &&
        this.disabledCommissionSeller == false
      ) {
        this.generalInfoStep.controls.contractTypeSeller.patchValue(20);
      } else this.generalInfoStep.controls.contractTypeSeller.patchValue(21);
      //  this.GetListClientsContractSeller()
      this.GetBranchesFirmsOfAllClients();
    }
  }

  //посетитель - структурные
  async GetBranchesListFirmSeller() {
    this.CheckDemoffOwnerStateSeller();
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
        this.initContractTypeSeller();
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
    // if (this.idOffer && this.listClientBranchSeller?.length > 0 && !this.offerGeneral.branchId) {         //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
    //   this.generalInfoStep.controls.listClientBranchSeller.patchValue(this.listClientBranchSeller[0].idFirmBranch)
    //   this.listBranchChooseSeller = this.listClientBranchSeller[0].nameShort
    // }
  }

  /*  //клиенты брокера в зависимости от типа договора
    GetListClientsContractSeller() {
      this.createOfferService.GetListClientsContract(this.user?.token, this.sectionId, [this.sessionId], this.direction, this.generalInfoStep.get('contractTypeSeller').value).then((res: any) => {
        this.brokerClientSeller = res.listClientsContract;
      })
    }

    // структурные клиентов брокера
    GetListBranchesClientsSeller() {
      this.createOfferService.GetListBranchesClients(this.user?.token, this.generalInfoStep.controls.brokerClientSeller.value, this.generalInfoStep.get('contractTypeSeller').value, this.sectionId, [this.sessionId], this.direction).then((res: any) => {
        this.listClientBranchSeller = res.branches

        if(this.idOffer && this.listClientBranchSeller?.length >0 && !this.offerGeneral.branchId) {         //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
          this.generalInfoStep.controls.listClientBranchSeller.patchValue(this.listClientBranchSeller[0].idFirmBranch)
          this.listBranchChooseSeller = this.listClientBranchSeller[0].nameShort
        }
      })
    }*/

  //контекстная проверка
  CheckDemoffOwnerStateSeller() {
    const body = {
      idSection: this.sectionId,
      idSession: this.sessionId,
      idModel: this.modelId,
      contractType:
        this.generalInfoStep.get('participantSeller').value == role.visitor
          ? null
          : this.generalInfoStep.get('contractTypeSeller')?.value || null,
      idFirmClient:
        this.generalInfoStep.get('participantSeller').value == role.broker &&
        this.generalInfoStep.get('contractTypeSeller')?.value == 21
          ? this.generalInfoStep.get('brokerClientSeller')?.value
          : null,
      idBranch:
        (this.generalInfoStep.get('participantSeller').value != role.visitor
          ? this.generalInfoStep.get('listClientBranchSeller')?.value
          : this.generalInfoStep.get('listBranchSeller')?.value) || null,
    };
    this.createOfferService
      .CheckStateSeller(this.user?.token, body)
      .then((res: any) => {
        this.errorBrokerClientMessageSeller = '';
        if (res.isStateExceptional != null) {
          this.errorState = res.isStateExceptional;
          this.error = true;
          this.messageError = res.stateMessage;
          this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
          if (this.errorState == 1) {
            this.errorBrokerClientMessageSeller = this.messageError;
          }
        }
      });
  }

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
        this.CheckDemoffOwnerStateSeller();
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
  async getContractorsVisitors() {
    //если это работник (а это может быть только редактирование) - передавать идентификатор владельца заявки
    //- иначе оставлять поле пустым, бэк сам подставит данные
    const res: any = await this.createOfferService.GetContractorsVisitors(
      this.user?.token,
      this.generalInfoStep.get('participantSeller').value == role.broker &&
        this.generalInfoStep.get('contractTypeSeller').value == '21'
        ? this.generalInfoStep.controls.brokerClientSeller?.value
        : this.user?.IsWorker
        ? this.offerGeneral.sellerInfo.firmId
        : ''
    );
    let visitors = res.visitors.reduce(function (r, a) {
      //сгруппированы поля по blockId
      r[a.buyerInfo.idFirm] = r[a.buyerInfo.idFirm] || [];
      r[a.buyerInfo.idFirm].push(a);
      return r;
    }, {});
    visitors = Object.entries(visitors);
    this.visitorsList = [];
    for (const visitor of visitors) {
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
    }
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

  async getParticipantFromWorkerBuyer() {
    //редактирование работником
    await this.getContractorsVisitors();
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
      this.disabledContractTypeBuyer = true;
      this.generalInfoStep.controls.listClientBranchWorkerBuyer.patchValue(
        this.offerGeneral.buyerInfo.branchName
      );
      this.brokerClientChooseBuyer.push(
        this.offerGeneral?.buyerInfo.clientName
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
        this.offerGeneral.buyerInfo.clientName
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

    this.CheckDemoffOwnerStateBuyer();
  }

  async getParticipantFromTraderBuyer() {
    //редактирование трейдером
    await this.getContractorsVisitors();
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
    /*  if(this.idOffer && this.listClientBranchBuyer?.length > 0 && !this.offerGeneral.branchId)
    {         //при подаче был выбран клиент со структурным подразделением - прочерк, при редактировании так отображать
      this.generalInfoStep.controls.listClientBranchBuyer.patchValue(this.listClientBranchBuyer[0].idFirmBranch)
      this.listBranchChooseBuyer = this.listClientBranchBuyer[0].nameShort
    }*/
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
      // this.generalInfoStep.controls.contractTypeSeller.patchValue(null)
      this.GetBranchesListFirmBuyer();
      this.generalInfoStep.controls.brokerClientBuyer.setValue(null);
      this.generalInfoStep.controls.listClientBranchBuyer.setValue(null);
      this.generalInfoStep.controls.contractTypeBuyer.setValue(null);
    } else {
      /*if (this.disabledAssignmentsBuyer == true && this.disabledCommissionBuyer == false) {
        this.generalInfoStep.controls.contractTypeBuyer.patchValue(20)
      } else*/
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

        if (this.good) {
          this.createOfferService
            .GetStatisticsPayments(
              this.user?.token,
              this.sectionId,
              this.sessionId,
              this.idMarketType,
              this.good.id,
              this.good.units.id
            )
            .then((res: any) => {
              this.termsConditionsPayment =
                this.termsConditionsPaymentIntersections.filter((el) =>
                  res.payments?.some((b) => Number(el.paymentConditionId) == b)
                );
            });
        }
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
    return !(
      this.generalInfoSellerValidationGroup?.instance?.validate().isValid &&
      this.errorBrokerClientMessageSeller?.length == 0
    );
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

  //----------------------------ШАГ 2----------------------------//

  onChangeSelectBox(e: any, str: string) {
    if (!e.value || e.value.length == 0) {
      switch (str) {
        case 'broker': {
          this.generalInfoStep.controls.listClientBranchSeller.setValue(null);
          this.listBranchChooseSeller = null;
          break;
        }
        case 'nomenclaturesWithGroups': {
          this.chooseGood.controls.goodsGroup.setValue(null);
          this.listPropertiesStr = [];
          break;
        }
        case 'goodsGroup': {
          this.chooseGood.controls.goods.setValue(null);
          if (this.listPropertiesStr?.includes(-3)) {
            //если в массиве есть -3 - id справочника тов. группы
            let index = this.listPropertiesStr.indexOf(-3); // Находим индекс id справочника
            if (index !== -1) {
              this.listPropertiesStr.splice(index - 1, 2);
            }
          }
          break;
        }
        case 'goods': {
          this.refs = [];
          this.listPropertiesInt = [];
          if (this.listPropertiesStr?.includes(-4)) {
            //если в массиве есть -4 - id справочника товара
            let indexG = this.listPropertiesStr.indexOf(-4); // Находим индекс id справочника
            let indexTG = this.listPropertiesStr.indexOf(-3);
            if (indexG !== -1 && indexTG !== -1 && indexTG < indexG) {
              // удаляем элементы между -3 и -4
              this.listPropertiesStr.splice(indexTG + 1, indexG - indexTG + 1);
            }
          }
          break;
        }
      }
    } else {
      switch (str) {
        case 'broker': {
          this.generalInfoStep.get('participantBuyerInfo').patchValue(null);
          this.generalInfoStep.get('participantBuyer').patchValue(null);
          this.onChooseBrokerSeller();
          this.generalInfoStep.controls.listBranchSeller.setValue(null);
          this.generalInfoStep.controls.listClientBranchSeller.setValue(null);
          this.getContractorsVisitors();
          if (this.generalInfoStep.controls.contractTypeSeller.value == 21)
            this.GetListBranchesClientsSeller();
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
            this.listPropertiesStr = [e.value].concat(-2); // -2 - id справочника ном. группы
          }
          break;
        }
        case 'goodsGroup': {
          // this.listProperties.splice(this.listProperties.indexOf(e.previousValue), 1)
          this.chooseGood.controls.goods.setValue(null);

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

                if (this.listPropertiesStr?.includes(-3)) {
                  //если в массиве есть -3 - id справочника тов. группы
                  let index = this.listPropertiesStr.indexOf(-3); // Находим индекс id справочника
                  if (index !== -1) {
                    // Заменяем пред. id ТГ
                    this.listPropertiesStr.splice(index - 1, 1, e.value);
                  }
                } else {
                  this.listPropertiesStr = this.listPropertiesStr.concat(
                    [e.value].concat(-3)
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
        case 'goods': {
          if (this.listPropertiesStr?.includes(-4)) {
            //если в  массиве есть -4 - id справочника товара
            let index = this.listPropertiesStr.indexOf(-4); // Находим индекс id справочника
            if (index !== -1) {
              // Заменяем пред. id ТГ
              this.listPropertiesStr.splice(index - 1, 1, e.value);
            }
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              [e.value].concat(-4)
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
      }
    }
  }

  public onChooseNomenclature(): void {
    this.createOfferService
      .GetNomenclaturesWithGroups(
        this.user?.token,
        this.sectionId,
        this.modelId
      )
      .subscribe((res: INomenclaturesWithGroups) => {
        this.nomenclaturesWithGroups = res.nomenclaturesWithGroups;

        if (this.nomenclaturesWithGroups.length == 1) {
          this.chooseGood.controls.nomenclaturesWithGroups.setValue(
            this.nomenclaturesWithGroups[0].idValue
          );
        }
      });
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
          let indexG = this.listPropertiesStr.indexOf(-4); // Находим индекс товара
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

  onShowProducts() {
    this.catalogProducts = [];
    this.totalPages = 0;
    this.totalCount = 0;
    let ListGoods = [];
    if (this.chooseGood.get('catalogTypes').value == 'personal') {
      const idFirmClient = this.generalInfoStep.controls.contractTypeSeller?.value === ID_DOCUMENT.AGENCY_AGREEMENT ?
        this.generalInfoStep.controls.brokerClientSeller?.value : '';
      this.createOfferService
        .GetPersonalCatalogTarg(
          this.user?.token,
          this.sectionId,
          this.sessionId,
          this.modelId,
          this.listPropertiesStr,
          this.listPropertiesInt,
          this.chooseGood.controls.searchParameters?.value || undefined,
          this.currentPage,
          this.idMarketType,
          idFirmClient
        )
        .then((res: any) => {
          this.catalogProducts = res.goods;
          this.totalPages = res.totalPages;
          this.totalCount = res.totalCount;
          document.getElementById('scrollView').scrollIntoView();
        });
    } else {
      this.createOfferService
        .GetGlobalCatalogTarg(
          this.user?.token,
          this.sectionId,
          this.sessionId,
          this.modelId,
          this.listPropertiesStr,
          this.listPropertiesInt,
          this.chooseGood.controls.searchParameters?.value || undefined,
          this.currentPage,
          this.idMarketType
        )
        .then((res: any) => {
          this.catalogProducts = res.goods;
          this.totalPages = res.totalPages;
          this.totalCount = res.totalCount;
          document.getElementById('scrollView').scrollIntoView();
        });
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

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    //по кнопке esc
    if (this.chooseGoodForm && !this.isOpenSidebar) {
      //открыто окно выбора товара и закрыта панель Sidebar
      this.popup.instance.hide();
    }
    if (document.getElementById('mySidebar').style.opacity == '0') {
      //панель Sidebar закрыта (условия для того чтобы, если открыта и попап и Sidebar, то при нажатии esc не закрывалось сразу два окна)
      this.isOpenSidebar = false;
    }
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

  onChooseGood(good) {
    this.good = good;
    /* if (this.deliveryBasis?.length > 0) {
      this.popupForm = true;
      this.popupTitle = this.translate.store.currentLang == 'RU' ? RU["login_form"].notification : EN["login_form"].notification
      this.popupMessage = this.translate.store.currentLang == 'RU' ? RU["errors"].addGoodAfterBasis : EN["errors"].addGoodAfterBasis
      this.popupButton = false;
    } else {*/
    this.onChooseGoodContinue();
  }

  async onChooseGoodContinue() {
    if (await this.intersections()) {
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

  async intersections() {
    //поиск товара в блоках модели: сначала по 3 уровню, затем по уровню - 2
    let blockFind: any = [];
    blockFind = this.findBlock();

    /*let deliveryConditionsPrev = JSON.parse(JSON.stringify(this.deliveryConditions)),
      deliverySchedulePrev = JSON.parse(JSON.stringify(this.deliverySchedule)),
      deliveryTermPrev = JSON.parse(JSON.stringify(this.deliveryTerm)),
      termsConditionsPaymentPrev = JSON.parse(JSON.stringify(this.termsConditionsPayment)),
      currencyConditionsPrev = JSON.parse(JSON.stringify(this.currencyConditions)),
      vatConditionsPrev = JSON.parse(JSON.stringify(this.vatConditions)),
      financeSourcesConditionsPrev = JSON.parse(JSON.stringify(this.financeSourcesConditions)),
      currencyQuotesConditionsPrev = JSON.parse(JSON.stringify(this.currencyQuotesConditions));*/

    if (Object.keys(blockFind).length != 0) {
      await this.intersectionsBlocks(blockFind);
    } //если не нашли товар в блоке модели
    else this.error = true;

    if (this.error) {
      this.errorState = 1;
      this.deliveryConditions = [];
      this.deliverySchedule = [];
      this.deliveryTerm = [];
      this.termsConditionsPaymentIntersections = [];
      /*      this.currencyConditions = [];
      this.vatConditions = [];
      this.currencyQuotesConditions = [];*/

      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['errors'].noIntersectionsSpecialBlocks
          : EN['errors'].noIntersectionsSpecialBlocks;
      return false;
    } else {
      this.good;
      this.blockModal = blockFind;
      return true;
    }
  }

  isMinPriceOnBasicBasis = null;
  isNotSpecified = null;

  async intersectionsBlocks(blockFind) {
    for (let i = 0; i < 6; i++) {
      if (!this.error) {
        switch (i) {
          case 0: {
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
            }
            break;
          }

          //проверка пересечений по специальным блокам (условия поставки, срок поставки, график поставки, условия и срок оплаты)
          case 1: {
            //график поставки может быть не заполнен (это необязательное поле)
            this.deliverySchedule = JSON.parse(
              JSON.stringify(blockFind.deliverySchedule.selectedValues)
            ); //заполнение deliverySchedule значением из блока модели
            break;
          }

          case 2: {
            //срок поставки
            if (this.deliveryTerm.length == 0) {
              this.deliveryTerm = JSON.parse(
                JSON.stringify(blockFind.deliveryTerm.selectedValues)
              );
            }
            break;
          }

          case 3: {
            //условия и срок оплаты
            this.termsConditionsPaymentIntersections = JSON.parse(
              JSON.stringify(blockFind.termsConditionsPayment.selectedValues)
            );
            if (this.termsConditionsPaymentIntersections.length == 0) {
              this.error = true;
            }
            break;
          }
          /*//пересечения по полям: валюта заявки, ставка НДС, источник финансирования, корректируемая цена, валюта котировки
          case 4: {
            let currency = blockFind?.fields.find(el => el.interfaceField.fieldId == 4)   //валюта

            if (currency) {
              if (this.currencyConditions.length == 0) {
                this.currencyConditions = currency.selectedValues ? JSON.parse(JSON.stringify(currency.selectedValues)) : JSON.parse(JSON.stringify(currency.interfaceField.allowedValues))
              } else {
                this.currencyConditions = this.currencyConditions.filter(a => currency.selectedValues ?
                  currency?.selectedValues?.some(b => JSON.stringify(a) == JSON.stringify(b)) :
                  currency.interfaceField.allowedValues.some(b => JSON.stringify(a) == JSON.stringify(b)));
              }

              if (this.currencyConditions?.length == 0)
                this.error = true
            } else {                                                  //если в одном блоке валюта была,а в другом - нет
              if (this.currencyConditions?.length > 0)
                this.error = true
            }
            if (!this.error && this.goodsList.length > 0 && currency) {        //проверка выбранного значения в первом товаре и его наличия в пересечениях
              // field['4'].find(el=> el.interfaceField.fieldId == 4).dataSource = this.currencyConditions
              if (!this.currencyConditions.find(el => el.id == this.goodsList[0]?.currency?.id)) {
                let listValues = '';
                this.currencyConditions.forEach(item => {
                  listValues = listValues + item.name + ';'
                })
              }
            }
            break;
          }

          case 5: {
            let vat = blockFind?.fields.find(el => el.interfaceField.fieldId == 5)   //ставка НДС
            if (vat) {
              if (this.vatConditions.length == 0) {
                this.vatConditions = vat.selectedValues ? JSON.parse(JSON.stringify(vat.selectedValues)) : JSON.parse(JSON.stringify(vat.interfaceField.allowedValues))
              } else {
                this.vatConditions = this.vatConditions?.filter(a => vat?.selectedValues ?
                  vat.selectedValues.some(b => JSON.stringify(a) == JSON.stringify(b)) :
                  vat.interfaceField.allowedValues.some(b => JSON.stringify(a) == JSON.stringify(b)));
              }

              if (this.vatConditions?.length == 0)
                this.error = true;
            } else {                                                    //если в одном блоке ставка НДС была, а в другом - нет
              if (this.vatConditions?.length > 0)
                this.error = true;
            }
            if (!this.error && this.goodsList.length > 0 && vat && this.vatConditions?.length > 0) {        //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (!this.vatConditions.find(el => el.id == this.filledFields.vat?.id)) {
                let listValues = '';
                this.vatConditions.forEach(item => {
                  listValues = listValues + item.name + ';'
                })
              }
            }
            break;
          }

          case 6: {
            let financeSources = blockFind.fields.find(el => el.interfaceField.fieldId == 11)   //источник финансирования

            if (financeSources) {
              if (this.financeSourcesConditions.length == 0) {
                this.financeSourcesConditions = financeSources?.selectedValues ? JSON.parse(JSON.stringify(financeSources?.selectedValues)) : JSON.parse(JSON.stringify(financeSources.interfaceField.allowedValues));
              } else {
                this.financeSourcesConditions = this.financeSourcesConditions?.filter(a => financeSources.selectedValues ?
                  financeSources.selectedValues.some(b => JSON.stringify(a) == JSON.stringify(b)) :
                  financeSources.interfaceField.allowedValues.some(b => JSON.stringify(a) == JSON.stringify(b)));
              }

              if (this.financeSourcesConditions?.length == 0)
                this.error = true;
            } else {
              if (this.financeSourcesConditions?.length > 0)
                this.error = true;
            }
            if (!this.error && this.goodsList.length > 0 && financeSources && this.financeSourcesConditions?.length > 0) {        //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (!this.financeSourcesConditions?.find(el => el?.id == this.filledFields?.finance)) {
                let listValues = '';
                this.financeSourcesConditions.forEach(item => {
                  listValues = listValues + item.name + ';'
                })
              }
            }
            break;
          }

          case 7: {
            let currencyQuotes = blockFind.fields?.find(el => el.interfaceField.fieldId == 55)   //валюта котировки

            if (currencyQuotes) {
              if (this.currencyQuotesConditions.length == 0) {
                this.currencyQuotesConditions = currencyQuotes.selectedValues ? JSON.parse(JSON.stringify(currencyQuotes.selectedValues)) : JSON.parse(JSON.stringify(currencyQuotes.interfaceField.allowedValues));
              } else {
                this.currencyQuotesConditions = this.currencyQuotesConditions?.filter(a => currencyQuotes.selectedValues ?
                  currencyQuotes.selectedValues.some(b => JSON.stringify(a) == JSON.stringify(b)) :
                  currencyQuotes.interfaceField.allowedValues.some(b => JSON.stringify(a) == JSON.stringify(b)));
              }

              if (this.currencyQuotesConditions?.length == 0)
                this.error = true;
            } else {
              if (this.currencyQuotesConditions?.length > 0)
                this.error = true;
            }
            if (!this.error && this.goodsList.length > 0 && currencyQuotes && this.currencyQuotesConditions.length > 0) {        //проверка выбранного значения в первом товаре и его наличия в пересечениях

              if (!this.currencyQuotesConditions?.find(el => el?.id == this.filledFields.currencyQuotes)) {
                let listValues = '';
                this.currencyQuotesConditions.forEach(item => {
                  listValues = listValues + item.name + ';'
                })
              }
            }
            break;
          }
*/
          case 4: {
            let adjustablePrice = blockFind.fields?.find(
              (el) => el.interfaceField.fieldId == 47
            ); //Корректируемая цена
            if (this.goodsList.length == 0 || this.goodsList[0] == this.good) {
              this.adjustablePriceConditions = adjustablePrice;
            }
            break;
          }
          //поле 62 Место назначения
          case 5: {
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
  }

  /*deliveryConditionsIntersections(blockFind) {
    if (this.isMinPriceOnBasicBasis == blockFind.deliveryConditions.selectedValues.isMinPriceOnBasicBasis)         //сравнение чекбокса isMinPriceOnBasicBasis
    {
      if (this.isNotSpecified == blockFind.deliveryConditions.selectedValues.isNotSpecified) {                      //сравнение чекбокса isNotSpecified
        //сравнение массива значений
        this.deliveryConditions = this.deliveryConditions?.filter(a =>
          blockFind.deliveryConditions.selectedValues.bases?.some(b => {
            let equal = false;
            if (a.linkId == b.linkId && a.minAddBasisPlaces == b.minAddBasisPlaces && a.minAddBasis == b.minAddBasis && a.isRequiredPlace == b.isRequiredPlace) {
              if (a?.children?.length > 0) {
                a.children = a?.children.filter(child => b?.children.find(Bchild => JSON.stringify(child) == JSON.stringify(Bchild)));

                if (a?.children?.length > 0 && a?.children?.length >= a.minAddBasis) {
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
      } else
        this.error = true;
    } else
      this.error = true;
    /!*    if(!this.error && this.deliveryBasis.length > 0){           //Заполнены условия поставки и вернулись добавить еще один товар
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
        }*!/
  }

  deliveryTermIntersections(blockFind) {
    this.deliveryTerm = this.deliveryTerm.filter(a => blockFind.deliveryTerm.selectedValues.some(b => {
      let equal = false;
      if (a.deliveryStartId == b.deliveryStartId && a.deliveryTermId == b.deliveryTermId) {
        if (a.dayValues) {                                                              //проверка данных массива дней
          a.dayValues = a.dayValues.filter(aDays => b.dayValues.includes(aDays));   //записываем только общие данные в массив
          if (a.dayValues.length != 0)
            equal = true;
        }

        if (a.monthValues) {                                                            //проверка данных массива месяцев
          a.monthValues = a.monthValues.filter(aMonth => b.monthValues.includes(aMonth));  //записываем только общие данные в массив
          if (a.monthValues.length != 0)
            equal = true;
        }
        if (a.endDeliveryDate == b.endDeliveryDate || a.startDeliveryDate == b.startDeliveryDate) {
          equal = true;
        }
      }
      return equal;
    }));

    if (this.deliveryTerm.length == 0) {
      this.error = true;
    }
    /!*    if(!this.error && this.deliveryTermForm?.controls?.startDelivery?.value && this.deliveryTermConcated.length > 0){          //Если заполнен Срок поставки и вернулись добавить еще один товар
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
        }*!/
  }
*/
  addGood(item: any, str?: string) {
    this.goodInfo = false;
    this.editInfoGood = null;
    this.firstElement = false;
    let temp = this.goodsList.findIndex((g) => g.id == this.good.id); //ищем товар в списке добавленных
    if (item === false) {
      //ничего не пришло-удаляем
      this.OnDelete();
    } else if (!item) {
      //отмена редактирования
      if (temp == -1) {
        //закрыть
        this.deliveryConditions = [];
        this.deliverySchedule = [];
        this.deliveryTerm = [];
        this.termsConditionsPaymentIntersections = [];
        /* this.currencyConditions = [];
        this.vatConditions = [];
        this.financeSourcesConditions = [];
        this.currencyQuotesConditions = [];*/
        this.adjustablePriceConditions = undefined;
        this.isNotSpecified = undefined;
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
          if (!str) {
            let unitFromGood;
            if (this.good.fields)
              unitFromGood = this.good.fields
                .find((el) => el[0].toString() == '3')[1]
                .find(
                  (field) => field.interfaceField.fieldId == 2
                ).selectedValues;
            if (units['units'].id != unitFromGood || !unitFromGood) {
              //если значения отличаются, то сбрасываем условия поставки
              this.isEditedTermsPayment = true;
              //выбора единицы измерения в форме добавления товара необходимо дополнительно выполнить пересечение между данными модели и котировочными данными для условий оплаты.
              this.createOfferService
                .GetStatisticsPayments(
                  this.user?.token,
                  this.sectionId,
                  this.sessionId,
                  this.idMarketType,
                  this.good.id,
                  units['units'].id
                )
                .then((res: any) => {
                  this.termsConditionsPayment =
                    this.termsConditionsPaymentIntersections.filter((el) =>
                      res.payments?.some(
                        (b) => Number(el.paymentConditionId) == b
                      )
                    );
                  if (this.termsPaymentForm.controls.termsPayment?.value) {
                    this.termsPaymentForm.controls.termsPayment.reset();
                    this.onTermsPaymentChange('termsPayment');
                  }
                });
            }
          }
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

      /*item[7]?.forEach(i => {
        if (i.interfaceField.fieldId == 11) {                                 //источник финансирования
          this.filledFields = Object.assign(this.filledFields, {finance: i.selectedValues});
        }
      })*/

      if (temp != -1) {
        //редактируем товар
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

        // пересчет формы Итого по заявке
        this.totalForm.controls.costWithoutVat.patchValue(
          Number(costNoVATValue).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.amountVAT.patchValue(
          amountVATValue
            ? Number(amountVATValue).toLocaleString('ru', {
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
          Number(costVATValue).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.quantity.patchValue(
          Number(volume['volume']).toLocaleString('ru', {
            maximumFractionDigits: this.volumePrecision,
          }) +
            ' ' +
            units['units'].name
        );
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
            priceAdjustment
          )
        );

        // пересчет формы Итого по заявке
        this.totalForm.controls.costWithoutVat.patchValue(
          Number(costNoVATValue).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.amountVAT.patchValue(
          amountVATValue || amountVATValue == 0
            ? Number(amountVATValue).toLocaleString('ru', {
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
          Number(costVATValue).toLocaleString('ru', {
            minimumFractionDigits: this.currencyPrecision,
            maximumFractionDigits: this.currencyPrecision,
          }) +
            ' ' +
            currency['currency'].name
        );
        this.totalForm.controls.quantity.patchValue(
          Number(volume['volume']).toLocaleString('ru', {
            maximumFractionDigits: this.volumePrecision,
          }) +
            ' ' +
            units['units'].name
        );
      }
      this.totalForm.controls.vat.patchValue(
        this.filledFields.vat.name.replace('%', '')
      );
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
        let find = this.deliveryBasis[0].goods.find(
          (bg) => bg.id == this.goodsList[0].id
        );
        if (!find) {
          this.deliveryBasis = [];
        } else {
          find.volume = this.goodsList[0].volume;
          find.units = this.goodsList[0].units.name;
          find.cost = this.goodsList[0].cost;
          find.currency = this.goodsList[0].currency.name;
          find.quotation = this.goodsList[0].quotation;
          find.quoteCurrency = this.goodsList[0].quoteCurrency;
          find.priceAdjustment = this.goodsList[0].priceAdjustment?.id;
          find.amendment = this.goodsList[0].amendment;
          find.costVAT =
            this.commonService.round(
              this.goodsList[0].cost * this.goodsList[0].volume,
              this.currencyPrecision
            ) +
            this.commonService.round(
              (this.goodsList[0].cost * this.goodsList[0].volume * vat) / 100,
              this.currencyPrecision
            );
        }
      }
      if (this.schedule.length > 0) {
        this.schedule.forEach(sch => {
          sch.goods[0].units = this.goodsList[0].units.name
        })
      }
      if (this.delivScope.length > 0) {
        this.delivScope.forEach((scope) => {
          scope.goods[0].goodUnits = this.goodsList[0].units.name;
        });
      }

      setTimeout(() => {
        //для того чтобы экран проехал вверх и затем вывелся тост
        this.toastMessage = this.translate.store.currentLang == 'RU'
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

  OnDelete() {
    this.goodsList = [];

    this.totalForm.controls.vat.reset(null);
    this.totalForm.controls.costWithoutVat.reset(null);
    this.totalForm.controls.amountVAT.reset(null);
    this.totalForm.controls.costVat.reset(null);
    this.totalForm.controls.quantity.reset(null);
    this.isNotSpecified = undefined;

    this.deliveryConditions = [];
    this.deliverySchedule = [];
    this.deliveryTerm = [];
    this.termsConditionsPaymentIntersections = [];
    this.termsConditionsPayment = [];
    /*  this.currencyConditions = [];
    this.vatConditions = [];
    this.financeSourcesConditions = [];
    this.currencyQuotesConditions = [];*/
    this.adjustablePriceConditions = undefined;
    this.isNotSpecified = undefined;

    this.deleteGood = false;
  }

  onEdit(good: any) {
    this.editInfoGood = good.id;
    this.viewInfoGood = null;
    this.good = good;
    if (this.idOffer) {
      this.blockModal = this.findBlock();
    }
    this.firstElement = true;

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

  /*-------- Шаг 4 -------*/
  openBasis = [];
  deleteBasis = false;
  deleteGood = false;

  uniqueDeliveryTerm: any[];
  deliveryTermSchedule: string; // вид графика поставки

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
    //невозможно сохранить с неправильной ценой
    this.deliveryBasis[0].goods[0].error = false;
    this.deliveryBasis[0].goods[0].quotation = null;
    if (this.dataGrid) this.dataGrid.instance.refresh();
    //если поменяли цену товара в базисе, то заменяем цену в массиве товаров
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
      this.good = this.goodsList[0];
      let goodFromGoodsList = JSON.parse(JSON.stringify(this.good));
      let vat,
        goodFromGoodsListField = goodFromGoodsList.fields.find(
          (item) => item[0] == 4
        )
          ? goodFromGoodsList.fields.find((item) => item[0] == 4)[1]
          : null,
        VAT = goodFromGoodsList.fields
          .find((item) => item[0] == 4)[1]
          .find((j) => j.interfaceField.fieldId == 5); //ставка НДС

      if (
        goodFromGoodsListField.find((j) => j.interfaceField.fieldId == 3)
          .selectedValues != g.cost
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
          (j) => j.interfaceField.fieldId == 3
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
        let editFields = {};
        goodFromGoodsList.fields.forEach((el) => {
          editFields[el[0]] = el[1];
        });
        this.addGood(editFields, 'basis');
      }
    });
  }

  onDeleteBasis() {
    this.deliveryBasis.length = 0;
    this.openBasis = [];
    this.deleteBasis = false;
    this.addBasisValue = false;
  }

  onEditBasis(e, b, id, place) {
    e.event.stopPropagation();
    this.addBasisValue = true;
    this.openBasis = this.deliveryBasis;

    let cancelButton = document.getElementById('cancelButton');
    cancelButton.setAttribute('disabled', 'true');
    let nextButton = document.getElementById('nextButton');
    nextButton.setAttribute('disabled', 'true');
  }

  /*------------- Шаг 3 -------------*/
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

        if (this.termsPaymentForm.controls.termsPayment.value) {
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
          this.timberTicket = true;
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

  /*-------------- шаг 5 --------------*/
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
        error = true;
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
        error = true;
    }
    return error;
  }

  public resetAdjustedPrice(): void{
    this.popupForm = false;
    this.filledFields.adjustedPrice = "false";
    this.goodsList.forEach(good => {
      const blockFields = good.fields.find(el => el[0] === BLOCK_ID_FIELDS.PRICE_BLOCK)
      blockFields[1].find(field => field.interfaceField.fieldId === ID_INTERFACE_FIELD.ADJUSTED_PRICE).selectedValues = 'false'
    })
    this.isVisibleToast = true;
    this.toastMessage = this.translate.store.currentLang == 'RU'
      ? RU['createOffer'].paymentDeliveryTerms.adjustablePriceReset
      : EN['createOffer'].paymentDeliveryTerms.adjustablePriceReset;
    this.activeStep++;
    this.isAdjustedPriceResetError = false
  }

  /*----------- Общий функционал -----------*/
  async goToNextStep() {
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
          this.error = this.isDifferentPeriod();
          if (this.error) {
            this.errorState = 1;
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
              } else if (Number(good.volume) != Number(findGood.sumValue)) {
                // не совпадают значения объема
                this.errorState = ErrorStates.error;
                this.error = true;
                this.messageError =
                  this.translate.store.currentLang == 'RU'
                    ? RU['createOffer'].paymentDeliveryTerms
                      .variousQuantity
                    : EN['createOffer'].paymentDeliveryTerms
                      .variousQuantity;
              }
            });
          }
        }

        if(this.filledFields?.adjustedPrice?.toString() === "true" &&
          (this.schedule?.length === 0 ||
            this.disabledButtonSchedule())){
          this.popupForm = true;
          this.popupButton = false;
          this.popupTitle = this.translate.store.currentLang == 'RU'
            ? RU['login_form'].notification
            : EN['login_form'].notification;
          this.isAdjustedPriceResetError = true;
          this.popupMessage = this.translate.store.currentLang == 'RU'
            ? RU['errors'].adjustedPriceReset
            : EN['errors'].adjustedPriceReset;
          return;
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

          if (
            this.modelsResult?.pricingTypeId !=
            pricingType?.formulaWithoutQuotation
          ) {
            this.deliveryBasis.forEach((item) => {
              //проверка на минимальную цену можно не делать, потому что там 0 , а когда внутри, то уже есть проверка
              if (!item.goods.every((g) => g.cost > 0)) {
                this.error = true;
                this.errorState = 1;
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
            });
          }
          if (this.deliveryBasis?.length > 0) {
            const res: any =
              await this.createOfferService.GetStatisticsPriceLimit(
                this.user?.token,
                this.sectionId,
                this.sessionId,
                this.termsPaymentForm.controls.termsPayment?.value,
                this.idMarketType,
                this.goodsList[0].currency.id,
                this.filledFields.vat.id != 1
                  ? Number(this.filledFields.vat.name.replace('%', ''))
                  : '',
                this.goodsList[0].id,
                this.goodsList[0].units.id,
                this.deliveryBasis[0].idBasisValue,
                this.deliveryBasis[0]?.idPlaceLink
              );

            if (this.goodsList[0].cost < res.priceWithoutVat) {
              this.deliveryBasis[0].goods[0].error = true;
              this.deliveryBasis[0].goods[0].quotation = res.priceWithoutVat;
            }

            if (this.deliveryBasis[0].goods[0].error) {
              return;
            }
          }
          /*          let minAddBasis = this.deliveryBasis.find(el => el.coreBasis == true)?.minAddBasis;
          //поиск количества дополнительных базисов:
          //количество всех базисов отнимаем 1 (основной базис)
          let countAddBasis = this.deliveryBasis.length - 1;
          if (minAddBasis && (countAddBasis < minAddBasis)) {
            this.error = true;
            this.errorState = 1;
            this.messageError = (this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.minAddBasisError : EN["createOffer"].termsDeliveryTime.minAddBasisError) + ' ' + minAddBasis;
            return;
          }*/
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

              this.onCreateString();
              this.getSchedule()
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
          if (this.termsConditionsPayment?.length > 0) {
            this.termsPaymentForm.controls.termsPayment.patchValue(
              this.offerPaymentCond.idPaymentType.toString()
            );
            this.onTermsPaymentChange('termsPayment');
            this.paymentTermConcated =
              this.offerGeneral.concatedPaymentConditions;
          }
        }

        break;
      }
      case 4: {
        this.createOfferService
          .GetStatisticsBases(
            this.user?.token,
            this.sectionId,
            this.sessionId,
            this.termsPaymentForm.controls.termsPayment?.value,
            this.idMarketType,
            this.goodsList[0].id,
            this.goodsList[0].units.id
          )
          .then((res: any) => {
            this.deliveryConditions = this.deliveryConditions.filter((el) =>
              res.basesValues?.some((b) => Number(el.valueId) == b)
            );
          });
        if (this.deliveryBasis?.length > 0) {
          const res: any =
            await this.createOfferService.GetStatisticsPriceLimit(
              this.user?.token,
              this.sectionId,
              this.sessionId,
              this.termsPaymentForm.controls.termsPayment?.value,
              this.idMarketType,
              this.goodsList[0].currency.id,
              this.filledFields.vat.id != 1
                ? Number(this.filledFields.vat.name.replace('%', ''))
                : '',
              this.goodsList[0].id,
              this.goodsList[0].units.id,
              this.deliveryBasis[0].idBasisValue,
              this.deliveryBasis[0]?.idPlaceLink
            );

          if (this.goodsList[0].cost < res.priceWithoutVat) {
            this.deliveryBasis[0].goods[0].error = true;
            this.deliveryBasis[0].goods[0].quotation = res.priceWithoutVat;
          }
        }
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

  req: {};

  checkOffer(e, type?) {
    if (e.validationGroup.validate().isValid) {
      this.req = {
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
                this.idOffer &&
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
                documentContent: item.content.split('base64,')[1],
                isPrivate: false,
              });
            }
          });
        }
        if (this.hiddenFiles.length > 0) {
          this.hiddenFiles.forEach((item) => {
            if (
              !(
                this.idOffer &&
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
                documentContent: item.content.split('base64,')[1],
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
            for (let i = 0; i < block[1].length; i++) {
              if (
                (block[1][i].interfaceField.controlFieldType == 'dxCheckBox' ||
                  block[1][i].interfaceField.controlFieldType ==
                    'dxNumberBox' ||
                  block[1][i].interfaceField.controlFieldType ==
                    'dxSelectBox' ||
                  block[1][i].interfaceField.controlFieldType == 'dxTextBox') &&
                block[1][i].selectedValues != null
              ) {
                // учитываем лишь те поля, которые есть в модели
                let blField = this.blockModal.fields.find(
                  (blField) =>
                    blField.interfaceField.fieldId ==
                    block[1][i].interfaceField.fieldId
                );
                if (blField) {
                  endProperties.push({
                    idInterfaceField: block[1][i].interfaceField.fieldId,
                    fieldValueNumber:
                      (block[1][i].interfaceField.controlFieldType ==
                        'dxSelectBox' &&
                        !block[1][i].interfaceField
                          ?.isAvailableMultiSelection &&
                        !block[1][i].interfaceField.isAvailableFreeInput) ||
                      block[1][i].interfaceField.controlFieldType ==
                        'dxNumberBox'
                        ? Number(block[1][i].selectedValues)
                        : block[1][i].interfaceField.fieldId ===
                        ID_INTERFACE_FIELD.PRODUCT_LOCATION &&
                        block[1][i].idSelectedValues
                          ? Number(block[1][i].idSelectedValues)
                        : null,
                    fieldValueString:
                      block[1][i].interfaceField.controlFieldType ==
                        'dxTextBox' ||
                      block[1][i].interfaceField.controlFieldType ==
                        'dxCheckBox' ||
                      (block[1][i].interfaceField.controlFieldType ==
                        'dxSelectBox' &&
                        block[1][i].interfaceField.isAvailableFreeInput)
                        ? block[1][i].selectedValues.toString()
                        : null,
                  });
                }
              }
              if (block[1][i].interfaceField.fieldId == 55) {
                //валюта котировки
                idVatQuoteForChecking = block[1][i].selectedValues;
              }
              if (block[1][i].interfaceField.fieldId == 11) {
                //источник финансирования
                financeForChecking = block[1][i].selectedValues;
              }
            }
          });

          endListGoods.push({
            idGood: item.id,
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

        const body = {
          idDirection: this.direction || IdDirection.sale,
          idSection: Number(this.sectionId),
          setDemandOffer: {
            idDemandOffer: Number(this.idOffer) || null,
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
            idOfferBasedOn: null,
            idOfferGoodMain: null,
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
              this.message = this.idOffer
                ? this.translate.instant(
                    'createOffer.successfulEditDirectOffer',
                    { lotNumber: res.lotNumber }
                  )
                : this.translate.instant(
                    'createOffer.successfulCreateDirectOffer',
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

  getNumber(value) {
    return Number(value);
  }

  closeSubmitPopup() {
    if (this.offerGoods.length > 0) {
      this.cancelForm();
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
         /* this.router.navigate([`/`], { skipLocationChange: true }).then(() => {
            window.history.replaceState(null, '', window.location.href);
            window.location.href = url;
          });*/
        });
    }
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

  cancelForm() {
    this.isChangesSaved = true;
    this.cleanupBeforeClose()
    history.back();
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
