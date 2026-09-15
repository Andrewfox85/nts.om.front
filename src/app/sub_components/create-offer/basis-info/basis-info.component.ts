/* eslint-disable */
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  GOOD_REF_ID,
  pricingType,
  searchIcon,
  ID_STAT_DELIVERY,
  BELARUS_ID_LINK,
  BELARUS_ID_LINK_DESTINATION_STATION,
  MARKET_TYPES,
  AUCTION_TYPE,
  EMPTY_LENGTH,
  MIN_SEARCH_LENGTH
} from 'src/app/api.constants';
import {
  BasisGoods,
  CreateOfferService,
  DeliveryCondition, PlaceSearchResult,
  TreesPlaceDetails,
  TreesValue
} from '../../../core/services/create-offer-service.service';
import { User } from '../../../core/classes/user';
import {
  DxDataGridComponent,
  DxTextBoxComponent,
  DxTreeViewComponent,
} from 'devextreme-angular';
import RU from '../../../../assets/i18n/RU.json';
import EN from '../../../../assets/i18n/EN.json';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../core/services/common-service.service';
import { OfferManagementService } from '../../../core/services/offer-management-service.service';
import TreeView, {ItemExpandedEvent, ItemSelectionChangedEvent, Scrollable} from 'devextreme/ui/tree_view';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';
import { ciNodeDelivPlaceArray } from "../../../core/interfaces/interface";
import { getTranslateResultByCurrentLang } from "../../../core/helpers";
import { KeyDownEvent } from "devextreme/ui/number_box";
import { getNumberVat, getPayloadVat } from "../../../core/helpers/vatValue";
import { ValueChangedEvent } from "devextreme/ui/text_box";
import { AppConfigService } from "../../../app-config.service";

@Component({
  selector: 'basis-info',
  templateUrl: './basis-info.component.html',
  styleUrls: ['./basis-info.component.scss'],
})
export class BasisInfoComponent implements OnInit {
  @Input() deliveryBasis;
  @Input() deliveryConditions: DeliveryCondition[];
  @Input() goodsList;
  @Input() vatValue;
  @Input() basisValue;
  @Input() isMinPriceOnBasicBasis;
  @Input() pricingType;
  @Input() isActiveQuotation;
  @Input() isActiveCorridor;
  @Input() createOffer;
  @Input() paymentTypeId;
  @Input() demandsModal;
  @Input() direction;
  @Input() isMinPriceInModel: boolean;
  @Output() saveBasis = new EventEmitter<any>();
  @Output() deleteBasis = new EventEmitter<any>();

  @ViewChild('dataGridGood', {static: false}) dataGrid: DxDataGridComponent;
  @ViewChild(DxTreeViewComponent, {static: false})
  treeView: DxTreeViewComponent;
  @ViewChild('location', {static: false}) location: DxTextBoxComponent;

  public basisForm: FormGroup = this.formBuilder.group({
    basis: null,
    placeName: [] || null,
    specifyingLocation: null,
  });
  public treeViewInstance: TreeView;

  public user: User;
  public searchIcon = searchIcon;
  public basisChooseValue: DeliveryCondition;
  public changeAmendment = []; //массив поправок изменений в таблице товаров

  public choosenPlaceBasis: TreesValue;

  public searchValue: string;
  public openPopupAddPlace = false;

  public placeDataBasis: TreesValue[];
  public EnterPlaceName: string; //которое отображает значение выбранного или введенного поля
  public addedNameNote: string; //добавленное значение родительских элементов, если выбрали место назначения из дерева
  public delivery: DeliveryCondition[];

  public basisGoods = [];

  public enterPlace: string;

  public pricingTypeConst = pricingType;
  public changeCoreBasis = false; //изменение основного базиса
  public vat: number;

  public loadingVisible: boolean = false; //при поиске
  private searchDebounceTimer: ReturnType<typeof setTimeout>;
  private searchRequestId: number = 0;
  public isBroadPlaceSearch: boolean = false;
  public broadPlaceSearchMatchCount: number = 0;
  private broadSearchMatchIds = new Set<number>();
  public idPlaceLink: number;

  public isVisibleToast = false;
  public messageToast: string = '';
  public typeToast: string;

  public errorState = 1;
  public error = false;
  public messageError: string;
  public isButtonPriceQuote = false;
  public isButtonPriceRange = false;
  public goodArray: BasisGoods[] = [];
  public deliveryConditionName: string;

  constructor(
    private formBuilder: FormBuilder,
    private createOfferService: CreateOfferService,
    private offerManagementService: OfferManagementService,
    public translate: TranslateService,
    public commonService: CommonService,
    public config: AppConfigService
  ) {
  }

  public setFocus(e): void {
    setTimeout(() => {
      e.component.focus();
    });
  }

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

  setPricesQuote(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let toastVisible = false;
      let nullQuotation = 0;
      this.basisGoods.forEach((good) => {
        let cost = good?.cost || null;
        if (good.quotation && cost != good.quotation) {
          good.cost = good.quotation;
          good.change = true;
          good.error ? (good.error = false) : null;
          toastVisible = true;
        }
        if (!good.quotation) {
          nullQuotation = nullQuotation + 1;
        }
      });
      if (nullQuotation == this.basisGoods.length) {
        this.messageToast =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.infoMessPriceQoute
            : EN['createOffer'].termsDeliveryTime.infoMessPriceQoute;
        this.typeToast = 'warning';
      } else {
        this.messageToast = toastVisible
          ? this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.toastPriceAccordingQuote
            : EN['createOffer'].termsDeliveryTime.toastPriceAccordingQuote
          : this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.toastPriceCorrespondQuote
            : EN['createOffer'].termsDeliveryTime.toastPriceCorrespondQuote;
        this.typeToast = 'success';
      }
      this.isVisibleToast = true;
    }
  }

  setPriceRange(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let isToast = true;
      let nullRange = 0;
      this.basisGoods.forEach((good) => {
        let cost = good?.cost;
        if (
          (good.minPrice && cost < good.minPrice) ||
          (good.maxPrice && cost > good.maxPrice)
        ) {
          //если не входит в ценовой коридор
          good.range = true;
          isToast = false;
        }

        if (!good.minPrice && !good.maxPrice) {
          nullRange = nullRange + 1;
        }
      });

      if (nullRange == this.basisGoods.length) {
        this.messageToast =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.infoMessPriceRange
            : EN['createOffer'].termsDeliveryTime.infoMessPriceRange;
        this.typeToast = 'warning';
        this.isVisibleToast = true;
      } else {
        if (isToast) {
          this.typeToast = 'success';
          this.messageToast =
            this.translate.store.currentLang == 'RU'
              ? RU['createOffer'].termsDeliveryTime.toastPriceCorrespondRange
              : EN['createOffer'].termsDeliveryTime.toastPriceCorrespondRange;
          this.isVisibleToast = true;
        }
      }
    }
  }

  public ngOnInit(): void {
    this.vat = getNumberVat(this.vatValue);
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.deliveryBasis.length == 0 || this.basisValue[0]?.coreBasis) {
      this.delivery = this.deliveryConditions;
    } else {
      this.delivery = this.deliveryConditions.find(
        (el) => el.linkId == this.deliveryBasis[0].basis
      ).children;
    }

    if (this.basisValue?.length > 0) {
      this.basisForm.controls['basis'].patchValue(this.basisValue[0]?.basis);
      this.onChangeBasis(this.basisForm.controls['basis'].value);
      this.basisForm.controls['placeName']?.patchValue(
        this.basisValue[0]?.placeName
      );
      this.basisForm.controls['specifyingLocation']?.patchValue(
        this.basisValue[0]?.specifyingLocation
      );
      this.EnterPlaceName = this.basisValue[0]?.enterPlaceName;
      this.basisGoods = JSON.parse(JSON.stringify(this.basisValue[0].goods));
    } else this.basisGoods = JSON.parse(JSON.stringify(this.goodsList));
    this.createOffer = JSON.parse(sessionStorage.getItem('createOffer'));
  }

  isMinPrice() {
    //проверка есть ли минимальная цена в заявке для добавления колонки
    if (this.basisValue?.length > 0) {
      const result = this.basisGoods.some(
        (item) => item.hasOwnProperty('minPriceField')
      );
      return result && this.isMinPriceInModel;
    } else {
      const result = this.basisGoods[0].fields
        .flatMap(([, fields]) => fields)
        .find((field) => field.interfaceField?.fieldId === ID_INTERFACE_FIELD.MIN_PRICE);
      return result;
    }
  }

  comparisonTarget(item) {
    return () => item.minPriceField;
  }

  lengthValidationSearch(e) {
    return e.value.length >= MIN_SEARCH_LENGTH;
  }

  onOpenedDropDown() {
    if (
      this.basisValue?.length > 0 &&
      this.basisForm.controls['placeName']?.value ==
      this.basisValue[0]?.placeName &&
      this.treeView?.instance
    )
      this.treeView?.instance.selectItem(this.basisValue[0]?.placeName?.[0]);
  }

  public clearPlaceName(): void {
    this.enterPlace = '';
    this.EnterPlaceName = '';
    this.isBroadPlaceSearch = false;
    this.broadPlaceSearchMatchCount = 0;
    this.broadSearchMatchIds = new Set<number>();
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls['placeName'].patchValue(null);
    this.basisForm.controls['specifyingLocation']?.patchValue(null);
  }

  onChangeBasis(e) {
    this.basisChooseValue = null;
    if (e) {
      this.basisChooseValue = this.delivery.find((el) => el.linkId == e);
      this.getDeliveryPlaces(e);
      this.searchValue = '';

      if (
        this.deliveryBasis?.length > 1 &&
        this.basisValue[0]?.coreBasis &&
        this.basisValue[0]?.basis != e
      ) {
        //редактируем
        this.error = true;
        this.errorState = 0;
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.editingBasisTextAddition
            : EN['createOffer'].termsDeliveryTime.editingBasisTextAddition;
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
        this.changeCoreBasis = true;
      }
      if (
        (!this.basisChooseValue?.placeTypeId ||
          !this.basisChooseValue.isRequiredPlace) &&
        this.isActiveQuotation
      ) {
        this.basisGoods.forEach((item) => {
          this.getQuoteForGoog(item);
        });
      }

      if (!this.basisChooseValue?.placeTypeId && this.isActiveCorridor) {
        this.basisGoods.forEach((item) => {
          this.getRangeForGoog(item);
        });
      }
    }
    this.clearPlaceName();
  }

  getQuoteForGoog(good) {
    let isAnalog = this.goodsList.find((el) => el.id == good.id);
    if (isAnalog.characteristicsNSI) {
      //для товаров аналогов
      let GoodDescription = '';
      for (let ch in isAnalog.characteristicsNSI) {
        if (
          !ch.toString().startsWith('analogs') &&
          isAnalog.characteristicsNSI[ch]?.length > 0 &&
          ch != GOOD_REF_ID.toString()
        ) {
          //не нужно наименование товара
          isAnalog.characteristicsNSI[ch].forEach((el) => {
            if (!isAnalog.characteristicsNSI['analogs' + ch])
              GoodDescription = GoodDescription + ch + ':' + el + ';';
          });
        }
      }
      this.offerManagementService
        .getPriceLimitQuotationAnalog(
          this.createOffer.sectionId,
          this.createOffer.sessionId,
          this.createOffer.modelId,
          isAnalog.idNomenclatureGroup,
          isAnalog.idGoodGroup,
          isAnalog.idGoodName,
          GoodDescription,
          this.goodsList[0].currency.id,
          getPayloadVat(this.vatValue),
          this.goodsList.find((gL) => gL.id == good.id).units.id,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          (this.choosenPlaceBasis?.idLink || null) == null &&
          this.basisForm.controls['specifyingLocation']?.value || null
        )
        .then((res: any) => {
          good.quotation = res.priceWithoutVat; //котировка по товару
        });
    } else {
      this.offerManagementService
        .getPriceLimitQuotation(
          this.createOffer.sectionId,
          this.createOffer.sessionId,
          this.createOffer.modelId,
          this.createOffer.direction,
          good.id,
          this.goodsList[0].currency.id,
          getPayloadVat(this.vatValue),
          this.goodsList.find((gL) => gL.id == good.id).units.id,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          (this.choosenPlaceBasis?.idLink || null) == null &&
          this.basisForm.controls['specifyingLocation']?.value || null
        )
        .then((res: any) => {
          good.quotation = res.priceWithoutVat; //котировка по товару
        });
    }
  }

  getRangeForGoog(good) {
    let isAnalog = this.goodsList.find((el) => el.id == good.id);
    if (isAnalog.characteristicsNSI) {
      //для товаров аналогов
      let GoodDescription = '';
      for (let ch in isAnalog.characteristicsNSI) {
        if (
          !ch.toString().startsWith('analogs') &&
          isAnalog.characteristicsNSI[ch]?.length > 0 &&
          ch != GOOD_REF_ID.toString()
        ) {
          //не нужно наименование товара
          isAnalog.characteristicsNSI[ch].forEach((el) => {
            if (!isAnalog.characteristicsNSI['analogs' + ch])
              GoodDescription = GoodDescription + ch + ':' + el + ';';
          });
        }
      }
      this.offerManagementService
        .getPriceLimitCorridorAnalog(
          this.createOffer.sectionId,
          this.createOffer.sessionId,
          this.createOffer.modelId,
          isAnalog.idNomenclatureGroup,
          isAnalog.idGoodGroup,
          isAnalog.idGoodName,
          GoodDescription,
          this.goodsList[0].currency.id,
          getPayloadVat(this.vatValue),
          this.goodsList.find((gL) => gL.id == good.id).units.id,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls['specifyingLocation']?.value || null
        )
        .then((res: any) => {
          good.minPrice = res.leftBound; //нижняя граница коридора
          good.maxPrice = res.rightBound; //верхняя граница коридора
        });
    } else {
      this.offerManagementService
        .getPriceLimitCorridor(
          this.createOffer.sectionId,
          this.createOffer.sessionId,
          this.createOffer.modelId,
          this.createOffer.direction,
          good.id,
          this.goodsList[0].currency.id,
          getPayloadVat(this.vatValue),
          this.goodsList.find((gL) => gL.id == good.id).units.id,
          good.volume,
          this.paymentTypeId,
          this.basisChooseValue.valueId,
          this.choosenPlaceBasis?.idLink || null,
          this.basisForm.controls['specifyingLocation']?.value || null
        )
        .then((res: any) => {
          good.minPrice = res.leftBound; //нижняя граница коридора
          good.maxPrice = res.rightBound; //верхняя граница коридора
        });
    }
  }

  onSelectionChanged(e) {
    //при очищении поля место поставки
    if (e.component.getSelectedNodes()?.length == 0) {
      this.choosenPlaceBasis = null;
      if ((!this.basisChooseValue?.placeTypeId ||
          !this.basisChooseValue.isRequiredPlace) &&
        this.isActiveQuotation) {
        //котировка
        this.basisGoods.forEach((item) => {
          this.getQuoteForGoog(item);
        });
      }

      if (this.isActiveCorridor) {
        //коридор
        this.basisGoods.forEach((item) => {
          this.getRangeForGoog(item);
        });
      }
    }
  }

  public onChangePlaceType(e: ItemSelectionChangedEvent): void {
    if (e.itemData['disableCountries'] || e.itemData.isLazyPlaceholder) {
      //не даем возможности выбрать страну или пункт подгрузки
      e.component.unselectItem(e.itemData);
      return;
    }
    let placeNameString =
      (e.node.parent?.parent?.text ? e.node.parent?.parent?.text + ', ' : '') +
      (e.node.parent?.text ? e.node.parent?.text + ', ' : '') +
      e.node.text;
    this.addedNameNote =
      (e.node.parent?.parent?.text ? e.node.parent?.parent?.text + ', ' : '') +
      (e.node.parent?.text ? e.node.parent?.text + ', ' : '');

    // this.EnterPlaceName = e.itemData.valueName
    this.EnterPlaceName = e.node.selected ? placeNameString : null;
    this.basisForm.controls['placeName'].patchValue(
      e.component.getSelectedNodeKeys()
    );
    this.basisForm.controls['specifyingLocation']?.patchValue(null);
    if (e.node.selected) {
      this.choosenPlaceBasis = this.placeDataBasis.find(
        (el) => el.idLink == e.component.getSelectedNodeKeys()[0]
      );
      if (this.isActiveQuotation) {
        //котировка
        this.basisGoods.forEach((item) => {
          this.getQuoteForGoog(item);
        });
      }

      if (this.isActiveCorridor) {
        //коридор
        this.basisGoods.forEach((item) => {
          this.getRangeForGoog(item);
        });
      }
    }
  }

  onChangeSpecifyingLocation() {
    if (this.isActiveQuotation) {
      this.basisGoods.forEach((item) => {
        this.getQuoteForGoog(item);
      });
    }
    if (this.isActiveCorridor) {
      this.basisGoods.forEach((item) => {
        this.getRangeForGoog(item);
      });
    }
  }

  onChangePlaceTypeByEnter() {
    this.openPopupAddPlace = false;
    this.EnterPlaceName = this.enterPlace;
    this.treeView?.instance?.unselectAll();
    this.basisForm.controls['placeName'].patchValue(-1);
    this.basisForm.controls['specifyingLocation']?.patchValue(null);

    if (this.isActiveQuotation) {
      //котировка
      this.basisGoods.forEach((item) => {
        this.getQuoteForGoog(item);
      });
    }
    if (this.isActiveCorridor) {
      //коридор
      this.basisGoods.forEach((item) => {
        this.getRangeForGoog(item);
      });
    }
  }

  public getDeliveryPlaces(idBasisLink: number): void {
    //получение названия места для каждого базиса
    this.createOfferService
      .GetDeliveryPlacesTree(this.user.token, idBasisLink)
      .subscribe((res: TreesPlaceDetails) => {
        let idValue = this.delivery.find(
          (el) => el.linkId === idBasisLink
        )?.valueId;
        const marketTypeIds = this.createOffer.demandsModal.marketTypeIds;

        const isValidDomesticOnly =
          marketTypeIds.length === 1 && marketTypeIds[0] === MARKET_TYPES.DOMESTIC;

        const isValidDomesticAndImport =
          marketTypeIds.length === 2 &&
          marketTypeIds.includes(MARKET_TYPES.DOMESTIC) &&
          marketTypeIds.includes(MARKET_TYPES.IMPORT);

        res.trees.find((el) => {
          if (el.lvl === 1) {
            // если базис поставки "Франко склад продавца" - значение "БЕЛАРУСЬ" недоступен
            if (idValue === ID_STAT_DELIVERY.SELLERS_EX_WAREHOUSE && el.idLink === BELARUS_ID_LINK) {
              //Если страна - дизейблим ее
              if (ciNodeDelivPlaceArray.includes(el.idLinkParent)) {
                el.disableCountries = true;
              }
            }
            el.idLinkParent = null;
          }
          //  "Внутренний рынок" или "Внутренний рынок"+ "Импорт", базис "Франко-вагон станция назначения" - место поставки только "Беларусь" без конкретных станций
          if (idValue === ID_STAT_DELIVERY.FREE_CARRIAGE_DESTINATION_STATION
            && (isValidDomesticOnly || isValidDomesticAndImport)
            && el.idLink !== BELARUS_ID_LINK_DESTINATION_STATION(this.config)
            && Number(this.createOffer.demandsModal.tradeTypeId) === AUCTION_TYPE.SIMPLE_SELLER_AUCTION) {
            el.disableCountries = true;
          }
        });
        if (this.domesticCondition() && idValue == ID_STAT_DELIVERY.BUYERS_EX_WAREHOUSE) {
          //для ФРАНКО-СКЛАД ПОКУПАТЕЛЯ и модели на внутренний рынок в дереве оставляем только Беларусь
          this.placeDataBasis = this.filterBelarusChildren(res.trees);
        } else {
          this.placeDataBasis = res.trees;
        }
        this.createOfferService.buildPlaceTreeIndex(this.placeDataBasis);
      });
  }

  filterBelarusChildren(trees) {
    const result = [];
    let valueName =
      this.translate.store.currentLang == 'RU' ? 'БЕЛАРУСЬ' : 'BELARUS';
    const belarusRoot = trees.find(
      (tree) => tree.valueName === valueName && tree.lvl === 1
    );
    if (!belarusRoot) return result;
    result.push(belarusRoot);

    function findChildren(parentId) {
      trees
        .filter((tree) => tree.idLinkParent === parentId)
        .forEach((child) => {
          result.push(child);
          findChildren(child.idLink);
        });
    }

    findChildren(belarusRoot.idLink);
    return result;
  }

  domesticCondition() {
    return this.createOffer.demandsModal.marketTypeIds.some((el) =>
      ['DOMESTIC', 'IMPORT'].includes(el)
    );
  }

  onChangePrices(e, id) {
    this.basisGoods.find((el) => el.id == id).cost = e.value;
    /*    if (this.changePrice.find(el => el.id == id)) {
          this.changePrice.splice(this.changePrice.findIndex(el => el.id == id), 1);
        }
        this.changePrice.push({
          id: id,
          cost: e.value
        })*/
  }

  onChangeMinPrices(e, id) {
    this.basisGoods.find((el) => el.id == id).minPriceField = e.value;
  }

  zeroComparison = () => 0;

  public onKeyDown(
    e: KeyDownEvent,
    field: BasisGoods,
    isMinPriceField?: boolean
  ): void {
    if (!field.isRequiredMinPrice && isMinPriceField) {
      if (e.event.key === 'Backspace' || e.event.key === 'Delete') {
        if (
          field.minPriceField == 0 ||
          !field.minPriceField
        ) {
          field.minPriceField = null;
        }
      }
    }
    let changeGood = this.basisGoods.find((el) => el.id == field.id);
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
      const treeViewInstance =
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
    if (this.changeAmendment.find((el) => el.id == id)) {
      this.changeAmendment.splice(
        this.changeAmendment.findIndex((el) => el.id == id),
        1
      );
    }

    this.changeAmendment.push({
      id: id,
      amendment: e.value,
    });
    if (this.pricingType == this.pricingTypeConst?.formulaWithQuotation) {
      let amendmentSize, quotationCurr;
      let good = this.basisGoods.find((g) => g.id == id);
      let date = new Date();
      this.commonService
        .ConvertCurrency(
          this.user?.token,
          good.quotation,
          good.quoteCurrency.id,
          good.currency.id,
          this.commonService.toOADate(date)
        )
        .subscribe((res) => {
          quotationCurr = res;

          if (good.priceAdjustment.id == 1) {
            //в процентном соотношении
            amendmentSize = (quotationCurr / 100) * e.value;
          } else amendmentSize = e.value;

          this.changeAmendment[this.changeAmendment.length - 1].cost =
            this.commonService.round(quotationCurr + amendmentSize, 2);
        });
    }
  }

  priceAmendment(item) {
    let ch = this.changeAmendment.find((el) => el.id == item.id);
    if (ch) {
      return ch.cost;
    } else return item.cost;
  }

  OnClose() {
    if (this.basisValue?.length > 0) {
      this.basisGoods = this.basisValue[0].goods;
    }
    this.saveBasis.emit(false);
  }

  get isDisabledSpecifyingLocation(): boolean {
    return !this.basisForm.controls['placeName']?.value ||
      this.basisForm.controls['placeName']?.value?.length == 0;
  }

  public clearBasis(): void {
    if (this.basisForm.controls) {
      this.basisForm.controls['basis'].patchValue(null);
      this.basisForm.controls['placeName'].patchValue(null);
      this.basisForm.controls['specifyingLocation'].patchValue(null);
    }
    this.basisGoods = this.goodsList;
  }

  async onSaveBasis(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      this.deliveryConditionName = '';
      if (
        (this.pricingType != this.pricingTypeConst.formulaWithoutQuotation &&
          !this.basisGoods.every((g) => g.cost > 0)) ||
        (this.pricingType == this.pricingTypeConst.formulaWithoutQuotation &&
          !this.basisGoods.every((g) => g.amendment > 0))
      ) {
        //цена должна быть больше 0
        this.error = true;
        this.messageError =
          this.translate.store.currentLang == 'RU'
            ? RU['createOffer'].termsDeliveryTime.price0Error1 +
            ' ' +
            (this.pricingType == this.pricingTypeConst.price
              ? RU['createOffer'].goodInfo.priceWithoutVAT
              : RU['createOffer'].goodInfo.amendment) +
            ' ' +
            RU['createOffer'].termsDeliveryTime.price0Error2
            : EN['createOffer'].termsDeliveryTime.price0Error1 +
            ' ' +
            (this.pricingType == this.pricingTypeConst.price
              ? EN['createOffer'].goodInfo.priceWithoutVAT
              : EN['createOffer'].goodInfo.amendment) +
            ' ' +
            EN['createOffer'].termsDeliveryTime.price0Error2;
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
        return;
      }

      this.idPlaceLink = null;
      if (this.choosenPlaceBasis) {
        this.idPlaceLink = this.choosenPlaceBasis.idLink;
      } else if (
        this.basisValue?.[0]?.basis === this.basisForm.controls['basis']?.value
        && this.basisForm.controls['placeName']?.value
      ) {
        this.idPlaceLink = this.basisValue[0].idPlaceLink;
      }

      this.createOfferService.getDeliveryCondConcated(
        this.user?.token,
        this.basisChooseValue.linkId,
        this.idPlaceLink,
        this.basisForm.controls['specifyingLocation']?.value?.toString() || null).subscribe(
        (item) => {
          this.deliveryConditionName = item.result;

          if (this.deliveryBasis.length > 0) {
            //добавление идентичного базиса с одинаковым местом поставки
            let deliveries = this.deliveryBasis.filter(
              el => el.concatedCondition === this.deliveryConditionName);

            deliveries.forEach((delivery) => {
                if (JSON.stringify(this.basisValue[0]) != JSON.stringify(delivery)) {
                  if (
                    (delivery && this.basisValue[0]?.basis == delivery.basis) ||
                    (delivery && this.basisValue.length == 0) ||
                    (delivery && this.basisValue[0]?.basisName == delivery.basisName)
                  ) {
                    if (
                      delivery?.placeName ==
                      this.basisForm.controls['placeName']?.value ||
                      delivery?.placeName[0] ==
                      this.basisForm.controls['placeName']?.value ||
                      delivery?.specifyingLocation?.toLowerCase() ==
                      this.basisForm.controls['specifyingLocation']?.value
                        ?.toString()
                        ?.toLowerCase()
                    ) {
                      this.error = true;
                      this.messageError =
                        this.translate.store.currentLang == 'RU'
                          ? RU['createOffer'].termsDeliveryTime.errorMessage1 +
                          this.basisChooseValue.basisName +
                          RU['createOffer'].termsDeliveryTime.errorMessage2
                          : EN['createOffer'].termsDeliveryTime.errorMessage1 +
                          this.basisChooseValue.basisName +
                          EN['createOffer'].termsDeliveryTime.errorMessage2;
                      this.messageError = this.messageError.replace(
                        /\n\r?/g,
                        '<br />'
                      );
                      return;
                    }
                  }
                  if (this.error) {
                    return;
                  }
                }
              }
            );
          }

          if (!this.error) {
            //редактирование базиса
            if (this.basisValue?.length > 0) {
              this.onEditBasis();
            } //добавление нового базиса
            else {
              let goodArray = [],
                isPriceQuote = false,
                isPriceRangeError = false;
              this.basisGoods.forEach((good) => {
                let cost = good?.cost || null,
                  unit,
                  currency,
                  amendment = good?.amendment || null,
                  isRequiredMinPrice;
                // let basisInfo = JSON.parse(JSON.stringify(this.basisForm.value));

                //поиск значения валюты и единиц измерения
                good.fields.forEach((block) => {
                  for (let i = 0; i < block[1].length; i++) {
                    if (block[1][i].interfaceField.fieldId == 2) {
                      //валюта
                      unit = block[1][i].interfaceField.allowedValues.find(
                        (u) => u.id == block[1][i].selectedValues
                      ).name;
                    }
                    if (block[1][i].interfaceField.fieldId == 4) {
                      //ед.измерения
                      currency = block[1][i].interfaceField.allowedValues.find(
                        (c) => c.id == block[1][i].selectedValues
                      ).name;
                    }
                    if (block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.MIN_PRICE) {
                      //минимальная цена
                      isRequiredMinPrice = block[1][i].isRequired;
                    }
                    /*  if (block[1][i].interfaceField.fieldId == 53) {                         //Тип поправки
                        amendmentType = block[1][i].interfaceField.allowedValues.find(c => c.id == block[1][i].selectedValues).name
                      }*/
                  }
                });

                if (this.changeAmendment?.length > 0) {
                  //проверка есть ли в измененном массиве поправки
                  let findEl = this.changeAmendment?.find((el) => el.id == good.id);
                  if (findEl) {
                    amendment = findEl.amendment;
                  }
                }

                let goodMainBasisCost = this.goodsList.find(
                  (el) => el.id == good.id
                )?.cost; //цена в основном базисе
                if (
                  cost <= goodMainBasisCost &&
                  this.isMinPriceOnBasicBasis &&
                  this.deliveryBasis.length > 0
                ) {
                  this.error = true;
                  this.messageError =
                    getTranslateResultByCurrentLang(
                      this.translate.store.currentLang,
                      'createOffer.paymentDeliveryTerms.messageErrorMinPrice'
                    );
                  return;
                }
                //проверка цен на котировку
                if (this.isActiveQuotation) {
                  if (good.quotation && cost != good.quotation) {
                    good.error = true; //подсвечиваем красным
                    isPriceQuote = true;
                  }
                }

                //проверка цен на ценовой коридор
                if (this.isActiveCorridor) {
                  if (
                    (good.minPrice && cost < good.minPrice) ||
                    (good.maxPrice && cost > good.maxPrice)
                  ) {
                    //если не входит в ценовой коридор
                    good.range = true;
                    isPriceRangeError = true;
                  }
                }

                if (!this.error && !isPriceQuote) {
                  goodArray.push({
                    id: good.id,
                    name: good.name,
                    volume: good.volume,
                    units: unit,
                    cost: cost || null,
                    currency: currency,
                    quotation: good.quotation, //при ценовом - значение котировки, при торгах по формуле с котировкой - значение котировки оттуда
                    quoteCurrency: good.quoteCurrency,
                    priceAdjustment: good.priceAdjustment?.id,
                    minPrice: good.minPrice || null,
                    maxPrice: good.maxPrice || null,
                    minPriceField: good.minPriceField || null,
                    isRequiredMinPrice: isRequiredMinPrice || false,
                    amendment: amendment,
                    costVAT:
                      this.commonService.round(good.volume * cost, 2) +
                      this.commonService.round(
                        (good.volume * cost * this.vat) / 100,
                        2
                      ),
                  });
                }
              });
              if (isPriceQuote) {
                this.error = true;
                this.isButtonPriceQuote = true;
                this.messageError =
                  getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'createOffer.termsDeliveryTime.priceQuoteError1'
                  );
                return;
              }

              if (isPriceRangeError) {
                this.errorState = 0;
                this.error = true;
                this.isButtonPriceRange = true;
                this.goodArray = goodArray;
                this.messageError =
                  getTranslateResultByCurrentLang(
                    this.translate.store.currentLang,
                    'createOffer.termsDeliveryTime.warningPriceRange'
                  );
                return;
              }

              if (!this.error) {
                this.deliveryBasisPush(goodArray);
              }
            }
            if (!this.error) this.saveBasis.emit(this.deliveryBasis);
          }
        });
    }
  }

  public deliveryBasisPush(goodArray: BasisGoods[]): void {
    this.deliveryBasis.push(
      Object.assign(
        this.basisForm.value,
        {
          concatedCondition: this.deliveryConditionName,
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

  public continue(): void {
    if (this.basisValue?.length > 0) {
      this.onWriteEditedData();
      if (this.basisValue[0].coreBasis &&
        this.changeCoreBasis
      ) {
        //При редактировании базиса проверем основной ли базис (если основной, остальные сбрасывем)
        this.deliveryBasis = [this.deliveryBasis[0]];
      }
    }
    if (this.basisValue?.length == 0) {
      //при добавлении нового базиса
      this.deliveryBasisPush(this.goodArray);
    }
    this.saveBasis.emit(this.deliveryBasis);
  }

  public onEditBasis(): void {
    let isMinPriceOnBasicBasisError = false,
      isPriceQuote = false,
      isPriceRangeError = false;

    let cost, goodCost;

    this.basisValue[0].goods.forEach((g) => {
      const basisGood = this.basisGoods.find((bg) => bg.id == g.id);
      //проверка есть ли в измененном массиве цены
      goodCost = this.goodsList.find((el) => el.id == g.id)?.cost; //цена в основном базисе
      cost = basisGood.cost;

      if (
        cost <= goodCost &&
        this.isMinPriceOnBasicBasis &&
        !this.basisValue[0]?.coreBasis
      ) {
        isMinPriceOnBasicBasisError = true;
        return;
      }
      //проверка цен на котировку
      if (this.isActiveQuotation) {
        if (basisGood.quotation && cost != basisGood.quotation) {
          basisGood.error = true;
          isPriceQuote = true;
        } else if (basisGood.error) {
          basisGood.error = false;
        }
      }

      //проверка цен на ценовой коридор
      if (this.isActiveCorridor) {
        if (
          (basisGood.minPrice && cost < basisGood.minPrice) ||
          (basisGood.maxPrice && cost > basisGood.maxPrice)
        ) {
          //если не входит в ценовой коридор
          basisGood.range = true;
          isPriceRangeError = true;
        }
      }
    });
    if (isMinPriceOnBasicBasisError) {
      this.error = true;
      this.messageError =
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'createOffer.paymentDeliveryTerms.messageErrorMinPrice'
        );
    }

    if (isPriceQuote) {
      this.error = true;
      this.isButtonPriceQuote = true;
      this.messageError =
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'createOffer.termsDeliveryTime.priceQuoteError1'
        );
      return;
    }

    if (isPriceRangeError) {
      this.errorState = 0;
      this.error = true;
      this.isButtonPriceRange = true;
      this.messageError =
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'createOffer.termsDeliveryTime.warningPriceRange'
        );
      return;
    }

    if (!this.error) {
      this.onWriteEditedData();
    }

    if (
      !this.error &&
      this.basisValue[0].coreBasis &&
      this.changeCoreBasis
    ) {
      //изменили основной базис (выбрали другой в выпадающем списке)
      this.deliveryBasis = [this.deliveryBasis[0]];
    }
  }

  public onWriteEditedData(): void {
    let basisValue = this.basisValue[0];
    let idPlaceValue = null;
    if (this.choosenPlaceBasis) {
      idPlaceValue = this.choosenPlaceBasis?.idValue;
    } else if (basisValue.basis === this.basisForm.controls['basis']?.value &&
      this.basisForm.controls['placeName']?.value) {
      idPlaceValue = this.basisValue[0].idPlaceValue;
    }

    basisValue.concatedCondition = this.deliveryConditionName;
    basisValue.idPlaceLink = this.idPlaceLink;
    basisValue.idPlaceValue = idPlaceValue;
    basisValue.basis = this.basisForm.controls['basis']?.value;
    basisValue.enterPlaceName = this.EnterPlaceName;
    basisValue.placeName = this.basisForm.controls['placeName']?.value;
    basisValue.specifyingLocation =
      this.basisForm.controls['specifyingLocation']?.value;
    basisValue.basisId = this.basisChooseValue.basisId;
    basisValue.basisName = this.basisChooseValue.basisName;
    basisValue.idBasisLink = this.basisChooseValue.linkId;
    basisValue.idBasisValue = this.basisChooseValue.valueId;
    basisValue.placeTypeId = this.basisChooseValue.placeTypeId;
    basisValue.minAddBasis = this.basisChooseValue.minAddBasis;
    basisValue.minAddBasisPlaces = this.basisChooseValue.minAddBasisPlaces;
    basisValue.contradictoryValueId =
      this.basisChooseValue.contradictoryValueId;
    basisValue.contradictoryBasisName =
      this.basisChooseValue.contradictoryBasisName;
    basisValue.isRequiredPlace = this.basisChooseValue.isRequiredPlace;
    basisValue.isRequiredAddBasis = this.basisChooseValue.isRequiredAddBasis;
    basisValue.parentId = this.basisChooseValue.parentId;
    basisValue.level = this.basisChooseValue.level;
    basisValue.hasChildren = this.basisChooseValue.hasChildren;

    let cost, amendment;
    basisValue.goods.forEach(g => {
      const basisGood = this.basisGoods.find((bg) => bg.id == g.id);
      //проверка есть ли в измененном массиве цены
      amendment = this.changeAmendment?.find(el => el.id === g.id)?.amendment ??
        (g?.amendment ? Number(g?.amendment) : null);
      cost = basisGood.cost;

      g.costVAT =
        this.commonService.round(g.volume * cost, 2) +
        this.commonService.round((g.volume * cost * this.vat) / 100, 2);
      g.amendment = amendment;
      g.minPriceField = basisGood.minPriceField || null;
      g.cost = cost;
      g.minPrice = basisGood.minPrice || null;
      g.maxPrice = basisGood.maxPrice || null;
      g.quotation = basisGood.quotation || null;
      g.error = basisGood.error || false;
    });
  }
}
