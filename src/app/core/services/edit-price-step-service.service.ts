/* eslint-disable */
import { CommonService } from 'src/app/core/services/common-service.service';
import { Injectable } from '@angular/core';
import { NO_BASIS, CURRENCY_PRECISION, FULL_PERCENT } from './../../api.constants';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';
import { OfferGood, GoodsSpecifications } from './../interfaces/interface';
import { DELIVERY_COND_BLOCK } from './../../sub_components/create-offer/enums/index';

interface IGoodDeliveryDetails {
  goodId: number;
  goodGroupId: number;
  goodNomenclatureId: number;
  goodNameId: number;
  goodValues: string;
  goodName: string;
  unitId: number;
  unitName: string;
  properties: string;
  volume: number;
  quotation: number;
  quoteCurrency: string;
  amendment: number;
  priceAdjustment: number;
  currency: string;
  currencyId: number;
  vat: number;
  costVat: number;
}

@Injectable({
  providedIn: 'root'
})

export class EditPriceStepService {
  constructor(private commonService: CommonService) {}

  public prepareDeliveryConditions(data: any, vatPercent: number): void {
    //когда базисы есть - привязываем товары к ним
    if (
      data?.deliveryConditions?.length > 0 &&
      !data?.deliveryConditions[DELIVERY_COND_BLOCK.CONCATED_CONDITION][
        DELIVERY_COND_BLOCK.COND_INFO
      ]
    ) {
      data.deliveryConditions.forEach((basis) => {
        data.offerGoods.forEach((good) => {
          if (good.goodsSpecifications[0].idDemandOfferGood === basis.idDemandOfferGood) {
            Object.assign(basis, this.mapGoodFields(good, basis.priceWithoutVat, vatPercent));
          }
        });
      });

      let mainBasis: any = data.deliveryConditions.find((el) => el.isMain);
      data.deliveryConditions = [
        mainBasis,
        ...data.deliveryConditions.filter((item) => item !== mainBasis)
      ];

      //сгруппированы поля по concatedCondition
      data.deliveryConditions = data?.deliveryConditions.reduce(function (r, a) {
        r[a.concatedCondition] = r[a.concatedCondition] || [];
        r[a.concatedCondition].push(a);
        return r;
      }, {});
      data.deliveryConditions = Object.entries(data.deliveryConditions);

      //если базисов нет создаем структуру c "пустым" базисом
    } else if (data?.offerGoods?.length > 0 && data.deliveryConditions.length === 0) {
      const emptyConditions: any = data.offerGoods.map((good) => {
        // создаем "пустой" базис на основе товара
        const emptyBasis: any = {
          idDemandOfferGood: good.goodsSpecifications[0]?.idDemandOfferGood,
          concatedCondition: NO_BASIS,
          priceWithoutVat: this.getValue(
            good.goodsSpecifications,
            ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT,
            'fieldValueNumber'
          ) as number
        };

        return Object.assign(
          emptyBasis,
          this.mapGoodFields(good, emptyBasis.priceWithoutVat, vatPercent)
        );
      });

      const grouped: any = emptyConditions.reduce(function (r, a) {
        r[a.concatedCondition] = r[a.concatedCondition] || [];
        r[a.concatedCondition].push(a);
        return r;
      }, {});

      data.deliveryConditions = Object.entries(grouped);
    }
  }

  private mapGoodFields(
    good: OfferGood,
    priceWithoutVat: number,
    vat: number
  ): IGoodDeliveryDetails {
    return {
      goodId: good.idGood,
      goodGroupId: good.idGoodGroup,
      goodNomenclatureId: good.idNomenclatureGroup,
      goodNameId: good.idGoodName,
      goodValues: good.goodValues,
      goodName: good.goodName,
      unitId: good.unitId,
      unitName: good.unitName,
      properties: good.goodDescription,
      volume: this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.QUANTITY,
        'fieldValueNumber'
      ) as number,
      quotation:
        (this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.QUOTATION,
          'fieldValue'
        ) as number) || null,
      quoteCurrency:
        (this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.QUOTE_CURRENCY,
          'fieldValue'
        ) as string) || null,
      amendment:
        (this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.AMENDMENT,
          'fieldValue'
        ) as number) || null,
      priceAdjustment:
        (this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.AMENDMENT_TYPE,
          'fieldValueNumber'
        ) as number) || null,
      currency: this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.CURRENCY,
        'fieldValue'
      ) as string,
      currencyId: this.getValue(
        good.goodsSpecifications,
        ID_INTERFACE_FIELD.CURRENCY,
        'fieldValueNumber'
      ) as number,
      vat: vat,
      costVat: this.costVatBasis(
        priceWithoutVat,
        good.goodsSpecifications.find((el) => el.idInterfaceField == ID_INTERFACE_FIELD.VAT_RATE),
        this.getValue(
          good.goodsSpecifications,
          ID_INTERFACE_FIELD.QUANTITY,
          'fieldValueNumber'
        ) as number
      )
    };
  }

  private getValue(specs: GoodsSpecifications[], idField: number, prop: string): string | number {
    const found: GoodsSpecifications = specs.find((field) => field.idInterfaceField == idField);
    return found ? found[prop] : null;
  }

  private costVatBasis(priceWithoutVat: number, vatBasis: any, volume: number): number {
    let vat: number;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else {
      vat = 0;
    }
    return (
      this.commonService.round(volume * priceWithoutVat, CURRENCY_PRECISION) +
      this.commonService.round((volume * priceWithoutVat * vat) / FULL_PERCENT, CURRENCY_PRECISION)
    );
  }
}
