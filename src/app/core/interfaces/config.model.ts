export interface ConfigModel {
  uas_front: string;
  OrderManagement: string;
  backendINV: string;
  DemandsManagement: string;
  SessionsManagement: string;
  NSIManagement: string;
  uasService: string;
  domain: string;
  nts: string;
  trading: string;
  auctions: string;
  ppDomain: string;
  ppRedirectUrl: string;
  sockets: string;
  idGoodGroup: number[];
  idGoods: number[];
  readyId: number[];
  notReadyId: number[];
  idGoodsForString: number[];
  idGoodsForRangeWidth: number[];
  idGoodsForRangeThickness: number[];
}
