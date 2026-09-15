import { Injectable } from '@angular/core';
import { PERIOD_CONFIG } from '../../../api.constants';
import moment, { Moment } from 'moment';
import { PeriodConfigItem } from '../../../core/interfaces/api';
import { GoodsItemModel } from '../../../core/interfaces/goods';

export interface DeliveryPeriod {
  numberPeriod: number;
  startDate: Moment;
  endDate: Moment;
}

export interface DeliveryPeriodWithClonedGoods {
  numberPeriod: number;
  startDate: string;
  endDate: string;
  goods: GoodsItemModel[];
  idPeriod: string | number;
  periodVolume: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryPeriodService {
  /**
   * Метод построения периодов поставки
   */
  public buildPeriods(
    deliveryView: 1 | 2 | 3,
    startDateStr: string,
    endDateStr: string
  ): DeliveryPeriod[] {
    const cfg: PeriodConfigItem = PERIOD_CONFIG[deliveryView];
    if (!cfg) {
      throw new Error('Unknown deliveryView');
    }

    const startDate: Moment = moment(startDateStr, 'DD-MM-YYYY');
    const endDate: Moment = moment(endDateStr, 'DD-MM-YYYY');

    const periods: DeliveryPeriod[] = [];
    let cursor: Moment = startDate.clone();
    let index: number = 1;

    while (cursor.isSameOrBefore(endDate, 'day')) {
      const isFirst: boolean = index === 1;

      const periodStart: Moment = isFirst
        ? cursor.clone()
        : cursor.clone().startOf(cfg.startOf as moment.unitOfTime.StartOf);

      let periodEnd: Moment = cursor.clone().endOf(cfg.endOf as moment.unitOfTime.StartOf);
      if (periodEnd.isAfter(endDate)) {
        periodEnd = endDate.clone();
      }

      periods.push({
        numberPeriod: cfg.number(periodStart),
        startDate: periodStart,
        endDate: periodEnd
      });

      cursor = periodEnd.clone().add(1, 'day');
      index++;
    }

    return periods;
  }

  /**
   * Расчёт даты окончания поставки
   */
  public calculateEndDate(
    startDateStr: string,
    deliveryTermType: number,
    deliveryPeriodValue: number | string
  ): Moment {
    const startDate: Moment = moment(startDateStr, 'DD-MM-YYYY');

    switch (deliveryTermType) {
      case 1: // дни
        return startDate.clone().add(Number(deliveryPeriodValue), 'days');

      case 2: // месяцы
        return startDate.clone().add(Number(deliveryPeriodValue), 'months');

      case 3: // дата
        return moment(deliveryPeriodValue, 'DD-MM-YYYY');

      default:
        throw new Error('Unknown deliveryTermType');
    }
  }

  /**
   * Формирование объекта периода поставки
   */
  public createObject(
    date1: Moment,
    date2: Moment,
    period: number,
    goodItems: GoodsItemModel[],
    objectArr: DeliveryPeriodWithClonedGoods[],
    isLastObject: boolean,
    periodsCount: number,
    idPeriod: string | number
  ): DeliveryPeriodWithClonedGoods[] {
    const outResult: DeliveryPeriodWithClonedGoods[] = objectArr.length ? objectArr : [];
    let remainder: number = 0;
    let isSmallValueVsLargePeriod: boolean = false;

    // глубокое клонирование
    const cloneGoods: GoodsItemModel[] = JSON.parse(JSON.stringify(goodItems)) as GoodsItemModel[];

    for (let i: number = 0; i < cloneGoods.length; i++) {
      const goodsCount: number = periodsCount;

      if (cloneGoods[i].volume > goodsCount) {
        remainder = parseFloat((cloneGoods[i].volume % goodsCount).toFixed(4));
        isSmallValueVsLargePeriod = false;
      } else {
        remainder = parseFloat((cloneGoods[i].volume / goodsCount).toFixed(4));
        isSmallValueVsLargePeriod = true;
      }

      if (remainder === 0) {
        cloneGoods[i].volume = Math.floor(cloneGoods[i].volume / goodsCount);
      } else {
        if (isSmallValueVsLargePeriod) {
          if (!isLastObject) {
            cloneGoods[i].volume = remainder;
          } else {
            cloneGoods[i].volume = +(cloneGoods[i].volume - remainder * (periodsCount - 1)).toFixed(
              4
            );
          }
        } else {
          if (!isLastObject) {
            cloneGoods[i].volume = Math.floor(cloneGoods[i].volume / goodsCount);
          } else {
            cloneGoods[i].volume = Math.floor(cloneGoods[i].volume / goodsCount) + remainder;
          }
        }
      }
    }

    const item: DeliveryPeriodWithClonedGoods = {
      numberPeriod: period,
      startDate: date1.format('DD.MM.YYYY'),
      endDate: date2.format('DD.MM.YYYY'),
      goods: cloneGoods,
      idPeriod,
      periodVolume: null
    };

    outResult.push(item);

    return outResult;
  }

  public getDivideQuantityIntoPeriods(
    summaryVolume: number,
    count: number,
    isLastObject: boolean
  ): number {
    let remainder: number = 0;
    let isSmallValueVsLargePeriod: boolean = false;
    let periodVolume: number;

    if (summaryVolume > count) {
      remainder = parseFloat((summaryVolume % count).toFixed(4));
      isSmallValueVsLargePeriod = false;
    } else {
      remainder = parseFloat((summaryVolume / count).toFixed(4));
      isSmallValueVsLargePeriod = true;
    }

    if (remainder === 0) {
      periodVolume = Math.floor(summaryVolume / count);
    } else {
      if (isSmallValueVsLargePeriod) {
        if (!isLastObject) {
          periodVolume = remainder;
        } else {
          periodVolume = +Number((summaryVolume - remainder * (count - 1)).toFixed(4));
        }
      } else {
        if (!isLastObject) {
          periodVolume = Math.floor(summaryVolume / count);
        } else {
          periodVolume = Math.floor(summaryVolume / count) + remainder;
        }
      }
    }
    return periodVolume;
  }
}
