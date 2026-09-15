import { Pipe, PipeTransform } from '@angular/core';
import { RuNumberFormatPipe } from './../ru-number-format/ru-number-format.pipe';
import { TranslateService } from '@ngx-translate/core';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import {
  ID_INTERFACE_FIELD,
  specialPriceFields
} from './../../enums/index';
import { GoodsSpecifications } from './../../../core/interfaces/interface';

@Pipe({
  name: 'fieldValueDisplay'
})
export class FieldValueDisplayPipe implements PipeTransform {
  constructor(
    private ruNumberFormat: RuNumberFormatPipe,
    private translate: TranslateService
  ) {}

  public transform(field: GoodsSpecifications, currencyPrecision: number): string {
    if (!field || field.fieldValue === null) {
      return '';
    }

    if (field.controlFieldType === 'dxCheckBox') {
      return field.fieldValue.toString() === 'true'
        ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'btns.yes')
        : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'btns.no');
    }

    if (
      field.controlFieldType === 'dxSelectBox' ||
      (field.controlFieldType !== 'dxNumberBox' && !this.isCurrencyField(field))
    ) {
      return field.fieldValue || '';
    }

    const precision: number = this.getPrecision(field, currencyPrecision);

    return this.ruNumberFormat.transform(field.fieldValue, precision, precision);
  }

  private isCurrencyField(field: GoodsSpecifications): boolean {
    return !!(
      field.costWithoutVAT ||
      field.amountVAT ||
      field.amountVAT === 0 ||
      field.costVAT ||
      field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT
    );
  }

  private getPrecision(field: GoodsSpecifications, currencyPrecision: number): number {
    if (field.idInterfaceField === ID_INTERFACE_FIELD.QUANTITY) {
      return 0;
    }
    if (this.isCurrencyField(field) || specialPriceFields.includes(field.idInterfaceField)) {
      return currencyPrecision;
    }
    return field.fieldPrecision;
  }
}
