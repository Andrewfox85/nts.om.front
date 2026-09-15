/* eslint-disable */
import { ERROR_MESSAGES } from '../constants';
import { ReportDealsGoods, DemandOfferGood } from './../../shared/services/report-service/index';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import { MS_IN_SECOND, SECONDS_IN_MINUTE, MINUTES_IN_HOUR, HOURS_IN_DAY, EXCEL_DATE_OFFSET_1900 } from './../../api.constants';

export const getErrorMessageByCode = (
  errorCode: number,
  lang: string
): string | null => {
  const messages = ERROR_MESSAGES[errorCode];
  return messages ? messages[lang] || null : null;
};


export function getMainName(goods: (ReportDealsGoods | DemandOfferGood)[]): string {
  if (goods?.length > 1) {
    const sameName = goods?.every(g => g.goodName === goods[0].goodName);
    const sameGroup = goods?.every(g => g.goodGroup === goods[0].goodGroup);
    const sameDesc = goods?.every(g => g.goodDescription === goods[0].goodDescription);
  
    if (sameName && !sameDesc) {  //если наименование одинаковое,но разные характеристики - выводить наименование товара
      return goods[0].goodName;
    } else if (!sameName && sameGroup) {  //разное наименование товара и одинаковая ТГ  - наименование товарной группы
      return goods[0].goodGroup;
    } else if (!sameName && !sameGroup) { //разная товарная группа - наименование номенклатурной группы
      return goods[0].nomenclatureGroup;
    }
  } else {
    return goods[0]?.goodName;
  }
}

export function getTranslateResultByCurrentLang(currentLang: string, pathStr: string): string {
  return pathStr.split('.').reduce((key, param) => {
    return key[param];
  }, currentLang === 'RU' ? RU : EN);
}

export function excelToJSDate(excelDate: number): Date {
  const date = new Date(
    Math.round(
      (excelDate - EXCEL_DATE_OFFSET_1900) *
        SECONDS_IN_MINUTE *
        MINUTES_IN_HOUR *
        HOURS_IN_DAY *
        MS_IN_SECOND
    )
  );
  const userOffset =
    date.getTimezoneOffset() * SECONDS_IN_MINUTE * MS_IN_SECOND;
  return new Date(date.getTime() + userOffset);
}