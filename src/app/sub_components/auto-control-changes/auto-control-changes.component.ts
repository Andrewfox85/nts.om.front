/* eslint-disable */
import { CatalogService } from './../../core/services/catalog-service.service';
import { OfferManagementService } from './../../core/services/offer-management-service.service';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CreateOfferService, } from '../../core/services/create-offer-service.service';
import { User } from '../../core/classes/user';
import {
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  DisplaySpecMode,
  IdDirection,
  pricingType
} from '../../api.constants';
import { CommonService } from '../../core/services/common-service.service';
import { TranslateService } from '@ngx-translate/core';
import { SidebarService } from '../../core/services/sidebar-service.service';
import { Subject, Observable } from 'rxjs';
import { DxPopupComponent } from 'devextreme-angular';
import { DemandOfferCataloguePayload } from 'src/app/shared/interfaces';
import {
  ID_INTERFACE_FIELD,
  specialPriceFields
} from '../../shared/enums';
import { GoodsSpecifications } from '../../core/interfaces/interface';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { SCOPE_BLOCK } from "../create-offer/enums";

export interface DiffContent {
  leftContent: string;
  rightContent: string;
}

@Component({
  selector: 'app-auto-control-changes',
  templateUrl: './auto-control-changes.component.html',
  styleUrls: ['./auto-control-changes.component.scss'],
})
export class AutoControlChangesComponent implements OnInit {
  public user: User;
  public activeTab: number = 0;
  public idOffer: number;

  // текущие значения заявки
  public offerGeneral: any;
  public offerGoods = [];
  public deliveryScopes = [];
  public scopes = []; //для сравнения грузоотправителей/грузополучателей первоначальный массив
  public delivSchPeriods = [];
  public schedule = []; //для сравнения графика первоначальный массив
  public delivCond = []; //для сравнения базисов первоначальный массив
  public deliveryConditions = [];
  public offerDocuments = [];

  // предыдущие значения заявки
  public offerGeneralParent: any;
  public offerGoodsParent = [];
  public deliveryScopesParent = [];
  public delivSchPeriodsParent = [];
  public deliveryConditionsParent = [];
  public offerDocumentsParent = [];

  public uniqueDeliveryScopes = []; //уникальный список клиентов брокера
  public uniqueDeliveryScopesParent = []; //уникальный список клиентов брокера

  public uniqueDelConditionsParent = []; //уникальные значения в массиве deliveryConditionsParent
  public mainBasis: any;
  public mainBasisParent: any;
  public VatField: any;
  public VatFieldParent: any;

  public currencyPrecision: any; //точность валюты
  public currencyPrecisionParent: any; //точность валюты

  public quotationCurrencyPrecision: any; //точность валюты котировки
  public quotationCurrencyPrecisionParent: any; //точность валюты котировки

  public volumePrecision: any; //точность количества
  public volumePrecisionParent: any; //точность количества

  public tabValue: number = 0; //id вкладки

  //общие подсчеты
  public costWithoutVATSum = 0;
  public amountVATSum = 0;
  public costVATSum = 0;
  public volumeSum = 0;
  public costWithoutVATSumParent = 0;
  public amountVATSumParent = 0;
  public costVATSumParent = 0;
  public volumeSumParent = 0;

  public clientHidden: boolean = false; //свернуть/развернуть клиентов брокера
  public dataSourceTabs = []; //массив табов на странице

  public compareText: boolean = false; //попап для сравнения текста
  public previousDetails: string;
  public currentDetails: string;

  public rejectPopup: boolean = false; //попап для отклонения заявок работником
  public rejectionTemplates = []; //список шаблонов для отклонения (с фильтром мои или секции)
  public rejectionTemplatesFull = []; //полный список шаблонов
  public chooseRejectionTempl = {}; //выбранный шаблон
  public rejectReason: string = ''; //причина отклонения
  public myTemplate: number = 0; //вкладка на попапе мои шаблоны
  public failureOffer: any; //массив отклоненных заявок с причиной отклонения
  public popup: boolean = false; //popup окно
  public popupMessage: string; //текст в попапе
  public popupTitle: string;
  public popupSuccess: boolean = false; //успешно завершено
  public popupWarning: boolean = false; //при отклонении если какое-то количество успешно, а какое-то - неуспешно

  public approvePopup: boolean = false;

  public direction: number;

  public contentObservable: Subject<DiffContent> = new Subject<DiffContent>();
  public contentObservable$: Observable<any> =
    this.contentObservable.asObservable();
  public isVisibleToast: boolean = false;

  public createTemplateSideBar: any;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  protected readonly SCOPE_BLOCK = SCOPE_BLOCK;
  public readonly pricingType = pricingType;
  public readonly IdDirection = IdDirection;
  public DisplaySpecMode = DisplaySpecMode;
  public isSameGradesInSaleOffer: boolean = false;

  //private contentObservable = new Subject<any>();
  // contentObservable$ = this.contentObservable.asObservable();

  constructor(
    public createOfferService: CreateOfferService,
    public commonService: CommonService,
    public translate: TranslateService,
    private sidebarService: SidebarService,
    private offerManagementService: OfferManagementService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.idOffer =
      this.createOfferService.idOffer ||
      JSON.parse(localStorage.getItem('autoControlChanges')).idOffer;
    this.direction =
      this.createOfferService.direction ||
      JSON.parse(localStorage.getItem('autoControlChanges')).direction;
    localStorage.setItem(
      'autoControlChanges',
      JSON.stringify({ idOffer: this.idOffer, direction: this.direction })
    );

    this.createOfferService
      .GetWorkerOfferFullInfo(this.user?.token, this.idOffer, this.direction)
      .then((res: any) => {
        this.offerGeneral = res.generalInfo;
        this.offerGoods = res.goods;
        this.deliveryScopes = !this.offerGeneral.isDeliveryScopeGraded ? res.deliveryScopes : res.deliveryScopesGraded;
        this.scopes = JSON.parse(JSON.stringify(this.deliveryScopes));
        this.delivSchPeriods = res.delivSchPeriods.length ? res.delivSchPeriods : res.delivSchPeriodsGraded;
        this.schedule = JSON.parse(JSON.stringify(this.delivSchPeriods));
        this.deliveryConditions = res.deliveryConditions;
        this.delivCond = JSON.parse(JSON.stringify(res.deliveryConditions));
        this.offerDocuments = res.documents;
        this.isSameGradesInSaleOffer = res.delivSchPeriodsGraded?.length > 0 || this.offerGeneral.isDeliveryScopeGraded;

        if (this.offerGeneral?.idDemandOfferParent) {
          this.createOfferService
            .GetWorkerOfferFullInfo(
              this.user?.token,
              this.offerGeneral.idDemandOfferParent,
              this.direction
            )
            .then((res: any) => {
              this.offerGeneralParent = res.generalInfo;
              this.offerGoodsParent = res.goods;
              this.deliveryScopesParent = res.deliveryScopes;
              this.delivSchPeriodsParent = res.delivSchPeriods;
              this.deliveryConditionsParent = res.deliveryConditions;
              this.offerDocumentsParent = res.documents;

              if (this.deliveryConditionsParent?.length > 0) {
                this.uniqueDelConditionsParent = [
                  ...new Map(
                    this.deliveryConditionsParent.map(
                      (
                        item //уникальные значения в массиве deliveryConditionsParent
                      ) => [item['concatedCondition'], item]
                    )
                  ).values(),
                ];
                this.mainBasisParent = this.uniqueDelConditionsParent.find(
                  (basis) => basis.isMain == true
                );
                this.uniqueDelConditionsParent.splice(
                  this.uniqueDelConditionsParent.indexOf(this.mainBasisParent),
                  1
                );
                this.uniqueDelConditionsParent.splice(
                  0,
                  0,
                  this.mainBasisParent
                );
              }

              if (this.deliveryScopesParent?.length > 0) {
                this.getClientName(
                  this.uniqueDeliveryScopesParent,
                  this.deliveryScopesParent
                );
              }

              this.commonService
                .GetPrecision(
                  this.user?.token,
                  this.getValue(
                    this.offerGoodsParent[0].goodsSpecifications,
                    ID_INTERFACE_FIELD.CURRENCY,
                    'fieldValueNumber'
                  )
                )
                .subscribe((res) => {
                  this.currencyPrecisionParent = res;
                  this.offerGoodsParent.forEach((good) => {
                    const result = this.onPrepareGoodInfo(
                      good,
                      this.VatFieldParent,
                      this.volumePrecisionParent,
                      this.offerGeneralParent,
                      this.currencyPrecisionParent,
                      this.costWithoutVATSumParent,
                      this.amountVATSumParent,
                      this.costVATSumParent,
                      this.quotationCurrencyPrecisionParent
                    );

                    this.VatFieldParent = result.VatField;
                    this.volumePrecisionParent = result.volumePrecision;
                    this.costWithoutVATSumParent = result.costWithoutVATSum;
                    this.amountVATSumParent = result.amountVATSum;
                    this.costVATSumParent = result.costVATSum;
                    this.quotationCurrencyPrecisionParent =
                      result.quotationCurrencyPrecision;
                  });
                  this.createDataSourceTabs();
                  this.compareGoodFields();
                });

              //Общее количество
              if (this.onSameUnits(this.offerGoodsParent)) {
                this.offerGoodsParent.forEach((good) => {
                  let volume = good.goodsSpecifications.find(
                    (field) =>
                      field.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
                  );
                  this.volumeSumParent =
                    this.volumeSumParent + volume.fieldValueNumber;
                });
              }

              /*  if(this.offerGoodsParent[0].goodsSpecifications?.length !== this.offerGoods[0].goodsSpecifications.length){
             this.compareMultiSelectField()
          } */
            });
        } else {
          alert('Нет родительской заявки!');
        }

        //находим точность цены
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
              const result = this.onPrepareGoodInfo(
                good,
                this.VatField,
                this.volumePrecision,
                this.offerGeneral,
                this.currencyPrecision,
                this.costWithoutVATSum,
                this.amountVATSum,
                this.costVATSum,
                this.quotationCurrencyPrecision
              );

              this.VatField = result.VatField;
              this.volumePrecision = result.volumePrecision;
              this.costWithoutVATSum = result.costWithoutVATSum;
              this.amountVATSum = result.amountVATSum;
              this.costVATSum = result.costVATSum;
              this.quotationCurrencyPrecision =
                result.quotationCurrencyPrecision;
            });

            //Общее количество
            if (this.onSameUnits(this.offerGoods)) {
              this.offerGoods.forEach((good) => {
                let volume = good.goodsSpecifications.find(
                  (field) =>
                    field.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
                );
                this.volumeSum = this.volumeSum + volume.fieldValueNumber;
              });
            }
            if (this.deliveryConditions?.length > 0) {
              this.deliveryConditions.forEach((basis) => {
                this.offerGoods.forEach((good) => {
                  if (
                    good.goodsSpecifications[0].idOfferGood == basis.idOfferGood
                  ) {
                    Object.assign(basis, {
                      goodName: good.goodName,
                      unitName: good.unitName,
                      properties: good.properties,
                      volume: this.getValue(
                        good.goodsSpecifications,
                        ID_INTERFACE_FIELD.QUANTITY,
                        'fieldValueNumber'
                      ),
                      quotation:
                        this.getValue(
                          good.goodsSpecifications,
                          ID_INTERFACE_FIELD.QUOTATION,
                          'fieldValue'
                        ) || null,
                      quoteCurrency:
                        this.getValue(
                          good.goodsSpecifications,
                          ID_INTERFACE_FIELD.QUOTE_CURRENCY,
                          'fieldValue'
                        ) || null,
                      amendment:
                        this.getValue(
                          good.goodsSpecifications,
                          ID_INTERFACE_FIELD.AMENDMENT,
                          'fieldValue'
                        ) || null,
                      priceAdjustment:
                        this.getValue(
                          good.goodsSpecifications,
                          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
                          'fieldValueNumber'
                        ) || null,
                      currency: this.getValue(
                        good.goodsSpecifications,
                        ID_INTERFACE_FIELD.CURRENCY,
                        'fieldValue'
                      ),
                      costVat: this.costVatBasis(
                        basis.priceWithoutVat,
                        good.goodsSpecifications.find(
                          (el) =>
                            el.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE
                        ),
                        this.getValue(
                          good.goodsSpecifications,
                          ID_INTERFACE_FIELD.QUANTITY,
                          'fieldValueNumber'
                        )
                      ),
                    });
                  }
                });
              });

              this.mainBasis = this.deliveryConditions.find(
                (el) => el.isMain == true
              );
              this.deliveryConditions.splice(
                this.deliveryConditions.indexOf(this.mainBasis),
                1
              );
              this.deliveryConditions.splice(0, 0, this.mainBasis);

              this.deliveryConditions = this.deliveryConditions.reduce(
                function (r, a) {
                  //сгруппированы поля по concatedCondition
                  r[a.concatedCondition] = r[a.concatedCondition] || [];
                  r[a.concatedCondition].push(a);
                  return r;
                },
                {}
              );
              this.deliveryConditions = Object.entries(this.deliveryConditions);
            }
          });

        if (this.delivSchPeriods?.length > 0) {
          this.delivSchPeriods = this.isSameGradesInSaleOffer
            ?
            this.delivSchPeriods.flatMap(sch =>
              this.offerGoods.map(good => ({
                ...sch,
                idOfferGood: good.idGood,
                goodName: good.goodName,
                unitName: good.unitName,
                properties: good.properties,
              }))
            )
            :
            this.delivSchPeriods.flatMap(sch =>
              this.offerGoods
                .filter(good => good.goodsSpecifications[0].idDemandOfferGood === sch.idDemandOfferGood)
                .map(good => {
                    return {
                      ...sch,
                      goodName: good.goodName,
                      unitName: good.unitName,
                      properties: good.properties,
                    };
                  }
                )
            );

          this.delivSchPeriods = this.delivSchPeriods.reduce(function (r, a) {
            //сгруппированы поля по periodDateBegin
            r[a.periodDateBegin] = r[a.periodDateBegin] || [];
            r[a.periodDateBegin].push(a);
            return r;
          }, {});
          this.delivSchPeriods = Object.entries(this.delivSchPeriods);
        }

        if (this.deliveryScopes?.length > 0 && !this.deliveryScopes[0][1]) {
          //грузополучатели / грузоотправители

          this.deliveryScopes = this.isSameGradesInSaleOffer ?
            this.deliveryScopes.flatMap(scope =>
              this.offerGoods.map(good => ({
                ...scope,
                idOfferGood: good.idGood,
                goodName: good.goodName,
                unitName: good.unitName,
                properties: good.properties,
              }))
            ) :
            this.deliveryScopes.flatMap(scope =>
              this.offerGoods
                .filter(good => good.goodsSpecifications[0].idDemandOfferGood === scope.idDemandOfferGood)
                .map(good => {
                    return {
                      ...scope,
                      goodName: good.goodName,
                      unitName: good.unitName,
                      properties: good.properties,
                    };
                  }
                )
            );

          this.deliveryScopes = this.deliveryScopes.reduce(function (r, a) {
            //сгруппированы поля по idFirmClient
            r[a.idFirmClient] = r[a.idFirmClient] || [];
            r[a.idFirmClient].push(a);
            return r;
          }, {});
          this.deliveryScopes = Object.entries(this.deliveryScopes);
          this.getClientName(this.uniqueDeliveryScopes, this.scopes);
        }
      });
    this.createTemplateSideBar = this.sidebarService.template$.subscribe(() => {
      this.onGetRejectionTemplates();
      this.isVisibleToast = true;
    });
  }

  public getValue(specs, idField: number, prop: string): string | number {
    const found = specs.find((field) => field.idInterfaceField == idField);
    return found ? found[prop] : null;
  }

  //массив табов на странице
  createDataSourceTabs() {
    this.dataSourceTabs.push(
      getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'createOffer.stepName.generalInfo'
      )
    );
    if (
      this.deliveryConditions?.length > 0 ||
      this.deliveryConditionsParent?.length > 0
    ) {
      this.dataSourceTabs.push(
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'viewOffer.deliveryBases'
        )
      );
    }
    if (this.schedule?.length > 0 || this.delivSchPeriodsParent?.length > 0) {
      this.dataSourceTabs.push(
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'createOffer.paymentDeliveryTerms.deliverySchedule'
        )
      );
    }
    if (this.scopes?.length > 0 || this.deliveryScopesParent?.length > 0) {
      if (this.offerGeneral.directionId == IdDirection.buy) {
        this.dataSourceTabs.push(
          getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'createOffer.delivScope.consignees'
          )
        );
      } else
        this.dataSourceTabs.push(
          getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'createOffer.delivScope.consignors'
          )
        );
    }
  }

  compareTextPopup(previous, current) {
    this.compareText = true;
    this.previousDetails = previous;
    this.currentDetails = current;
    const newContent: DiffContent = {
      leftContent: this.previousDetails,
      rightContent: this.currentDetails,
    };
    this.contentObservable.next(newContent);
  }

  onCompareResults(diffResults) {
    console.log('diffResults', diffResults);
  }

  public compareGoodFields(): void {
    this.offerGoods.forEach((good) => {
      let goodParent = this.offerGoodsParent.find(
        (el) => el.idGood === good.idGood
      );
      if (goodParent) {
        const allFieldIds = new Set();
        const createFieldKey = (item) => {
          return `${item.idInterfaceField || ''}_${item.fieldName || ''}_${
            item.blockId || 0
          }_${item.controlFieldType || ''}_${
            item.isAvailableMultiSelection || false
          }`;
        };
        good.goodsSpecifications.forEach((item) => {
          if (item.idInterfaceField && !item.isVirtual) {
            allFieldIds.add(createFieldKey(item));
          }
        });
        goodParent.goodsSpecifications.forEach((item) => {
          if (item.idInterfaceField && !item.isVirtual) {
            allFieldIds.add(createFieldKey(item));
          }
        });

        const createEmptySpec = (key) => {
          const [
            idInterfaceField,
            fieldName,
            blockId,
            controlFieldType,
            isAvailableMultiSelection,
          ] = key.split('_');
          return {
            idDemandOfferGood: null,
            idInterfaceField: idInterfaceField,
            fieldValueNumber: null,
            fieldValueString: '',
            fieldName: fieldName,
            fieldPrecision: 0,
            controlFieldType: controlFieldType,
            fieldValue: '-',
            blockId: blockId,
            isVirtual: false,
            isAvailableMultiSelection: isAvailableMultiSelection,
          };
        };

        const syncedGoodSpecs = [];
        allFieldIds.forEach((key: string) => {
          const [idInterfaceField] = key.split('_');
          const existingItem = good.goodsSpecifications.find(
            (item) => item.idInterfaceField == idInterfaceField
          );
          if (existingItem) {
            syncedGoodSpecs.push(existingItem);
          } else {
            syncedGoodSpecs.push(createEmptySpec(key));
          }
        });

        const syncedGoodParentSpecs = [];
        allFieldIds.forEach((key: string) => {
          const [idInterfaceField] = key.split('_');
          const existingItem = goodParent.goodsSpecifications.find(
            (item) => item.idInterfaceField == idInterfaceField
          );
          if (existingItem) {
            syncedGoodParentSpecs.push(existingItem);
          } else {
            syncedGoodParentSpecs.push(createEmptySpec(key));
          }
        });

        const serviceObjects = good.goodsSpecifications.filter(
          (item) => !item.idInterfaceField
        );
        const serviceObjectsParent = goodParent.goodsSpecifications.filter(
          (item) => !item.idInterfaceField
        );

        good.goodsSpecifications = [...syncedGoodSpecs, ...serviceObjects];
        goodParent.goodsSpecifications = [
          ...syncedGoodParentSpecs,
          ...serviceObjectsParent,
        ];
      }
    });
  }

  public onPrepareGoodInfo(
    good,
    VatField,
    volumePrecision,
    offerGeneral,
    currencyPrecision,
    costWithoutVATSum,
    amountVATSum,
    costVATSum,
    quotationCurrencyPrecision
  ): {
    VatField: GoodsSpecifications;
    volumePrecision: number;
    costWithoutVATSum: number;
    amountVATSum: number;
    costVATSum: number;
    quotationCurrencyPrecision: number;
  } {
    good.goodsSpecifications = [
      //сортируем поля с готовностью и с фактическими размерами в самое начало
      ...good.goodsSpecifications.filter((item) =>
        ACTUAL_SIZE_READINESS_FIELDS.includes(item.idInterfaceField)
      ),
      ...good.goodsSpecifications.filter(
        (item) => !ACTUAL_SIZE_READINESS_FIELDS.includes(item.idInterfaceField)
      ),
    ];

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
          groupFields[id][0].fieldValue + '; ' + groupFields[id][i].fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
      }
      groupFields[id] = [groupFields[id][0]]; //из массива данных с одинаковым idInterfaceField, делаем одно поле, в котором fieldValue включает в себя все выбранные значения
    });
    good.goodsSpecifications = Object.values(groupFields).flat(); //массив с индивидуальными idInterfaceField

    VatField = good.goodsSpecifications.find(
      (field) => field.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE
    ); //Ставка НДС
    let volume = good.goodsSpecifications.find(
      (field) => field.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
    ); //количество
    volumePrecision = volume.fieldPrecision;
    if (offerGeneral.pricingTypeId != pricingType.formulaWithoutQuotation) {
      // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
      let count = Number(volume.fieldValueNumber);
      let priceWithoutVat = Number(
        this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
          'fieldValueNumber'
        )
      ); //Цена без НДС
      let vat;

      if (VatField.fieldValueNumber != 1) {
        vat = Number(VatField.fieldValue.replace(/[^0-9]/g, ''));
      } else vat = 0;

      let costWithoutVAT = this.commonService.round(
        count * priceWithoutVat,
        currencyPrecision
      );
      let amountVAT = this.commonService.round(
        costWithoutVAT * (vat / 100),
        currencyPrecision
      );
      let costVAT = Number(costWithoutVAT) + Number(amountVAT);

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

      costWithoutVATSum = costWithoutVATSum + Number(costWithoutVAT); //Общая стоимость по заявке (без НДС)
      amountVATSum = amountVATSum + Number(amountVAT); //Общая сумма НДС
      costVATSum = costVATSum + Number(costVAT); //Общая стоимость (с учетом НДС)
    }

    Object.assign(good, {
      currency: this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.CURRENCY,
        'fieldValue'
      ),
    }); //добавляем каждому товару Валюта

    if (offerGeneral.pricingTypeId == pricingType.formulaWithQuotation) {
      let quoteCurrency = this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.QUOTE_CURRENCY,
        'fieldValue'
      );
      let priceAdjustment = this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.AMENDMENT_TYPE,
        'fieldValueNumber'
      );
      Object.assign(good, {
        quoteCurrency: quoteCurrency,
        priceAdjustment: priceAdjustment,
      });
      this.commonService
        .GetPrecision(
          this.user?.token,
          this.getValue(
            good.goodsSpecifications,
            ID_INTERFACE_FIELD.QUOTE_CURRENCY,
            'fieldValueNumber'
          )
        )
        .subscribe((res) => {
          quotationCurrencyPrecision = res;
        });
    }
    if (offerGeneral.pricingTypeId == pricingType.formulaWithoutQuotation) {
      let priceAdjustment = this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.AMENDMENT_TYPE,
        'fieldValueNumber'
      );
      Object.assign(good, { priceAdjustment: priceAdjustment });
    }

    return {
      VatField: VatField,
      volumePrecision: volumePrecision,
      costWithoutVATSum: costWithoutVATSum,
      amountVATSum: amountVATSum,
      costVATSum: costVATSum,
      quotationCurrencyPrecision: quotationCurrencyPrecision,
    };
  }

  public isMinPrice(): boolean {
    //проверка есть ли минимальная цена в заявке для добавления колонки в базисы
    return this.offerGoods.some(good =>
      good.goodsSpecifications.some(field =>
        field.idInterfaceField === ID_INTERFACE_FIELD.MIN_PRICE
      )
    );
  }

  public getValueGoodField(field, goodinParent?): string {
    const valueKey: string = field.controlFieldType === 'dxNumberBox' ? 'fieldValueNumber' : 'fieldValue';
    const fieldValue = goodinParent?.[valueKey] ?? field[valueKey];

    const costWithoutVAT = goodinParent
      ? goodinParent?.costWithoutVAT
      : field?.costWithoutVAT;
    const amountVAT = goodinParent ? goodinParent?.amountVAT : field?.amountVAT;
    const costVAT = goodinParent ? goodinParent?.costVAT : field?.costVAT;
    const precisionCurrency = !goodinParent
      ? this.currencyPrecision
      : this.currencyPrecisionParent;
    const fieldPrecision = !goodinParent
      ? field.fieldPrecision
      : goodinParent?.fieldPrecision;

    const fractionDigits = costWithoutVAT ||
    amountVAT ||
    amountVAT === 0 ||
    costVAT ||
    specialPriceFields.includes(field.idInterfaceField)
      ? precisionCurrency
      : fieldPrecision;

    const yes: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'btns.yes'
    );

    const no: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'btns.no'
    );

    return ACTUAL_SIZE_FIELDS.includes(field.idInterfaceField)
      ? fieldValue
        ? this.commonService.actualDimensions(fieldValue, 0)
        : '-'
      : field.controlFieldType == 'dxSelectBox'
      ? fieldValue
      : field.controlFieldType == 'dxCheckBox'
      ? fieldValue?.toString() == 'true'
        ? yes
        : no
      : field.controlFieldType == 'dxNumberBox' ||
        costWithoutVAT ||
        amountVAT ||
        amountVAT === 0 ||
        costVAT
            ? Number(fieldValue).toLocaleString('ru', {
              minimumFractionDigits:
                field.idInterfaceField == ID_INTERFACE_FIELD.QUANTITY
                  ? 0
                  : fractionDigits,
              maximumFractionDigits: fractionDigits,
            })
      : fieldValue
      ? fieldValue
      : '-';
  }

  /*  compareMultiSelectField(){
    const parentList = this.offerGoodsParent[0].goodsSpecifications;
    const isList = this.offerGoods[0].goodsSpecifications;
    if (parentList.length < isList.length) {
      const missingCount = isList.length - parentList.length;
      for (let i = 0; i < missingCount; i++) {
        parentList.push({
          idDemandOfferGood: parentList[0].idDemandOfferGood,
          idInterfaceField: 62,
          fieldValueNumber: null,
          fieldValueString: null,
          fieldName: "Место назначения",
          fieldPrecision: 0,
          controlFieldType: "dxSelectBox",
          fieldValue: "-",
          blockId: 7,
          isVirtual: null
        });
      }
    }

    if (isList.length < parentList.length) {
      const missingCount = parentList.length - isList.length;
      for (let i = 0; i < missingCount; i++) {
        isList.push({
          idDemandOfferGood: parentList[0].idDemandOfferGood,
          idInterfaceField: 62,
          fieldValueNumber: null,
          fieldValueString: null,
          fieldName: "Место назначения",
          fieldPrecision: 0,
          controlFieldType: "dxSelectBox",
          fieldValue: "-",
          blockId: 7,
          isVirtual: null
        });
      }
    }
  }
 */
  deletedGoods() {
    return this.offerGoodsParent.filter(
      (parent) =>
        !this.offerGoods.find((current) => current.idGood == parent.idGood)
    );
  }

  //поиск по товарам, чтобы установить тег добавлен, удален
  findGoodinParent(good) {
    return this.offerGoodsParent.find((el) => el.idGood == good.idGood);
  }

  changeGoodTag(id) {
    return (
      document.getElementById('table' + id)?.getElementsByClassName('change')
        ?.length > 0
    );
  }

  include(array, id) {
    return array.some((e) => e.idDocument == id);
  }

  changedRowGood(idGood, i) {
    let parent = 'parent' + idGood + '_' + i;
    let current = 'current' + idGood + '_' + i;
    return (
      document.getElementById(parent)?.innerHTML !=
      document.getElementById(current)?.innerHTML
    );
  }

  Number(n) {
    return Number(n.toString().replace(/,/, '.'));
  }

  costVatBasis(priceWithoutVat, vatBasis, volume) {
    let vat;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = 0;
    return (
      this.commonService.round(
        volume * priceWithoutVat,
        this.currencyPrecision
      ) +
      this.commonService.round(
        (volume * priceWithoutVat * vat) / 100,
        this.currencyPrecision
      )
    );
  }

  public onSameUnits(offer): boolean {
    return offer.every((item) => item.unitId === offer[0]?.unitId);
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

  public changeScope(): any {
    //todo Проверить: в 1 товаре просто поменять единицы измерения
    //приходит всегда в одинаковом порядке, сравниваем объекты без учета товара, только по датам и количеству.
    let scopes = this.mapDeliveryScopes(this.scopes);
    let deliveryScopesParent = this.mapDeliveryScopes(
      this.deliveryScopesParent
    );

    //сравнение двух массивов в зависимости от расположения элементов
    return (
      scopes?.length === deliveryScopesParent?.length &&
      scopes.every(
        (value, index) =>
          JSON.stringify(value) === JSON.stringify(deliveryScopesParent[index])
      )
    );
  }

  public mapDeliveryScopes(scopes): any {
    return scopes.map((el) => ({
      firmClientName: el.firmClientName,
      idFirmClient: el.idFirmClient,
      volume: el.volume,
    }));
  }

  public includeBasis(): any {
    //todo Проверить: в 1 товаре просто поменять единицы измерения
    let delivCond = this.mapDeliveryFields(this.delivCond);
    let deliveryConditionsParent = this.mapDeliveryFields(
      this.deliveryConditionsParent
    );
    return (
      delivCond?.length === deliveryConditionsParent?.length &&
      delivCond.every(
        (value, index) =>
          JSON.stringify(value) ===
          JSON.stringify(deliveryConditionsParent[index])
      )
    );
  }

  public mapDeliveryFields(list): any {
    return list.map((el) => ({
      concatedCondition: el.concatedCondition,
      idBasisLink: el.idBasisLink,
      idBasisValue: el.idBasisValue,
      idPlaceLink: el.idPlaceLink,
      idPlaceValue: el.idPlaceValue,
      isMain: el.isMain,
      placeDetails: el.placeDetails,
      placeName: el.placeName,
      priceAdjustment: el.priceAdjustment,
      priceWithoutVat: el.priceWithoutVat,
    }));
  }

  public changeSchedule(): any {
    //todo Проверить: в 1 товаре просто поменять единицы измерения
    //приходит всегда в одинаковом порядке, сравниваем объекты без учета товара, только по датам и количеству.
    let schedule = this.mapSchedule(this.schedule);
    let delivSchPeriodsParent = this.mapSchedule(this.delivSchPeriodsParent);

    //сравнение двух массивов в зависимости от расположения элементов
    return (
      schedule?.length === delivSchPeriodsParent?.length &&
      schedule.every(
        (value, index) =>
          JSON.stringify(value) === JSON.stringify(delivSchPeriodsParent[index])
      )
    );
  }

  public mapSchedule(schedule): any {
    return schedule.map((el) => ({
      periodDateBegin: el.periodDateBegin,
      periodDateEnd: el.periodDateEnd,
      periodVolume: el.periodVolume,
    }));
  }

  public getClientName(uniqueScopes, deliveryScopes): void {
    uniqueScopes = [
      ...new Map(
        deliveryScopes.map((item) => [item['idFirmClient'], item])
      ).values(),
    ];
  }

  addTagClient(client, array) {
    return array.find((el) => el.idFirmClient == client.idFirmClient);
  }

  public changedClients(): boolean {
    if (
      this.uniqueDeliveryScopes?.length > 0 ||
      this.uniqueDeliveryScopesParent?.length > 0
    ) {
      let uniqueDeliveryScopes = this.uniqueDeliveryScopes.map((el) => ({
        idFirmClient: el.idFirmClient,
      }));
      let uniqueDeliveryScopesParent = this.uniqueDeliveryScopesParent.map(
        (el) => ({ idFirmClient: el.idFirmClient })
      );
      //сравнение двух массивов НЕ зависимо от расположения элементов
      return (
        JSON.parse(JSON.stringify(uniqueDeliveryScopes)) ==
        JSON.parse(JSON.stringify(uniqueDeliveryScopesParent))
      );
    } else return true;
  }

  public hasStatus = (arr, status: boolean) =>
    !!arr?.some((f) => f.isPrivate === status);

  public checkIsPrivateDocuments = () =>
    this.hasStatus(this.offerDocuments, true);

  public checkIsPrivateDocumentsParent = () =>
    this.hasStatus(this.offerDocumentsParent, true);

  public checkNoPrivateDocuments = () =>
    this.hasStatus(this.offerDocuments, false);

  public checkNoPrivateDocumentsParent = () =>
    this.hasStatus(this.offerDocumentsParent, false);

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

  downloadDoc(file) {
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

  public onRejectOffer(): void {
    this.rejectPopup = true;
    this.onGetRejectionTemplates();
  }

  public onApproveOffer(): void {
    this.approvePopup = true;
    this.popupTitle = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'offer-management.includeInRegister'
    );
    this.popupMessage = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'offer-management.approveOfferMess'
    );
  }

  public onGetRejectionTemplates(): void {
    this.offerManagementService
      .getRejectionTemplates(this.offerGeneral.sectionId)
      .then((res: any) => {
        this.rejectionTemplatesFull = res.rejectionTemplates;
        this.getRejectionTemplates();
      });
  }

  public getRejectionTemplates(): void {
    this.chooseRejectionTempl = {};
    this.rejectReason = '';
    if (this.myTemplate == 0) {
      //мои шаблоны
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == true
      );
    } else {
      //шаблоны секции
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == false
      );
    }
  }

  onPopupSubmit(type) {
    switch (type) {
      case 'reject': {
        const body = {
          idDirection: this.offerGeneral.directionId,
          idSection: this.offerGeneral.sectionId,
          idSession: this.offerGeneral.idSession,
          listDemandsOffers: [this.offerGeneral.idDemandOffer],
          rejectionText: this.rejectReason,
        };
        this.catalogService
          .OffersReject(this.user?.token, body)
          .then((res: any) => {
            this.failureOffer = res.listFailures;
            if (res.isSuccessful) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.rejectionOfTheApp'
              );
              this.popupMessage = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.rejectionOfTheAppSuccessMess'
              );
              this.popupSuccess = true;
            }

            if (res.failureCount > 0) {
              this.popup = true;
              this.popupTitle = getTranslateResultByCurrentLang(
                this.translate.store.currentLang,
                'viewOffer.rejectionOfTheApp'
              );
              this.popupMessage = this.failureOffer[0].reason;
              this.popupWarning = true;
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
              this.popupMessage = getTranslateResultByCurrentLang(
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

  public condEditButton(): boolean {
    //Отображение кнопки редактировать и удалить в выпадающем списке
    return (
      Object.keys(this.chooseRejectionTempl).length !== 0 &&
      this.myTemplate == 0
    );
  }

  /* закрытие попап окна для отклонения заявки, в зависимотси есть или нет боковая панель*/
  @ViewChild('rejectPopupOpen', { static: false })
  rejectPopupOpen: DxPopupComponent;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    //по кнопке esc
    if (this.rejectPopup && !this.isOpenSidebar) {
      //открыто отклонения заявки и закрыта панель Sidebar
      this.rejectPopupOpen.instance.hide();
    }
    if (document.getElementById('mySidebar').style.opacity == '0') {
      //панель Sidebar закрыта (условия для того чтобы, если открыта и попап и Sidebar, то при нажатии esc не закрывалось сразу два окна)
      this.isOpenSidebar = false;
    }
  }

  public onInitializedPopup(e): void {
    //запрещаем закрывать попап по клавише esc
    e.component.registerKeyHandler('escape', function (arg) {
      arg.preventDefault();
    });
  }

  isOpenSidebar = false; //открыта ли боковая панель

  public onEditTemplate(str): void {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    let dataForReq;
    if (str == 'create') {
      dataForReq = {
        sectionId: this.offerGeneral.sectionId,
        idTemplate: {name: '', text: ''},
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

  public onClose(): void {
    this.popup = false;
    if (this.popupSuccess) {
      // this.ngOnInit();
      location.reload();
    }
    // this.popupWarning = false;
    this.popupSuccess = false;
  }
}
