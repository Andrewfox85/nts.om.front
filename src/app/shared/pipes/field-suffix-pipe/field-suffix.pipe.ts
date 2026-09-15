import { Pipe, PipeTransform } from '@angular/core';
import { ID_INTERFACE_FIELD } from './../../enums/index';
import { GoodsSpecifications, OfferGood } from './../../../core/interfaces/interface';

@Pipe({
  name: 'fieldSuffix'
})
export class FieldSuffixPipe implements PipeTransform {
  public transform(field: GoodsSpecifications, good: OfferGood): string {
    if (!good || !field) {
      return '';
    }

    if (field.idInterfaceField === ID_INTERFACE_FIELD.QUANTITY) {
      return good.unitName || '';
    }
    if (field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT) {
      return good.currency || '';
    }
    if (field.idInterfaceField === ID_INTERFACE_FIELD.QUOTATION) {
      return good.quoteCurrency || '';
    }
    if (field.idInterfaceField === ID_INTERFACE_FIELD.AMENDMENT) {
      return good.priceAdjustment === 1 ? '%' : good.currency || '';
    }

    const isCurrency: boolean =
      Boolean(field.costWithoutVAT) ||
      Boolean(field.amountVAT) ||
      field.amountVAT === 0 ||
      Boolean(field.costVAT);

    return isCurrency ? good.currency : '';
  }
}
