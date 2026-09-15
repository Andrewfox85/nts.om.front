/* eslint-disable */
import { AddGoodToCatalogResult, FiltersService } from './../filters/filters.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';
import { GoodDescriptionFull, SidebarService } from './../../core/services/sidebar-service.service';
import { User } from 'src/app/core/classes/user';
import { IdDirection, pricingType, searchIcon } from '../../api.constants';
import { TranslateService } from '@ngx-translate/core';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import { OfferManagementService } from '../../core/services/offer-management-service.service';
import { Router } from '@angular/router';
import { CreateOfferService } from '../../core/services/create-offer-service.service';
import { OpenAccessPopupComponent } from '../open-access/open-access-popup/open-access-popup.component';
import { CommonService } from 'src/app/core/services/common-service.service';
import { ID_INTERFACE_FIELD } from "../../shared/enums";
import { FormBuilder, FormGroup } from "@angular/forms";
import {
  AddNsiGoodService,
  ReplaceGood
} from "../../core/services/add-nsi-good.service";
import {
  forkJoin,
  Subject,
  takeUntil
} from "rxjs";
import { ACTION } from "../../core/enums";
import { SCHEDULE_BLOCK, SCOPE_BLOCK } from "../create-offer/enums";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @ViewChild(OpenAccessPopupComponent)
  openAccessPopupComponent: OpenAccessPopupComponent;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    //закрывается выезжающая панель по кнопке esc
    if (document.getElementById('mySidebar').style.opacity == '1') {
      this.closeSidebar();
    }
  }

  public user: User;
  public fullData: any;
  public fullDataGroup = []; //сгруппированная инф-ция о товаре
  public dataForReq: any = [];
  public type: string;
  public directionConst = IdDirection;
  public pricingType = pricingType;
  public tabName: number = 0;
  public dataSourceTabs = [];

  public title: string = '';
  public rejectReason: string = '';

  public searchIcon: any;
  public search: string;
  public page: number = 1;
  public firmList = [];
  public pagination: any;
  public Privileges: boolean = false;

  private destroy$ = new Subject<void>();
  public readonly IdDirection = IdDirection;

  public addGoodNSIForm: FormGroup = this.formBuilder.group({
    nomenclaturesWithGroups: [],
    goodsGroup: [],
    goods: [],
  });

  public allCharacteristics = [];
  public NSIlistProperty = [];
  public removedInfoWhenReplacedGood = false;
  public removedCharacteristicsWhenReplacedGood = false;
  public addedSameGoodWhenReplacedGood = false;
  public changedStandardizedFieldsId = [];
  public isViewWarning = false;
  protected readonly SCOPE_BLOCK = SCOPE_BLOCK;

  constructor(
    private formBuilder: FormBuilder,
    private sidebarService: SidebarService,
    public translate: TranslateService,
    private offerManagementService: OfferManagementService,
    public router: Router,
    public createOfferService: CreateOfferService,
    private filtersService: FiltersService,
    public commonService: CommonService,
    public addNsiGoodService: AddNsiGoodService
  ) {
    this.searchIcon = searchIcon;
    window.addEventListener('popstate', () => {
      //при нажатии браузерной кнопки назад закрывается sidebar
      this.closeSidebar();
    });
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.sidebarService.dataForReq$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.dataForReq = data;
      });

    this.sidebarService.type$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.type = data;
        this.prepareDataByType();
      });
  }

  public prepareDataByType(): void {
    if (this.type == 'good') {
      this.onGoodDescriptionFull();
    } else if (this.type == 'detail') {
      if (this.user?.IsWorker) {
        //получение привилегий для работника
        const sectionsArray = JSON.parse(localStorage.getItem('sections'));
        let sectionDescription = sectionsArray.find(
          (el) => el.id === Number(this.dataForReq?.sectionId)
        )?.description;
        sectionDescription =
          'DemandOfferManagementProcessDemoff' + sectionDescription;
        this.Privileges =
          this.commonService.checkPrivileges(sectionDescription);
      }

      if (
        this.dataForReq?.deliveryConditions.length > 0 &&
        !this.dataForReq?.deliveryConditions[0][1]
      ) {
        //базисы поставки

        this.dataForReq.deliveryConditions.forEach((basis) => {
          this.dataForReq.offerGoods.forEach((good) => {
            if (
              good.goodsSpecifications[0].idDemandOfferGood ==
              basis.idDemandOfferGood
            ) {
              Object.assign(basis, {
                goodName: good.goodName,
                unitName: good.unitName,
                properties: good.goodDescription,
                volume: good.goodsSpecifications.find(
                  (el) => el.idInterfaceField == 1
                ).fieldValueNumber, //количество
                quotation:
                  good.goodsSpecifications?.find(
                    (el) => el.idInterfaceField == 56
                  )?.fieldValue || null, //Котировка
                quoteCurrency:
                  good.goodsSpecifications?.find(
                    (el) => el.idInterfaceField == 55
                  )?.fieldValue || null, //Валюта котировки
                amendment:
                  good.goodsSpecifications?.find(
                    (el) => el.idInterfaceField == 54
                  )?.fieldValue || null, //поправка
                priceAdjustment:
                  good.goodsSpecifications?.find(
                    (el) => el.idInterfaceField == 53
                  )?.fieldValueNumber || null, //Тип поправки
                currency: good.goodsSpecifications.find(
                  (el) => el.idInterfaceField == 4
                ).fieldValue, //Валюта
                costVat: this.costVatBasis(
                  basis.priceWithoutVat,
                  good.goodsSpecifications.find(
                    (el) => el.idInterfaceField == 5
                  ),
                  good.goodsSpecifications.find(
                    (el) => el.idInterfaceField == 1
                  ).fieldValueNumber
                ),
              });
            }
          });
        });

        let mainBasis = this.dataForReq.deliveryConditions.find(
          (el) => el.isMain == true
        );
        this.dataForReq.deliveryConditions.splice(
          this.dataForReq.deliveryConditions.indexOf(mainBasis),
          1
        );
        this.dataForReq.deliveryConditions.splice(0, 0, mainBasis);
        this.dataForReq.deliveryConditions =
          this.dataForReq?.deliveryConditions.reduce(function (r, a) {
            //сгруппированы поля по concatedCondition
            r[a.concatedCondition] = r[a.concatedCondition] || [];
            r[a.concatedCondition].push(a);
            return r;
          }, {});
        this.dataForReq.deliveryConditions = Object.entries(
          this.dataForReq.deliveryConditions
        );
      }

      if (
        this.dataForReq?.deliverySchedule?.length > 0 &&
        !this.dataForReq?.deliverySchedule[0][1]
      ) {
        //график поставки
        this.dataForReq.deliverySchedule = this.dataForReq?.isSameGradesInSaleOffer
          ?
          this.dataForReq.deliverySchedule.flatMap(sch =>
            this.dataForReq.offerGoods.map(good => ({
              ...sch,
              idDemandOfferGood: good.idGood,
              goodName: good.goodName,
              unitName: good.unitName,
              properties: good.goodDescription,
            }))
          )
          :
          this.dataForReq.deliverySchedule.flatMap(sch =>
            this.dataForReq.offerGoods
              .filter(good => good.goodsSpecifications[0].idDemandOfferGood === sch.idDemandOfferGood)
              .map(good => {
                  return {
                    ...sch,
                    goodName: good.goodName,
                    unitName: good.unitName,
                    properties: good.goodDescription,
                  };
                }
              )
          );

        this.dataForReq.deliverySchedule =
          this.dataForReq?.deliverySchedule.reduce(function (r, a) {
            //сгруппированы поля по periodDateBegin
            r[a.periodDateBegin] = r[a.periodDateBegin] || [];
            r[a.periodDateBegin].push(a);
            return r;
          }, {});
        this.dataForReq.deliverySchedule = Object.entries(
          this.dataForReq.deliverySchedule
        );
      }

      if (
        this.dataForReq?.delivScope?.length > 0 &&
        !this.dataForReq?.delivScope[0][1]
      ) {
        //грузополучатели / грузоотправители
        this.dataForReq.delivScope = this.dataForReq?.isSameGradesInSaleOffer ?
          this.dataForReq.delivScope.flatMap(scope =>
            this.dataForReq.offerGoods.map(good => ({
              ...scope,
              idDemandOfferGood: good.idGood,
              goodName: good.goodName,
              unitName: good.unitName,
              properties: good.goodDescription,
            }))
          ) :
          this.dataForReq.delivScope.flatMap(scope =>
            this.dataForReq.offerGoods
              .filter(good => good.goodsSpecifications[0].idDemandOfferGood === scope.idDemandOfferGood)
              .map(good => {
                  return {
                    ...scope,
                    goodName: good.goodName,
                    unitName: good.unitName,
                    properties: good.goodDescription,
                  };
                }
              )
          );


        this.dataForReq.delivScope = this.dataForReq?.delivScope.reduce(
          function (r, a) {
            //сгруппированы поля по idFirmClient
            r[a.idFirmClient] = r[a.idFirmClient] || [];
            r[a.idFirmClient].push(a);
            return r;
          },
          {}
        );
        this.dataForReq.delivScope = Object.entries(this.dataForReq.delivScope);
      }
      if (this.dataSourceTabs.length == 0) {
        //можно расценивать как первый раз
        if (this.dataForReq?.deliveryConditions.length > 0) {
          this.dataSourceTabs.push(
            this.translate.store.currentLang == 'RU'
              ? RU['viewOffer'].deliveryBases
              : EN['viewOffer'].deliveryBases
          );
        }
        if (this.dataForReq?.deliverySchedule.length > 0) {
          this.dataSourceTabs.push(
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].paymentDeliveryTerms.deliverySchedule
              : EN['createOffer'].paymentDeliveryTerms.deliverySchedule
          );
        }
        if (this.dataForReq?.delivScope.length > 1) {
          if (this.dataForReq.direction == this.directionConst.buy) {
            this.dataSourceTabs.push(
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].delivScope.consignees
                : EN['createOffer'].delivScope.consignees
            );
          } else
            this.dataSourceTabs.push(
              this.translate.store.currentLang == 'RU'
                ? RU['createOffer'].delivScope.consignors
                : EN['createOffer'].delivScope.consignors
            );
        }
      }
    } else if (this.type == 'createTemplate') {
      if (this.dataForReq?.idTemplate) {
        this.title = this.dataForReq?.idTemplate.name;
        this.rejectReason = this.dataForReq?.idTemplate.text;
      }
    } else if (this.type == 'listOffers') {
    } else if (this.type === 'changedGoodProperty') {
      this.addGoodNSIForm = this.dataForReq.addGoodNSIForm;
      this.onGoodDescriptionFull();

      this.addNsiGoodService.allCharacteristics$
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: []) => {
          this.allCharacteristics = data;
        });

      this.addNsiGoodService.NSIlistProperty$
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: []) => {
          this.NSIlistProperty = data;
        });

      this.addNsiGoodService.removedInfoWhenReplacedGood$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.removedInfoWhenReplacedGood = data;
        });

      this.addNsiGoodService.removedCharacteristicsWhenReplacedGood$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.removedCharacteristicsWhenReplacedGood = data;
        });
    }
  }

  public onGoodDescriptionFull(): void {
    this.sidebarService
      .GetGoodDescriptionFull(this.user.token, this.dataForReq?.id)
      .subscribe((res: GoodDescriptionFull) => {
        this.fullData = res.goodDescriptions;
        if (this.fullData[0]?.specifyBlockName != null) {
          this.fullDataGroup = this.fullData.reduce(function (groupName, value) {
            //сгруппированы поля по specifyBlockName
            groupName[value.specifyBlockName] = groupName[value.specifyBlockName] || [];
            groupName[value.specifyBlockName].push(value);
            return groupName;
          }, {});

          this.fullDataGroup = Object.entries(this.fullDataGroup); //возвращает массив объектов
        }
      });
  }

  costVatBasis(priceWithoutVat, vatBasis, volume) {
    let vat;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = 0;
    return (
      this.commonService.round(volume * priceWithoutVat, 2) +
      this.commonService.round((volume * priceWithoutVat * vat) / 100, 2)
    );
  }

  Number(e) {
    return Number(e);
  }

  onSameUnits() {
    let count = 0;
    this.dataForReq.offerGoods.forEach((item) => {
      if (item.unitId == this.dataForReq.offerGoods[0].unitId) {
        count = count + 1;
      }
    });
    return count == this.dataForReq.offerGoods.length;
  }

  isMinPrice(): boolean {
    //проверка есть ли минимальная цена в заявке для добавления колонки в базисы
    const result = this.dataForReq.offerGoods.some(good =>
      good.goodsSpecifications.some(field =>
        field.idInterfaceField === ID_INTERFACE_FIELD.MIN_PRICE
      )
    );
    return result;
  }

  closeSidebar() {
    document.getElementById('mySidebar').style.right = '-2000px';
    document.getElementById('mySidebar').style.opacity = '0';
    document.getElementById('dark').className = 'dark';
    document.getElementById('mySidebar').style.zIndex = '1500';
    this.sidebarService.dataForReqSubject.next([]);  //очищаем данные после закрытия
    this.sidebarService.typeSubject.next('');  //очищаем данные после закрытия
    this.fullDataGroup = [];
    this.tabName = 0;
    this.dataSourceTabs = [];
    this.fullData = [];
    this.addedSameGoodWhenReplacedGood = false;
    this.addNsiGoodService.removedCharacteristicsWhenReplacedGoodSubject.next(false);
    this.addNsiGoodService.removedInfoWhenReplacedGoodSubject.next(false);
    this.changedStandardizedFieldsId = [];
    const replaceGood: ReplaceGood = {
      id: 0,
      properties: []
    };
    this.addNsiGoodService.newGoodSubject.next(replaceGood);
  }

  editFromViewOffer() {
    //редактирование заявки при ее подробном просмотре
    this.sidebarService.editButton();
    this.closeSidebar();
  }

  onCreateRejectTemplate(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      const body = {
        idSection: this.dataForReq?.sectionId,
        idRejectionTemplate: this.dataForReq?.idTemplate.id || null,
        name: this.title,
        text: this.rejectReason,
      };
      this.offerManagementService
        .setRejectionTemplates(body)
        .then((res: any) => {
          if (res.idRejectionTemplate) {
            this.sidebarService.createEditTemplate();
            this.closeSidebar();
          }
        });
    }
  }

  onRemoveRejectTemplate() {
    const body = {
      idSection: this.dataForReq?.sectionId,
      idRejectionTemplate: this.dataForReq.idTemplate.id,
    };

    this.offerManagementService
      .deleteRejectionTemplate(body)
      .then((res: any) => {
        {
          this.sidebarService.createEditTemplate();
          this.closeSidebar();
        }
      });
  }

  openViewOffer(idOffer, direction) {
    localStorage.setItem(
      'viewOffer',
      JSON.stringify({idOffer: idOffer, direction: direction})
    );
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`/ordermanagement/view-offer`])
    );
    window.open(url, '_blank');
  }

  getFirmsList() {
    if (this.search.length > 0) {
      this.filtersService
        .BuceGetFirmsList(this.user?.token, this.search, this.page)
        .then((res: any) => {
          this.firmList = res.buceFirms;
          this.pagination = res.pagination;
        });
    }
  }

  clearFirmList() {
    this.page = 1;
    this.firmList.length = 0;
  }

  onChooseIdFirm(item) {
    this.offerManagementService.choosenFirm = item;
    this.sidebarService.chooseFirm();
    this.search = '';
    this.clearFirmList();
    this.closeSidebar();
  }

  public onChangeGoodCharacteristics(isAfterWarningMess?: boolean): void {
    if (this.changedStandardizedFieldsId?.length > 0 && !isAfterWarningMess) {
      this.isViewWarning = true;
      return;
    }
    this.addedSameGoodWhenReplacedGood = false;
    //Добавление в каталог
    let listGood = [];

    this.dataForReq.goodsList.forEach((el) => {
      if (!el?.characteristicsNSI && !this.dataForReq.id) {
        listGood.push(el.id);
      }
    });
    let body = {
      idSection: this.dataForReq.sectionId,
      idNomenclatureGroup:
      this.addGoodNSIForm.controls['nomenclaturesWithGroups']?.value,
      idGoodGroup: this.addGoodNSIForm.controls['goodsGroup']?.value,
      idGoodName: this.addGoodNSIForm.controls['goods']?.value?.idValue,
      listProperty: this.NSIlistProperty,
      idModel: this.dataForReq.modelId,
      listAddedGoods: listGood,
    };

    if (this.dataForReq.listClients != null)
      body['listClients'] = this.dataForReq.listClients;

    this.filtersService
      .AddToGeneralCatalog(this.user?.token, body)
      .subscribe((resGood: AddGoodToCatalogResult) => {
        if (resGood.idGood) {
          const goodIdsExcludingOriginalAndCurrent = this.dataForReq.goodsList
            .map(good => good.id)
            .filter(el => el !== this.dataForReq.id &&
              el !== this.dataForReq.originalGoodId);
          if (goodIdsExcludingOriginalAndCurrent.includes(resGood.idGood) ||
            this.dataForReq.id === resGood.idGood) {
            this.addedSameGoodWhenReplacedGood = true;
          } else {
            forkJoin({
              goodName: this.filtersService.getGoodName(this.user.token, resGood.idGood),
              description: this.sidebarService.GetGoodDescriptionFull(this.user.token, resGood.idGood)
            }).subscribe({
              next: ({ goodName, description }) => {
                const good: ReplaceGood = {
                  goodName: goodName.concatName,
                  id: resGood.idGood,
                  properties: description.goodDescriptions,
                  changedStandardizedFieldsId: this.changedStandardizedFieldsId
                };
                this.addNsiGoodService.newGoodSubject.next(good);
                this.closeSidebar();
              }
            });
          }
        }
      });
  }

  public getWarningResult(result: boolean): void {
    if (result) {
      this.onChangeGoodCharacteristics(true);
    }
    this.isViewWarning = false;
  }

  public getChangedStandardizedFieldsId(obj: { idField: number, action: string }): void {
    let isActualField = this.dataForReq.fieldIds?.includes(obj.idField);
    if (isActualField) {
      switch (obj.action) {
        case ACTION.ADD: {
          this.changedStandardizedFieldsId.push(obj.idField);
          break;
        }
        case ACTION.REMOVE: {
          const index = this.changedStandardizedFieldsId.findIndex(id => id == obj.idField);
          this.changedStandardizedFieldsId.splice(index, 1);
          break;
        }
      }
    }

  }

  protected readonly SCHEDULE_BLOCK = SCHEDULE_BLOCK;
}
