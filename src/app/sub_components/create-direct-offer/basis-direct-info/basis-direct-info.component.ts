/* eslint-disable */
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder } from "@angular/forms";
import {
  GOOD_REF_ID,
  pricingType,
  searchIcon,
  ID_STAT_DELIVERY,
  BELARUS_ID_LINK,
  EMPTY_LENGTH,
  MIN_SEARCH_LENGTH
} from 'src/app/api.constants';
import {
  CreateOfferService,
  DeliveryCondition, PlaceSearchResult,
  TreesPlaceDetails,
  TreesValue
} from "../../../core/services/create-offer-service.service";
import { User } from "../../../core/classes/user";
import { DxDataGridComponent, DxTextBoxComponent, DxTreeViewComponent } from "devextreme-angular";
import { log} from "util";
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import { TranslateService } from "@ngx-translate/core";
import { CommonService } from "../../../core/services/common-service.service";
import { OfferManagementService } from "../../../core/services/offer-management-service.service";
import TreeView, {ItemExpandedEvent, Scrollable} from "devextreme/ui/tree_view";
import TextBox from "devextreme/ui/data_grid";
import { ciNodeDelivPlaceArray } from "../../../core/interfaces/interface";
import { ID_INTERFACE_FIELD } from "../../../shared/enums";
import { getNumberVat, getPayloadVat } from "../../../core/helpers/vatValue";
import { ValueChangedEvent } from "devextreme/ui/text_box";

@Component({
  selector: 'basis-direct-info',
  templateUrl: './basis-direct-info.component.html',
  styleUrls: ['./basis-direct-info.component.scss']
})
export class BasisDirectInfoComponent implements OnInit {

  @Input() deliveryBasis;
  @Input() deliveryConditions;
  @Input() goodsList;
  @Input() vatValue;
  @Input() basisValue;
  @Input() isMinPriceOnBasicBasis;
  @Input() pricingType;
  @Input() createOffer;
  @Input() sessionInfo;
  @Input() paymentTypeId;
  @Output() saveBasis = new EventEmitter<any>();
  @Output() deleteBasis = new EventEmitter<any>();


  @ViewChild('dataGridGood', {static: false}) dataGrid: DxDataGridComponent;
  @ViewChild(DxTreeViewComponent, {static: false}) treeView: DxTreeViewComponent;
  @ViewChild("location", {static: false}) location: DxTextBoxComponent;

  setFocus(e) {
    setTimeout(() => {
      e.component.focus();
    });
    // this.location.instance.focus();
  }

  basisForm = this.formBuilder.group({
    basis: null,
    placeName: [] || null,
    specifyingLocation: null,
  });
  treeViewInstance: TreeView;

  user: User;
  searchIcon = searchIcon;
  basisChooseValue: DeliveryCondition;
  changeAmendment = [];           //массив поправок изменений в таблице товаров

  choosenPlaceBasis: any;

  searchValue: string;
  openPopupAddPlace = false;

  placeDataBasis: TreesValue[];
  EnterPlaceName: string;                             //которое отображает значение выбранного или введенного поля
  addedNameNote: string;                              //добавленное значение родительских элементов, если выбрали место назначения из дерева
  delivery: DeliveryCondition[];

  basisGoods = []

  enterPlace: string;

  pricingTypeConst = pricingType;
  changeCoreBasis = false;                            //изменение основного базиса
  vat: number;

  loadingVisible = false;         //при поиске
  private searchDebounceTimer: ReturnType<typeof setTimeout>;
  private searchRequestId: number = 0;
  public isBroadPlaceSearch: boolean = false;
  public broadPlaceSearchMatchCount: number = 0;
  private broadSearchMatchIds = new Set<number>();
  isButtonWeightedAveragePrice = false;
  weightedAveragePrice: number;       //средневзвешенной цены биржевого товара

  constructor(
    private formBuilder: FormBuilder,
    private createOfferService: CreateOfferService,
    private offerManagementService: OfferManagementService,
    public translate: TranslateService,
    public commonService: CommonService
  ) {
  }

  isVisibleToast = false;
  messageToast: string = '';
  typeToast: string;

  saveInstance(e) {
    this.treeViewInstance = e.component;
  }

  private getExpandedTreeKeys(treeViewInstance: TreeView): Array<number | string> {
    return treeViewInstance
      .getNodes()
      .filter((node) => node.expanded)
      .map((node) => node.key);
  }

  private getTreeScrollTop(treeViewInstance: TreeView): number {
    const scrollable: Scrollable = treeViewInstance.getScrollable?.();
    if (scrollable?.scrollTop) {
      return scrollable.scrollTop();
    }

    const element: HTMLElement = treeViewInstance.element?.() as HTMLElement | undefined;
    const scrollContainer =
      element?.querySelector('.dx-scrollable-container') ??
      element?.querySelector('.dx-treeview-scrollable-content');

    return (scrollContainer as HTMLElement | null)?.scrollTop ?? 0;
  }

  private setTreeScrollTop(treeViewInstance: TreeView, scrollTop: number): void {
    const scrollable: Scrollable = treeViewInstance.getScrollable?.();
    if (scrollable?.scrollTo) {
      scrollable.scrollTo({ top: scrollTop });
      return;
    }

    const element: HTMLElement = treeViewInstance.element?.() as HTMLElement | undefined;
    const scrollContainer =
      element?.querySelector('.dx-scrollable-container') ??
      element?.querySelector('.dx-treeview-scrollable-content');

    if (scrollContainer) {
      (scrollContainer as HTMLElement).scrollTop = scrollTop;
    }
  }

  private applyTreeDataSourceUpdate(
    treeViewInstance: TreeView,
    updated: TreesValue[],
    focusKey?: number
  ): void {
    const expandedKeys: (string|number)[] = this.getExpandedTreeKeys(treeViewInstance);
    const scrollTop: number = this.getTreeScrollTop(treeViewInstance);

    treeViewInstance.beginUpdate();
    treeViewInstance.option('dataSource', updated);
    treeViewInstance.endUpdate();

    setTimeout(() => {
      expandedKeys.forEach((key) => {
        try {
          treeViewInstance.expandItem(key);
        } catch {
          // узел мог отсутствовать в отфильтрованном дереве
        }
      });

      if (focusKey != null) {
        try {
          treeViewInstance.expandItem(focusKey);
        } catch {
          // ignore
        }
      }

      this.setTreeScrollTop(treeViewInstance, scrollTop);

      if (focusKey != null) {
        try {
          treeViewInstance.scrollToItem(focusKey);
        } catch {
          // ignore
        }
      }
    }, 0);
  }

  ngOnInit(): void {
    this.vat = getNumberVat(this.vatValue);
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.deliveryBasis.length == 0 || this.basisValue[0]?.coreBasis) {
      this.delivery = this.deliveryConditions;
    } else {
      this.delivery = this.deliveryConditions.find(el => el.linkId == this.deliveryBasis[0].basis).children;
    }

    if (this.basisValue?.length > 0) {
      this.basisForm.controls.basis.patchValue(this.basisValue[0]?.basis);
      this.onChangeBasis(this.basisForm.controls.basis.value)
      this.basisForm.controls.placeName?.patchValue(this.basisValue[0]?.placeName);
      this.basisForm.controls.specifyingLocation?.patchValue(this.basisValue[0]?.specifyingLocation)
      this.EnterPlaceName = this.basisValue[0]?.enterPlaceName;
      this.basisGoods = JSON.parse(JSON.stringify(this.basisValue[0].goods))
      this.getPriceForGood()
    } else this.basisGoods = JSON.parse(JSON.stringify(this.goodsList))
    this.createOffer = JSON.parse(sessionStorage.getItem('createOffer'))
  }

  lengthValidationSearch(e) {
    return e.value.length >= MIN_SEARCH_LENGTH;
  }

  onOpenedDropDown() {
    if (this.basisValue?.length > 0 && this.basisForm.controls.placeName?.value == this.basisValue[0]?.placeName && this.treeView?.instance)
      this.treeView?.instance.selectItem(this.basisValue[0]?.placeName[0]);
  }

  clearPlaceName() {
    this.enterPlace = '';
    this.EnterPlaceName = '';
    this.isBroadPlaceSearch = false;
    this.broadPlaceSearchMatchCount = 0;
    this.broadSearchMatchIds = new Set<number>();
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(null);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
  }

  onChangeBasis(e) {
    this.basisChooseValue = null;
    this.clearPlaceName()
    if (e) {
      this.basisChooseValue = this.delivery.find(el => el.linkId == e);
      this.getDeliveryPlaces(e, this.basisChooseValue.valueId)
      this.searchValue = ''
      if (!this.basisChooseValue?.placeTypeId) {
        this.getPriceForGood()
      }
    }
  }

  onChangePlaceType(e) {
    if (e.itemData.disableCountries || e.itemData.isLazyPlaceholder) {
      //не даем возможности выбрать страну или пункт подгрузки
      e.component.unselectItem(e.itemData);
      return;
    }
    let placeNameString = (e.node.parent?.parent?.text ? (e.node.parent?.parent?.text + ', ') : '') + (e.node.parent?.text ? (e.node.parent?.text + ', ') : '') + e.node.text
    this.addedNameNote = (e.node.parent?.parent?.text ? (e.node.parent?.parent?.text + ', ') : '') + (e.node.parent?.text ? (e.node.parent?.text + ', ') : '')

    // this.EnterPlaceName = e.itemData.valueName
    this.EnterPlaceName = e.node.selected ? placeNameString : null
    this.basisForm.controls.placeName.patchValue(e.component.getSelectedNodeKeys())
    this.basisForm.controls.specifyingLocation?.patchValue(null);
    if (e.node.selected) {
      this.choosenPlaceBasis = this.placeDataBasis.find(el => el.idLink == e.component.getSelectedNodeKeys());
      this.getPriceForGood()
    }
  }

  onChangePlaceTypeByEnter() {
    this.openPopupAddPlace = false;
    this.EnterPlaceName = this.enterPlace;
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls.placeName.patchValue(-1);
    this.basisForm.controls.specifyingLocation?.patchValue(null);
    this.getPriceForGood()
  }

  checkPrices(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let cost = this.basisGoods[0]?.cost || null
      if (cost && cost < this.weightedAveragePrice) {
        this.basisGoods[0].error = true
        this.error = true;
        this.isButtonWeightedAveragePrice = true
        this.messageError = this.translate.store.currentLang == 'RU' ?
          (RU["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + RU["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name) :
          (EN["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + EN["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name)
      } else {
        this.messageToast = this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.toastPriceCorrespondQuote : EN["createOffer"].termsDeliveryTime.toastPriceCorrespondQuote
        this.typeToast = 'success'
        this.isVisibleToast = true;
      }

      /*    this.messageToast = toastVisible ? (this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.toastPriceAccordingQuote : EN["createOffer"].termsDeliveryTime.toastPriceAccordingQuote) :
            (this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.toastPriceCorrespondQuote : EN["createOffer"].termsDeliveryTime.toastPriceCorrespondQuote)
          this.typeToast = 'success'
        this.isVisibleToast = true;*/
    }
  }

  setWeightedAveragePrice(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.basisGoods[0].cost = this.weightedAveragePrice
      this.basisGoods[0].change = true;
      this.basisGoods[0].error ? this.basisGoods[0].error = false : null

      this.messageToast = this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.toastPriceAccordingQuote : EN["createOffer"].termsDeliveryTime.toastPriceAccordingQuote
      this.typeToast = 'success'
      this.isVisibleToast = true;
    }
  }


  public getPriceForGood(): void {
    this.createOfferService.GetStatisticsPriceLimit(
      this.user?.token,
      this.sessionInfo.sectionId,
      this.sessionInfo.sessionId,
      this.paymentTypeId,
      this.sessionInfo.idMarketType,
      this.goodsList[0].currency.id,
      getPayloadVat(this.vatValue) || '',
      this.goodsList[0].id,
      this.goodsList[0].units.id,
      this.basisChooseValue.valueId,
      this.choosenPlaceBasis ? this.choosenPlaceBasis?.idLink : this.basisValue ? this.basisValue[0]?.idPlaceLink : null
    ).then((res: any) => {
      this.weightedAveragePrice = res.priceWithoutVat;
    });
  }

  getDeliveryPlaces(idBasisLink: number, idBasisValue: number) {
    //получение названия места для каждого базиса
    this.createOfferService
      .GetStatisticsPlacesTree(this.user?.token, this.sessionInfo.sectionId, this.sessionInfo.sessionId, this.paymentTypeId, this.sessionInfo.idMarketType, this.goodsList[0].id, this.goodsList[0].units.id, idBasisLink, idBasisValue)
      .then((res: TreesPlaceDetails) => {
        res.trees.find((el) => {
          if (el.lvl === 0) {
            el.lvl = 1;
          }
          if (el.lvl === 1) {
            // если базис поставки "Франко склад продавца" - значение "БЕЛАРУСЬ" недоступен
            if (idBasisValue === ID_STAT_DELIVERY.SELLERS_EX_WAREHOUSE && el.idLink === BELARUS_ID_LINK) {
              if (ciNodeDelivPlaceArray.includes(el.idLinkParent)) {
                el.disableCountries = true;
              }
            }
            el.idLinkParent = null;
          }
        })
        this.placeDataBasis = res.trees;
        this.createOfferService.buildPlaceTreeIndex(this.placeDataBasis);
      })
  }

  onChangePrices(e, id) {
    this.basisGoods.find(el => el.id == id).cost = e.value

    /*    if (this.changePrice.find(el => el.id == id)) {
          this.changePrice.splice(this.changePrice.findIndex(el => el.id == id), 1);
        }
        this.changePrice.push({
          id: id,
          cost: e.value
        })*/
  }

  keyDown(id) {
    let changeGood = this.basisGoods.find(el => el.id == id)
    changeGood.change = changeGood.error = changeGood.range = false;
  }

  public searchTxtBoxValueChange(e: ValueChangedEvent): void {
    const isSearchAllowed: boolean = e.value.length >= MIN_SEARCH_LENGTH || e.value.length === EMPTY_LENGTH;
    if (!isSearchAllowed) {
      return;
    }

    clearTimeout(this.searchDebounceTimer);
    const searchValue: any = e.value;
    const requestId: number = ++this.searchRequestId;
    this.loadingVisible = true;

    this.searchDebounceTimer = setTimeout(() => {
      const treeViewInstance: TreeView =
        this.treeView?.instance ?? this.treeViewInstance;

      if (!treeViewInstance || !this.placeDataBasis?.length) {
        if (requestId === this.searchRequestId) {
          this.loadingVisible = false;
        }
        return;
      }

      setTimeout(() => {
        if (requestId !== this.searchRequestId) {
          return;
        }

        try {
          const searchState: PlaceSearchResult = this.createOfferService.applyPlaceTreeSearch(
            searchValue,
            this.placeDataBasis,
            treeViewInstance
          );
          if (requestId !== this.searchRequestId) {
            return;
          }
          this.isBroadPlaceSearch = searchState.isBroadSearch;
          this.broadPlaceSearchMatchCount = searchState.matchCount;
          this.broadSearchMatchIds = searchState.matchIds;
        } finally {
          if (requestId === this.searchRequestId) {
            this.loadingVisible = false;
          }
        }
      }, 0);
    }, 300);
  }

  public onPlaceTreeItemExpanded(e: ItemExpandedEvent): void {
    if (e.itemData?.isLazyPlaceholder) {
      return;
    }

    const parentId = e.itemData?.idLink;
    if (!parentId) {
      return;
    }

    const treeViewInstance: TreeView = this.treeView?.instance ?? this.treeViewInstance;
    if (!treeViewInstance) {
      return;
    }

    const currentFiltered: TreesValue[] = treeViewInstance.option('dataSource') as TreesValue[];
    const childNodes: TreesValue[] = currentFiltered.filter(
      (item) => Number(item.idLinkParent) === Number(parentId)
    );

    if (
      childNodes.some((item) => item.isLazyPlaceholder) ||
      !e.itemData?.hasLazyChildren
    ) {
      return;
    }

    const updated: TreesValue[] = this.createOfferService.appendLazyChildren(
      this.placeDataBasis,
      currentFiltered,
      parentId,
      this.broadSearchMatchIds
    );

    if (updated !== currentFiltered) {
      this.applyTreeDataSourceUpdate(treeViewInstance, updated, parentId);
    }
  }

  public onLoadPlaceChildren(event: Event, item: TreesValue): void {
    event.preventDefault();
    event.stopPropagation();

    const parentId: number = item.isLazyPlaceholder ? item.idLinkParent : item.idLink;
    const treeViewInstance: TreeView = this.treeView?.instance ?? this.treeViewInstance;
    if (!treeViewInstance || parentId == null) {
      return;
    }

    const currentFiltered: TreesValue[] = treeViewInstance.option('dataSource') as TreesValue[];
    const updated: TreesValue[] = this.createOfferService.appendLazyChildren(
      this.placeDataBasis,
      currentFiltered,
      parentId,
      this.broadSearchMatchIds
    );

    if (updated === currentFiltered) {
      return;
    }

    this.applyTreeDataSourceUpdate(treeViewInstance, updated, parentId);
  }

  onChangeAmendment(e, id) {
    if (this.changeAmendment.find(el => el.id == id)) {
      this.changeAmendment.splice(this.changeAmendment.findIndex(el => el.id == id), 1);
    }

    this.changeAmendment.push({
      id: id,
      amendment: e.value
    })
    if (this.pricingType == this.pricingTypeConst?.formulaWithQuotation) {
      let amendmentSize, quotationCurr;
      let good = this.basisGoods.find(g => g.id == id);
      let date = new Date();
      this.commonService.ConvertCurrency(this.user?.token, good.quotation, good.quoteCurrency.id, good.currency.id, this.commonService.toOADate(date)).subscribe((res) => {
        quotationCurr = res;

        if (good.priceAdjustment.id == 1) {               //в процентном соотношении
          amendmentSize = quotationCurr / 100 * e.value;
        } else
          amendmentSize = e.value;

        this.changeAmendment[this.changeAmendment.length - 1].cost = this.commonService.round((quotationCurr + amendmentSize), 2)
      })
    }
  }

  priceAmendment(item) {
    let ch = this.changeAmendment.find(el => el.id == item.id)
    if (ch) {
      return ch.cost;
    } else
      return item.cost;
  }

  OnClose() {
    if (this.basisValue?.length > 0) {
      this.basisGoods = this.basisValue[0].goods
    }
    this.saveBasis.emit(false)
  }

  clearBasis() {
    this.basisForm.controls?.basis.patchValue(null);
    this.basisForm.controls?.placeName.patchValue(null);
    this.basisForm.controls?.specifyingLocation.patchValue(null);
    this.basisGoods = this.goodsList

    // this.dataGrid.instance.cancelEditData();                            //отменяет редактирование в таблице товаров
  }

  errorState = 1;
  error = false;
  messageError: string;

  goodArray = [];

  async onSaveBasis(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      if ((this.pricingType != this.pricingTypeConst.formulaWithoutQuotation && !this.basisGoods.every(g => g.cost > 0)) || (this.pricingType == this.pricingTypeConst.formulaWithoutQuotation && !this.basisGoods.every(g => g.amendment > 0))) {                   //цена должна быть больше 0
        this.error = true;
        this.messageError = this.translate.store.currentLang == 'RU' ? RU["createOffer"].termsDeliveryTime.price0Error1 + " " + (this.pricingType == this.pricingTypeConst.price ? RU["createOffer"].goodInfo.priceWithoutVAT : RU["createOffer"].goodInfo.amendment) + " " + RU["createOffer"].termsDeliveryTime.price0Error2
          : EN["createOffer"].termsDeliveryTime.price0Error1 + " " + (this.pricingType == this.pricingTypeConst.price ? EN["createOffer"].goodInfo.priceWithoutVAT : EN["createOffer"].goodInfo.amendment) + " " + EN["createOffer"].termsDeliveryTime.price0Error2;
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />')
        return;
      }

      const idPlaceLink = this.choosenPlaceBasis
        ? this.choosenPlaceBasis?.idLink
        : this.basisValue && this.basisValue[0]?.basis === this.basisForm.controls?.basis.value &&
        this.basisForm.controls.placeName?.value
          ? this.basisValue[0].idPlaceLink
          : null;

      this.createOfferService.getDeliveryCondConcated(
        this.user?.token,
        this.basisChooseValue.linkId,
        idPlaceLink,
        this.basisForm.controls?.specifyingLocation?.value?.toString() || null).subscribe(
        (item) => {
          let deliveryConditionName = item.result

          if (!this.error) {
            if (this.basisValue?.length > 0) {//редактирование базиса
              this.basisValue.forEach(item => {
                item.concatedCondition = deliveryConditionName;
                item.idPlaceLink = idPlaceLink
                item.idPlaceValue = this.choosenPlaceBasis ? this.choosenPlaceBasis?.idValue : (item.basis == this.basisForm.controls?.basis.value && this.basisForm.controls.placeName?.value) ? this.basisValue[0].idPlaceValue : null
                item.basis = this.basisForm.controls?.basis.value;
                item.enterPlaceName = this.EnterPlaceName;
                item.placeName = this.basisForm.controls?.placeName.value;
                item.specifyingLocation = this.basisForm.controls?.specifyingLocation.value;
                item.basisId = this.basisChooseValue.basisId
                item.basisName = this.basisChooseValue.basisName
                item.idBasisLink = this.basisChooseValue.linkId
                item.idBasisValue = this.basisChooseValue.valueId
                item.placeTypeId = this.basisChooseValue.placeTypeId
                item.minAddBasis = this.basisChooseValue.minAddBasis
                item.minAddBasisPlaces = this.basisChooseValue.minAddBasisPlaces
                item.contradictoryValueId = this.basisChooseValue.contradictoryValueId
                item.contradictoryBasisName = this.basisChooseValue.contradictoryBasisName
                item.isRequiredPlace = this.basisChooseValue.isRequiredPlace
                item.isRequiredAddBasis = this.basisChooseValue.isRequiredAddBasis
                item.parentId = this.basisChooseValue.parentId
                item.level = this.basisChooseValue.level
                item.hasChildren = this.basisChooseValue.hasChildren

                let cost, amendment;

                item.goods.forEach(g => {                                                          //проверка есть ли в измененном массиве цены
                  amendment = this.changeAmendment?.length > 0 ? (this.changeAmendment.find(el => el.id == g.id) ? this.changeAmendment.find(el => el.id == g.id)?.amendment : Number(g?.amendment)) : null;
                  cost = this.basisGoods[0].cost

                  //проверка на соответствие цены средневзвешенной цены биржевого товара
                  if (cost < this.weightedAveragePrice) {
                    this.basisGoods[0].error = true;
                    this.error = true;
                    this.isButtonWeightedAveragePrice = true
                    this.messageError = this.translate.store.currentLang == 'RU' ?
                      (RU["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + RU["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name) :
                      (EN["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + EN["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name)
                  } else {
                    g.cost = cost;
                    g.costVAT = this.commonService.round((g.volume * cost), 2) + this.commonService.round((g.volume * cost * this.vat / 100), 2);
                    g.amendment = amendment;
                  }
                })
              })
              if (!this.error && this.basisValue[0].coreBasis && this.changeCoreBasis) {      //изменили основной базис (выбрали другой в выпадающем списке)
                this.deliveryBasis = [this.deliveryBasis[0]]
              }
            } else {
              //добавление нового базиса
              let goodArray = [];
              this.basisGoods.forEach(good => {
                let cost = this.basisGoods[0].cost || null, unit, currency, amendment = good?.amendment || null;

                //поиск значения валюты и единиц измерения
                good.fields.forEach(block => {
                  for (let i = 0; i < block[1].length; i++) {
                    if (block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.UNIT) {                      //ед.измерения
                      unit = block[1][i].interfaceField.allowedValues.find(u => u.id == block[1][i].selectedValues).name
                    }
                    if (block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.CURRENCY) {                       //валюта
                      currency = block[1][i].interfaceField.allowedValues.find(c => c.id == block[1][i].selectedValues).name
                    }
                  }
                })

                if (this.changeAmendment?.length > 0) {                                          //проверка есть ли в измененном массиве поправки
                  let findEl = this.changeAmendment?.find(el => el.id == good.id)
                  if (findEl) {
                    amendment = findEl.amendment
                  }
                }
                //проверка на соответствие цены средневзвешенной цены биржевого товара
                if (cost < this.weightedAveragePrice) {
                  this.basisGoods[0].error = true;
                  this.error = true;
                  this.isButtonWeightedAveragePrice = true
                  this.messageError = this.translate.store.currentLang == 'RU' ?
                    (RU["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + RU["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name) :
                    (EN["createOffer"].termsDeliveryTime.priceQuoteError1 + '</br>' + EN["createOffer"].goodInfo.quotation + ' ' + this.weightedAveragePrice + ' ' + this.goodsList[0].currency.name)
                }
                if (!this.error) {
                  goodArray.push({
                    id: good.id,
                    name: good.name,
                    volume: good.volume,
                    units: unit,
                    cost: cost || null,
                    currency: currency,
                    quotation: good.quotation,            //при ценовом контрое значение котировки, при торгах по формуле с котировкой - значение котировки оттуда
                    quoteCurrency: good.quoteCurrency,
                    priceAdjustment: good.priceAdjustment?.id,
                    amendment: amendment,
                    costVAT: this.commonService.round((good.volume * cost), 2) + this.commonService.round((good.volume * cost * this.vat / 100), 2),
                  })
                }
              })
              if (!this.error) {
                this.deliveryBasisPush(goodArray, deliveryConditionName)
              }
            }
            if (!this.error)
              this.saveBasis.emit(this.deliveryBasis)
          }
        })
    }
  }

  public deliveryBasisPush(goodArray, concatedCondition: string): void {
    this.deliveryBasis.push(
      Object.assign(
        this.basisForm.value,
        {
          concatedCondition: concatedCondition,
          minAddBasis: this.basisChooseValue.minAddBasis,
          basisName: this.basisChooseValue.basisName,
          enterPlaceName: this.EnterPlaceName,
          coreBasis: this.deliveryBasis.length == 0,
          idBasisLink: this.basisChooseValue.linkId,
          idBasisValue: this.basisChooseValue.valueId,
          idPlaceLink: this.choosenPlaceBasis?.idLink || null,
          idPlaceValue: this.choosenPlaceBasis?.idValue || null,
          minAddBasisPlaces: this.basisChooseValue.minAddBasisPlaces,
          contradictoryValueId: this.basisChooseValue.contradictoryValueId,
          contradictoryBasisName: this.basisChooseValue.contradictoryBasisName,
          isRequiredPlace: this.basisChooseValue.isRequiredPlace,
          isRequiredAddBasis: this.basisChooseValue.isRequiredAddBasis,
          placeTypeId: this.basisChooseValue.placeTypeId,
          parentId: this.basisChooseValue.parentId,
          level: this.basisChooseValue.level,
          hasChildren: this.basisChooseValue.hasChildren,
          basisId: this.basisChooseValue.basisId,
        },
        {goods: goodArray}
      )
    );
  }

}
