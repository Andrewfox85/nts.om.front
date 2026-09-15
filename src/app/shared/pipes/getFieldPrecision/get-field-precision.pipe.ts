import { Pipe, PipeTransform } from '@angular/core';
import { specialPriceFields } from "../../enums";
import { GoodsSpecifications } from "../../../core/interfaces/interface";

@Pipe({
  name: 'getFieldPrecision'
})
export class GetFieldPrecisionPipe implements PipeTransform {
  transform(field: GoodsSpecifications, currencyPrecision: number): number {
    if (!field) return currencyPrecision;
    return specialPriceFields.includes(field.idInterfaceField)
      ? currencyPrecision
      : field.fieldPrecision;
  }
}
