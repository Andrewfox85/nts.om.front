import { AppConfigService, refIdActualDimensions } from "./app-config.service";
import { Moment } from 'moment';
import { ID_INTERFACE_FIELD } from './shared/enums';
import { ApiConstModel, ApiConstStringModel, PeriodConfig } from './core/interfaces/api';
import { SectionIdModel } from './core/interfaces';

export const sectionID: SectionIdModel = {
  metalProducts: 1, //метал
  forestProducts: 2, //лес
  agricultural: 3, //сельхоз
  promising: 7 //перспективные
};

export const numberEntriesPage: number[] = [10, 20, 50, 100];

export const role: ApiConstModel = {
  unauthorized: 0, //не авторизован
  worker: 1, //работник
  broker: 2, //брокер
  visitor: 3, //посетитель
  brokerVisitor: 4 //брокер и посетитель
};

export const applicationForm: ApiConstModel = {
  all: 1, //Все
  filingApplication: 2, //Подача заявки
  registrationSession: 3 //Регистрация на сессию
};

export const statusSession: ApiConstModel = {
  preparation: 1, //Подготовка
  inProcessForAuction: 2, //В процессе переноса в торги
  notMovedToAuction: 3, //Не перенесена в торги
  bidding: 4, //Торги
  inProcessArchived: 5, //В процессе переноса в архив
  notArchived: 6, //Не перенесена в архив
  archive: 7 //Архив
};

export const sessionStage: ApiConstModel = {
  new: 1, //Новая
  applicationsOpen: 2, //Открыт приём заявок
  purchaseOrdersOpen: 3, //Открыт приём заявок на покупку
  applicationsSaleOpen: 4, //Открыт приём заявок на продажу
  applicationsClosed: 5, //Завершён приём заявок
  completedProcessingApplications: 6, //Завершена обработка заявок
  transferAuctionCompleted: 7, //Для трейдера "Сессия активирована"
  //Для работника "Завершен перенос сессии в торги. Сессия активирована"
  sessionEnded: 8, //Сессия завершена
  completedDataTransferArchive: 9 //Завершён перенос данных в архив
};

export const IdDirection: ApiConstModel = {
  buy: 1, //покупка
  sale: 2, //продажа
  regs: 3 //регистрации
};

export const searchIcon: ApiConstStringModel = {
  icon: 'assets/img/icons/search_grey.svg',
  type: 'default'
};

export const pricingType: ApiConstModel = {
  price: 1, //по цене
  formulaWithQuotation: 2, //по формуле с котировкой
  formulaWithoutQuotation: 3 //по формуле без котировки
};

export const deliveryAddress: ApiConstModel = {
  //Место поставки
  destinationPort: 1, //Порт назначения
  shippingPort: 2, //Порт отгрузки
  destination: 3, //Место назначения
  placeShipment: 4, //Место отгрузки
  destinationStation: 5, //Станция назначения
  departureStation: 6, //Станция отправления
  destinationOutsideBorderRB: 7, //Пункт назначения за пределами границы РБ
  placeName: 8, //Название места
  borderCrossing: 9 //Погранпереход
};

export const minDeliveryScheduleDaysCount: number = 180;

export const termsConditionsPaymentConst: ApiConstModel = {
  prepayment100: 1, //Предоплата 100%
  partialPrepayment: 2, //Частичная предоплата
  paymentDeferment: 3, //Отсрочка
  paymentThroughExchange: 4 //Оплата через счета Биржи
};

export const maxLengthTextArea: number = 4000;

export const offerStatus: ApiConstModel = {
  //статус заявки
  submitted: 1, //Подана
  canceled: 2, //Отменена
  includedInRegister: 3, //Включена в реестр
  notIncludedInRegister: 4, //Не включена в реестр
  excludedFromRegister: 5, //Исключена из реестра
  deleted: 6, //Удалена
  previousEdition: 7 //Предыдущая редакция
};

export const GOOD_REF_ID: number = 4; //id справочника товаров

export const GOOD_GROUP_REF_ID: number = 3; //id справочника ТГ

export const VALIDATION_ERROR: number = 400;

export const NO_DEMAND_OFFER_ID: number = 0;

export enum ErrorStates {
  error = 1,
  warning = 0
}

export enum AuctionType {
  englishUpgrading = 1,
  dutchDown = 2,
  doubleCounter = 4
}
export enum IdAction {
  edit = 4,
  cancel = 5
}

export enum STEPS_TO_APPLY {
  GENERAL_INFO = 1,
  PRODUCT_INFO,
  TERMS_PAYMENT_TERMS ,
  DELIVERY_TERMS,
  COMMON_PARAM,
  PREVIEW_SUBMISSION
}

export enum levelProductBlock {
  nomenclatureGroup = 1,
  productGroup = 2,
  good = 3
}

export enum SORT_ID_ACTUAL_FIELDS {
  FIELD_57 = 1, //DIAMETER
  FIELD_59, //THICKNESS
  FIELD_58, //WIDTH
  FIELD_40 //LENGTH
}

export const TARGET_PERIOD: number = 13;

export const OFFERS_ADJUSTMENT_PERIOD: number = 3;    //Период корректировки заявок в торгах

export const AUCTION_TYPE: ApiConstModel = {
  SIMPLE_SELLER_AUCTION: 1, // Простой аукцион продавца
  SIMPLE_BUYER_AUCTION: 2, // Простой аукцион покупателя
  REVERSE_WHOLESALE_AUCTION: 3, // Обратный оптовый аукцион
  DOUBLE_COUNTER_AUCTION: 4 // Двойной встречный аукцион
};

export const ACTUAL_SIZE_READINESS_FIELDS: ID_INTERFACE_FIELD[] = [
  ID_INTERFACE_FIELD.ACTUAL_LENGTH,
  ID_INTERFACE_FIELD.ACTUAL_DIAMETER,
  ID_INTERFACE_FIELD.ACTUAL_WIDTH,
  ID_INTERFACE_FIELD.ACTUAL_THICKNESS,
  ID_INTERFACE_FIELD.PRODUCT_READINESS
];

export const ACTUAL_SIZE_FIELDS: ID_INTERFACE_FIELD[] = [
  ID_INTERFACE_FIELD.ACTUAL_LENGTH,
  ID_INTERFACE_FIELD.ACTUAL_DIAMETER,
  ID_INTERFACE_FIELD.ACTUAL_WIDTH,
  ID_INTERFACE_FIELD.ACTUAL_THICKNESS
];

export interface ActualDimensionComparison {
  idField: ID_INTERFACE_FIELD;
  refId: number;
}

//сопоставления "стандартизированных" значений и "фактических" полей модели
export const getComparisons = (
  config: refIdActualDimensions
): ActualDimensionComparison[] => [
  { idField: ID_INTERFACE_FIELD.ACTUAL_WIDTH, refId: config.REF_WIDTH },
  { idField: ID_INTERFACE_FIELD.ACTUAL_THICKNESS, refId: config.REF_THICKNESS },
  { idField: ID_INTERFACE_FIELD.ACTUAL_DIAMETER, refId: config.REF_DIAMETER },
  { idField: ID_INTERFACE_FIELD.ACTUAL_LENGTH, refId: config.REF_LENGTH },
];

export const COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES: string = '104';
export const COMPLEX_LOT_PRODUCT_TYPE_ID: string = '2';

export const CURRENT_TAB_FROM_AUCTIONS: number = 1; //по умолчанию вкладка Заявки

export enum REF_ID {
  NOMENCLATURES_WITH_GROUPS = -2, // id справочника ном. группы
  GOODS_GROUP = -3, // id справочника тов. группы
  GOODS = -4 // id справочника товара
}

export enum BLOCK_ID_FIELDS {
  QUANTITY_BLOCK = '3', //количественные поля
  PRICE_BLOCK = '4', //ценовые поля
  ADDITIONAL_BLOCK = '7' //дополнительные поля
}

export enum ID_DELIVERY_TERM {
  DATE_REGISTRATION_OF_AGREEMENT = 1, //С даты регистрации договора на бирже
  DATE_OF_DELIVERY = 2, //С даты начала поставки
  NOT_SET_START_DELIVERY = 3 //Начало поставки не задано
}

export enum ID_DELIVERY_TERM_TYPE {
  CALENDAR_DAYS = 1, //Календарные дни
  MONTHS, //Месяцы
  DAYS //Дата
}

export enum filterTabsInOM {
  active = 1,
  rejected
}

export enum GridCategoryEnum {
  All = 0,
  NoArchivedNoDeleted,
  OnlyArchived,
  OnlyDeleted
}

export enum DeliveryView {
  Week = 1,
  Month,
  Quarter
}

export enum ID_DOCUMENT {
  COMMISSION_AGREEMENT = 20, //Договор комиссии
  AGENCY_AGREEMENT = 21 //Договор поручения
}

// ---------- DELIVERY SCHEDULE CONFIG ----------
export const PERIOD_CONFIG: PeriodConfig = {
  1: {
    // неделя
    unit: 'week',
    startOf: 'isoWeek',
    endOf: 'isoWeek',
    add: { value: 1, unit: 'week' },
    number: (date: Moment) => date.isoWeek()
  },
  2: {
    // месяц
    unit: 'month',
    startOf: 'month',
    endOf: 'month',
    add: { value: 1, unit: 'month' },
    number: (date: Moment) => date.month() + 1
  },
  3: {
    // квартал
    unit: 'quarter',
    startOf: 'quarter',
    endOf: 'quarter',
    add: { value: 1, unit: 'quarter' },
    number: (date: Moment) => date.quarter()
  }
};

export const MS_IN_SECOND: number = 1000;

export const SECONDS_IN_MINUTE: number = 60;

export const MINUTES_IN_HOUR: number = 60;

export const HOURS_IN_DAY: number = 24;

export const EXCEL_DATE_OFFSET_1900: number = 25569;

export const ONE_MS: number = 1;

export const HH_MM_FORMAT: string = 'HH:mm';

export const EMPTY_STRING: string = '';

export const UTC_TIMEZONE_OFFSET: string = '+0000';

export const ID_WITHOUT_VAT: number = 1; //ид ставки Без НДС

export enum depositType {
  withoutDeposit = 0, //без задатка
  dealsDeposit, //задаток по сделкам
  taxDeposit //задаток по биржевому сбору
}

export enum FileTypes {
  REPORT_ORDERS = 'Report-orders',
  REPORT_DEALS = 'Report-deals',
  REPORT_PARTICIPANTS = 'Report-participants',
  REPORT_BIDDING_PROCESS = 'Report-bidding-process',
  DEPOSIT = 'Deposit',
  DEPOSIT_LIST_TAX = 'Deposit-list-tax',
  DEPOSIT_LIST_DEAL = 'Deposit-list-deal',
  UNREALIZED_VOLUMES = 'Unrealized-volumes'
}

export enum DisplaySpecMode {
  GENERAL = 'general',
  CHANGES = 'changes',
  PRICES_STEPS = 'pricesSpecs'
}

export enum NamesOfCachePage {
  OFFER_MANAGEMENT = 'offer-management',
  CATALOG = 'catalog',
  SESSIONS_SCHEDULE = 'sessions-schedule',
  REPORT_DEALS = 'report-deals',
  REPORT_TRADING_SESSION_ORDERS = 'report-trading-session-orders',
  REPORT_BIDDING_PROCESS = 'report-bidding-process',
}

export enum RefbooksNames {
  SESSIONSTAGESPRESALE = 'sessionstagespresale', //стадия сессии для работника
  DEMOFFSESSIONSTAGES = 'demoffsessionstages', //стадия сессии для авторизованного трейдера
  MARKETTYPES = 'markettypes', // тип рынка
  UNITS = 'units', // ед.измерения
  CURRENCIES = 'currencies', // валюта
  PAYMENTTYPES = 'paymenttypes', // условия оплаты
  DELIVERYBASISES = 'deliverybasises', // условия поставки
}

export const VOLUME_PRECISION: number = 4;

export const CURRENCY_PRECISION: number = 2;

export enum ID_STAT_DELIVERY {
  BUYERS_EX_WAREHOUSE = 11,     //ФРАНКО-СКЛАД ПОКУПАТЕЛЯ
  SELLERS_EX_WAREHOUSE = 12,    //ФРАНКО-СКЛАД ПРОДАВЦА
  FREE_CARRIAGE_DESTINATION_STATION = 24,    //ФРАНКО-ВАГОН СТАНЦИЯ НАЗНАЧЕНИЯ
}

export const BELARUS_ID_LINK: number = 1000;
//на dev и test2 отличаются данные. todo оставить одно значение
export const BELARUS_ID_LINK_DESTINATION_STATION = (
  config: AppConfigService
): number => {
 return config.domain.toString().includes('59') ? 20115 : 20382
};

export enum IdDirectionsForTransfer {
  buy = 1, //Покупка
  sale = 2, //Продажа
  buyAndSale = 3 //Покупка и продажа
}

export enum MARKET_TYPES {
  DOMESTIC = 'DOMESTIC',
  IMPORT = 'IMPORT',
  FOREIGN = 'FOREIGN',
  EXPORT = 'EXPORT'
}

export const TIMBER_TICKET = 7; //лесорубочный билет

export enum FILES_TYPE {
  HIDDEN_FILES = 'hiddenFiles',
  COMMON_FILES = 'commonFiles'
}

export const EMPTY_LENGTH: number = 0;
export const MIN_SEARCH_LENGTH: number = 3;

export const NO_BASIS: string = 'Без базиса поставки';

export const FULL_PERCENT: number = 100;

export enum DIFF_PRICE_TREND {
  DOWNWARD = -1, //отличие в сторону уменьшения ("медвежий тренд")
  UNDEFINED_DIFF = 0, //отличия (неопределенные)
  UPWARD = 1, //отличие в сторону увеличения ("бычий тренд")
}
