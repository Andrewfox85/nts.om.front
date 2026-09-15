/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from '../../app-config.service';
import { Observable } from 'rxjs';
import { IReferencesValueDep, ReferencesGoodCharacteristics } from "../../core/services/add-nsi-good.service";
import { RefsDataValues } from "../../core/interfaces/interface";

export interface Good {
  id: number;
  name: string;
  description: string;
  idLink: number;
  idReference: number;
}

export interface GoodsResponse {
  goods: Good[];
}

export interface Group {
  id: number;
  name: string;
  description: string;
  idLink: number;
  idReference: number;
}

export interface NomenclatureWithGroups {
  id: number;
  name: string;
  description: string;
  idLink: number;
  idReference: number;
  groups: Group[];
}

export interface AddGoodToCatalog {
  idSection: number;
  idNomenclatureGroup: number;
  idGoodGroup: number;
  idGoodName: number;
  listProperty: number[];
  listClients?: number[];
  idModel: number;
  listAddedGoods: number[];
}

export interface AddGoodToCatalogResult {
  idGood: number;
  isGoodWasReallyAdded: boolean;
}

export interface NomenclaturesWithGroupsResponse {
  nomenclaturesWithGroups: NomenclatureWithGroups[];
}

export interface GoodName {
  concatName: string;
}

export interface ListLotsNumberResponse {
  lotNumbers: number[];
}

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  private url = this.conf.backendINV;
  private OrderManagement = this.conf.OrderManagement;

  public lang: string;

  constructor(
    private readonly http: HttpClient,
    private readonly conf: AppConfigService
  ) {
    this.lang = JSON.parse(localStorage?.getItem('lang'));
  }

  public getNomenclaturesWithGroups(
    sessionKey: string,
    section: number
  ): Observable<NomenclaturesWithGroupsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<NomenclaturesWithGroupsResponse>(
      `${this.url}${this.OrderManagement}/Filters/GetNomenclaturesWithGroups?IdSection=${section}&Language=${this.lang}`,
      { headers: myHeaders }
    );
  }

  public getGoodsList(
    sessionKey: string,
    section: number,
    group: number
  ): Observable<GoodsResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GoodsResponse>(
      `${this.url}${this.OrderManagement}/Filters/GetGoodsList?IdSection=${section}&IdGroup=${group}`,
      { headers: myHeaders }
    );
  }

  BuceGetFirmsList(SessionKey, searchString, page) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .get(
        `${this.url}${this.OrderManagement}/Accred/worker/BuceGetFirmsList?SearchString=${searchString}&IsOnlyActive=true&CurrentPageNumber=${page}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  GetBranchesFirmsOfAllClients(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(
        `${this.url}${this.OrderManagement}/Accred/worker/GetBranchesFirmsOfAllClients`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }

  GetBranchesListFirm(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(
        `${this.url}${this.OrderManagement}/Accred/worker/GetBranchesListFirm`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }

  //получение динамических характеристик
  GetAvailableReferences(SessionKey, IdSection, IdGoodLink, IdGoodValue): Observable<ReferencesGoodCharacteristics> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get<ReferencesGoodCharacteristics>(
        `${this.url}${this.OrderManagement}/Filters/submission/GetAvailableReferences?IdSection=${IdSection}&IdGoodLink=${IdGoodLink}&IdGoodValue=${IdGoodValue}`,
        { headers: myHeaders }
      );
  }

  //получение значений характеристик
  GetAvailableRefValues(
    SessionKey,
    IdSection,
    IdGoodLink,
    IdGoodValue,
    IdReference
  ): Observable<RefsDataValues> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get<RefsDataValues>(
        `${this.url}${this.OrderManagement}/Filters/submission/GetAvailableRefValues?IdSection=${IdSection}&IdReference=${IdReference}&IdGoodLink=${IdGoodLink}&IdGoodValue=${IdGoodValue}`,
        { headers: myHeaders }
      );
  }

  //получение зависимых характеристик
  GetAvailableReferencesDep(SessionKey, IdSection, IdParent?): Observable<ReferencesGoodCharacteristics> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idParent = IdParent === undefined ? '' : '&IdParent=' + IdParent;
    return this.http
      .get<ReferencesGoodCharacteristics>(
        `${this.url}${this.OrderManagement}/Filters/submission/GetAvailableReferencesDep?IdSection=${IdSection}${idParent}`,
        { headers: myHeaders }
      )
  }

  //получение значения зависимых характеристик
  GetAvailableRefValuesDep(SessionKey, IdSection, IdReference, IdParent?): Observable<IReferencesValueDep> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idParent = IdParent === undefined ? '' : '&IdParent=' + IdParent;
    return this.http
      .get<IReferencesValueDep>(
        `${this.url}${this.OrderManagement}/Filters/submission/GetAvailableRefValuesDep?IdSection=${IdSection}&IdReference=${IdReference}${idParent}`,
        { headers: myHeaders }
      )
  }

  //добавление товара
  AddToGeneralCatalog(SessionKey, body: AddGoodToCatalog): Observable<AddGoodToCatalogResult> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post<AddGoodToCatalogResult>(
        `${this.url}${this.OrderManagement}/Filters/submission/AddToGeneralCatalog`,
        body,
        { headers: myHeaders }
      )
  }

  //получение склеенного наименования товара
  public getGoodName(SessionKey, IdGood: number): Observable<GoodName> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .get<GoodName>(
        `${this.url}${this.OrderManagement}/Filters/GetGoodName?IdGood=${IdGood}`,
        { headers: myHeaders }
      );
  }

  //получение списка лотов на сессию
  public getListLotsNumber(sessionKey: string, idSection: number, idSession: number): Observable<ListLotsNumberResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http
      .get<ListLotsNumberResponse>(
        `${this.url}${this.OrderManagement}/Report/worker/GetListLotsNumber?IdSection=${idSection}&IdSession=${idSession}`,
        { headers: myHeaders }
      );
  }
}
