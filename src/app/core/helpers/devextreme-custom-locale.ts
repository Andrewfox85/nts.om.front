/* eslint-disable */
import Globalize from 'globalize';
import { loadMessages, locale } from 'devextreme/localization';
import ruMessages from 'devextreme/localization/messages/ru.json';
import enMessages from 'devextreme/localization/messages/en.json';
import 'devextreme/localization/globalize/number';
import 'devextreme/localization/globalize/date';
import 'devextreme/localization/globalize/currency';
import 'devextreme/localization/globalize/message';

import likelySubtags from 'cldr-core/supplemental/likelySubtags.json';
import numberingSystems from 'cldr-core/supplemental/numberingSystems.json';
import timeData from 'cldr-core/supplemental/timeData.json';
import weekData from 'cldr-core/supplemental/weekData.json';
import currencyData from 'cldr-core/supplemental/currencyData.json';
import gregorianRu from 'cldr-dates-full/main/ru/ca-gregorian.json';
import gregorianEn from 'cldr-dates-full/main/en/ca-gregorian.json';
import timeZoneNamesRu from 'cldr-dates-full/main/ru/timeZoneNames.json';
import timeZoneNamesEn from 'cldr-dates-full/main/en/timeZoneNames.json';
import numbersRu from 'cldr-numbers-full/main/ru/numbers.json';
import numbersEn from 'cldr-numbers-full/main/en/numbers.json';
import currenciesRu from 'cldr-numbers-full/main/ru/currencies.json';
import currenciesEn from 'cldr-numbers-full/main/en/currencies.json';
import { EN_LANG, RU_LANG } from '../constants';

export const EN_WITH_RU_NUMBERS_LOCALE: string = 'en-RU-numbers';
let isInitialized: boolean = false;

function mixedEnRuNumbersLocaleData() {
  return {
    main: {
      [EN_WITH_RU_NUMBERS_LOCALE]: {
        identity: {
          language: 'en',
          territory: 'RU',
        },
        dates: (gregorianEn as any).main.en.dates,
        numbers: (numbersRu as any).main.ru.numbers,
      },
    },
  };
}

export function initDevExtremeGlobalizeLocales(): void {
  if (isInitialized) {
    return;
  }

  Globalize.load(
    likelySubtags as any,
    numberingSystems as any,
    timeData as any,
    weekData as any,
    currencyData as any,
    gregorianRu as any,
    gregorianEn as any,
    timeZoneNamesRu as any,
    timeZoneNamesEn as any,
    numbersRu as any,
    numbersEn as any,
    currenciesRu as any,
    currenciesEn as any,
    mixedEnRuNumbersLocaleData() as any
  );

  loadMessages(ruMessages);
  loadMessages(enMessages);
  loadMessages({
    [EN_WITH_RU_NUMBERS_LOCALE]: (enMessages as any).en,
  });

  isInitialized = true;
}

export function applyDevExtremeLocale(language: string): void {
  initDevExtremeGlobalizeLocales();

  if (language === RU_LANG) {
    Globalize.locale(RU_LANG);
    locale(RU_LANG);
    return;
  }

  if (language === EN_LANG) {
    Globalize.locale(EN_WITH_RU_NUMBERS_LOCALE);
    locale(EN_WITH_RU_NUMBERS_LOCALE);
  }
}
