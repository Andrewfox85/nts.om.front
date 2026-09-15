/* eslint-disable */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SidebarService } from '../../../core/services/sidebar-service.service';
import {
  ACTUAL_SIZE_FIELDS,
  ACTUAL_SIZE_READINESS_FIELDS,
  AuctionType,
  BLOCK_ID_FIELDS,
  COMPLEX_LOT_PRODUCT_TYPE_ID,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  IdDirection,
  pricingType,
  sectionID,
  SORT_ID_ACTUAL_FIELDS,
} from '../../../api.constants';
import RU from '../../../../assets/i18n/RU.json';
import EN from '../../../../assets/i18n/EN.json';
import { TranslateService } from '@ngx-translate/core';
import { CommonService } from '../../../core/services/common-service.service';
import {
  CreateOfferService,
  IFieldProperty,
  StandardizedProps
} from '../../../core/services/create-offer-service.service';
import { ValidationCallbackData } from 'devextreme/common';
import { ID_INTERFACE_FIELD } from '../../../shared/enums';
import { RefsData } from '../../../core/interfaces/interface';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { actualDimensionsType, GOODS_FIELDS_BLOCK } from '../enums';
import { ActualDimensionsComponent } from "../../actual-dimensions/actual-dimensions.component";
import {
  AddNsiGoodService,
  ReplaceGood
} from "../../../core/services/add-nsi-good.service";
import { Subject, takeUntil } from "rxjs";
import { SECTIONS_TYPES } from "../../header/enums";
import { SelectionChangedEvent } from 'devextreme/ui/accordion';

@Component({
  selector: 'good-info',
  templateUrl: './good-info.component.html',
  styleUrls: ['./good-info.component.scss'],
})
export class GoodInfoComponent implements OnInit, OnDestroy {
  @ViewChild(ActualDimensionsComponent, { static: false }) actualDimensionsComponent: ActualDimensionsComponent;

  @Input() good;
  @Input() goodInfo;
  @Input() filledFields; //не первый товар (второй и более)
  @Input() blockModal;
  @Input() demandsModal;
  @Input() modelsResult;
  @Input() user;
  @Input() direction;
  @Input() goodsList;
  @Input() schedule;
  @Input() listClients;
  @Input() idOffer;
  @Output() saveItem = new EventEmitter<any>();
  @Output() scheduleResult = new EventEmitter<[]>();

  goodForm: any = this.formBuilder.group({
    costNoVAT: [],
    amountVAT: [],
    costVAT: [],
  });
  modelFieldsGroup: any;
  costBlock = false;

  modal = [];
  standartdizeProps: IFieldProperty[] = []; // информации о стандартизированных характеристиках товара

  pricingType = pricingType;
  quotationCurr; //котировка в пересчитанной валюте
  pricePrecision: number;
  checkboxId = []; //массив ид товаров

  error = false;
  messageError: string;

  isDropDownOpened = false;
  selectedItemKeys = [];
  removeAdjustedPricePopup = false;

  public readonly ID_INTERFACE_FIELD = ID_INTERFACE_FIELD;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;
  public readonly IdDirection = IdDirection;
  public readonly GOODS_FIELDS_BLOCK = GOODS_FIELDS_BLOCK;
  public readonly BLOCK_ID_FIELDS = BLOCK_ID_FIELDS;

  private destroy$ = new Subject<void>();

  public isVisibleToast = false;
  public replaceGood: ReplaceGood = {
    goodName: '',
    id: 0,
    properties: []
  };

  constructor(
    private formBuilder: FormBuilder,
    private sidebarService: SidebarService,
    public translate: TranslateService,
    public commonService: CommonService,
    public createOfferService: CreateOfferService,
    public addNsiGoodService: AddNsiGoodService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.getStandardizedProps();

    if (!this.goodInfo) {
      this.modal = JSON.parse(JSON.stringify(this.blockModal.fields)); //создание нового массива на основе this.blockModal.fields
      this.addCondSearch(this.modal);

      for (let i = 0; i < this.modal.length; i++) {
        //Добавление полей в динамическую форму. Везде formControlName равняется fieldId
        if (this.modal[i].interfaceField.fieldId == 3) {
          this.costBlock = true;
        }

        this.goodForm.addControl(
          this.modal[i].interfaceField.fieldId,
          this.formBuilder.control(
            this.modal[i].interfaceField.fieldDataType == 'TBOOLEAN'
              ? false
              : null,
            this.modal[i].isRequired ? Validators.required : null
          )
        );

        //если есть поле местонахождение и оно может быть изменено вручную, добавляем отдельный контрол для записи id значения. в основную форму записываем строку вписанную вручную
        if (this.modal[i].interfaceField.fieldId == ID_INTERFACE_FIELD.PRODUCT_LOCATION && this.modal[i].interfaceField.isAvailableFreeInput) {
          this.goodForm.addControl(
            'id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString(),
            this.formBuilder.control(null,  this.modal[i].isRequired ? Validators.required : null)
          );
        }

        if (
          this.demandsModal.tradeTypeId == 2 &&
          this.direction == IdDirection.buy
        ) {
          //аукцион покупателя
          if (
            this.modal[i].interfaceField.fieldId == 9 &&
            this.modal[i].isRequired
          ) {
            //если поле Мин цена и оно обязательное! предзаполняем 0.01
            this.goodForm?.get('9')?.setValue(0.01);
          }
        }
      }
    }

    if (this.goodInfo) {
      let allField = [];
      this.goodInfo.fields.forEach((item) => {
        allField = allField.concat(item[1]);
      });
      if (this.goodInfo.idOfferGood) {
        //выстраиваем правильный порядок полей
        let sortedFieldId = this.blockModal.fields.map(
          (x) => x.interfaceField.fieldId
        ); //массив fieldId с правильной сортировкой
        allField = allField.map((e) => {
          //добавляем поле sortBy с индексом места поля
          e.sortBy = e.interfaceField.fieldId
            ? sortedFieldId.indexOf(e.interfaceField.fieldId)
            : allField.indexOf(e);
          return e;
        });
        allField.sort((a, b) => a.sortBy - b.sortBy); //выстраиваем в нужном порядке
      }
      this.modal = JSON.parse(JSON.stringify(allField));

      this.addCondSearch(this.modal);
      for (let i = 0; i < this.modal?.length; i++) {
        //добавление полей в динамическую форму. Везде formControlName равняется fieldId
        if (this.modal[i].interfaceField.fieldId == ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT) {
          this.costBlock = true;
        }

        this.goodForm.addControl(
          this.goodInfo.idOfferGood &&
            !this.modal[i].costVAT &&
            !this.modal[i].amountVAT &&
            this.modal[i].amountVAT != 0 &&
            !this.modal[i].costNoVAT
            ? this.modal[i].interfaceField.fieldId.toString()
            : this.modal[i].interfaceField.fieldId,
          this.formBuilder.control(
            this.modal[i].interfaceField.fieldDataType == 'TBOOLEAN'
              ? false
              : null,
            this.modal[i].isRequired ? Validators.required : null
          )
        );

        if (this.modal[i].interfaceField.fieldId == ID_INTERFACE_FIELD.PRODUCT_LOCATION && this.modal[i].interfaceField.isAvailableFreeInput) {
          this.goodForm.addControl(
            'id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString(),
            this.formBuilder.control(this.modal[i].idSelectedValues, this.modal[i].isRequired ? Validators.required : null)
          );
        }

        if (
          this.goodInfo &&
          !this.modal[i].costVAT &&
          !this.modal[i].amountVAT &&
          this.modal[i].amountVAT != 0 &&
          !this.modal[i].costNoVAT
        ) {
          this.fieldValue(this.modal[i].interfaceField.fieldId);
        }
      }
      this.onChangePrecision(4);
      // if(!this.goodInfo?.idOfferGood)
      if (
        this.demandsModal?.pricingTypeId != pricingType?.formulaWithoutQuotation
      )
        this.vatCalculator();

      if (this.goodForm?.get('55')?.value) {
        //если есть Валюта котировки
        this.onChangePrecision(55);
      }
    }

    if (this.filledFields)
      this.onValuePrefill()

    this.modelFieldsGroup = this.modal.reduce(function (r, a) {
      //сгруппированы поля по blockId
      r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
      r[a.interfaceField.blockId].push(a);
      return r;
    }, {});

    this.modelFieldsGroup = Object.entries(this.modelFieldsGroup); //возвращает массив объектов

    this.addNsiGoodService.newGood$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (data: ReplaceGood) => {
        if (data.properties?.length > 0) {
          this.replaceGood.goodName = data.goodName;
          this.replaceGood.id = data.id;
          this.replaceGood.properties = data.properties;
          this.isVisibleToast = true;

          if (data.changedStandardizedFieldsId?.length > 0) {
            await this.getStandardizedProps();
            if (Object.keys(this.goodForm.value).includes(ID_INTERFACE_FIELD.PRODUCT_READINESS.toString()) &&
              this.actualDimensionsComponent.isProductDependOnReadiness()) {
              this.goodForm.controls[ID_INTERFACE_FIELD.PRODUCT_READINESS.toString()].reset();
            } else {
              data.changedStandardizedFieldsId.forEach(fieldId => {
                let name = 'type' + fieldId.toString();
                this.goodForm.controls[name].reset();
              });
            }
            this.initActualField();
          }
        }
      });
  }

  public async getStandardizedProps() {
    /*  Особые правила добавления товара применяются при следующих условиях:
        секция 2 Лесопродукция;
        вид торгов 1 Торги на повышение;
        направление 2 продажа*/
    if (
      this.demandsModal.sectionId == SECTIONS_TYPES.TIMBER &&
      this.demandsModal.tradeTypeId == AuctionType.englishUpgrading &&
      this.direction == IdDirection.sale
    ) {
      let res: StandardizedProps = await this.createOfferService.GetStandardizedProps(
        this.user?.token,
        this.replaceGood.id != 0 ? this.replaceGood.id : this.good.id
      );
      this.standartdizeProps = res.props;
      this.createOfferService.standartdizePropsSubject.next(this.standartdizeProps);
    }
  }

  public onValuePrefill(): void {
    //второй и далее товар заполняем поля значениями из первого товара
    this.goodForm?.get(ID_INTERFACE_FIELD.CURRENCY.toString())?.setValue(this.filledFields?.currency?.toString()); //валюта
    this.goodForm?.get(ID_INTERFACE_FIELD.VAT_RATE.toString())?.setValue(this.filledFields.vat?.id?.toString()); //ставка НДС
    this.goodForm?.get(ID_INTERFACE_FIELD.ADJUSTED_PRICE.toString())?.setValue(this.filledFields?.adjustedPrice?.toString() === "true"); //корректируемая цена
    this.goodForm
      ?.get(ID_INTERFACE_FIELD.QUOTE_CURRENCY.toString())
      ?.setValue(this.filledFields?.currencyQuotes.toString()); //валюта котировки
    if (this.filledFields?.currencyQuotes) this.onChangePrecision(ID_INTERFACE_FIELD.QUOTE_CURRENCY);
    this.goodForm?.get(ID_INTERFACE_FIELD.FINANCE_SOURCE.toString())?.setValue(this.filledFields?.finance?.toString() || null); //источник финансирования
    this.goodForm
      ?.get(ID_INTERFACE_FIELD.AMENDMENT_TYPE.toString())
      ?.setValue(this.filledFields?.priceAdjustment.toString()); //тип поправки
    this.onChangePrecision(ID_INTERFACE_FIELD.CURRENCY.toString()); //точность currency

    if (this.demandsModal.sectionId == sectionID.forestProducts)
      this.hasTheSameValueComplexLot();

    if(this.demandsModal.sectionId == sectionID.agricultural && !this.goodInfo){
      const fieldsArray = [ID_INTERFACE_FIELD.EXPIRATION_DATE, ID_INTERFACE_FIELD.WHOLESALE_MARKUP,
        ID_INTERFACE_FIELD.PRODUCT_QUALITY, ID_INTERFACE_FIELD.DELIVERY_FEATURES]
      const fieldBlock = this.goodsList[0].fields.find(block=>
        block[1].find(el=> fieldsArray.includes(el.interfaceField.fieldId)))
      if(fieldBlock) {
        fieldsArray.forEach((field) => {
          this.setValueForField(field, fieldBlock)
        })
      }
    }
  }

  public setValueForField(id: number, fieldBlock: unknown): void {
    const value = fieldBlock[1]?.find(el => el.interfaceField.fieldId === id)?.selectedValues
    const fieldInModal = this.modal.find(el=>el.interfaceField.fieldId === id)
    const dataSource = fieldInModal?.selectedValues || fieldInModal?.interfaceField?.allowedValues
    if (dataSource?.find(v => v.id == value))
      this.goodForm?.get(id.toString())?.setValue(value.toString())
  }

  public isActualDimensions(fieldId: number): boolean {
    return ACTUAL_SIZE_FIELDS.includes(fieldId)
  }

  get getReadinessDataSource(): RefsData[] {
    const readiness = this.modal.find(el => el.interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_READINESS)
    return readiness?.interfaceField.allowedValues || readiness?.dataSource
  }

  zeroComparison = () => 0;

  addCondSearch(fields) {
    let index = fields.findIndex(
      (el) =>
        el.interfaceField.controlFieldType == 'dxTextBox' &&
        el.interfaceField.fieldSize > 1000
    ); //проверка на поле Дополнительные условия
    if (index != -1) this.modal.push(this.modal.splice(index, 1)[0]);
    //фактические размеры и готовность товара
    // Фактическая длина (40), Фактический диаметр (57), Фактическая ширина (58), Фактическая толщина (59), Готовность товара (21)
    fields.forEach((el, indexDimensions) => {
      if (ACTUAL_SIZE_READINESS_FIELDS.includes(Number(el.interfaceField.fieldId))) {
        if (el.interfaceField.fieldId != ID_INTERFACE_FIELD.PRODUCT_READINESS) {
          let nameField = 'type' + el.interfaceField.fieldId.toString();
          this.goodForm.addControl(
            nameField,
            this.formBuilder.control(null, Validators.required)
          );
          this.modal[indexDimensions].sortBy =
            SORT_ID_ACTUAL_FIELDS['FIELD_' + el.interfaceField.fieldId];
        } else {
          this.modal[indexDimensions].sortBy = 0;
        }
        this.modal[indexDimensions].interfaceField.blockId = 0;
        this.modal.unshift(this.modal.splice(indexDimensions, 1)[0]);
      }
    });
    let readiness = this.modal.findIndex(
      (el) => el.interfaceField.fieldId == 21
    ); //готовность товара
    if (readiness != -1) this.modal.unshift(this.modal.splice(readiness, 1)[0]);
    // Сортировка полей с blockId = 0 по sortBy
    this.modal = this.createOfferService.sortActualFields(this.modal);
  }

  public conditionsTheSameValue(): boolean {
    return this.demandsModal.complexLotProductTypes?.length === 1 &&
      this.demandsModal.complexLotProductTypes.find(
        (el) => el.typeId === COMPLEX_LOT_PRODUCT_TYPE_ID &&
          el.referenceIds?.length === 1 &&
          el.referenceIds[0] === COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
      );
  }


  public hasTheSameValueComplexLot(): void {
    //Один товар с разными характеристиками:Сорт => предзаполняем все поля других товаров
    if (this.conditionsTheSameValue()) {
      this.goodsList[0].fields.forEach((block) => {
        for (let i = 0; i < block[1].length; i++) {
          /* не предзаполняются и доступны для редактирования доп. поля по каждому товару:
             - Минимальная цена (без НДС)
             - Пороговая цена (без НДС)*/
          if (
            block[1][i].interfaceField.fieldId &&
            (block[1][i].interfaceField.isAccessibleForWorker ||
              [
                ID_INTERFACE_FIELD.UNIT,
                ID_INTERFACE_FIELD.CFEA
              ]
                .includes(block[1][i].interfaceField.fieldId)) &&
            ![...ACTUAL_SIZE_FIELDS,
              ID_INTERFACE_FIELD.MIN_PRICE,
              ID_INTERFACE_FIELD.THRESHOLD_PRICE_WITHOUT_VAT]
              .includes(
                block[1][i].interfaceField.fieldId
              )
          ) {
            this.goodForm.controls[
              block[1][i].interfaceField.fieldId.toString()
              ]?.patchValue(
                block[1][i].interfaceField.fieldDataType == 'TBOOLEAN'
                  ? !(
                      !block[1][i].selectedValues ||
                      block[1][i].selectedValues == 'false'
                    )
                  : block[1][i].selectedValues?.toString() || null
             );
            this.goodForm.controls[
              block[1][i].interfaceField.fieldId.toString()
              ]?.disable();

            if (block[1][i].interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_LOCATION) {
              this.goodForm.controls[
              'id_location_' + ID_INTERFACE_FIELD.PRODUCT_LOCATION.toString()]
                .patchValue(block[1][i].idSelectedValues);
            }
          }
        }
      });
    }
  }

  public clearField(): void {
    this.actualDimensionsComponent?.clearField();
  }

  fieldValue(fieldId) {
    this.goodInfo.fields.forEach((block) => {
      for (let i = 0; i < block[1].length; i++) {
        if (block[1][i].interfaceField.fieldId == fieldId) {
          if (!ACTUAL_SIZE_FIELDS.includes(Number(fieldId))) {
            //если корректируемая цена - то переменная boolean, иначе: поле имеет тип dxSelectBox - string, остальные просто цифры
            this.goodForm.controls[fieldId]?.patchValue(
              block[1][i].interfaceField.fieldId == ID_INTERFACE_FIELD.ADJUSTED_PRICE
                ? block[1][i].selectedValues?.toString().toLowerCase() === 'true' :
                this.goodInfo.idOfferGood ?
                  block[1][i].interfaceField.controlFieldType ==
                  'dxSelectBox' &&
                  !block[1][i].interfaceField.isAvailableMultiSelection
                    ? block[1][i].selectedValues?.toString()
                    : block[1][i].selectedValues
                  : block[1][i].selectedValues
            );
          } else {
            this.goodForm.controls[fieldId]?.patchValue(
              block[1][i].selectedValues
                ? this.goodInfo.idOfferGood
                  ? block[1][i].interfaceField.controlFieldType ==
                      'dxSelectBox' &&
                    !block[1][i].interfaceField.isAvailableMultiSelection
                    ? this.commonService
                        .actualDimensions(block[1][i].selectedValues, 0)
                        .toString()
                    : this.commonService.actualDimensions(
                        block[1][i].selectedValues,
                        0
                      )
                  : this.commonService.actualDimensions(
                      block[1][i].selectedValues,
                      0
                    )
                : null
            );

            let typeValue = block[1][i].selectedValues
              ? this.commonService.actualDimensions(
                  block[1][i].selectedValues,
                  1
                )
              : null;
            if (!['TSTRING', 'TRANGE', 'TINTEGER'].includes(typeValue)) {
              let props = this.actualDimensionsComponent?.standartdizeOption(
                block[1][i].interfaceField.fieldId
              );
              if (
                props &&
                props?.length == 1 &&
                props[0].dataType == 'TRANGE'
              ) {
                typeValue = this.actualDimensionsComponent?.isVisibleTString(
                  props,
                  block[1][i].interfaceField.fieldId
                )
                  ? 'TSTRING'
                  : 'TINTEGER';
              } else if (props?.length == 1) {
                typeValue = props[0].dataType;
              } else
                typeValue = this.actualDimensionsComponent?.isVisibleTString(
                  props,
                  block[1][i].interfaceField.fieldId
                )
                  ? 'TSTRING' //отображается то что есть в выпадающем списке, если ничего нет, то TSTRING
                  : (
                      this.user?.IsWorker
                        ? true
                        : this.actualDimensionsComponent?.isVisibleTRange(
                            block[1][i].interfaceField.fieldId,
                            props
                          )
                    )
                  ? 'TRANGE'
                  : (
                      this.user?.IsWorker
                        ? true
                        : this.actualDimensionsComponent?.isVisibleTInteger(
                            block[1][i].interfaceField.fieldId,
                            props
                          )
                    )
                  ? 'TINTEGER'
                  : 'TSTRING';
            }
            this.goodForm.controls['type' + fieldId]?.patchValue(
              this.goodInfo.idOfferGood
                ? block[1][i].interfaceField.controlFieldType ==
                    'dxSelectBox' &&
                  !block[1][i].interfaceField.isAvailableMultiSelection
                  ? typeValue
                  : typeValue
                : typeValue
            );
          }
        }
        // && fieldId!= 12
      }
    });
    if (
      this.goodForm?.get('53')?.value &&
      this.demandsModal?.pricingTypeId != pricingType?.price
    ) {
      this.changeCurrency();
    }
  }



  public isFreeInput: boolean = false;

  public clearValueNull(e: ValueChangedEvent, fieldId?: number): void {
    if (e.value?.length === 0) {
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

  validateWoodName(e: ValidationCallbackData) {
    const value = (e.value || '').trim();
    if (value === '') {
      return true;
    }

    const pattern = /^[0-9А-Я+]+$/; //цифры от 0 до 9, заглавные буквы русского алфавита, знак +
    if (!pattern.test(e.value)) {
      e.rule.message = 'Допускается ввод символов только кириллицей.';
      return false;
    }

    if (/\+\+/.test(e.value)) {
      // нет двух или более плюсов подряд
      e.rule.message =
        'Недопустимо использование нескольких знаков "+" подряд.';
      return false;
    }

    const num = e.value.match(/\d+/g) || []; // 0 может входить только в состав числа 10
    for (const n of num) {
      if (n.includes('0') && n !== '10') {
        e.rule.message = 'Символ "0" допускается только в составе числа "10".';
        return false;
      }
    }

    const numbers = e.value.match(/\d+/g) || []; //контроль суммы цифровых значений введенных данных. Эта сумма д.б. == 10
    const sum = numbers.reduce((acc, num) => acc + parseInt(num, 10), 0);
    if (sum !== 10) {
      e.rule.message = 'Сумма введенных чисел должна быть равна 10.';
    }
    return sum === 10;
  }

  minPriceComparison = () => this.goodForm?.get('9')?.value;

  openSidebar(good: any) {
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('dark').className = 'dark_opened';
    let goodInfo = this.setDataToOpenSideBar(good)
    goodInfo.isCanEditCharacteristics = this.isCanEditCharacteristics

    this.sidebarService.dataForReqSubject.next(goodInfo);
    this.sidebarService.typeSubject.next('good');
  }

  get isCanEditCharacteristics(): boolean {
    return !this.user.IsWorker && this.direction === IdDirection.sale
  }

  async getDataSourceSelectBox(m) {
    //dataSource в выпадающем списке
    let dataSource = [];
    if (
      !(
        [
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.OKRB007,
          ID_INTERFACE_FIELD.CFEA,
        ].includes(m.interfaceField.fieldId) ||
        ((m.interfaceField.referenceId || m.interfaceField.referenceAlias) &&
          m.interfaceField.isAvailableFreeInput)
      )
    ) {
      //ОКРБ 007-2012(12), ед.изм(2), Код ТН ВЭД ЕАЭС(63)
      dataSource =
        m.selectedValues && m.selectedValues?.length > 0
          ? m.selectedValues
          : m.interfaceField.allowedValues;
    } else {
      if (m.interfaceField.fieldId == 2) {
        //пересечение с классифаером ед.изм.
        this.commonService
          .GetRefbookByName(
            this.user?.token,
            m.interfaceField.referenceAlias,
            undefined,
            this.good.idGoodName
          )
          .then((res: any) => {
            let dataSourceFromModel =
              m.selectedValues && m.selectedValues?.length > 0
                ? m.selectedValues
                : m.interfaceField.allowedValues;
            m.dataSource =
              res.refbooks.length == 0
                ? dataSourceFromModel
                : dataSourceFromModel.filter((el) =>
                    res.refbooks.map((v) => v.id).includes(el.id)
                  );
            if (m.dataSource?.length == 1 && m.isRequired)
              this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(
                m.dataSource[0]?.id
              );
          });
      } else {
        if (m.interfaceField.referenceAlias) {
          this.commonService
            .GetRefbookByName(
              this.user?.token,
              m.interfaceField.referenceAlias,
              undefined,
              this.good.idGoodName || null
            )
            .then((res: any) => {
              m.dataSource = res.refbooks;
              if (m.dataSource?.length == 1 && m.isRequired)
                this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(
                  m.dataSource[0]?.id
                );
            });
        } else if (m.interfaceField.referenceId) {
          this.commonService
            .getById(
              this.user?.token,
              m.interfaceField.referenceId,
              this.demandsModal.sectionId
            )
            .subscribe((res: any) => {
              m.dataSource = res.data;
              if (m.dataSource?.length == 1 && m.isRequired)
                this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(
                  m.dataSource[0]?.id
                );
            });
        }
      }
    }
    if (dataSource?.length == 1 && m.isRequired) {
      this.goodForm.controls[m.interfaceField.fieldId]?.patchValue(
        m.interfaceField.isAvailableMultiSelection
          ? [dataSource[0]?.id]
          : dataSource[0]?.id
      );

      if (m.interfaceField.fieldId === ID_INTERFACE_FIELD.PRODUCT_READINESS) {
        //ждем окончания текущего цикла рендеринга и создания actualDimensionsComponent
        setTimeout(() => {
          this.clearField();
        }, 0);
      }
    }
    if ([
      ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
      ID_INTERFACE_FIELD.QUOTE_CURRENCY,
      ID_INTERFACE_FIELD.AMENDMENT_TYPE
    ].includes(m.interfaceField.fieldId)) {
      this.onChangePrecision(m.interfaceField.fieldId);
    }
    m.dataSource = dataSource;
    return m.dataSource;
  }

  checkboxIdElement(fieldId) {
    this.checkboxId.push(fieldId);
  }

  public onOpened(fieldId: number, filterDataSource: RefsData[]): void {
    this.selectedItemKeys = [];
    if (this.goodForm.controls[fieldId.toString()].value) {
      let findElementInArray = filterDataSource.find(
        (el) => el.name === this.goodForm.controls[fieldId.toString()].value
      );
      if (findElementInArray) {
        this.selectedItemKeys = [findElementInArray.id.toString()];
      }
    }
  }

  public initDropDownBox(m: any): void {
    if (!m.dataSource) {
      this.getDataSourceSelectBox(m);
    }
  }

  selectionChangeInUserInputComponent(
    event: SelectionChangedEvent,
    fieldId: number
  ): void {
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
      m.filterDataSource = m.dataSource.filter((item) =>
        item.name.toLowerCase().includes(e.value)
      );
    }
  }

  async onChangePrecision(id) {
    if (
      id == ID_INTERFACE_FIELD.CURRENCY ||
      id == ID_INTERFACE_FIELD.QUOTE_CURRENCY ||
      id == ID_INTERFACE_FIELD.AMENDMENT_TYPE
    ) {
      if (
        !(
          id == ID_INTERFACE_FIELD.AMENDMENT_TYPE &&
          this.goodForm?.get(ID_INTERFACE_FIELD.AMENDMENT_TYPE.toString())
            ?.value == 1
        )
      ) {
        //должно быть в относительном поправка
        let idCurrency;
        if (id == ID_INTERFACE_FIELD.QUOTE_CURRENCY) {
          idCurrency = this.goodForm?.get(
            ID_INTERFACE_FIELD.QUOTE_CURRENCY.toString()
          )?.value; //Валюта котировки
        } else
          idCurrency = this.goodForm?.get(
            ID_INTERFACE_FIELD.CURRENCY.toString()
          )?.value; //Валюта

        if (idCurrency) {
          this.commonService
            .GetPrecision(this.user?.token, idCurrency)
            .subscribe((res) => {
              this.modelFieldsGroup.forEach((block) => {
                for (let i = 0; i < block[1].length; i++) {
                  if (
                    id == ID_INTERFACE_FIELD.CURRENCY &&
                    block[1][i].interfaceField.fieldDataType == 'TCURRENCY' &&
                    block[1][i].interfaceField.fieldId !=
                      ID_INTERFACE_FIELD.QUOTATION
                  ) {
                    //все поля типа TCURRENCY и при этом не поля Валюта котировки
                    block[1][i].interfaceField.fieldPrecision = res;
                    this.pricePrecision = Number(res);
                    if (
                      block[1][i].interfaceField.fieldId ==
                      ID_INTERFACE_FIELD.AMENDMENT
                    ) {
                      //Тип поправки
                      this.changeCurrency();
                    }
                  }
                  if (
                    id === ID_INTERFACE_FIELD.QUOTE_CURRENCY &&
                    block[1][i].interfaceField.fieldId ==
                      ID_INTERFACE_FIELD.QUOTATION
                  ) {
                    //Валюта котировки
                    block[1][i].interfaceField.fieldPrecision = res;
                  }
                }
              });
            });
        }
      }
    }
  }

  vatCalculator(): void {
    let VATRate;
    if (this.goodForm?.get('5')?.value) {
      let valueVAT;
      this.modal.forEach((item) => {
        if (item.interfaceField.fieldId == 5) {
          //ставка НДС
          valueVAT = item.interfaceField.allowedValues;
        }
      });
      if (this.goodForm?.get('5')?.value == 1) {
        //Без НДС
        VATRate = 0;
      } else
        VATRate = Number(
          valueVAT
            .filter((v) => v.id == this.goodForm?.get('5')?.value)[0]
            .name.replace(/[^0-9]/g, '')
        );
    }
    const volume = this.goodForm?.get('1')?.value;
    const priceWithoutVAT = this.goodForm?.get('3')?.value;
    this.pricePrecision = 2;
    const cost = this.commonService.round(
      volume * priceWithoutVAT,
      this.pricePrecision
    );
    const vatPrice = this.commonService.round(
      cost * (VATRate / 100),
      this.pricePrecision
    );
    const fullCost = cost + vatPrice;

    this.goodForm.get('costNoVAT')?.patchValue(cost);
    this.goodForm.get('amountVAT')?.patchValue(vatPrice);
    this.goodForm.get('costVAT')?.patchValue(fullCost);
  }

  priceCalculator() {
    let quotation = this.goodForm?.get('56')?.value; //котировка
    let quoteCurrency = this.goodForm?.get('55')?.value; //Валюта котировки
    let amendment = this.goodForm?.get('54')?.value; //поправка
    let amendmentType = this.goodForm?.get('53')?.value; //Тип поправки
    let currency = this.goodForm?.get('4')?.value; //Валюта
    let amendmentSize; //размер поправки
    let date = new Date();

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
          this.quotationCurr = res;

          if (amendmentType == 1) {
            //в процентном соотношении
            amendmentSize = (this.quotationCurr / 100) * amendment;
          } else amendmentSize = amendment;

          this.goodForm
            ?.get('3')
            ?.patchValue(this.quotationCurr + Number(amendmentSize)); //цена без НДС
        });
    }
    this.changeCurrency();
  }

  formatType: string; // для поля поправка

  changeCurrency() {
    let valueVAT, amendmentPrecision;
    if (this.goodForm?.get('4')?.value) {
      this.modal?.forEach((item) => {
        if (item.interfaceField.fieldId == 4) {
          valueVAT = item.interfaceField.allowedValues;
        }
        if (item.interfaceField.fieldId == 54) {
          amendmentPrecision = item.interfaceField.fieldPrecision;
        }
      });
      if (this.goodForm?.get('53')?.value == 2) {
        let amendmentPrecisionString = '';
        for (let i = 0; i < amendmentPrecision; i++) {
          amendmentPrecisionString += '0';
        }
        let format =
          '#0' +
          (amendmentPrecision == 0 ? '' : '.' + amendmentPrecisionString);
        this.formatType =
          format +
          ' ' +
          valueVAT.filter((v) => v.id == this.goodForm?.get('4')?.value)[0]
            .name;
      } else {
        this.formatType = "#.00' %'";
      }
      return this.formatType;
    }
    return null;
  }

  OnDelete() {
    this.saveItem.emit(false);
  }

  OnClose() {
    this.saveItem.emit(null);
  }

  //todo добавить типизацию
  public setDataToOpenSideBar(good) {
    let goodInfo = structuredClone(good);
    if (this.replaceGood.id !== 0) {
      goodInfo.originalGoodId = goodInfo.id;
      goodInfo.id = this.replaceGood.id;
    }
    goodInfo.sectionId = this.demandsModal.sectionId;
    goodInfo.direction = this.direction;
    goodInfo.modelId = this.blockModal.modelId;
    goodInfo.goodsList = this.goodsList;
    goodInfo.listClients = this.listClients;
    goodInfo.fieldIds = this.modelFieldsGroup.flatMap(group =>
      group[1].map(item => item?.interfaceField?.fieldId)
    );
    const index = this.goodsList.findIndex((item) => item?.id === good.id);
    goodInfo.isDisabledFields = !(index === 0 || this.goodsList?.length == 0) &&
      this.conditionsTheSameValue() &&
      Number(this.demandsModal.sectionId) === SECTIONS_TYPES.TIMBER &&
      Number(this.demandsModal.tradeTypeId) === AuctionType.englishUpgrading;
    return goodInfo;
  }

  public editGoodCharacteristics(good): void {
    let goodInfo = this.setDataToOpenSideBar(good)
    goodInfo.isDisabledAboutTypeCollection =
      (
        this.goodsList?.length > 1
        || (!this.goodInfo && this.goodsList?.length === 1)
      ) && this.conditionsTheSameValue();
    this.addNsiGoodService.onEditGoodCharacteristic(this.user, goodInfo)
  }

  clearForm() {
    this.goodForm.reset();
    this.checkboxId.every((el) => this.goodForm.controls[el].patchValue(false)); //в чекбоксах выставляется false чтобы не было квадратика внутри
    this.initActualField();
  }

  public initActualField(): void {
    //при очищении всех полей чтобы предзаполнялись значения фактических
    if (
      Object.keys(this.goodForm.value).some(el => ACTUAL_SIZE_FIELDS.includes(Number(el)))
    ) {
      ACTUAL_SIZE_FIELDS.forEach((fieldId) => {
        if (Object.keys(this.goodForm.value).includes(fieldId.toString())) {
          const prop = this.actualDimensionsComponent?.standartdizeOption(fieldId);
          this.actualDimensionsComponent?.initField(prop, fieldId);
        }
      });
    }
  }

  isValidateRuleVisible(m) {
    return (
      !(m.interfaceField.fieldId == 54) &&
      (!!this.goodForm?.get(m.interfaceField.fieldId.toString())?.value ||
        this.goodForm?.get(m.interfaceField.fieldId.toString())?.value == 0)
    );
  }

  onKeyDown(e, m) {
    if (e.event.key === 'Backspace' || e.event.key === 'Delete') {
      if (
        this.goodForm.controls[m.interfaceField.fieldId.toString()].value ==
          0 ||
        !this.goodForm.controls[m.interfaceField.fieldId.toString()].value
      ) {
        this.goodForm.controls[m.interfaceField.fieldId.toString()].patchValue(
          null
        );
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
      const promises = [ID_INTERFACE_FIELD.ACTUAL_WIDTH.toString(), ID_INTERFACE_FIELD.ACTUAL_THICKNESS.toString(), ID_INTERFACE_FIELD.ACTUAL_LENGTH.toString()].map(async (id) => {
        if (
          this.goodForm.controls['type' + id]?.value ==
          actualDimensionsType.TRANGE
        ) {
          const body = {
            idGood: this.replaceGood.id != 0 ? this.replaceGood.id : this.good.id,
            idModel: this.blockModal.modelId,
            idInterfaceField: Number(id),
            leftBound: Number(this.goodForm.controls[id].value.split('-')[0]?.replace(/,/g, '.')),
            rightBound: Number(this.goodForm.controls[id].value.split('-')[1]?.replace(/,/g, '.')),
          };
          try {
            await this.createOfferService.CheckDimensionIntervals(
              this.user?.token,
              body
            );
          } catch (err) {
            isCorrect = false;
          }
        }
      });
      await Promise.all(promises);
    }
    return isCorrect;
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

  async onSave(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      if (
        this.demandsModal.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        if (
          this.goodForm?.get('costNoVAT')?.value == 0 ||
          this.goodForm?.get('costVAT')?.value == 0
        ) {
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].nullCost
              : EN['errors'].nullCost;
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

      this.modal.forEach((item) => {
        for (let nameControl of Object.keys(this.goodForm.controls)) {
          if (item.interfaceField.fieldId == nameControl) {
            if (
              ['58', '59', '40', '57'].includes(
                item.interfaceField.fieldId.toString()
              ) &&
              this.goodForm.controls[item.interfaceField.fieldId]?.value
            ) {
              let name = 'type' + item.interfaceField.fieldId;
              let value =
                this.goodForm.controls[item.interfaceField.fieldId]?.value +
                '#' +
                this.goodForm.controls[name].value +
                '#';
              item.selectedValues = value;
            } else if(item.interfaceField.fieldId == ID_INTERFACE_FIELD.PRODUCT_LOCATION) {
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
      });

      if (
        this.demandsModal.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        if (!this.goodInfo) {
          this.modal = [
            ...this.modal,
            ...[
              {
                costNoVAT: this.goodForm?.get('costNoVAT')?.value,
                interfaceField: {
                  blockId: 4,
                  fieldName:
                    this.translate.store.currentLang == 'RU'
                      ? RU['createOffer'].total.costNoVAT
                      : EN['createOffer'].total.costNoVAT,
                },
                selectedValues: this.goodForm?.get('costNoVAT')?.value,
              },
              {
                amountVAT: this.goodForm?.get('amountVAT')?.value,
                interfaceField: {
                  blockId: 4,
                  fieldName:
                    this.translate.store.currentLang == 'RU'
                      ? RU['createOffer'].total.amountVAT
                      : EN['createOffer'].total.amountVAT,
                },
                selectedValues: this.goodForm?.get('amountVAT')?.value,
              },
              {
                costVAT: this.goodForm?.get('costVAT')?.value,
                interfaceField: {
                  blockId: 4,
                  fieldName:
                    this.translate.store.currentLang == 'RU'
                      ? RU['createOffer'].total.costVAT
                      : EN['createOffer'].total.costVAT,
                },
                selectedValues: this.goodForm?.get('costVAT')?.value,
              },
            ],
          ];
        } else {
          this.modal.forEach((item) => {
            if (item.costNoVAT) {
              item.costNoVAT = this.goodForm?.get('costNoVAT')?.value;
              item.selectedValues = this.goodForm?.get('costNoVAT')?.value;
            }
            if (item.amountVAT || item.amountVAT == 0) {
              item.amountVAT = this.goodForm?.get('amountVAT')?.value;
              item.selectedValues = this.goodForm?.get('amountVAT')?.value;
            }
            if (item.costVAT) {
              item.costVAT = this.goodForm?.get('costVAT')?.value;
              item.selectedValues = this.goodForm?.get('costVAT')?.value;
            }
          });
        }
      }

      this.modal = this.modal.reduce(function (r, a) {
        //сгруппированы поля по fieldId
        r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
        r[a.interfaceField.blockId].push(a);
        return r;
      }, {});

      if (this.replaceGood.id != 0) {
        this.good.oldId = this.good.id;
        this.good.id = this.replaceGood.id;
        this.good.properties = this.replaceGood.properties;
        this.good.name = this.replaceGood.goodName;
      }
      this.saveItem.emit(this.modal);
    }
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
