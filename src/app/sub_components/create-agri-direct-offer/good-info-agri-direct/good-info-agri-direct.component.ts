/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output, ɵɵsetComponentScope} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {SidebarService} from "../../../core/services/sidebar-service.service";
import {pricingType} from "../../../api.constants";
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import {TranslateService} from "@ngx-translate/core";
import {CommonService} from "../../../core/services/common-service.service";
import {CreateOfferService} from 'src/app/core/services/create-offer-service.service';
import {ConnectableObservable} from 'rxjs';
import {ID_INTERFACE_FIELD} from "../../../shared/enums";
import {RefsData} from "../../../core/interfaces/interface";
import {ValueChangedEvent} from "devextreme/ui/select_box";
import DevExpress from "devextreme";
import { SelectionChangedEvent } from 'devextreme/ui/accordion';

@Component({
  selector: 'good-info-agri-direct',
  templateUrl: './good-info-agri-direct.component.html',
  styleUrls: ['./good-info-agri-direct.component.scss'],
})
export class GoodInfoAgriDirectComponent implements OnInit {
  @Input() good;
  @Input() goodInfo;
  @Input() filledFields;
  @Input() demandsModal;
  @Input() modelsResult;
  @Input() user;
  @Input() goodsList;
  @Input() idPaymentType;
  @Input() deliveryCond;
  @Input() offerInfo;
  @Input() idArchiveOffer;
  @Output() saveItem = new EventEmitter<any>();

  goodForm: any = this.formBuilder.group({
    costNoVAT: [],
    amountVAT: [],
    costVAT: [],
  });
  modelFieldsGroup: any;
  costBlock = false;

  modal = [];

  pricingType = pricingType;
  quotationCurr; //котировка в пересчитанной валюте
  pricePrecision: number;
  checkboxId = []; //массив ид товаров

  error = false;
  messageError: string;

  volumesPopup: boolean = false;

  isDropDownOpened = false;
  selectedItemKeys = [];

  constructor(
    private formBuilder: FormBuilder,
    private sidebarService: SidebarService,
    public translate: TranslateService,
    public commonService: CommonService,
    private createOfferService: CreateOfferService
  ) {}

  ngOnInit(): void {
    if (this.goodInfo) {
      let allField = [];
      this.goodInfo.fields.forEach((item) => {
        allField = allField.concat(item[1]);
      });
      if (this.goodInfo.idOfferGood) {
        //выстраиваем правильный порядок полей
        let sortedFieldId = this.demandsModal.fields.map(
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
        if (this.modal[i].interfaceField.fieldId == 3) {
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

      if (
        this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation
      )
        this.vatCalculator();

      if (this.goodForm?.get('55')?.value) {
        //если есть Валюта котировки
        this.onChangePrecision(55);
      }
    }

    if (this.filledFields) {
      //если пришла ставка НДС (второй и далее товар) - заполняем поле значением ставки из первого товара
      this.goodForm?.get('4')?.setValue(this.filledFields?.currency.toString()); //валюта
      this.goodForm?.get('5')?.setValue(this.filledFields.vat?.id.toString()); //ставка НДС
      this.goodForm?.get('47')?.setValue(this.filledFields?.adjustedPrice); //корректируемая цена
      this.goodForm
        ?.get('55')
        ?.setValue(this.filledFields?.currencyQuotes.toString()); //валюта котировки
      if (this.filledFields?.currencyQuotes) this.onChangePrecision(55);
      this.goodForm?.get('11')?.setValue(this.filledFields?.finance.toString()); //источник финансирования
      this.goodForm
        ?.get('53')
        ?.setValue(this.filledFields?.priceAdjustment.toString()); //тип поправки
      this.onChangePrecision(4); //точность currency
    }

    this.modelFieldsGroup = this.modal.reduce(function (r, a) {
      //сгруппированы поля по blockId
      r[a.interfaceField.blockId] = r[a.interfaceField.blockId] || [];
      r[a.interfaceField.blockId].push(a);
      return r;
    }, {});

    this.modelFieldsGroup = Object.entries(this.modelFieldsGroup); //возвращает массив объектов
    this.createVolumesArray();
  }

  zeroComparison = () => 0;

  addCondSearch(fields) {
    //проверка на поле Дополнительные условия
    let index = fields.findIndex(
      (el) =>
        el.interfaceField.controlFieldType == 'dxTextBox' &&
        el.interfaceField.fieldSize > 1000
    );
    if (index != -1) this.modal.push(this.modal.splice(index, 1)[0]);
  }

  fieldValue(fieldId) {
    this.goodInfo.fields.forEach((block) => {
      for (let i = 0; i < block[1].length; i++) {
        if (block[1][i].interfaceField.fieldId == fieldId) {
          //если корректируемая цена - то переменная boolean, иначе: поле имеет тип dxSelectBox - string, остальные просто цифры
          this.goodForm.controls[fieldId]?.patchValue(
            this.goodInfo.idOfferGood
              ? block[1][i].interfaceField.fieldId == 47
                ? block[1][i].selectedValues?.toLowerCase?.() === 'true'
                : block[1][i].interfaceField.controlFieldType ==
                    'dxSelectBox' &&
                  !block[1][i].interfaceField.isAvailableMultiSelection
                ? block[1][i].selectedValues?.toString()
                : block[1][i].selectedValues
              : block[1][i].selectedValues
          );
        }
        //&& fieldId!= 12
      }
    });
    if (
      this.goodForm?.get('53')?.value &&
      this.modelsResult?.pricingTypeId != pricingType?.price
    ) {
      this.changeCurrency();
    }
    /*  if(this.modelsResult?.pricingTypeId != pricingType?.formulaWithoutQuotation && (fieldId == 1 || fieldId == 3 || fieldId == 5))
        this.vatCalculator()*/
  }

  clearValueNull(e) {
    if (e.value === '') {
      e.component.option('value', null);
    }
  }

  openSidebar(i: any) {
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('dark').className = 'dark_opened';
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
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
              m.interfaceField.fieldId === ID_INTERFACE_FIELD.OKRB007
                ? this.good.idGoodName
                : null
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
              this.modelsResult.sectionId
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
    }
    if ([4, 55, 53].includes(m.interfaceField.fieldId))
      this.onChangePrecision(m.interfaceField.fieldId);
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
    this.goodForm.get(fieldId.toString()).patchValue(event.addedItems[0].name);
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

  OnClose() {
    let resultArray = { modal: null, volumes: null };
    this.saveItem.emit(resultArray);
  }

  clearForm() {
    this.goodForm.reset();
    this.checkboxId.every((el) => this.goodForm.controls[el].patchValue(false)); //в чекбоксах выставляется false чтобы не было квадратика внутри
  }

  volumes: any;
  volumeForm: any = this.formBuilder.group({});
  isHiddenNotification: boolean = false;

  openVolumePopup() {
    // this.createVolumesArray();
    this.volumesPopup = true;
  }

  onRowPrepared(e: any) {
    //дизэблим строку
    if (e.rowType === 'data') {
      if (!e.key.isValid) e.rowElement.classList.add('redBack');
    }
  }

  toBasic: boolean = false;
  toIncrease: boolean;

  createVolumesArray(type?) {
    if (type != 'toBasic') {
      this.volumes = this.goodsList.map((item) => ({
        //создаем массив для работы с таблицей контроля объемов
        goodId: item.id,
        demandOfferGoodId: item.idDemandOfferGood,
        goodName: item.name,
        isMainBasic: item.isMainBaseGood,
        isBasic: item.isBaseGood,
        volume: item.volume,
        basicVolume: item.basicArchiveVolume,
        unitName: item.units.name,
        volumePrecision: 4,
      }));

      this.toBasic = false;
    }

    this.volumes.forEach((v) => {
      //значения в таблицу рассчитываем по формуле из ТЗ

      if (type == 'toBasic') {
        if (v.isMainBasic) {
          //сбрасываем главный базовый
          this.toBasic = true;
          v.isMainBasic = false;
        }
        v.volume = v.basicVolume; //сбрасываем кол-во до первоначального
      }

      if (!this.hasMainBasic() || type == 'toBasic') {
        v.minVolume = v.isBasic ? 0.0001 : v.basicVolume;
        v.maxVolume = v.isBasic ? v.basicVolume * 3 : v.basicVolume;
      } else {
        let basicVolumeOfMain = this.volumes.find((item) => item.isMainBasic); // главный базовый товар

        if (basicVolumeOfMain.basicVolume < basicVolumeOfMain.volume) {
          //смотрим уменьшали мы или увеличивали главный базовый
          this.toIncrease = true;
        }

        if (v.isBasic && v.isMainBasic) {
          //главный базовый
          v.minVolume = 0.0001;
          v.maxVolume = v.basicVolume * 3;
        }

        if (v.isBasic && !v.isMainBasic) {
          // базовый
          v.minVolume = parseFloat((v.volume * (1 - 0.1)).toFixed(4));
          v.maxVolume = parseFloat((v.volume * (1 + 0.1)).toFixed(4));
        }

        if (!v.isBasic && !v.isMainBasic) {
          //иной
          v.minVolume = this.toIncrease ? v.basicVolume : v.volume;
          v.maxVolume = this.toIncrease ? null : v.basicVolume;
        }

        /*  v.minVolume = v.isBasic && !v.isMainBasic ? parseFloat((v.volume * (1 - 0.1)).toFixed(4)) : v.isBasic && v.isMainBasic ? 0.0001 : v.basicVolume
         v.maxVolume = v.isBasic && !v.isMainBasic ? parseFloat((v.volume * (1 + 0.1)).toFixed(4)) : v.isBasic && v.isMainBasic ? v.basicVolume * 3 : v.basicVolume  */
      }

      v.isValid =
        v.volume >= v.minVolume &&
        (v.maxVolume ? v.volume <= v.maxVolume : true);

      this.volumeForm.addControl(
        'volume_' + v.goodId.toString(),
        this.formBuilder.control(null, Validators.required)
      );
      this.volumeForm.controls['volume_' + v.goodId.toString()].patchValue(
        type == 'toBasic' ? v.basicVolume : v.volume
      );

      this.volumeForm.addControl(
        'minVolume_' + v.goodId.toString(),
        this.formBuilder.control(null, Validators.required)
      );
      this.volumeForm.controls['minVolume_' + v.goodId.toString()].patchValue(
        v.minVolume
      );

      this.volumeForm.addControl(
        'maxVolume_' + v.goodId.toString(),
        this.formBuilder.control(null, Validators.required)
      );
      this.volumeForm.controls['maxVolume_' + v.goodId.toString()].patchValue(
        v.maxVolume
      );
    });

    if (this.toBasic) {
      this.toBasic = false;
    }
  }

  hasMainBasic() {
    return this.volumes.some((item) => item.isMainBasic); //смотрим есть ли у нас главный базовый товар
  }

  hasError() {
    return this.volumes.some((item) => !item.isValid);
  }

  changeMainBasicGood(e, goodId) {
    let good = this.volumes.find((item) => item.goodId == goodId); //проверяю товар который я хочу поменять

    if (good.isMainBasic) {
      //если он ГЛАВНЫЙ БАЗОВЫЙ -> сразу делаем пересчет других
      this.calcGoodsVolume(e.value, good);
    } else {
      //если он НЕ ГЛАВНЫЙ БАЗОВЫЙ -> смотрим есть ли главный в массиве
      if (!this.hasMainBasic()) {
        this.volumes = this.volumes.map(
          (
            item //делаем первый отредактированный товар главным базовым
          ) => (item.goodId === goodId ? { ...item, isMainBasic: true } : item)
        );
        let mainBasicGood = this.volumes.find((item) => item.isMainBasic); // главный базовый товар
        this.calcGoodsVolume(e.value, mainBasicGood);
      } else {//проверка взодит ли кол-во товара в диапазон
        this.volumes = this.volumes.map((item) => {
          if (item.goodId == goodId) {
            this.volumeForm.controls['volume_' + item.goodId.toString()].patchValue(e.value);
            return {
              ...item,
              volume: e.value,
              isValid: e.value >= item.minVolume &&
                       (item.maxVolume ? e.value <= item.maxVolume : true)
            };
          }
          return item;
        });

      }
    }
  }

  calcGoodsVolume(value, mainBasicGood) {
    this.volumes = this.volumes.map((item) => {
      const newItem = { ...item };

      //рассчитываем объемы базовых и иных товаров
      if (newItem.goodId !== mainBasicGood.goodId) {
        const calculatedVolume = (value * newItem.basicVolume) / mainBasicGood.basicVolume;
        newItem.volume = Number(calculatedVolume.toFixed(4));
      } else {
        newItem.volume = value;
      }

     //рассчитываем min для базового товара по формуле, для иного смотрим уменьшаем мы или увеличиваем объем Гл.Баз. (похожая логика для max)
      if (newItem.isBasic) {
        newItem.minVolume = Number((newItem.volume * 0.9).toFixed(4));
        //Объем базового товара не может превышать трехкратный исходный объем данного товара из архивной заявки
        //поэтому считаем либо по формуле с parseFloat((item.volume * (1 + 0.1)).toFixed(4)) либо просто исходный объем *3
        const firstWay = Number((newItem.volume * 1.1).toFixed(4));
        const secondWay = newItem.basicVolume * 3;
        newItem.maxVolume = Math.min(firstWay, secondWay);
      } else {
        // Логика для иных товаров
        newItem.minVolume = value > mainBasicGood.basicVolume
          ? newItem.basicVolume
          : newItem.volume;

        newItem.maxVolume = value > mainBasicGood.basicVolume
          ? null
          : newItem.basicVolume;
      }

      //проверка входит ли кол-во товара в диапазон
      newItem.isValid = newItem.volume >= (newItem.minVolume || 0) &&
        (!newItem.maxVolume || newItem.volume <= newItem.maxVolume);

      const id = newItem.goodId.toString();
      if (this.volumeForm.controls['volume_' + id]) {
        this.volumeForm.patchValue({
          ['volume_' + id]: newItem.volume,
          ['minVolume_' + id]: newItem.minVolume,
          ['maxVolume_' + id]: newItem.maxVolume
        }, { emitEvent: false });
      }

      return newItem;
    });
  }

  volumesToResList = []

  saveVolumePopup() {
    this.volumes.forEach(item => {
      const id = item.goodId.toString();
      const volumeFromForm = this.volumeForm.get('volume_' + id)?.value;

      item.volume = volumeFromForm;
      item.minVolume = this.volumeForm.get('minVolume_' + id)?.value;
      item.maxVolume = this.volumeForm.get('maxVolume_' + id)?.value;
    });

    this.goodForm.controls[(ID_INTERFACE_FIELD.QUANTITY).toString()]?.patchValue(
      this.volumeForm.controls['volume_' + this.goodInfo.id].value
    ); //меняем только кол-во

    this.goodsList.forEach((el) => {
      let findedGood = this.volumes.find((v) => v.goodId == el.id);
      el.isMainBaseGood = findedGood.isMainBasic;
    });

    this.volumesToResList = JSON.parse(JSON.stringify(this.volumes))
    this.volumesPopup = false;
  }

  closeVolumePopup() {
   // if (this.hasError()) {
      //сбрасываем всегда, сохранять кол-во не нужно
      this.volumes.forEach((v) => {
        /*   this.volumeForm.removeControl('volume_' + v.goodId.toString(), this.formBuilder.control(null, Validators.required));
          this.volumeForm.removeControl('minVolume_' + v.goodId.toString(), this.formBuilder.control(null, Validators.required));
          this.volumeForm.removeControl('maxVolume_' + v.goodId.toString(), this.formBuilder.control(null, Validators.required)); */
        v.volume = v.basicVolume;
      });
  //  }

    this.volumesPopup = false;
  }

  priceLimitationName: string;
  priceAgriStatistics: number;
  priceLimitationPopup: boolean = false;
  priceWarning: boolean = false;
  lessDestination: boolean = false;
  errorState: number;
  toastVisible: boolean = false;

  onTagBoxValueChanged(e) {
    if (Array.isArray(e.value) && e.value.length > 1) {
      e.component.option('value', [e.value[e.value.length - 1]]);
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

  checkPrice() {
    let IdCnfea = this.goodForm?.get('63')?.value;
    let IdDestination = this.goodForm?.get('62')?.value || null;

    if (IdDestination?.length == 1) {
      this.createOfferService
        .GetArchiveStatisticsPriceLimit(
          this.user?.token,
          this.modelsResult.sectionId,
          this.offerInfo.idSession,
          this.idArchiveOffer ? this.idArchiveOffer : this.offerInfo.idOffer,
          this.idPaymentType,
          this.goodInfo.currency.id,
          this.goodInfo.id,
          this.goodInfo.units.id,
          this.deliveryCond?.idBasisValue,
          this.deliveryCond?.idPlaceLink,
          IdCnfea,
          IdDestination
        )
        .then((res: any) => {
          this.priceAgriStatistics = res.priceWithoutVat;
          this.priceLimitationName = res.priceLimitationName;

          if (this.priceAgriStatistics != null) {
            //если цена пришла смотрим и сравниваем с нашими
            if (this.priceAgriStatistics > this.goodForm?.get('3')?.value) {
              //где-то неверная цена - предупреждаем
              this.priceWarning = true;
              this.priceLimitationPopup = true;
              this.errorState = 0;
              this.messageError = `Цена без НДС не соответствует ценовому контролю. Минимально допустимая цена: ${this.priceLimitationName} ${this.priceAgriStatistics} ${this.goodsList[0].currency.name}/${this.goodsList[0].units.name}`;
            } else {
              this.priceWarning = false;
              this.toastVisible = true;
            }
          } else {
            //если цена null сразу тотальная ошибка
            this.priceLimitationPopup = true;
            this.errorState = 1;
            this.messageError =
              this.translate.store.currentLang == 'RU'
                ? RU['directOffers'].noLimitationMess
                : EN['directOffers'].noLimitationMess;
          }
        });
    } else {
      this.lessDestination = true;
    }
  }

  onSave(e) {
    let result = e.validationGroup.validate();
    let IdDestination = this.goodForm?.get('62')?.value || null;

    if (IdDestination?.length > 1) {
      this.error = true;
      this.messageError =
        this.translate.store.currentLang == 'RU'
          ? RU['directOffers'].destinationError
          : EN['directOffers'].destinationError;
      return;
    }

    if (result.isValid) {
      if (
        this.modelsResult.pricingTypeId !=
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

      this.modal.forEach((item) => {
        for (let nameControl of Object.keys(this.goodForm.controls)) {
          if (item.interfaceField.fieldId == nameControl) {
            item.selectedValues = this.goodForm.get(nameControl).value;
          }
        }
      });

      if (
        this.modelsResult.pricingTypeId !=
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

      let resultArray = { modal: this.modal, volumes: this.volumesToResList?.length > 0 ? this.volumesToResList : this.volumes };

      this.saveItem.emit(resultArray);
    }
  }
}
