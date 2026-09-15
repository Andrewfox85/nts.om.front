/* eslint-disable */
import { Input, Directive, ElementRef, OnChanges } from '@angular/core';
import { GoodsSpecifications } from './../interfaces/interface';
import {
  pricingType,
  ACTUAL_SIZE_READINESS_FIELDS,
  DisplaySpecMode
} from 'src/app/api.constants';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';



@Directive({
  selector: '[display-specs]',
})
export class DisplaySpecsDirective implements OnChanges {
  @Input('pricingTypeId') pricingTypeId: number;
  @Input('field') field: GoodsSpecifications;
  @Input('display-specs') mode: DisplaySpecMode;
  @Input('isArchive') isArchive: boolean;
  @Input('unsold') unsold: boolean;

  constructor(private elementRef: ElementRef) {}

  public ngOnChanges(): void {
    this.elementRef.nativeElement.style.display = this.isVisible(
      this.pricingTypeId,
      this.field
    )
      ? 'flex'
      : 'none';
  }

  private isVisible(
    pricingTypeId: number,
    field: GoodsSpecifications
  ): boolean {
    const hasCostData =
      field?.costWithoutVAT ||
      field?.amountVAT ||
      field.amountVAT === 0 ||
      field?.costVAT;

    if (this.mode === DisplaySpecMode.CHANGES) {
      if (field.isVirtual) {
        return false;
      }

      if (pricingTypeId === pricingType?.price) {
        return ![ID_INTERFACE_FIELD.UNIT, ID_INTERFACE_FIELD.CURRENCY].includes(
          field.idInterfaceField
        );
      }

      if (pricingTypeId === pricingType?.formulaWithQuotation) {
        return ![
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.CURRENCY,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          ID_INTERFACE_FIELD.QUOTE_CURRENCY,
        ].includes(field.idInterfaceField);
      }

      if (pricingTypeId === pricingType?.formulaWithoutQuotation) {
        return ![
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.CURRENCY,
          ID_INTERFACE_FIELD.VAT_RATE,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
        ].includes(field.idInterfaceField);
      }
    }

    if (this.mode === DisplaySpecMode.GENERAL) {
      if (ACTUAL_SIZE_READINESS_FIELDS.includes(field.idInterfaceField))
        return false;

      if (pricingTypeId === pricingType?.price) {
        return !(
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.UNIT,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.CURRENCY,
            ID_INTERFACE_FIELD.VAT_RATE,
          ].includes(field.idInterfaceField) || hasCostData
        );
      }

      if (pricingTypeId === pricingType?.formulaWithQuotation) {
        return !(
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.UNIT,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.CURRENCY,
            ID_INTERFACE_FIELD.VAT_RATE,
            ID_INTERFACE_FIELD.AMENDMENT_TYPE,
            ID_INTERFACE_FIELD.AMENDMENT,
            ID_INTERFACE_FIELD.QUOTE_CURRENCY,
            ID_INTERFACE_FIELD.QUOTATION,
          ].includes(field.idInterfaceField) || hasCostData
        );
      }

      if (pricingTypeId === pricingType?.formulaWithoutQuotation) {
        return ![
          ID_INTERFACE_FIELD.QUANTITY,
          ID_INTERFACE_FIELD.UNIT,
          ID_INTERFACE_FIELD.CURRENCY,
          ID_INTERFACE_FIELD.VAT_RATE,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          ID_INTERFACE_FIELD.AMENDMENT,
        ].includes(field.idInterfaceField);
      }
    }

    if (this.mode === DisplaySpecMode.PRICES_STEPS) {
      if (
        field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_STEP &&
        !(this.isArchive && this.unsold)
      )
        return true;

      if (pricingTypeId === pricingType.price) {
        return (
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.VAT_RATE,
          ].includes(field.idInterfaceField) || !!hasCostData
        );
      }

      if (pricingTypeId === pricingType.formulaWithQuotation) {
        return (
          [
            ID_INTERFACE_FIELD.QUANTITY,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            ID_INTERFACE_FIELD.VAT_RATE,
            ID_INTERFACE_FIELD.AMENDMENT,
            ID_INTERFACE_FIELD.QUOTATION,
          ].includes(field.idInterfaceField) || !!hasCostData
        );
      }

      if (pricingTypeId === pricingType.formulaWithoutQuotation) {
        return [
          ID_INTERFACE_FIELD.QUANTITY,
          ID_INTERFACE_FIELD.VAT_RATE,
          ID_INTERFACE_FIELD.AMENDMENT,
        ].includes(field.idInterfaceField);
      }
    }

    return false;
  }
}
