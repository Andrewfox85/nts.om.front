/* eslint-disable */
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { actualDimensionsType } from "../create-offer/enums";
import { ID_INTERFACE_FIELD } from "../../shared/enums";
import { User } from "../../core/classes/user";
import { TranslateService } from "@ngx-translate/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import {
  ACTUAL_SIZE_FIELDS,
  COMPLEX_LOT_PRODUCT_TYPE_ID,
  COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES,
  getComparisons,
  IdDirection
} from "../../api.constants";
import { AppConfigService } from "../../app-config.service";
import { CreateOfferService, IFieldProperty } from "../../core/services/create-offer-service.service";
import { CommonService } from "../../core/services/common-service.service";
import { ValueChangedEvent } from "devextreme/ui/select_box";
import { IServiceError } from "../../core/interfaces/interface";
import { ErrorServiceService } from "../../core/services/error-service.service";
import { Subject,
  takeUntil } from "rxjs";

@Component({
  selector: 'app-actual-dimensions',
  templateUrl: './actual-dimensions.component.html',
  styleUrls: ['./actual-dimensions.component.scss'],
})
export class ActualDimensionsComponent implements OnInit, OnDestroy {
  @Input() interfaceField;
  @Input() user: User;
  @Input() goodForm: FormGroup;
  @Input() good;
  @Input() demandsModal;
  @Input() filledFields;
  @Input() goodsList;
  @Input() goodInfo;
  @Input() direction;
  @Input() standartdizeProps;
  @Input() readinessDataSource;

  public readonly actualDimensionsType = actualDimensionsType;
  private readonly errorServiceService = inject(ErrorServiceService);

  //ограничение для фактических размеров
  goodGroupArray: number[] = [];
  goodsArray: number[] = [];
  readyId: number[] = [];
  notReadyId: number[] = [];
  idGoodsForRangeWidth: number[] = [];
  idGoodsForString: number[] = [];
  idGoodsForRangeThickness: number[] = [];
  private destroy$ = new Subject<void>();

  props: IFieldProperty[];

  public fixedPointWorker: number = 4;
  public basicFixedPointTraderDiameterThickness: number = 0;
  public basicFixedPointTraderWidth: number = 1;
  public basicFixedPointTraderLength: number = 2;

  public fixedPointTraderDiameterThickness: number;
  public fixedPointTraderWidth: number;
  public fixedPointTraderLength: number;


  constructor(
    public translate: TranslateService,
    private conf: AppConfigService,
    public createOfferService: CreateOfferService,
    public commonService: CommonService,
  ) {
  }

  ngOnInit(): void {
    this.goodGroupArray = this.conf.idGoodGroup;
    this.goodsArray = this.conf.idGoods;
    this.readyId = this.conf.readyId;
    this.notReadyId = this.conf.notReadyId;
    this.idGoodsForRangeWidth = this.conf.idGoodsForRangeWidth;
    this.idGoodsForRangeThickness = this.conf.idGoodsForRangeThickness;
    this.idGoodsForString = this.conf.idGoodsForString;

    this.props = this.standartdizeOption(this.interfaceField.interfaceField.fieldId);
    this.getFixedPointTrader();

    this.createOfferService.standartdizeProps$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: IFieldProperty[]) => {
        this.standartdizeProps = data;
        this.props = this.standartdizeOption(this.interfaceField.interfaceField.fieldId);
        this.getFixedPointTrader();
      });
  }

  public getFixedPointTrader(): void {
    if (this.user?.IsWorker)
      return;

    const fieldMapping: { [key in ID_INTERFACE_FIELD]?: string } = {
      [ID_INTERFACE_FIELD.ACTUAL_DIAMETER]: 'fixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_THICKNESS]: 'fixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_WIDTH]: 'fixedPointTraderWidth',
      [ID_INTERFACE_FIELD.ACTUAL_LENGTH]: 'fixedPointTraderLength'
    };

    const propertyName: string = fieldMapping[this.interfaceField.interfaceField.fieldId];

    const basicFieldMapping: { [key in ID_INTERFACE_FIELD]?: string } = {
      [ID_INTERFACE_FIELD.ACTUAL_DIAMETER]: 'basicFixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_THICKNESS]: 'basicFixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_WIDTH]: 'basicFixedPointTraderWidth',
      [ID_INTERFACE_FIELD.ACTUAL_LENGTH]: 'basicFixedPointTraderLength'
    };

    const basicPropertyName: string = basicFieldMapping[this.interfaceField.interfaceField.fieldId];

    if ([actualDimensionsType.TRANGE.toString(), actualDimensionsType.TINTEGER.toString()].includes(this.props[0]?.dataType)) {
      const countDecimals = (value: number): number => {
        if (Math.floor(value) === value) return 0; // Для целых чисел
        return value.toString().split(".")[1].length || 0;
      };

      let leftFixedPoint: number = 0, rightFixedPoint: number = 0;
      if (this.props[0]?.rangeLeftBound) {
        leftFixedPoint = countDecimals(this.props[0].rangeLeftBound);
      }
      if (this.props[0]?.rangeRightBound) {
        rightFixedPoint = countDecimals(this.props[0].rangeRightBound);
      }
      this[propertyName] = Math.max(...[leftFixedPoint, rightFixedPoint, this[basicPropertyName]]);
    } else {
      this[propertyName] = this[basicPropertyName];
    }
  }

  public getFixedPointValue(): number {
    const fieldMapping: { [key in ID_INTERFACE_FIELD]?: string } = {
      [ID_INTERFACE_FIELD.ACTUAL_DIAMETER]: 'fixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_THICKNESS]: 'fixedPointTraderDiameterThickness',
      [ID_INTERFACE_FIELD.ACTUAL_WIDTH]: 'fixedPointTraderWidth',
      [ID_INTERFACE_FIELD.ACTUAL_LENGTH]: 'fixedPointTraderLength'
    };

    const fixedPointName: string = fieldMapping[this.interfaceField.interfaceField.fieldId];
    return this[fixedPointName];
  }

  public getPlaceHolder(fieldId: number): string {
    const fixedPoint: number = this.user?.IsWorker ? this.fixedPointWorker : this.getFixedPointValue();
    let placeholderValue: string =
      `0${fixedPoint > 0 ? `,${'0'.repeat(fixedPoint)}` : ''}`;
    return this.goodForm.controls['type' + fieldId.toString()]?.value ==
    actualDimensionsType.TINTEGER
      ? placeholderValue
      : this.goodForm.controls['type' + fieldId.toString()]?.value ==
      actualDimensionsType.TRANGE
        ? placeholderValue + '-' + placeholderValue
        : this.translate.instant('general.text');
  }

  public isDisabledActualSize(idField: number): boolean {
    const PRODUCT_READINESS = ID_INTERFACE_FIELD.PRODUCT_READINESS.toString()
    return (
      (this.isProductDependOnReadiness() &&
        Object.keys(this.goodForm.value).includes(PRODUCT_READINESS) &&
        !this.goodForm.controls[PRODUCT_READINESS]?.value) ||
      this.hasTheSameValueAsFirstGood(idField)
    );
  }

  public hasTheSameValueAsFirstGood(idField: number): boolean {
    let disable =
      (this.demandsModal.complexLotProductTypes?.length === 1 &&
        this.demandsModal.complexLotProductTypes.find(
          (el) => el.typeId === COMPLEX_LOT_PRODUCT_TYPE_ID &&
            el.referenceIds?.length === 1 &&
            el.referenceIds[0] === COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES
        ) &&
        this.filledFields) ||
      false;
    if (disable) {
      this.goodsList[0].fields.forEach((block) => {
        for (let i = 0; i < block[1].length; i++) {
          if (block[1][i].interfaceField.fieldId == idField) {
            if (ACTUAL_SIZE_FIELDS.includes(idField)) {
              this.goodForm.controls['type' + idField]?.patchValue(
                block[1][i].selectedValues
                  ? this.commonService
                    .actualDimensions(block[1][i].selectedValues, 1)
                    .toString()
                  : null
              );
              this.goodForm.controls[idField.toString()]?.patchValue(
                block[1][i].selectedValues
                  ? this.commonService.actualDimensions(
                    block[1][i].selectedValues,
                    0
                  )
                  : null
              );
            }
          }
        }
      });
    }
    return disable;
  }


  public isVisibleTString(props: IFieldProperty[], fieldId: number, isValid?: boolean): boolean {
    const conditionToDisplayString =
      ((this.goodGroupArray.includes(this.good.idGoodGroup) ||
          this.idGoodsForString.includes(this.good.idGoodName)) &&
        this.notReadyId.includes(
          Number(this.goodForm.controls['21']?.value)
        )) ||
      (this.goodsArray.includes(this.good.idGoodName) &&
        fieldId == ID_INTERFACE_FIELD.ACTUAL_DIAMETER) ||
      (this.idGoodsForRangeThickness.includes(this.good.idGoodName) &&
        (fieldId == ID_INTERFACE_FIELD.ACTUAL_WIDTH ||
          fieldId == ID_INTERFACE_FIELD.ACTUAL_THICKNESS) &&
        this.readyId.includes(Number(this.goodForm.controls['21']?.value))) ||
      !(
        this.goodsArray.includes(this.good.idGoodName) ||
        this.goodGroupArray.includes(this.good.idGoodGroup)
      ) ||
      !Object.keys(this.goodForm.value).includes(ID_INTERFACE_FIELD.PRODUCT_READINESS.toString());
    return this.user?.IsWorker
      ? true
      : props?.length == 0 || isValid
        ? conditionToDisplayString
        : props[0].isStringDataTypeApplicable && conditionToDisplayString;
  }

  public isVisibleTRange(fieldId: number, props: IFieldProperty[]): boolean {
    return (
      (this.goodsArray.includes(this.good.idGoodName) &&
        this.notReadyId.includes(
          Number(this.goodForm.controls['21']?.value)
        )) ||
      (this.goodsArray.includes(this.good.idGoodName) &&
        fieldId == ID_INTERFACE_FIELD.ACTUAL_DIAMETER) ||
      (((this.idGoodsForRangeWidth.includes(this.good.idGoodName) &&
            fieldId == ID_INTERFACE_FIELD.ACTUAL_WIDTH) ||
          (this.idGoodsForRangeThickness.includes(this.good.idGoodName) &&
            fieldId == ID_INTERFACE_FIELD.ACTUAL_THICKNESS)) &&
        this.readyId.includes(Number(this.goodForm.controls['21']?.value))) ||
      !(
        this.goodsArray.includes(this.good.idGoodName) ||
        this.goodGroupArray.includes(this.good.idGoodGroup)
      ) ||
      !Object.keys(this.goodForm.value).includes('21') ||
      (!(
          this.goodsArray.includes(this.good.idGoodName) ||
          this.goodGroupArray.includes(this.good.idGoodGroup)
        ) &&
        props?.length == 0)
    );
  }

  public isVisibleTInteger(fieldId: number, props: IFieldProperty[]): boolean {
    const goodsArrayWithoutRange = this.goodsArray.filter(
      (el) =>
        !this.idGoodsForRangeWidth.includes(el) &&
        !this.idGoodsForString.includes(el)
    );
    const goodsArrayForDiameter = this.goodsArray.filter(
      (el) => !this.idGoodsForString.includes(el)
    );
    const goodsArrayForNotWidth = this.idGoodsForRangeWidth.filter(
      (el) => !this.idGoodsForString.includes(el)
    );

    return (
      ((this.goodGroupArray.includes(this.good.idGoodGroup) ||
          this.idGoodsForString.includes(this.good.idGoodName)) &&
        this.readyId.includes(Number(this.goodForm.controls['21']?.value))) ||
      (this.idGoodsForRangeThickness.includes(this.good.idGoodName) &&
        (fieldId == ID_INTERFACE_FIELD.ACTUAL_WIDTH ||
          fieldId == ID_INTERFACE_FIELD.ACTUAL_THICKNESS) &&
        this.notReadyId.includes(
          Number(this.goodForm.controls['21']?.value)
        )) ||
      (goodsArrayWithoutRange.includes(this.good.idGoodName) &&
        this.readyId.includes(Number(this.goodForm.controls['21']?.value))) ||
      (goodsArrayForDiameter.includes(this.good.idGoodName) &&
        fieldId == ID_INTERFACE_FIELD.ACTUAL_DIAMETER) ||
      (goodsArrayForNotWidth.includes(this.good.idGoodName) &&
        fieldId != ID_INTERFACE_FIELD.ACTUAL_WIDTH &&
        this.readyId.includes(Number(this.goodForm.controls['21']?.value))) ||
      !(
        this.goodsArray.includes(this.good.idGoodName) ||
        this.goodGroupArray.includes(this.good.idGoodGroup)
      ) ||
      !Object.keys(this.goodForm.value).includes('21') ||
      (!(
          this.goodsArray.includes(this.good.idGoodName) ||
          this.goodGroupArray.includes(this.good.idGoodGroup)
        ) &&
        props?.length == 0)
    );
  }

  public standartdizeOption(idField: number): IFieldProperty[] {
    let filterProps = [];
    const COMPARISONS = getComparisons(this.conf.refIdActualDimensions);
    let refIds = COMPARISONS.filter((el) => el.idField == idField);
    refIds.forEach((refId) => {
      let array = this.standartdizeProps?.filter(
        (el) => el.referenceId == refId.refId
      );
      if (array?.length > 0) {
        array.every((el) => {
          el.placeholder = el.referenceValue.replaceAll(
            '%' + el.dataType + '%',
            ''
          );
          filterProps.push(el);
        });
      }
    });
    return filterProps;
  }

  public initField(filterProps: IFieldProperty[], idField: number): void {
    if (filterProps?.length == 1) {
      let nameField = 'type' + idField.toString();
      if (filterProps[0].dataType !== actualDimensionsType.TRANGE
        && !this.goodForm.controls[idField.toString()]?.value) {
        this.goodForm.controls[nameField].patchValue(filterProps[0].dataType);
        this.goodForm.controls[idField.toString()].patchValue(
          filterProps[0].placeholder
        );
      }
      if (!this.goodForm.controls[nameField]?.value)
        this.goodForm.controls[idField.toString()].patchValue(
          filterProps[0].placeholder
        );
    }
  }

  public isProductDependOnReadiness(): boolean {
    return this.goodsArray.includes(this.good.idGoodName) ||
      this.goodGroupArray.includes(this.good.idGoodGroup);
  }

  public onDataSourceChange(fieldId: number, e): void {
    if (this.goodForm.controls[ID_INTERFACE_FIELD.PRODUCT_READINESS]?.value &&
      this.isProductDependOnReadiness()
    ) {
      const firstVisibleItem = e.find((item: any) => item.visible);
      if (firstVisibleItem) {
        this.goodForm.controls['type' + fieldId.toString()].patchValue(
          firstVisibleItem.id
        );
      }
    }
  }

  public isViewTypeBox(props: IFieldProperty[]): boolean {
    return this.user?.IsWorker || props?.length === 0 || (props?.length === 1 && props[0].dataType == actualDimensionsType.TRANGE)
  }

  public onKeyPress(props: IFieldProperty[], e: any, fieldId: number): void {
    if (props?.length > 0 && props[0]?.dataType === actualDimensionsType.TRANGE) {
      const key = e.event.key;


      // Разрешаем: цифры, точка, запятая, Backspace, Delete, Tab, стрелки
      const allowedKeys = [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '.',
        ',',
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ];

      // Добавляем '-' в разрешенные клавиши только для типа TRANGE
      if (this.goodForm.controls['type' + fieldId.toString()]?.value === actualDimensionsType.TRANGE) {
        allowedKeys.push('-');
      }

      if (!allowedKeys.includes(key)) {
        e.event.preventDefault();
        return;
      }

      if (['.', ',', '-'].includes(key)) {
        const input = e.event.target as HTMLInputElement;
        const currentValue = input.value;

        if (this.goodForm.controls['type' + fieldId.toString()]?.value === actualDimensionsType.TRANGE) {
          if (key === '-') {
            if (currentValue?.includes('-')) {
              e.event.preventDefault();
            }
          } else {
            const parts = currentValue.split('-');
            if (parts[0]?.includes('.') && parts[1]?.includes('.')) {
              e.event.preventDefault();
            }
          }
        } else {
          if (currentValue.includes('.')) {
            e.event.preventDefault();
          }
        }
      }
    }
  }

  public validateTextBoxField(fieldId: number, e: ValueChangedEvent, props: IFieldProperty[]): void {
    if (props?.length > 0) {
      const fixedPoint: number = this.user?.IsWorker ? this.fixedPointWorker : this.getFixedPointValue();
      let value = e.value;
      value = value.replace(/,/g, '.'); // Заменяем запятые на точки для унификации
      // Удаляем все символы, кроме цифр и точек
      value = value.replace(/[^\d.]/g, '');
      // Оставляем только первую точку
      const dotCount = value.split('.').length - 1;
      if (dotCount > 1) {
        const firstDotIndex = value.indexOf('.');
        value =
          value.substring(0, firstDotIndex + 1) +
          value.substring(firstDotIndex + 1).replace(/\./g, '');
      }
      // Ограничиваем 4 знака после точки
      if (dotCount > 0) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > fixedPoint) {
          const secondPart: string = fixedPoint > 0 ? ('.' + parts[1].substring(0, fixedPoint)) : '';
          value = parts[0] + secondPart;
        }
      }
      if (props[0].rangeLeftBound && Number(value) <= props[0].rangeLeftBound)
        value = props[0].rangeLeftBound;
      if (props[0].rangeRightBound && Number(value) >= props[0].rangeRightBound)
        value = props[0].rangeRightBound.toString();

      let type: string = '%' + props[0].dataType + '%';
      let pattern: string = type + '.*?' + type;
      let regex: RegExp = new RegExp(pattern, 'g');
      value = props[0].referenceValue.replace(regex, value).replace(/\./g, ',');

      this.goodForm.controls[fieldId].patchValue(value);
    }
  }

  public onValueChangeActualDimensions(event: ValueChangedEvent, props: IFieldProperty[]): void {
    if (this.goodForm.controls['type' + this.interfaceField.interfaceField.fieldId.toString()]?.value != actualDimensionsType.TSTRING) {
      this.validateInput(this.interfaceField.interfaceField.fieldId, event, props);
    } else if (!this.user.IsWorker) {
      this.validateTextBoxField(this.interfaceField.interfaceField.fieldId, event, props);
    }
  }

  public validateInput(fieldId: number, e: ValueChangedEvent, props: IFieldProperty[]): void {
    const fixedPoint: number = this.user?.IsWorker ? this.fixedPointWorker : this.getFixedPointValue();
    let value = e.value;
    if (value && this.goodForm.controls['type' + fieldId.toString()]?.value) {
      const input = e.event?.target as HTMLInputElement;
      const cursorPos = input?.selectionStart;

      value = value.replace(/,/g, '.'); // Заменяем запятые на точки для унификации
      if (
        this.goodForm.controls['type' + fieldId.toString()]?.value ==
        actualDimensionsType.TINTEGER
      ) {
        // Удаляем все символы, кроме цифр и точек
        value = value.replace(/^0+(?=\d)/, '').replace(/[^\d.]/g, '');
        // Оставляем только первую точку
        const dotCount = value.split('.').length - 1;
        if (dotCount > 1) {
          const firstDotIndex = value.indexOf('.');
          value =
            value.substring(0, firstDotIndex + 1) +
            value.substring(firstDotIndex + 1).replace(/\./g, '');
        }
        // Ограничиваем 4 знака после точки
        if (dotCount > 0) {
          const parts = value.split('.');
          if (parts[1] && parts[1].length > fixedPoint) {
            const secondPart: string = fixedPoint > 0 ? ('.' + parts[1].substring(0, fixedPoint)) : '';
            value = parts[0] + secondPart;
          }
        }
        if (props?.length > 0 && !this.user?.IsWorker) {
          // Ограничение диапазона
          if (
            props[0].rangeLeftBound &&
            Number(value) <= props[0].rangeLeftBound
          ) {
            value = props[0].rangeLeftBound.toString();
          } else if (
            props[0].rangeRightBound &&
            Number(value) >= props[0].rangeRightBound
          ) {
            value = props[0].rangeRightBound.toString();
          }
        }
        value = value.replace(/\./g, ',');
      }
      if (
        this.goodForm.controls['type' + fieldId.toString()]?.value ==
        actualDimensionsType.TRANGE
      ) {
        // Разбиваем на два числа
        const parts = value.split('-');
        // Обрабатываем каждую часть
        let processedParts = [];
        for (let i = 0; i < parts.length; i++) {
          // Удаляем все, кроме цифр и точек
          let cleaned = parts[i].replace(/[^\d.]/g, '');
          // Оставляем только первую точку
          const dotIndex = cleaned.indexOf('.');
          if (dotIndex >= 0) {
            cleaned =
              cleaned.substring(0, dotIndex + 1) +
              cleaned.substring(dotIndex + 1).replace(/\./g, '');
          }
          // Ограничиваем 4 знака после точки
          if (dotIndex >= 0) {
            const decimalPart = cleaned.substring(dotIndex + 1);
            if (decimalPart.length > fixedPoint) {
              const fixedPointPart: number = fixedPoint ? (fixedPoint + 1) : 0;
              cleaned = cleaned.substring(0, dotIndex + fixedPointPart);
            }
          }
          processedParts.push(cleaned);
        }

        if (props?.length > 0 && !this.user?.IsWorker) {
          // Ограничение диапазона
          //правая часть
          if (
            props[0].rangeLeftBound &&
            Number(processedParts[0]) < props[0].rangeLeftBound
          )
            processedParts[0] = props[0].rangeLeftBound.toString();
          if (
            props[0].rangeRightBound &&
            Number(processedParts[0]) >= props[0].rangeRightBound
          ) {
            const minValue: number = fixedPoint === 0 ? 1 : Math.pow(0.1, fixedPoint);
            processedParts[0] = (props[0].rangeRightBound - minValue).toString();
          }
          //левая часть
          if (
            props[0].rangeRightBound &&
            Number(processedParts[1]) >= props[0].rangeRightBound
          )
            processedParts[1] = props[0].rangeRightBound.toString();
        }
        processedParts[0] = processedParts[0]?.replace(/^0+(?=\d)/, '')?.replace(/\./g, ',');
        processedParts[1] = processedParts[1]?.replace(/^0+(?=\d)/, '')?.replace(/\./g, ',');

        value = processedParts.join('-'); // Собираем обратно
      }
      // Восстанавливаем позицию курсора
      if (cursorPos)
        setTimeout(() => {
          const diff =
            value.length - this.goodForm.controls[fieldId].value.length;
          input.setSelectionRange(cursorPos + diff, cursorPos + diff);
        });
      this.goodForm.controls[fieldId].patchValue(value);
      this.validateRangeFormat;
    }
  }

  public validateRangeFormat(options: ValueChangedEvent): boolean {
    const value = options.value.replaceAll(/,/g, '.') || '';
    const parts = value.split('-');
    return parts[1] && Number(parts[0]) < Number(parts[1]);
  }

  public validateTwoNumbers(options: ValueChangedEvent): boolean {
    const value = options.value || '';
    const parts = value.split('-');
    return parts.length === 2 && !!parts[0] && !!parts[1];
  }

  public validateNumber(options: ValueChangedEvent): boolean {
    const value = options.value || '';
    const normalized = value.replace(',', '.');
    const num = Number(normalized);
    return !(isNaN(num) || !isFinite(num))
  }

  public validateRangeMultipleFormat(
    multiplicator: number,
    dataType: string,
    fieldId: number,
    options: ValueChangedEvent
  ): boolean {
    const value = options.value.replaceAll(/,/g, '.') || '';
    const parts = value.split('-');
    const fixedPoint: number = this.user?.IsWorker ? this.fixedPointWorker : this.getFixedPointValue();
    const power: number = Math.pow(10, fixedPoint);

    return dataType !== actualDimensionsType.TINTEGER
      ? Math.round(Number(parts[0]) * power) % Math.round(multiplicator * power) === 0 &&
      Math.round(Number(parts[1]) * power) % Math.round(multiplicator * power) === 0
      : Math.round(Number(value) * power) % Math.round(multiplicator * power) === 0;
  }

  get isValidateRangeMultipleFormat(): boolean {
    return !this.user?.IsWorker
      && [actualDimensionsType.TRANGE, actualDimensionsType.TINTEGER].includes(this.goodForm.controls['type' + this.interfaceField.interfaceField.fieldId.toString()]?.value)
      && this.props[0]?.multiplicator && this.goodForm.controls[this.interfaceField.interfaceField.fieldId.toString()]?.value
  }

  get isValidateRange(): boolean {
    return this.goodForm.controls['type' + this.interfaceField.interfaceField.fieldId.toString()]?.value == actualDimensionsType.TRANGE && this.goodForm.controls[this.interfaceField.interfaceField.fieldId.toString()]?.value
  }

  get isValidateNumber(): boolean {
    return this.goodForm.controls['type' + this.interfaceField.interfaceField.fieldId.toString()]?.value == actualDimensionsType.TINTEGER && this.goodForm.controls[this.interfaceField.interfaceField.fieldId.toString()]?.value
  }

  public isDisabledTextBox(props: IFieldProperty[], fieldId: number): boolean {
    return Boolean(!this.user?.IsWorker &&
      ((props?.length == 1 &&
          props[0]?.dataType == actualDimensionsType.TINTEGER) ||
        !this.goodForm.controls['type' + fieldId.toString()]?.value ||
        this.hasTheSameValueAsFirstGood(fieldId) ||
        (this.goodForm.controls['type' + fieldId.toString()]?.value ==
          actualDimensionsType.TSTRING &&
          (props[0]?.multiplicator ||
            (props[0]?.referenceValue &&
              !props[0]?.referenceValue.includes('%' + props[0].dataType + '%')))))
    );
  }

  public clearField(fieldId?: number, prop?: IFieldProperty[]): void {
    if (fieldId) {
      if (
        prop?.length == 1 &&
        (this.goodForm.get('type' + fieldId.toString())?.value ===
          actualDimensionsType.TSTRING ||
          (this.goodForm.get('type' + fieldId.toString())?.value === actualDimensionsType.TRANGE
            && prop[0]?.rangeLeftBound
            && prop[0]?.rangeRightBound
            && !prop[0]?.isStringDataTypeApplicable))
      ) {
        this.goodForm.get(fieldId.toString()).patchValue(prop[0].placeholder);
      } else {
        this.goodForm.get(fieldId.toString()).reset(null);
      }
    } else {
      if (!this.user?.IsWorker &&
        (this.goodGroupArray.includes(this.good.idGoodGroup) ||
          this.goodsArray.includes(this.good.idGoodName))
      )
        Object.keys(this.goodForm.value).forEach((key) => {
          if (key.includes('type')) {
            let idField = Number(key.replace('type', ''));
            let props = this.standartdizeOption(idField);
            if (
              (props?.length == 1 &&
                props[0]?.dataType == actualDimensionsType.TRANGE) ||
              props?.length == 0
            ) {
              if (
                !this.goodForm.get(
                  ID_INTERFACE_FIELD.PRODUCT_READINESS.toString()
                )?.value
              ) {
                this.goodForm.get(key).reset(null);
              } else {
                const idValue = this.isVisibleTString(props, idField)
                  ? actualDimensionsType.TSTRING
                  : actualDimensionsType.TRANGE;
                this.goodForm.get(key).patchValue(idValue);
              }
            } else this.isValidateTypeWithReadiness(props, idField)
          }
        });
    }
  }

  public isValidateTypeWithReadiness(props: IFieldProperty[], idField: number): boolean {
    if (
      (!this.goodGroupArray.includes(this.good.idGoodGroup) &&
        !this.goodsArray.includes(this.good.idGoodName))
      || this.user?.IsWorker
    ) {
      return true;
    }
    if (props?.length !== 1 || props[0]?.dataType === actualDimensionsType.TRANGE) {
      return true;
    }

    if (
      !this.goodForm.get(ID_INTERFACE_FIELD.PRODUCT_READINESS.toString())?.value
    ) {
      return true;
    }

    let isValid = false;
    switch (props[0]?.dataType) {
      case actualDimensionsType.TINTEGER:
        isValid = this.isVisibleTInteger(idField, props)
        break;
      case actualDimensionsType.TSTRING:
        isValid = this.isVisibleTString(props, idField, true)
        break;
      case actualDimensionsType.TRANGE:
        isValid = this.isVisibleTRange(idField, props)
        break;
    }
    if (!isValid) {
      const error: IServiceError = {
        error: true,
        errorStatus: 500,
        messageError: this.translate.instant(
          'createOffer.goodInfo.noValidReadiness',
          {
            readiness: this.readinessDataSource.find(el => el.id === this.goodForm.get(
              ID_INTERFACE_FIELD.PRODUCT_READINESS.toString()
            )?.value)?.name
          }
        )
      };
      this.errorServiceService.callErrorPopup(error);
      return isValid;
    }
    return isValid;
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
