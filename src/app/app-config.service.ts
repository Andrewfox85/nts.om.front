import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { ConfigModel } from "./core/interfaces";

export interface refIdActualDimensions {
  REF_WIDTH: number;
  REF_THICKNESS: number;
  REF_DIAMETER: number;
  REF_LENGTH: number;
}

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  public uas_front: string;
  public OrderManagement: string;
  public uasService: string;
  public backendINV: string;
  public DemandsManagement: string;
  public SessionsManagement: string;
  public NSIManagement: string;
  public domain: string;
  public nts: string;
  public trading: string;
  public auctions: string;
  public ppDomain: string;
  public ppRedirectUrl: string;
  public idGoodGroup: [];
  public idGoods: [];
  public readyId: [];
  public notReadyId: [];
  public idGoodsForString: [];
  public idGoodsForRangeWidth: [];
  public idGoodsForRangeThickness: [];
  public sockets: string;
  public refIdActualDimensions: refIdActualDimensions;

  constructor(private http: HttpClient) {
  }

  public load(): Promise<ConfigModel> {
    return this.http.get<ConfigModel>('./assets/config.json')
      .toPromise()
      .then((data: ConfigModel) => {
        Object.assign(this, data);
        return data;
      });
  }
}
