// TODO: remove any and then delete eslint-disable
/* eslint-disable */
export interface GoodsItemModel {
  id: number,
  idOfferGood?: number,
  idDemandOfferGood?: number,
  idNomenclatureGroup?: number,
  idGoodGroup?: number,
  idGoodName?: string,
  name: string,
  nomenclature?: string,
  group?: string,
  properties: any,
  fields?: any[],
  quoteCurrency?: {
    id: string,
    name: string
  },
  quotation?: string,
  amendment?: string,
  priceAdjustment?: {
    id: string,
    name: string
  },
  volume: number,
  cost?: number,
  costWithoutVAT?: number,
  costVAT?: number,
  units: {
    id: string,
    name: string
  },
  currency?: {
    id: string,
    name: string
  },
  basicArchiveVolume?: number,
  isBaseGood?: boolean,
  isMainBaseGood?: boolean,
  destinationError?: boolean,
  priceError?: boolean,
  noPriceLimit?: boolean,
  priceAgriStatistics?: any,
  priceLimitationName?: string,
  characteristicsNSI?: any
}
