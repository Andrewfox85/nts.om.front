/* eslint-disable */
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { SidebarService } from '../../core/services/sidebar-service.service';
import {
  IdDirection,
  offerStatus,
  pricingType,
  sessionStage,
  SORT_ID_ACTUAL_FIELDS,
  termsConditionsPaymentConst,
  DisplaySpecMode,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS
} from '../../api.constants';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CreateOfferService } from '../../core/services/create-offer-service.service';
import { User } from '../../core/classes/user';
import { CommonService } from '../../core/services/common-service.service';
import { Router } from '@angular/router';
import { CatalogService } from '../../core/services/catalog-service.service';
import { Location } from '@angular/common';
import { OfferManagementService } from '../../core/services/offer-management-service.service';
import { DxPopupComponent } from 'devextreme-angular';
import { DemandOfferCataloguePayload } from 'src/app/shared/interfaces';
import { ID_INTERFACE_FIELD } from '../../shared/enums';
import { GoodsSpecifications, OfferGood } from '../../core/interfaces/interface';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import {
  getTranslateResultByCurrentLang,
  excelToJSDate,
} from 'src/app/core/helpers';
import { EditPriceStepService } from './../../core/services/edit-price-step-service.service';

@Component({
  selector: 'app-view-offer',
  templateUrl: './view-offer.component.html',
  styleUrls: ['./view-offer.component.scss'],
})
export class ViewOfferComponent implements OnInit {
  public user: User;

  public totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  public contentHiddenDomestic: boolean = false;
  public contentHiddenForeign: boolean = false;
  public clientHidden: boolean = false;

  public sessionStage = sessionStage;
  public offerStatus = offerStatus;
  public pricingType = pricingType;
  public IdDirection = IdDirection;
  public ID_INTERFACE_FIELD = ID_INTERFACE_FIELD;
  public DisplaySpecMode = DisplaySpecMode;

  public idOffer: number;
  public offerGeneral: any;
  public offerGoods = [];
  public deliveryScopes: [];
  public delivSchPeriods: [];
  public deliveryConditions = [];
  public offerDocuments = [];
  public paymentCond: any;
  public deliveryPeriod: any;

  public deliveryConditionsChoose = []; //выбранный базис

  public uniqueDelConditions = []; //уникальные значения в массиве deliveryConditions
  public basisValue: string; //выбранное значение для базисов

  public VatField: any; //Ставка НДС

  public currencyPrecision: any; //точность валюты
  public quoteCurrencyPrecision: any; //точность валюты
  public uniqueDeliveryScopes = []; //никальный список клиентов брокера

  public popup: boolean = false; //popup окно
  public popupMessage: string; //текст в попапе
  public popupTitle: string; //название в попапе
  public popupType: string; //тип сообщения

  public rejectPopup: boolean = false; //попап для отменения заявки
  public rejectPopupTitle: string;
  public rejectReason: string = '';

  public editFromSideBar: any;
  public createTemplateSideBar: any;
  public popupSuccess: boolean = false; //успешно завершено
  public popupSuccessMess: string;
  public myTemplate: number = 0;

  public Privileges: boolean = false;
  public rejectionTemplatesFull = [];
  public chooseRejectionTempl = {};
  public isVisibleToast: boolean = false;
  public direction: number;

  public deadlinePayment: number | string;
  public deadlineDelivery: number | string;

  public isArchive: boolean; //для просмотра архивной заявки
  public unsold: boolean; //просмотр непроданных лотов
  public idSection: number;
  public idSession: number;

  public modelResult: {
    isAllowedAnalogues: boolean;
  };

  public isNoBounds = false; //наличие двух границ у ценового коридора
  public infoForRestore: any = [];
  public isActiveQuotation: boolean = false;
  public isActiveRange: boolean = false;
  public priceRange: any = [];
  public activePriceLimit: any;
  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  private isSameGradesInSaleOffer: boolean = false;

  constructor(
    private sidebarService: SidebarService,
    private createOfferService: CreateOfferService,
    public commonService: CommonService,
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    public router: Router,
    public catalogService: CatalogService,
    private location: Location,
    private offerManagementService: OfferManagementService,
    private pageMeta: PageMetaService,
    private editPriceStepService: EditPriceStepService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    let viewOfferInfo = JSON.parse(localStorage.getItem('viewOffer'));
    this.idOffer = this.createOfferService.idOffer || viewOfferInfo?.idOffer;
    this.direction =
      this.createOfferService.direction || viewOfferInfo?.direction;

    this.isArchive =
      this.createOfferService.isArchive != null
        ? this.createOfferService.isArchive
        : viewOfferInfo?.isArchive || false;
    this.unsold =
      this.createOfferService.unsold != null
        ? this.createOfferService.unsold
        : viewOfferInfo?.unsold || false;
    this.idSection =
      this.createOfferService.sectionId || viewOfferInfo?.idSection;
    this.idSession =
      this.createOfferService.sessionId || viewOfferInfo?.idSession;

    this.modelResult =
      this.createOfferService.modelResult || viewOfferInfo?.isAllowedAnalogues;

    const DEPOSIT_TITLE = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.detailedInformation'
    );
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(
      this.offerGeneral?.lotNumber,
      DEPOSIT_TITLE,
      faviconUrl
    );

    localStorage.setItem(
      'viewOffer',
      JSON.stringify({
        idOffer: this.idOffer,
        direction: this.direction,
        isArchive: this.isArchive,
        unsold: this.unsold,
        idSection: this.idSection,
        idSession: this.idSession,
        isAllowedAnalogues: this.modelResult.isAllowedAnalogues,
      })
    );

    if (!this.isArchive) {
      this.getData();
    } else {
      this.getArchiveData();
    }

    this.editFromSideBar = this.sidebarService.trigger$.subscribe(() =>
      this.onEditOffer()
    );
    this.createTemplateSideBar = this.sidebarService.template$.subscribe(() => {
      this.onGetRejectionTemplates();
      this.isVisibleToast = true;
    });
  }

  getData() {
    this.createOfferService
      .GetWorkerOfferFullInfo(this.user?.token, this.idOffer, this.direction)
      .then((res: any) => {
        this.prepareData(res);
      });
  }

  public sortActualFields(
    fields: GoodsSpecifications[]
  ): GoodsSpecifications[] {
    let blockZeroFields = [],
      otherFields = [];
    fields.forEach((field) => {
      if (
        [
          ID_INTERFACE_FIELD.ACTUAL_LENGTH,
          ID_INTERFACE_FIELD.ACTUAL_DIAMETER,
          ID_INTERFACE_FIELD.ACTUAL_WIDTH,
          ID_INTERFACE_FIELD.ACTUAL_THICKNESS,
          ID_INTERFACE_FIELD.PRODUCT_READINESS,
        ].includes(field.idInterfaceField)
      ) {
        field.sortBy =
          SORT_ID_ACTUAL_FIELDS['FIELD_' + field.idInterfaceField] || 0;
        blockZeroFields.push(field);
      } else otherFields.push(field);
    });
    blockZeroFields.sort((a, b) => a.sortBy - b.sortBy);
    return [...blockZeroFields, ...otherFields];
  }

  public getArchiveData(): void {
    if (this.unsold) {
      this.commonService
        .UnsoldGetOfferFullInfo(
          this.user?.token,
          this.idSection,
          this.idSession,
          this.idOffer
        )
        .then((res: any) => {
          this.prepareData(res);
        });
    } else
      this.createOfferService
        .GetArchiveOfferFullInfo(
          this.user?.token,
          this.direction,
          this.idSection,
          this.idSession,
          this.idOffer
        )
        .subscribe((res: any) => {
          this.prepareData(res);
        });
  }

  public prepareData(res): void {
    //обработка данных по архивным задачам
    this.offerGeneral = res.generalInfo;
    this.offerGoods = res.goods;
    this.deliveryScopes = !this.offerGeneral.isDeliveryScopeGraded ? res.deliveryScopes : res.deliveryScopesGraded;
    this.delivSchPeriods = res.delivSchPeriods.length ? res.delivSchPeriods : res.delivSchPeriodsGraded;
    this.deliveryConditions = res.deliveryConditions;
    this.offerDocuments = res.documents;
    this.paymentCond = res.paymentCond;
    this.deliveryPeriod = res.deliveryPeriod;
    this.isSameGradesInSaleOffer = res.delivSchPeriodsGraded?.length > 0 || this.offerGeneral.isDeliveryScopeGraded;

    this.direction = this.offerGeneral.directionId;

    if (this.user?.IsWorker) {
      //получение привилегий для работника
      const sectionsArray = JSON.parse(localStorage.getItem('sections'));
      let sectionDescription = sectionsArray.find(
        (el) => el.id === Number(this.offerGeneral.sectionId)
      )?.description;
      sectionDescription =
        'DemandOfferManagementProcessDemoff' + sectionDescription;
      this.Privileges = this.commonService.checkPrivileges(sectionDescription);
    }

    this.getUniqueDelConditions();

    this.offerGoods.forEach((good) => {
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE
      ); //Ставка НДС

      //ищем поля с мультивыбором, группируя по idInterfaceField
      let groupFields = good.goodsSpecifications.reduce(function (r, a) {
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
        for (let i = 1; i < groupFields[id]?.length; i++) {
          groupFields[id][0].fieldValue =
            groupFields[id][0].fieldValue +
            '; ' +
            groupFields[id][i].fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
        }
        groupFields[id] = [groupFields[id][0]]; //из массива данных с одинаковым idInterfaceField, делаем одно поле, в котором fieldValue включает в себя все выбранные значения
      });
      good.goodsSpecifications = Object.values(groupFields).flat(); //массив с индивидуальными idInterfaceField

      if (
        this.offerGeneral.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        this.commonService
          .GetPrecision(
            this.user?.token,
            this.getValue(
              this.offerGoods[0].goodsSpecifications,
              ID_INTERFACE_FIELD.CURRENCY,
              'fieldValueNumber'
            )
          )
          .subscribe((res) => {
            this.currencyPrecision = res;
            let count = Number(
              this.getValue(
                good.goodsSpecifications,
                ID_INTERFACE_FIELD.QUANTITY,
                'fieldValueNumber'
              )
            ); //количество
            let priceWithoutVat = Number(
              this.getValue(
                good.goodsSpecifications,
                ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
                'fieldValueNumber'
              )
            ); //Цена без НДС
            let vat;

            if (this.VatField.fieldValueNumber != 1) {
              vat = Number(this.VatField.fieldValue.replace(/[^0-9]/g, ''));
            } else vat = 0;

            let costWithoutVAT = this.commonService.round(
              count * priceWithoutVat,
              this.currencyPrecision
            );
            let amountVAT = this.commonService.round(
              costWithoutVAT * (vat / 100),
              this.currencyPrecision
            );
            let costVAT = costWithoutVAT + amountVAT;

            good.goodsSpecifications.push(
              {
                costWithoutVAT: costWithoutVAT,
                fieldName: getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'createOffer.total.costNoVAT'
                ),
                fieldValue: costWithoutVAT,
              },
              {
                amountVAT: amountVAT,
                fieldName: getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'createOffer.total.amountVAT'
                ),
                fieldValue: amountVAT,
              },
              {
                costVAT: costVAT,
                fieldName: getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'createOffer.total.costVAT'
                ),
                fieldValue: costVAT,
              }
            );
          });
      }

      Object.assign(good, {
        currency: this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.CURRENCY,
          'fieldValue'
        ),
      }); //добавляем каждому товару Валюта

      if (
        this.offerGeneral.pricingTypeId == this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.QUOTE_CURRENCY,
          'fieldValue'
        ); //Валюта котировки
        let priceAdjustment = this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          'fieldValueNumber'
        ); //Тип поправки
        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      }
      if (
        this.offerGeneral.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          'fieldValueNumber'
        ); //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }

      good.goodsSpecifications = this.sortActualFields(
        good.goodsSpecifications
      );
    });

    //заполнение формы ИТОГО
    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)
    if (this.onSameUnits()) {
      //Количество
      let volumeSum = 0,
        precision;
      this.offerGoods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
        );
        volumeSum = volumeSum + volume.fieldValueNumber;
        precision = volume.fieldPrecision;
      });
      this.totalForm.controls.quantity.patchValue(
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
          ' ' +
          this.offerGoods[0].unitName
      );
    }
    if (this.deliveryConditions?.length > 0) {
      this.onChangeBasis({ value: this.basisValue });
    } else if (
      this.offerGeneral.pricingTypeId != pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }

    if (this.offerGeneral.pricingTypeId == pricingType.formulaWithQuotation) {
      this.commonService
        .GetPrecision(
          this.user?.token,
          this.getValue(
            this.offerGoods[0].goodsSpecifications,
            ID_INTERFACE_FIELD.CURRENCY,
            'fieldValueNumber'
          )
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }

    //контрольный срок оплаты и поставки, только для работника
    if (this.user?.IsWorker && !this.isArchive) {
      this.createOfferService
        .GetPayDelivDeadlines(
          this.user?.token,
          this.unsold ? this.idSection : this.offerGeneral.sectionId,
          this.unsold ? this.idSession : this.offerGeneral.idSession,
          false,
          this.paymentCond.idPaymentType,
          this.paymentCond.idPaymentType !=
            termsConditionsPaymentConst.paymentDeferment
            ? this.paymentCond.firstPaymentMomentId
            : null,
          this.paymentCond.idPaymentType ==
            termsConditionsPaymentConst.paymentDeferment
            ? this.paymentCond.firstPaymentMomentId
            : this.paymentCond.idPaymentType ==
              termsConditionsPaymentConst.partialPrepayment
            ? this.paymentCond.secondPaymentMomentId
            : null,
          this.paymentCond.idDayType || null,
          this.paymentCond.firstPeriodValueNumber || null,
          this.paymentCond.firstPeriodValueDate
            ? this.commonService.toOADate(
                excelToJSDate(this.paymentCond.firstPeriodValueDate)
              )
            : null,
          this.paymentCond.secondPeriodValueNumber || null,
          this.paymentCond.thirdPeriodValueNumber || null,
          this.deliveryPeriod.idDeliveryMoment,
          this.deliveryPeriod.idDeliveryType,
          this.deliveryPeriod.periodTypeValue,
          this.deliveryPeriod.dateBegin
            ? this.commonService.toOADate(
                excelToJSDate(this.deliveryPeriod.dateBegin)
              )
            : null,
          this.deliveryPeriod.dateEnd
            ? this.commonService.toOADate(
                excelToJSDate(this.deliveryPeriod.dateEnd)
              )
            : null
        )
        .then((res: any) => {
          this.deadlinePayment = res.deadlinePayment || '-';
          this.deadlineDelivery = res.deadlineDelivery || '-';
        });
    }
  }

  public getValue(specs, idField: number, prop: string): string | number {
    const found = specs.find((field) => field.idInterfaceField == idField);
    return found ? found[prop] : null;
  }

  public getUniqueDelConditions(): void {
    if (this.deliveryConditions?.length > 0) {
      this.uniqueDelConditions = [
        ...new Map(
          this.deliveryConditions.map(
            (
              item //уникальные значения в массиве deliveryConditions
            ) => [item['concatedCondition'], item]
          )
        ).values(),
      ];
      let main = this.uniqueDelConditions.find((basis) => basis.isMain == true);
      this.basisValue = main.concatedCondition;
      this.uniqueDelConditions.splice(
        this.uniqueDelConditions.indexOf(main),
        1
      );
      this.uniqueDelConditions.splice(0, 0, main);
    }
  }

  public changeTotalCost(): void {
    //рассчитываем стоимость без НДС, сумму НДС, стоимость с НДС и форму ИТОГО рассчитываем по значениям цены из выбранного базиса
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat =
      this.VatField.fieldValueNumber != 1
        ? Number(this.totalForm.controls.vat.value.replace(/[^0-9]/g, ''))
        : 0;
    if (
      this.offerGeneral.pricingTypeId != pricingType.formulaWithoutQuotation
    ) {
      this.commonService
        .GetPrecision(
          this.user?.token,
          this.getValue(
            this.offerGoods[0].goodsSpecifications,
            ID_INTERFACE_FIELD.CURRENCY,
            'fieldValueNumber'
          )
        )
        .subscribe((res) => {
          this.currencyPrecision = res;

          this.offerGoods.forEach((good) => {
            if (this.deliveryConditions?.length > 0) {
              this.deliveryConditionsChoose.forEach((basis) => {
                if (
                  basis.idDemandOfferGood ==
                  good.goodsSpecifications[0].idDemandOfferGood
                ) {
                  let count = Number(
                    this.getValue(
                      good.goodsSpecifications,
                      ID_INTERFACE_FIELD.QUANTITY,
                      'fieldValueNumber'
                    )
                  ); //количество
                  let priceWithoutVat = basis?.priceWithoutVat; //Цена без НДС

                  let costWithoutVAT = this.commonService.round(
                    count * priceWithoutVat,
                    this.currencyPrecision
                  ); //цена из базиса умножаем на количество из товаров
                  let amountVAT = this.commonService.round(
                    costWithoutVAT * (vat / 100),
                    this.currencyPrecision
                  );
                  let costVAT = costWithoutVAT + amountVAT;

                  good.goodsSpecifications.forEach((item) => {
                    if (item.costWithoutVAT) {
                      item.costWithoutVAT = costWithoutVAT;
                      item.fieldValue = costWithoutVAT;
                    }
                    if (item.amountVAT || item.amountVAT == 0) {
                      item.amountVAT = amountVAT;
                      item.fieldValue = amountVAT;
                    }
                    if (item.costVAT) {
                      item.costVAT = costVAT;
                      item.fieldValue = costVAT;
                    }
                  });

                  costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
                  amountVATTotal = amountVATTotal + amountVAT;
                  costVATTotal = costVATTotal + costVAT;
                }
              });
            } else {
              //заявки без базисов
              let count = Number(
                this.getValue(
                  good.goodsSpecifications,
                  ID_INTERFACE_FIELD.QUANTITY,
                  'fieldValueNumber'
                )
              ); //количество
              let priceWithoutVat = Number(
                this.getValue(
                  good.goodsSpecifications,
                  ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
                  'fieldValueNumber'
                )
              ); //Цена без НДС

              let costWithoutVAT = this.commonService.round(
                count * priceWithoutVat,
                this.currencyPrecision
              ); //цена из базиса умножаем на количество из товаров
              let amountVAT = this.commonService.round(
                costWithoutVAT * (vat / 100),
                this.currencyPrecision
              );
              let costVAT = costWithoutVAT + amountVAT;

              good.goodsSpecifications.forEach((item) => {
                if (item.costWithoutVAT) {
                  item.costWithoutVAT = costWithoutVAT;
                  item.fieldValue = costWithoutVAT;
                }
                if (item.amountVAT || item.amountVAT == 0) {
                  item.amountVAT = amountVAT;
                  item.fieldValue = amountVAT;
                }
                if (item.costVAT) {
                  item.costVAT = costVAT;
                  item.fieldValue = costVAT;
                }
              });

              costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
              amountVATTotal = amountVATTotal + amountVAT;
              costVATTotal = costVATTotal + costVAT;
            }
          });
          this.totalForm.controls.costWithoutVat.patchValue(
            Number(costWithoutVatTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.offerGoods[0].currency
          );
          // const amountVAT =  Number(costWithoutVat.toFixed(this.currencyPrecision)) * (vat / 100)
          this.totalForm.controls.amountVAT.patchValue(
            Number(amountVATTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.offerGoods[0].currency
          );
          this.totalForm.controls.costVat.patchValue(
            costVATTotal.toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.offerGoods[0].currency
          );
        });
    }
  }

  public getDataFromBasis(good: OfferGood, idField: number): number {
    let find = this.deliveryConditionsChoose?.find(
      (b) =>
        b.idDemandOfferGood === good.goodsSpecifications[0].idDemandOfferGood
    );
    if (idField === ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT) {
      //Цена без НДС
      return find.priceWithoutVat;
    } else if (idField === ID_INTERFACE_FIELD.MIN_PRICE) {
      //минимальная цена
      return find.minPriceWithoutVat;
    } else {
      //Поправка
      return find.priceAdjustment;
    }
  }

  public getRawValue(field: GoodsSpecifications, good: OfferGood): number | string {
    if (
      this.deliveryConditions?.length > 0 &&
      [
        ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
        ID_INTERFACE_FIELD.AMENDMENT,
      ].includes(field.idInterfaceField)
    ) {
      return this.getDataFromBasis(good, field.idInterfaceField);
    }

    if (field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_STEP) {
      return field.fieldValueNumber;
    }

    return field.fieldValue;
  }

  public getActualRowValue(field: GoodsSpecifications): number | string {
    if (ACTUAL_SIZE_FIELDS.includes(field.idInterfaceField)) {
      return field.fieldValue
        ? this.commonService.actualDimensions(
          field.fieldValue,
          0
        )
        : "-";
    }

    return field.fieldValue;
  }

  public shouldShowDeliveryPrice(fieldId: number): boolean {
    return [ID_INTERFACE_FIELD.MIN_PRICE].includes(fieldId)
      && this.deliveryConditions?.length > 0;
  }

  getClientName() {
    this.uniqueDeliveryScopes = [
      ...new Map(
        this.deliveryScopes.map(
          (
            item //уникальные значения в массиве deliveryConditions
          ) => [item['idFirmClient'], item]
        )
      ).values(),
    ];
    return this.uniqueDeliveryScopes;
  }

  public checkIsPrivateDocuments(): boolean {
    return this.offerDocuments?.some((file) => file.isPrivate == true);
  }

  public checkNoPrivateDocuments(): boolean {
    return this.offerDocuments?.some((file) => file.isPrivate == false);
  }

  onChangeBasis(e) {
    // this.loadingVisible = true
    this.deliveryConditionsChoose = [];
    this.deliveryConditionsChoose = this.deliveryConditions.filter(
      (el) => el.concatedCondition == e.value
    );
    if (
      this.offerGeneral.pricingTypeId != pricingType.formulaWithoutQuotation
    ) {
      this.changeTotalCost();
    }
  }

  public getNumber(int): number {
    return Number(int.replaceAll(/[^,\d]/g, '', '').replace(/,/, '.'));
  }

  openSidebar(i: any) {
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('dark').className = 'dark_opened';
    const dataForReq = {
      id: i.idGood,
      name: i.goodName,
      nomenclature: i.nomenclatureGroup,
      group: i.goodGroup,
    };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('good');
  }

  public onDetailInfo(): void {
    let info = {
      sectionId: this.offerGeneral.sectionId,
      name: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'general.detailedInformation'
      ),
      direction: this.offerGeneral.directionId,
      pricingTypeId: this.offerGeneral.pricingTypeId,
      deliveryConditions: this.deliveryConditions,
      offerGoods: this.offerGoods,
      deliverySchedule: this.delivSchPeriods,
      isSameGradesInSaleOffer: this.isSameGradesInSaleOffer,
      delivScope: this.deliveryScopes,
      isCanEdit: this.offerGeneral.isCanEdit,
      currencyPrecision: this.currencyPrecision,
      volumePrecision: this.offerGoods[0].goodsSpecifications.find(
        (field) => field.idInterfaceField == 1
      ).fieldPrecision,
      quoteCurrencyPrecision: this.quoteCurrencyPrecision || null,
    };
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('dark').className = 'dark_opened';
    this.sidebarService.dataForReqSubject.next(info);
    this.sidebarService.typeSubject.next('detail');
  }

  downloadFile(content, name) {
    let type = name.split('.').reverse()[0];
    let url = 'data:application/' + type + ';base64,' + content;
    let a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  public downloadDoc(file): void {
    if (this.isArchive || this.unsold) {
      this.createOfferService
        .getArchiveOfferDocumentContent(
          this.user?.token,
          this.direction,
          file.idDemandOffer,
          file.idDocument
        )
        .subscribe((res) => {
          this.downloadFile(res.content, file.filename);
        });
    } else {
      this.commonService
        .GetOfferDocumentContent(
          this.user?.token,
          file.idDemandOffer,
          file.idDocument,
          this.direction
        )
        .subscribe((res) => {
          this.downloadFile(res.content, file.filename);
        });
    }
  }

  public onSameUnits(): boolean {
    return this.offerGoods.every(
      (item) => item.unitId === this.offerGoods[0]?.unitId
    );
  }

  public onOpenPopup(type: string, title: string, message: string): void {
    if (type === 'edit') {
      this.isActiveQuotation = false;
      this.isActiveRange = false;
    }

    this.popup = true;
    this.popupType = type;
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      title
    );
    this.popupMessage = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      message
    );
  }

  public onEditOffer = () =>
    this.onOpenPopup(
      'edit',
      'catalogs.editApplication',
      'viewOffer.wantToApply'
    );

  public onCancelOffer = () =>
    this.onOpenPopup(
      'cancel',
      'btns.cancelApplication',
      'viewOffer.wantToCancel'
    );

  public onDeleteOffer = () =>
    this.onOpenPopup(
      'delete',
      'btns.deleteApplication',
      'viewOffer.deleteMess'
    );

  public onCreateCopy = () =>
    this.onOpenPopup(
      'createCopy',
      'createOffer.filingApplication',
      'viewOffer.createCopyApplicationMess'
    );

  public onApproveOffer = () =>
    this.onOpenPopup(
      'approve',
      'offer-management.includeInRegister',
      'offer-management.approveOfferMess'
    );

  vat(vatBasis) {
    let vat;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = null;
    return vat;
  }

  public checkPrices(): void {
    this.offerManagementService
      .checkActivePriceLimit(
        this.offerGeneral.sectionId,
        this.offerGeneral.idSession,
        this.offerGeneral.idModel,
        this.direction
      )
      .then((res: any) => {
        this.activePriceLimit = res.activePriceLimit;

        if (
          this.activePriceLimit.isActiveQuotation ||
          this.activePriceLimit.isActiveCorridor
        ) {
          //
          this.infoForRestore = {
            pricingTypeId: this.offerGeneral.pricingTypeId,
            deliveryConditions: this.deliveryConditions,
            offerGoods: this.offerGoods,
            currencyPrecision: this.currencyPrecision,
            volumePrecision: this.getValue(
              this.offerGoods[0].goodsSpecifications,
              ID_INTERFACE_FIELD.QUANTITY,
              'fieldPrecision'
            ),
            quoteCurrencyPrecision: this.quoteCurrencyPrecision || null,
            isActiveQuotation: this.activePriceLimit.isActiveQuotation,
            isActiveRange: this.activePriceLimit.isActiveCorridor,
          };

          this.editPriceStepService.prepareDeliveryConditions(
            this.infoForRestore,
            this.vat(
              this.offerGoods[0].goodsSpecifications.find((el) => el.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE)
            )
          );

          //получение данных если есть котировки
          if (this.activePriceLimit.isActiveQuotation) {
            //
            this.infoForRestore.deliveryConditions.forEach((condition) => {
              const basis = condition[1];

              basis.forEach((b) => {
                if (b.goodId) {
                  //для биржевых товаров
                  this.offerManagementService
                    .getPriceLimitQuotation(
                      this.offerGeneral.sectionId,
                      this.offerGeneral.idSession,
                      this.offerGeneral.idModel,
                      this.direction,
                      b.goodId,
                      b.currencyId,
                      b.vat,
                      b.unitId,
                      b.volume,
                      this.paymentCond.idPaymentType,
                      b.idBasisValue,
                      b.idPlaceLink || null,
                      b.placeDetails || null
                    )
                    .then((res: any) => {
                      b.quotationPrice = res.priceWithoutVat;
                      //сравниваем цену и котировку
                      if (b.priceWithoutVat === b.quotationPrice) {
                        b.quote = false; //для подсветки в табл
                        //    this.isActiveQuotation = false
                      } else {
                        b.quote = true;
                        this.isActiveQuotation = true;
                      }
                    });
                } else {
                  //для товаров аналогов
                  let goodDescription = '';
                  b.goodValues.forEach((el) => {
                    if (!el.isAllowAnalog && el.idReference != 4) {
                      //правила формирования строки в #9257
                      if (el.listValues?.length > 0) {
                        let valuesStr = '';
                        el.listValues.forEach((v) => {
                          valuesStr = valuesStr + v.idValue + ';';
                        });
                        goodDescription =
                          goodDescription + el.idReference + ':' + valuesStr;
                      }
                    }
                  });

                  this.offerManagementService
                    .getPriceLimitQuotationAnalog(
                      this.offerGeneral.sectionId,
                      this.offerGeneral.idSession,
                      this.offerGeneral.idModel,
                      b.goodNomenclatureId,
                      b.goodGroupId,
                      b.goodNameId,
                      goodDescription,
                      b.currencyId,
                      b.vat,
                      b.unitId,
                      b.volume,
                      this.paymentCond.idPaymentType,
                      b.idBasisValue,
                      b.idPlaceLink || null,
                      b.placeDetails || null
                    )
                    .then((res: any) => {
                      b.quotationPrice = res.priceWithoutVat;
                      //сравниваем цену и котировку
                      if (b.priceWithoutVat === b.quotationPrice) {
                        b.quote = false; //для подсветки в табл
                        //    this.isActiveQuotation = false
                      } else {
                        b.quote = true;
                        this.isActiveQuotation = true;
                      }
                    });
                }
              });
            });
          }

          //получение данных если есть ценовой контроль
          if (this.activePriceLimit.isActiveCorridor) {
            //
            this.infoForRestore.deliveryConditions.forEach((condition) => {
              const basis = condition[1];

              basis.forEach((b) => {
                if (b.goodId) {
                  //для биржевых товаров
                  this.offerManagementService
                    .getPriceLimitCorridor(
                      this.offerGeneral.sectionId,
                      this.offerGeneral.idSession,
                      this.offerGeneral.idModel,
                      this.direction,
                      b.goodId,
                      b.currencyId,
                      b.vat,
                      b.unitId,
                      b.volume,
                      this.paymentCond.idPaymentType,
                      b.idBasisValue,
                      b.idPlaceLink || null,
                      b.placeDetails || null
                    )
                    .then((res: any) => {
                      b.leftBound = res.leftBound;
                      b.rightBound = res.rightBound;

                      //проверяем есть ли границы у ценового коридора
                      if (!res.leftBound && !res.rightBound) {
                        this.isNoBounds = true;
                      }

                      //проверяем попадает ли цена в коридор
                      if (
                        b.priceWithoutVat >= b.leftBound &&
                        b.priceWithoutVat <= b.rightBound
                      ) {
                        b.range = false;
                        //this.isActiveRange = false
                      } else {
                        b.range = true;
                        this.isActiveRange = true;
                      }
                    });
                } else {
                  //для товаров аналогов
                  let goodDescription = '';
                  b.goodValues.forEach((el) => {
                    if (!el.isAllowAnalog && el.idReference != 4) {
                      //правила формирования строки в #9257
                      if (el.listValues?.length > 0) {
                        let valuesStr = '';
                        el.listValues.forEach((v) => {
                          valuesStr = valuesStr + v.idValue + ';';
                        });
                        goodDescription =
                          goodDescription + el.idReference + ':' + valuesStr;
                      }
                    }
                  });

                  this.offerManagementService
                    .getPriceLimitCorridorAnalog(
                      this.offerGeneral.sectionId,
                      this.offerGeneral.idSession,
                      this.offerGeneral.idModel,
                      b.goodNomenclatureId,
                      b.goodGroupId,
                      b.goodNameId,
                      goodDescription,
                      b.currencyId,
                      b.vat,
                      b.unitId,
                      b.volume,
                      this.paymentCond.idPaymentType,
                      b.idBasisValue,
                      b.idPlaceLink || null,
                      b.placeDetails || null
                    )
                    .then((res: any) => {
                      b.leftBound = res.leftBound;
                      b.rightBound = res.rightBound;

                      //проверяем попадает ли цена в коридор
                      if (
                        b.priceWithoutVat >= b.leftBound &&
                        b.priceWithoutVat <= b.rightBound
                      ) {
                        b.range = false;
                        //this.isActiveRange = false
                      } else {
                        b.range = true;
                        this.isActiveRange = true;
                      }
                    });
                }
              });
            });
          }
        }
      });
  }

  public onRestoreRejectedOffer(): void {
    this.checkPrices();
    if (this.user?.IsWorker) {
      this.catalogService
        .GetRejectedInfo(
          this.user?.token,
          this.direction,
          this.offerGeneral.sectionId,
          this.offerGeneral.idSession,
          this.idOffer
        )
        .then((res: any) => {
          this.popup = true;
          this.popupTitle = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'offer-management.restoreOffer'
          );
          let message: string = '';
          if (res.warningDeletedGoods)
            message =
              message +
              getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.deletedGoodRestoreRejectMess'
              ) +
              '<br />' +
              '<br />';

          if (res.warningAttachments)
            message =
              message +
              getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.dontAllowFileRestoreRejectMess'
              ) +
              '<br />' +
              '<br />';
          this.popupMessage =
            message +
            getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'viewOffer.restoreRejectMess'
            );
        });
    } else {
      this.popupTitle = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'offer-management.restoreOffer'
      );
      this.popupMessage = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'viewOffer.restoreRejectMess'
      );
    }
    this.popupType = 'restoreRejected';
  }

  public onRejectOffer(): void {
    this.rejectPopup = true;
    this.rejectPopupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'viewOffer.rejectionOfTheApp'
    );
    this.popupType = 'reject';
    this.onGetRejectionTemplates();
  }

  public onGetRejectionTemplates(): void {
    this.offerManagementService
      .getRejectionTemplates(this.offerGeneral.sectionId)
      .then((res: any) => {
        this.rejectionTemplatesFull = res.rejectionTemplates;
        this.getRejectionTemplates();
      });
  }

  public onPopupSubmit(type: string): void {
    switch (type) {
      case 'edit':
      case 'createCopy': {
        this.createOfferService.isMine = this.offerGeneral.isMine; //если пришел участник, значит заявка самого трейдера
        this.createOfferService.isCreateCopy = type === 'createCopy';
        this.createOfferService.idOffer = this.idOffer;
        this.createOfferService.isArchiveSubmit = false;
        this.createOfferService.sessionName = this.offerGeneral.sessionName;
        this.createOfferService.sectionName = this.offerGeneral.sectionName;
        this.createOfferService.sessionDateTime =
          this.offerGeneral.sessionDatetime;
        this.createOfferService.sessionId = this.offerGeneral.idSession;
        this.createOfferService.sectionId = this.offerGeneral.sectionId;
        this.createOfferService.modelId = this.offerGeneral.idModel;
        this.createOfferService.choosenMarketType =
          this.offerGeneral.concatedMarketTypes;
        this.createOfferService.direction = this.offerGeneral.directionId;
        this.createOfferService.modelResult = {
          pricingTypeId: this.offerGeneral.pricingTypeId,
          isAllowedFilesPrivate: this.offerGeneral.isAllowedFilesPrivate,
          isAllowedFilesPublic: this.offerGeneral.isAllowedFilesPublic,
          isAllowedAnalogues: this.modelResult.isAllowedAnalogues,
        };
        this.router.navigateByUrl('/createOffer');
        break;
      }
      case 'cancel': {
        const body = {
          idDirection: this.direction,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .cancelOffer(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'btns.cancelApplication'
              );
              this.popupSuccess = true;
              this.popupSuccessMess = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.sucсessCancelMess'
              );
            }
          });
        break;
      }
      case 'delete': {
        const body = {
          idDirection: this.direction,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .deleteOffer(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'btns.deleteApplication'
              );
              this.popupSuccess = true;
              this.popupSuccessMess = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.successDeleteMess'
              );
            }
          });
        break;
      }
      case 'restoreRejected': {
        const body = {
          idDirection: this.direction,
          idSection: this.offerGeneral.sectionId,
          idSession: this.offerGeneral.idSession,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .OffersRestoreRejected(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'offer-management.restoreOffer'
              );
              this.popupSuccess = true;
              this.popupSuccessMess = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.successRestoreRejectMess'
              );
            }
          });
        break;
      }
      case 'reject': {
        const body = {
          idDirection: this.direction,
          idSection: this.offerGeneral.sectionId,
          idSession: this.offerGeneral.idSession,
          listDemandsOffers: [this.idOffer],
          rejectionText: this.rejectReason,
        };
        this.catalogService
          .OffersReject(this.user?.token, body)
          .then((res: any) => {
            if (res.isSuccessful) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.rejectionOfTheApp'
              );
              this.popupSuccess = true;
              this.popupSuccessMess = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.rejectionOfTheAppSuccessMess'
              );
            }
          });
        break;
      }

      case 'approve': {
        const body: DemandOfferCataloguePayload = {
          idSection: this.offerGeneral.sectionId,
          idSession: this.offerGeneral.idSession,
          idOffers: this.direction === IdDirection.sale ? [this.idOffer] : null,
          idDemands: this.direction === IdDirection.buy ? [this.idOffer] : null,
        };

        this.offerManagementService
          .offersApprove(body)
          .subscribe((res) => {
            if (res) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'offer-management.includingInRegister'
              );
              this.popupSuccess = true;
              this.popupSuccessMess = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'offer-management.approveOfferMessSucc'
              );
            } else {
              this.popup = false;
            }
          });

        break;
      }
    }
  }

  rejectionTemplates = [];

  public getRejectionTemplates(): void {
    this.chooseRejectionTempl = {};
    this.rejectReason = '';
    if (this.myTemplate == 0)
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == true
      );
    else
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == false
      );
  }

  condEditButton() {
    //Отображение кнопки редактировать и удалить в выпадающем списке
    return (
      Object.keys(this.chooseRejectionTempl).length !== 0 &&
      this.myTemplate == 0
    );
  }

  public onClose(): void {
    this.popup = false;
    if (this.popupSuccess) {
      if (this.popupType != 'delete') location.reload();
      else this.location.back();
    } else this.popupSuccess = false;
    this.isActiveQuotation = false;
    this.isActiveRange = false;
  }

  /* закрытие попап окна для отклонения заявки, в зависимотси есть или нет боковая панель*/
  @ViewChild('rejectPopupOpen', { static: false })
  rejectPopupOpen: DxPopupComponent;

  @HostListener('document:keydown', ['$event'])
  onKeydownHandler(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.rejectPopup && !this.isOpenSidebar) {
        this.rejectPopupOpen.instance.hide();
      }
      if (document.getElementById('mySidebar')?.style.opacity === '0') {
        this.isOpenSidebar = false;
      }
    }
  }

  public onInitializedPopup(e): void {
    //запрещаем закрывать попап по клавише esc
    e.component.registerKeyHandler('escape', function (arg) {
      arg.preventDefault();
    });
  }

  isOpenSidebar = false; //открыта ли боковая панель

  public onEditTemplate(str: string): void {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    let dataForReq;
    if (str == 'create') {
      dataForReq = {
        sectionId: this.offerGeneral.sectionId,
        idTemplate: { name: '', text: '' },
        name: getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'viewOffer.addingTemplate'
        ),
      };
    } else
      dataForReq = {
        sectionId: this.offerGeneral.sectionId,
        idTemplate: this.chooseRejectionTempl,
        name: getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'viewOffer.editingTemplate'
        ),
      };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('createTemplate');
  }

  public onDeleteTemplate(): void {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    const dataForReq = {
      idTemplate: this.chooseRejectionTempl,
      sectionId: this.offerGeneral.sectionId,
      name: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'viewOffer.deletingTemplate'
      ),
    };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('deleteTemplate');
  }

  public isLineUsed(): boolean {
    return (
      (!this.user?.IsWorker && this.offerGeneral.isCanEdit) ||
      (this.user?.IsWorker && this.Privileges && this.offerGeneral.isCanEdit) ||
      (!this.user?.IsWorker && this.offerGeneral.isCanRestoreRejected) ||
      (this.user?.IsWorker &&
        this.Privileges &&
        this.offerGeneral.isCanRestoreRejected) ||
      this.offerGeneral.isCanCancel ||
      this.offerGeneral.isCanDelete ||
      (!this.user?.IsWorker && this.offerGeneral.isCanReject) ||
      (this.user?.IsWorker && this.Privileges && this.offerGeneral.isCanReject)
    );
  }

  editPriceStepPopup: boolean = false;
  infoForPriceStep: any = [];

  public onOpenEditPriceStep(): void {
    this.infoForPriceStep = {
      idSection: this.offerGeneral.sectionId,
      idSession: this.offerGeneral.idSession,
      idDemandOffer: this.offerGeneral.idDemandOffer,
      idDirection: this.offerGeneral.directionId,
      pricingTypeId: this.offerGeneral.pricingTypeId,
      deliveryConditions: this.deliveryConditions,
      offerGoods: this.offerGoods,
      currencyPrecision: this.currencyPrecision,
      volumePrecision: this.getValue(
        this.offerGoods[0].goodsSpecifications,
        ID_INTERFACE_FIELD.QUANTITY,
        'fieldPrecision'
      ),
      quoteCurrencyPrecision: this.currencyPrecision || null,
    };

    this.editPriceStepService.prepareDeliveryConditions(
      this.infoForPriceStep,
      this.vat(
        this.offerGoods[0].goodsSpecifications.find((el) => el.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE)
      )
    );

    this.editPriceStepPopup = true;
  }

  public closeEditPriceStepPopup(event: boolean): void {
    this.editPriceStepPopup = event;
    this.getData();
  }

  public ngOnDestroy(): void {
    this.editFromSideBar.unsubscribe();
    this.createTemplateSideBar.unsubscribe();
    //  localStorage.removeItem('viewOffer');
  }
}
