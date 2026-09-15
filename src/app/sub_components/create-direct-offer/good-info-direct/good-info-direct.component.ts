/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {SidebarService} from "../../../core/services/sidebar-service.service";
import {
  ACTUAL_SIZE_FIELDS,
  AuctionType,
  IdDirection,
  pricingType,
  sectionID,
  SORT_ID_ACTUAL_FIELDS
} from "../../../api.constants";
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import {TranslateService} from "@ngx-translate/core";
import {CommonService} from "../../../core/services/common-service.service";
import {log} from "util";
import {
  CreateOfferService,
  IFieldProperty,
  StandardizedProps
} from "../../../core/services/create-offer-service.service";
import {AppConfigService} from "../../../app-config.service";
import {ID_INTERFACE_FIELD} from "../../../shared/enums";
import {RefsData} from "../../../core/interfaces/interface";
import {ValueChangedEvent} from "devextreme/ui/select_box";
import DevExpress from "devextreme";
import { SelectionChangedEvent } from 'devextreme/ui/accordion';
import DataSource from "devextreme/data/data_source";
import {actualDimensionsType} from "../../create-offer/enums";
import {ActualDimensionsComponent} from "../../actual-dimensions/actual-dimensions.component";
import { SECTIONS_TYPES } from "../../header/enums";

@Component({
  selector: 'good-info-direct',
  templateUrl: './good-info-direct.component.html',
  styleUrls: ['./good-info-direct.component.scss']
})
export class GoodInfoDirectComponent implements OnInit {
  @ViewChild(ActualDimensionsComponent, { static: false }) actualDimensionsComponent: ActualDimensionsComponent;

  @Input() good;
  @Input() goodInfo;
  @Input() filledFields;                //не первый товар (второй и более)
  @Input() demandsModal;
  @Input() sessionInfo;
  @Input() modelsResult;
  @Input() user;
  @Input() direction;
  @Input() goodsList;
  @Input() schedule;
  @Output() saveItem = new EventEmitter<any>();
  @Output() scheduleResult = new EventEmitter<[]>();

  goodForm: any = this.formBuilder.group({
    costNoVAT: [],
    amountVAT: [],
    costVAT: []
  })
  modelFieldsGroup: any;
  costBlock = false;

  modal = [];

  pricingType = pricingType;
  quotationCurr;                                                //котировка в пересчитанной валюте
  pricePrecision: number;
  checkboxId = [];      //массив ид товаров

  error = false;
  messageError: string;

  standartdizeProps: IFieldProperty[] = []; // информации о стандартизированных характеристиках товара

  isDropDownOpened = false;
  selectedItemKeys = [];
  removeAdjustedPricePopup = false;

  public readonly ID_INTERFACE_FIELD = ID_INTERFACE_FIELD;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  public readonly actualDimensionsType = actualDimensionsType;
  public isFreeInput: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private sidebarService: SidebarService,
    public translate: TranslateService,
    public commonService: CommonService,
    private createOfferService: CreateOfferService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    /*  Особые правила добавления товара применяются при следующих условиях:
        секция 2 Лесопродукция;
        вид торгов 1 Торги на повышение;
        направление 2 продажа*/
    if (
      Number(this.modelsResult.sectionId) === SECTIONS_TYPES.TIMBER &&
      Number(this.modelsResult.tradeTypeId) === AuctionType.englishUpgrading &&
      Number(this.direction) === IdDirection.sale
    ) {
      let res: StandardizedProps = await this.createOfferService.GetStandardizedProps(this.user?.token, this.good.id);
      this.standartdizeProps = res.props;
      this.createOfferService.standartdizePropsSubject.next(this.standartdizeProps);
    }

    if (!this.goodInfo) {
      this.modal = JSON.parse(JSON.stringify(this.demandsModal.fields.filter(el => el.interfaceField.fieldId != 11)))       //создание нового массива на основе this.demandsModal.fields
      this.addCondSearch(this.modal);


      for (let i = 0; i < this.modal.length; i++) {                      //Добавление полей в динамическую форму. Везде formControlName равняется fieldId
        if (this.modal[i].interfaceField.fieldId == 3) {
          this.costBlock = true;
        }

        this.goodForm.addControl(this.modal[i].interfaceField.fieldId.toString(),
          this.formBuilder.control(
            this.modal[i].interfaceField.fieldDataType === "TBOOLEAN" ? false : null,
            this.modal[i].isRequired ? Validators.required : null));

        //если есть поле местонахождение и оно может быть изменено вручную, добавляем отдельный контрол для записи id значения. в основную форму записываем строку вписанную вручную
        if (this.modal[i].interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_LOCATION && this.modal[i].interfaceField.isAvailableFreeInput) {
          this.goodForm.addControl(
            'id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString(),
            this.formBuilder.control(null, this.modal[i].isRequired ? Validators.required : null)
          );
        }
      }
    }

    if (this.goodInfo) {
      let allField = [];
      this.goodInfo.fields.forEach(item => {
        allField = allField.concat(item[1])
      })
      if (this.goodInfo.idOfferGood) {        //выстраиваем правильный порядок полей
        let sortedFieldId = this.demandsModal.fields.map(x => x.interfaceField.fieldId)       //массив fieldId с правильной сортировкой
        allField = allField.map(e => {            //добавляем поле sortBy с индексом места поля
          e.sortBy = e.interfaceField.fieldId ? sortedFieldId.indexOf(e.interfaceField.fieldId) : allField.indexOf(e);
          return e;
        });
        allField.sort((a, b) => a.sortBy - b.sortBy);         //выстраиваем в нужном порядке
      }
      this.modal = JSON.parse(JSON.stringify(allField.filter(el => el.interfaceField.fieldId != 11)))
      this.addCondSearch(this.modal);
      for (let i = 0; i < this.modal?.length; i++) {                      //добавление полей в динамическую форму. Везде formControlName равняется fieldId
        if (this.modal[i].interfaceField.fieldId == 3) {
          this.costBlock = true;
        }

        this.goodForm.addControl(this.goodInfo.idOfferGood && !this.modal[i].costVAT && !this.modal[i].amountVAT && this.modal[i].amountVAT != 0 && !this.modal[i].costNoVAT ? this.modal[i].interfaceField.fieldId.toString() : this.modal[i].interfaceField.fieldId,
          this.formBuilder.control(
            this.modal[i].interfaceField.fieldDataType === "TBOOLEAN" ? false : null,
            this.modal[i].isRequired ? Validators.required : null));

        if (this.modal[i].interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_LOCATION && this.modal[i].interfaceField.isAvailableFreeInput) {
          this.goodForm.addControl(
            'id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString(),
            this.formBuilder.control(this.modal[i].idSelectedValues, this.modal[i].isRequired ? Validators.required : null)
          );
        }

        if (this.goodInfo && !this.modal[i].costVAT && !this.modal[i].amountVAT && this.modal[i].amountVAT != 0 && !this.modal[i].costNoVAT) {
          this.fieldValue(this.modal[i].interfaceField.fieldId);
        }
      }
      this.onChangePrecision(4);
      // if(!this.goodInfo?.idOfferGood)
      if (this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation)
        this.vatCalculator();

      if (this.goodForm?.get('55')?.value) {      //если есть Валюта котировки
        this.onChangePrecision(55)
      }

    }

    if (this.filledFields) {              //если пришла ставка НДС (второй и далее товар) - заполняем поле значением ставки из первого товара
      this.goodForm?.get('4')?.setValue(this.filledFields?.currency.toString()) //валюта
      this.goodForm?.get('5')?.setValue(this.filledFields.vat?.id.toString()) //ставка НДС
      this.goodForm?.get('47')?.setValue(this.filledFields?.adjustedPrice) //корректируемая цена
      this.goodForm?.get('55')?.setValue(this.filledFields?.currencyQuotes.toString()) //валюта котировки
      if (this.filledFields?.currencyQuotes)
        this.onChangePrecision(55)
      //  this.goodForm?.get('11')?.setValue(this.filledFields?.finance.toString()) //источник финансирования
      this.goodForm?.get('53')?.setValue(this.filledFields?.priceAdjustment.toString())     //тип поправки
      this.onChangePrecision(4)                             //точность currency
      if (this.modelsResult.sectionId == sectionID.forestProducts)
        this.hasTheSameValueComplexLot()
    }

    this.modelFieldsGroup = this.modal.reduce(function (r, a) {       //сгруппированы поля по blockId
      r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
      r[a.interfaceField.blockId].push(a);
      return r;
    }, {});

    this.modelFieldsGroup = Object.entries(this.modelFieldsGroup)     //возвращает массив объектов
  }

  public isActualDimensions(fieldId: number): boolean {
    return ACTUAL_SIZE_FIELDS.includes(fieldId)
  }

  get getReadinessDataSource(): RefsData[] {
    const readiness = this.modal.find(el => el.interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_READINESS)
    return readiness?.allowedValues || readiness?.dataSource
  }

  zeroComparison = () => 0

  addCondSearch(fields) {               //проверка на поле Дополнительные условия
    let index = fields.findIndex(el => el.interfaceField.controlFieldType == 'dxTextBox' && el.interfaceField.fieldSize > 1000)
    if (index != -1)
      this.modal.push(this.modal.splice(index, 1)[0]);
    //фактические размеры и готовность товара
    // Фактическая длина (40), Фактический диаметр (57), Фактическая ширина (58), Фактическая толщина (59), Готовность товара (21)
    fields.forEach((el, indexDimensions) => {
      if ([40, 57, 58, 59, 21].includes(el.interfaceField.fieldId)) {
        if (el.interfaceField.fieldId != 21) {
          let nameField = "type" + el.interfaceField.fieldId.toString()
          this.goodForm.addControl(nameField,
            this.formBuilder.control(null, Validators.required));
          this.modal[indexDimensions].sortBy = SORT_ID_ACTUAL_FIELDS['FIELD_' + el.interfaceField.fieldId]
        } else {
          this.modal[indexDimensions].sortBy = 0
        }
        this.modal[indexDimensions].interfaceField.blockId = 0
        this.modal.unshift(this.modal.splice(indexDimensions, 1)[0]);
      }
    })
    let readiness = this.modal.findIndex(el => el.interfaceField.fieldId == 21)    //готовность товара
    if (readiness != -1)
      this.modal.unshift(this.modal.splice(readiness, 1)[0]);
    // Сортировка полей с blockId = 0 по sortBy
    this.modal = this.createOfferService.sortActualFields(this.modal)
  }

  hasTheSameValueComplexLot() {
    //Один товар с разными характеристиками:Сорт => предзаполняем все поля других товаров
    if (this.modelsResult.complexLotProductTypes?.length == 1 && this.modelsResult.complexLotProductTypes.find(el => el.typeId == 2 && el.referenceIds == '104')) {
      this.goodsList[0].fields.forEach(block => {
        for (let i = 0; i < block[1].length; i++) {
          /* не предзаполняются и доступны для редактирования доп. поля по каждому товару:
             - Минимальная цена (без НДС)
             - Пороговая цена (без НДС)*/
          if (block[1][i].interfaceField.fieldId && block[1][i].interfaceField.isAccessibleForWorker && !['58', '59', '40', '57', '9', '13'].includes(block[1][i].interfaceField.fieldId.toString())) {
            this.goodForm.controls[block[1][i].interfaceField.fieldId.toString()]?.patchValue(
              block[1][i].interfaceField.fieldDataType == "TBOOLEAN" ? (!(!block[1][i].selectedValues || block[1][i].selectedValues == 'false'))
                : this.goodInfo && this.goodInfo?.idOfferGood ? block[1][i].selectedValues?.toString() || null : block[1][i].selectedValues || null)
            this.goodForm.controls[block[1][i].interfaceField.fieldId.toString()]?.disable()
          }
        }
      })
    }
  }

  public clearField(): void {
    this.actualDimensionsComponent?.clearField();
  }


  fieldValue(fieldId) {
    this.goodInfo.fields.forEach(block => {
      for (let i = 0; i < block[1].length; i++) {
        if (block[1][i].interfaceField.fieldId == fieldId) {
          if (!['58', '59', '40', '57'].includes(fieldId.toString())) {
            //если корректируемая цена - то переменная boolean, иначе: поле имеет тип dxSelectBox - string, остальные просто цифры
            this.goodForm.controls[fieldId]?.patchValue(block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.ADJUSTED_PRICE
              ? block[1][i].selectedValues?.toString().toLowerCase() === 'true' :
              this.goodInfo.idOfferGood ?
                block[1][i].interfaceField.controlFieldType ==
                'dxSelectBox' &&
                !block[1][i].interfaceField.isAvailableMultiSelection
                  ? block[1][i].selectedValues?.toString()
                  : block[1][i].selectedValues
                : block[1][i].selectedValues)
          } else {
            this.goodForm.controls[fieldId]?.patchValue(block[1][i].selectedValues ? this.goodInfo.idOfferGood ?
              (block[1][i].interfaceField.controlFieldType == "dxSelectBox" && !block[1][i].interfaceField.isAvailableMultiSelection ? this.commonService.actualDimensions(block[1][i].selectedValues, 0).toString() : this.commonService.actualDimensions(block[1][i].selectedValues, 0)) : this.commonService.actualDimensions(block[1][i].selectedValues, 0) : null)

            let typeValue = block[1][i].selectedValues ? this.commonService.actualDimensions(block[1][i].selectedValues, 1) : null
            if (!['TSTRING', 'TRANGE', 'TINTEGER'].includes(typeValue)) {
              let props = this.actualDimensionsComponent?.standartdizeOption(block[1][i].interfaceField.fieldId)
              if (props && props?.length == 1 && props[0].dataType == 'TRANGE') {
                typeValue = this.actualDimensionsComponent?.isVisibleTString(props, block[1][i].interfaceField.fieldId) ? 'TSTRING' : 'TINTEGER'
              } else if (props?.length == 1) {
                typeValue = props[0].dataType
              } else typeValue = this.actualDimensionsComponent?.isVisibleTString(props, block[1][i].interfaceField.fieldId) ? 'TSTRING' :                                                 //отображается то что есть в выпадающем списке, если ничего нет, то TSTRING
                (this.user?.IsWorker ? true : this.actualDimensionsComponent?.isVisibleTRange(block[1][i].interfaceField.fieldId, props)) ? 'TRANGE' :
                  (this.user?.IsWorker ? true : this.actualDimensionsComponent?.isVisibleTInteger(block[1][i].interfaceField.fieldId, props)) ? 'TINTEGER' : 'TSTRING'
            }
            this.goodForm.controls['type' + fieldId]?.patchValue(this.goodInfo.idOfferGood ?
              (block[1][i].interfaceField.controlFieldType == "dxSelectBox" && !block[1][i].interfaceField.isAvailableMultiSelection ? typeValue : typeValue) : typeValue)
          }
        }
        // && fieldId!= 12
      }
    })
    if (this.goodForm?.get('53')?.value && this.modelsResult?.pricingTypeId != pricingType?.price) {
      this.changeCurrency();
    }
    /*  if(this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation && (fieldId == 1 || fieldId == 3 || fieldId == 5))
        this.vatCalculator()*/
  }

  public onResultFromRemoveAdjustedPrice(isContinue: boolean): void {
    if (isContinue) {
      this.schedule = [];
      this.scheduleResult.emit([])
      const event = {
        validationGroup: {
          validate: () => ({isValid: true})
        }
      };
      this.onSave(event);
    }
    this.removeAdjustedPricePopup = false;
  }

  public clearValueNull(e, fieldId?: number): void {
    if (e.value === '') {
      e.component.option('value', null);
    }
    if (fieldId === ID_INTERFACE_FIELD.PRODUCT_LOCATION) {
      if (e.event && e.event.type === 'change') { //поле изменялось вручную
        this.isFreeInput = true;
        this.goodForm.get('id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString())?.patchValue(null);
      } else {
        this.isFreeInput = false;
        this.goodForm.controls[ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString()]?.patchValue(e.value);
      }
      if (e.value === '' || !e.value) {
        this.goodForm.get('id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString())?.patchValue(null);
      }
    }
  }

  openSidebar(i: any) {
    document.getElementById("mySidebar").style.right = "0";
    document.getElementById("mySidebar").style.opacity = "1";
    document.getElementById("dark").className = "dark_opened";
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
  }

  async getDataSourceSelectBox(m) {                    //dataSource в выпадающем списке
    let dataSource = [];
    if (!([ID_INTERFACE_FIELD.UNIT, ID_INTERFACE_FIELD.OKRB007, ID_INTERFACE_FIELD.CFEA].includes(m.interfaceField.fieldId) || ((m.interfaceField.referenceId || m.interfaceField.referenceAlias) && m.interfaceField.isAvailableFreeInput))) {                              //ОКРБ 007-2012(12), ед.изм(2), Код ТН ВЭД ЕАЭС(63)
      dataSource = m.selectedValues && m.selectedValues?.length > 0 ? m.selectedValues : m.interfaceField.allowedValues;
    } else {
      if (m.interfaceField.fieldId == 2) {
        //пересечение с классифаером и котировочными значениями ед.изм.
        const statisticsUnits: any = await this.createOfferService.GetStatisticsUnits(this.user?.token, this.sessionInfo.sectionId, this.sessionInfo.sessionId, this.sessionInfo.idMarketType, this.good.id)
        this.commonService.GetRefbookByName(this.user?.token, m.interfaceField.referenceAlias, undefined, this.good.idGoodName).then((res: any) => {
          let dataSourceFromModel = m.selectedValues && m.selectedValues?.length > 0 ? m.selectedValues : m.interfaceField.allowedValues
          let dataWithRefbooks = res.refbooks.length == 0 ? dataSourceFromModel : dataSourceFromModel.filter(el => res.refbooks.map(v => v.id).includes(el.id));
          m.dataSource = dataWithRefbooks.filter(a => statisticsUnits.units?.some(b => Number(a.id) == b))
          if (m.dataSource?.length == 1 && m.isRequired)
            this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(m.dataSource[0]?.id)
        })
      } else {
        if (m.interfaceField.referenceAlias) {
          this.commonService.GetRefbookByName(this.user?.token, m.interfaceField.referenceAlias, undefined, this.good.idGoodName).then((res: any) => {
            m.dataSource = res.refbooks;
            if (m.dataSource?.length == 1 && m.isRequired)
              this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(m.dataSource[0]?.id)
          })
        } else if (m.interfaceField.referenceId) {
          this.commonService.getById(this.user?.token, m.interfaceField.referenceId, this.modelsResult.sectionId).subscribe((res: any) => {
            m.dataSource = res.data;
            if (m.dataSource?.length == 1 && m.isRequired)
              this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(m.dataSource[0]?.id)
          })
        }
      }
    }
    if (dataSource?.length == 1 && m.isRequired)
      this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(m.interfaceField.isAvailableMultiSelection ? [dataSource[0]?.id] : dataSource[0]?.id)
    if ([4, 55, 53].includes(m.interfaceField.fieldId))
      this.onChangePrecision(m.interfaceField.fieldId)
    m.dataSource = dataSource
    return m.dataSource
  }

  /*  //выбора единицы измерения в форме добавления товара необходимо дополнительно выполнить пересечение между данными модели и котировочными данными для условий оплаты.
    getTermsConditionsPayment(){
      this.createOfferService.GetStatisticsPayments(this.user?.token, this.sessionInfo.sectionId, this.sessionInfo.sessionId, this.sessionInfo.idMarketType, this.good.id, this.goodForm?.get('2')?.value).then((res: any)=>{
      })
    }*/

  public onOpened(fieldId: number, filterDataSource: RefsData[]): void {
    this.selectedItemKeys = [];
    if (this.goodForm.controls[fieldId.toString()].value) {
      let findElementInArray = filterDataSource.find(el => el.name === this.goodForm.controls[fieldId.toString()].value)
      if (findElementInArray) {
        this.selectedItemKeys = [findElementInArray.id.toString()]
      }
    }
  }

  public initDropDownBox(m: any): void {
    if (!m.dataSource) {
      this.getDataSourceSelectBox(m)
    }
  }

  public selectionChangeInUserInputComponent(event: SelectionChangedEvent, fieldId: number): void {
    if (event.addedItems?.length > 0) {
      this.goodForm.get(fieldId.toString()).patchValue(event.addedItems[0]?.name);
      this.goodForm.get('id_location_' + fieldId.toString()).patchValue(event.addedItems[0].id);
    }
    this.isDropDownOpened = false;
  }

  // Фильтрация стран по поисковому запросу
  onSearch(e: ValueChangedEvent, m: any): void {
    let result = e.value.length >= 3 || e.value.length == 0;
    if (result) {
      m.filterDataSource = m.dataSource.filter(item =>
        item.name.toLowerCase().includes(e.value))
    }
  }

  checkboxIdElement(fieldId) {
    this.checkboxId.push(fieldId)
  }

  async onChangePrecision(id) {
    if (id == ID_INTERFACE_FIELD.CURRENCY || id == ID_INTERFACE_FIELD.QUOTE_CURRENCY || id == ID_INTERFACE_FIELD.AMENDMENT_TYPE) {
      if (!(id == ID_INTERFACE_FIELD.AMENDMENT_TYPE && this.goodForm?.get(ID_INTERFACE_FIELD.AMENDMENT_TYPE.toString())?.value == 1)) {                    //должно быть в относительном поправка
        let idCurrency;
        if (id == ID_INTERFACE_FIELD.QUOTE_CURRENCY) {
          idCurrency = this.goodForm?.get(ID_INTERFACE_FIELD.QUOTE_CURRENCY.toString())?.value                            //Валюта котировки
        } else
          idCurrency = this.goodForm?.get(ID_INTERFACE_FIELD.CURRENCY.toString())?.value                             //Валюта

        if (idCurrency) {
          this.commonService.GetPrecision(this.user?.token, idCurrency).subscribe((res) => {
            this.modelFieldsGroup.forEach(block => {
              for (let i = 0; i < block[1].length; i++) {
                if (id == ID_INTERFACE_FIELD.CURRENCY && block[1][i].interfaceField.fieldDataType == 'TCURRENCY' && block[1][i].interfaceField.fieldId != ID_INTERFACE_FIELD.QUOTATION) {       //все поля типа TCURRENCY и при этом не поля Валюта котировки
                  block[1][i].interfaceField.fieldPrecision = res;
                  this.pricePrecision = Number(res);
                  if (block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.AMENDMENT) {      //Тип поправки
                    this.changeCurrency()
                  }
                }
                if (id === ID_INTERFACE_FIELD.QUOTE_CURRENCY && block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.QUOTATION) {                    //Валюта котировки
                  block[1][i].interfaceField.fieldPrecision = res;
                }
              }
            })
          })
        }
      }
    }
  }

  vatCalculator(): void {
    let VATRate;
    if (this.goodForm?.get('5')?.value) {
      let valueVAT;
      this.modal.forEach(item => {
        if (item.interfaceField.fieldId == 5) {                   //ставка НДС
          valueVAT = item.interfaceField.allowedValues
        }
      })
      if (this.goodForm?.get('5')?.value == 1) {                //Без НДС
        VATRate = 0;
      } else
        VATRate = Number(valueVAT.filter(v => v.id == this.goodForm?.get('5')?.value)[0].name.replace(/[^0-9]/g, ''));
    }
    const volume = this.goodForm?.get('1')?.value;
    const priceWithoutVAT = this.goodForm?.get('3')?.value;
    this.pricePrecision = 2;
    const cost = this.commonService.round(volume * priceWithoutVAT, this.pricePrecision)
    const vatPrice = this.commonService.round((cost * (VATRate / 100)), this.pricePrecision);
    const fullCost = cost + vatPrice;

    this.goodForm.get('costNoVAT')?.patchValue(cost);
    this.goodForm.get('amountVAT')?.patchValue(vatPrice);
    this.goodForm.get('costVAT')?.patchValue(fullCost);
  }


  priceCalculator() {
    let quotation = this.goodForm?.get('56')?.value                   //котировка
    let quoteCurrency = this.goodForm?.get('55')?.value               //Валюта котировки
    let amendment = this.goodForm?.get('54')?.value                   //поправка
    let amendmentType = this.goodForm?.get('53')?.value               //Тип поправки
    let currency = this.goodForm?.get('4')?.value                     //Валюта
    let amendmentSize;                                                //размер поправки
    let date = new Date();


    if (quotation && quoteCurrency && currency) {

      this.commonService.ConvertCurrency(this.user?.token, quotation, quoteCurrency, currency, this.commonService.toOADate(date)).subscribe((res) => {

        this.quotationCurr = res;

        if (amendmentType == 1)                      //в процентном соотношении
        {
          amendmentSize = this.quotationCurr / 100 * amendment;
        } else
          amendmentSize = amendment;

        this.goodForm?.get('3')?.patchValue(this.quotationCurr + Number(amendmentSize))            //цена без НДС
      })
    }
    this.changeCurrency()
  }

  formatType: string;               // для поля поправка

  changeCurrency() {
    let valueVAT, amendmentPrecision;
    if (this.goodForm?.get('4')?.value) {
      this.modal?.forEach(item => {
        if (item.interfaceField.fieldId == 4) {
          valueVAT = item.interfaceField.allowedValues
        }
        if (item.interfaceField.fieldId == 54) {
          amendmentPrecision = item.interfaceField.fieldPrecision
        }
      })
      if (this.goodForm?.get('53')?.value == 2) {
        let amendmentPrecisionString = '';
        for (let i = 0; i < amendmentPrecision; i++) {
          amendmentPrecisionString += "0";
        }
        let format = "#0" + (amendmentPrecision == 0 ? '' : "." + amendmentPrecisionString)
        this.formatType = format + ' ' + valueVAT.filter(v => v.id == this.goodForm?.get('4')?.value)[0].name;
      } else {
        this.formatType = "#.00' %'";
      }
      return this.formatType
    }
    return null;
  }

  OnDelete() {
    this.saveItem.emit(false)
  }

  OnClose() {
    this.saveItem.emit(null)
  }

  clearForm() {
    this.goodForm.reset();
    this.checkboxId.every(el => this.goodForm.controls[el].patchValue(false))      //в чекбоксах выставляется false чтобы не было квадратика внутри
    //при очищении всех полей чтобы предзаполнелись значения фактических
    if (Object.keys(this.goodForm.value).includes('58') || Object.keys(this.goodForm.value).includes('40')
      || Object.keys(this.goodForm.value).includes('59') || Object.keys(this.goodForm.value).includes('57')) {
      ACTUAL_SIZE_FIELDS.forEach(fieldId => {
        if (Object.keys(this.goodForm.value).includes(fieldId.toString())) {
          const prop = this.actualDimensionsComponent?.standartdizeOption(fieldId)
          this.actualDimensionsComponent?.initField(prop, fieldId)
        }
      })
    }
  }

  isValidateRuleVisible(m) {
    return !(m.interfaceField.fieldId == 54) && (!!this.goodForm?.get(m.interfaceField.fieldId.toString())?.value || this.goodForm?.get(m.interfaceField.fieldId.toString())?.value == 0)
  }

  onKeyDown(e, m) {
    if (e.event.key === 'Backspace' || e.event.key === 'Delete') {
      if (this.goodForm.controls[m.interfaceField.fieldId.toString()].value == 0 || !this.goodForm.controls[m.interfaceField.fieldId.toString()].value) {
        this.goodForm.controls[m.interfaceField.fieldId.toString()].patchValue(null)
      }
    }
  }

  public validTypeActualDimensions(): boolean {
    for (const key of Object.keys(this.goodForm.value)) {
      if (key.includes('type')) {
        const idField = Number(key.replace('type', ''));
        const props = this.actualDimensionsComponent?.standartdizeOption(idField);
        if (!this.actualDimensionsComponent?.isValidateTypeWithReadiness(props, idField)) {
          return false;
        }
      }
    }
    return true;
  }

  async checkActualRange() {
    let isCorrect = true;
    if (
      Object.keys(this.goodForm.value).includes(ID_INTERFACE_FIELD.ACTUAL_WIDTH.toString()) ||
      Object.keys(this.goodForm.value).includes(ID_INTERFACE_FIELD.ACTUAL_LENGTH.toString()) ||
      Object.keys(this.goodForm.value).includes(ID_INTERFACE_FIELD.ACTUAL_THICKNESS.toString())
    ) {
      const promises = [ID_INTERFACE_FIELD.ACTUAL_WIDTH.toString(), ID_INTERFACE_FIELD.ACTUAL_THICKNESS.toString(), ID_INTERFACE_FIELD.ACTUAL_LENGTH.toString()].map(async id => {
        if (this.goodForm.controls['type' + id]?.value == actualDimensionsType.TRANGE) {
          const body = {
            idGood: this.good.id,
            idModel: this.demandsModal.modelId,
            idInterfaceField: Number(id),
            leftBound: Number(this.goodForm.controls[id].value.split('-')[0]?.replace(/,/g, '.')),
            rightBound: Number(this.goodForm.controls[id].value.split('-')[1]?.replace(/,/g, '.'))
          }
          try {
            await this.createOfferService.CheckDimensionIntervals(this.user?.token, body);
          } catch (err) {
            isCorrect = false;
          }
        }
      });
      await Promise.all(promises);
    }
    return isCorrect;
  }


  async onSave(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      if (this.modelsResult.pricingTypeId != this.pricingType.formulaWithoutQuotation) {
        if (this.goodForm?.get('costNoVAT')?.value == 0 || this.goodForm?.get('costVAT')?.value == 0) {
          this.error = true;
          this.messageError = this.translate.store.currentLang == 'RU' ? RU["errors"].nullCost : EN["errors"].nullCost;
          return;
        }
      }

      const isValidType = this.validTypeActualDimensions()
      if (!isValidType) {
        return;
      }

      const isDimensionsCorrect = await this.checkActualRange();
      if (!isDimensionsCorrect) {
        return;
      }


      if (this.schedule?.length > 0 && !this.goodForm.controls[ID_INTERFACE_FIELD.ADJUSTED_PRICE.toString()].value) {
        this.removeAdjustedPricePopup = true;
        return;
      }

      this.modal.forEach(item => {
        for (let nameControl of Object.keys(this.goodForm.controls)) {
          if (item.interfaceField.fieldId == nameControl) {
            if (ACTUAL_SIZE_FIELDS.includes(Number(item.interfaceField.fieldId)) && this.goodForm.controls[item.interfaceField.fieldId]?.value) {
              let name: string = 'type' + item.interfaceField.fieldId;
              let value: string = this.goodForm.controls[item.interfaceField.fieldId]?.value + '#' + this.goodForm.controls[name].value + '#';
              item.selectedValues = value;
            } else if (item.interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_LOCATION) {
              item.selectedValues = this.goodForm.get(nameControl).value;
              item.isFreeInput = this.isFreeInput;
              item.idSelectedValues = this.goodForm.get('id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString())?.value
                ? Number(this.goodForm.get('id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString())?.value)
                : null;
            } else {
              item.selectedValues = this.goodForm.get(nameControl).value;
            }
          }
        }
      })

      if (this.modelsResult.pricingTypeId != this.pricingType.formulaWithoutQuotation) {
        if (!this.goodInfo) {
          this.modal = [...this.modal, ...[{
            "costNoVAT": this.goodForm?.get('costNoVAT')?.value,
            "interfaceField": {
              "blockId": 4,
              "fieldName": this.translate.store.currentLang == 'RU' ? RU["createOffer"].total.costNoVAT : EN["createOffer"].total.costNoVAT,
            },
            "selectedValues": this.goodForm?.get('costNoVAT')?.value
          },
            {
              "amountVAT": this.goodForm?.get('amountVAT')?.value,
              "interfaceField": {
                "blockId": 4,
                "fieldName": this.translate.store.currentLang == 'RU' ? RU["createOffer"].total.amountVAT : EN["createOffer"].total.amountVAT,
              },
              "selectedValues": this.goodForm?.get('amountVAT')?.value
            },
            {
              "costVAT": this.goodForm?.get('costVAT')?.value,
              "interfaceField": {
                "blockId": 4,
                "fieldName": this.translate.store.currentLang == 'RU' ? RU["createOffer"].total.costVAT : EN["createOffer"].total.costVAT,
              },
              "selectedValues": this.goodForm?.get('costVAT')?.value
            },
          ]
          ]
        } else {
          this.modal.forEach(item => {
            if (item.costNoVAT) {
              item.costNoVAT = this.goodForm?.get('costNoVAT')?.value
              item.selectedValues = this.goodForm?.get('costNoVAT')?.value
            }
            if (item.amountVAT || item.amountVAT == 0) {
              item.amountVAT = this.goodForm?.get('amountVAT')?.value
              item.selectedValues = this.goodForm?.get('amountVAT')?.value
            }
            if (item.costVAT) {
              item.costVAT = this.goodForm?.get('costVAT')?.value
              item.selectedValues = this.goodForm?.get('costVAT')?.value
            }
          })
        }
      }


      this.modal = this.modal.reduce(function (r, a) {       //сгруппированы поля по fieldId
        r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
        r[a.interfaceField.blockId].push(a);
        return r;
      }, {});

      this.saveItem.emit(this.modal)

    }
  }
}
