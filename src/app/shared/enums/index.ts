/* eslint-disable */
export enum ID_INTERFACE_FIELD {
  QUANTITY = 1, // Количество
  UNIT = 2, // Ед. изм.
  PRICE_WITHOUT_VAT = 3, // Цена без НДС
  CURRENCY = 4, // Валюта
  VAT_RATE = 5, // Ставка НДС
  MIN_PRICE = 9, // Минимальная цена (без НДС)
  FINANCE_SOURCE = 11, // Источник финансирования
  OKRB007 = 12, // ОКРБ 007-2012
  THRESHOLD_PRICE_WITHOUT_VAT = 13, // Пороговая цена (без НДС)
  PRODUCT_READINESS = 21, // Готовность товара
  PRODUCT_LOCATION = 22, // Местонахождение товара
  PLACE_OF_WORK = 29, // Место выполнения работ
  PAYMENT_TERMS = 36, // Условия оплаты
  DELIVERY_TERMS = 37, // Условия поставки
  DELIVERY_TIME = 38, // Срок поставки
  ACTUAL_LENGTH = 40, // Фактическая длина
  ADJUSTED_PRICE = 47, // Корректируемая цена
  AMENDMENT_TYPE = 53, // Тип поправки
  AMENDMENT = 54, // Поправка
  QUOTE_CURRENCY = 55, // Валюта котировки
  QUOTATION = 56, // Котировка
  ACTUAL_DIAMETER = 57, // Фактический диаметр
  ACTUAL_WIDTH = 58, // Фактическая ширина
  ACTUAL_THICKNESS = 59, // Фактическая толщина
  DESTINATION = 62, // Место назначения
  CFEA = 63, // Код ТН ВЭД ЕАЭС
  PRICE_STEP = 64, //Шаг цены
  EXPIRATION_DATE = 66, // срок годности
  WHOLESALE_MARKUP = 67, //оптовая надбавка
  PRODUCT_QUALITY = 68, // качество товара
  DELIVERY_FEATURES = 70 //особенности доставки;
}

export enum REF_ID_ACTUAL_DIMENSIONS {
  REF_WIDTH_TEST = 115,
  REF_WIDTH = 117,
  REF_THICKNESS_TEST = 114,
  REF_THICKNESS = 116,
  REF_DIAMETER = 108,
  REF_LENGTH = 109
}

export const specialPriceFields = [
  ID_INTERFACE_FIELD.MIN_PRICE,
  ID_INTERFACE_FIELD.THRESHOLD_PRICE_WITHOUT_VAT,
  ID_INTERFACE_FIELD.PRICE_WITHOUT_VAT
];

