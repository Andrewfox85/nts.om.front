/* eslint-disable */
import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {firstValueFrom, Observable} from 'rxjs';
import { REF_BOOK_NAMES } from '../enums';

export interface DemandsCount {
  numberRegsBuy: number;
  numberRegsSale: number;
  numberDemoffBuy: number;
  numberDemoffSale: number;
}

export interface Product {
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
}

export interface ProductsParams {
  products: Product[];
  minLotValue: number | null;
  maxLotValue: number | null;
  lotUnitId: number | null;
}

export interface AnalogueProduct {
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
}

export interface Analogue {
  id: number;
  products: AnalogueProduct[];
}

export interface SessionDataItem {
  stageId: string;
  statusId: number;
  isManualStageChange: boolean;
  demandsCount: DemandsCount;
  endDate: string | null;
  stagesScheduler: any[];
  sessionTemplateId: number;
  sessionTemplateName: string;
  multiBasisTypeId: string;
  pricingTypeId: string;
  pricingTypeName: string;
  isAllowedFilesPublic: boolean;
  isAllowedFilesPrivate: boolean;
  isAllowedTargetedTransact: boolean;
  priceLimitParams: any | null;
  isCanCloseAgreementSigning: boolean;
  dateCloseAgreementSigning: string | null;
  id: number;
  isDeleted: boolean;
  tradeSectionId: number;
  tradeTypeId: string;
  marketTypeIds: string[];
  sessionNameId: number;
  startDateTime: string;
  applicationFormBuyerId: number;
  applicationFormSellerId: number;
  complexLotTypeId: string;
  quartzCountRepeat: number | null;
  quartzEndDateTime: string | null;
  quartzExpression: string | null;
  quartzExceptions: string | null;
  regularityId: number | null;
  deliveryBasisIds: any | null;
  productsParams: ProductsParams[];
  notes: string | null;
  isUpdated: boolean;
  isAllowedAnalogues: boolean;
  analogues: Analogue[] | null;
}

export interface GetDxGridResponse {
  data: SessionDataItem[];
}

export interface RefbookItem {
  id: string;
  name: string;
  description: string;
}

export interface GetByNameResponse {
  refbooks: RefbookItem[];
}

export interface FilteredSessionsCatalog {
  idSection: number;
  idSession: number;
  idSessionName: number;
  sessionName: string;
  datetimeBegin: string;
  sessionStageId: number;
  sessionStatusId: number;
  marketTypes: string[];
}

export type FilteredSessionsCatalogResponse = FilteredSessionsCatalog[];

export interface GetFilteredSessions {
  idSection: number;
  id: number;
  sessionTemplateId: number;
  sessionNameId: number;
  sessionName: string;
  auctionTypeId: number;
  marketTypes: string;
  startDateTime: string;
  endDate: string;
  sessionStatusId: number;
  sessionStageId: number;
  lotAvailabilityId: number;
  multiBasisAvailabilityId: number;
  isScheduledSageChanging: boolean;
  isAllowedTargetedTransact: boolean;
  isAllowedAnalogues: boolean;
  notes: string;
}

export interface GetFilteredSessionsResponse {
  sessions: GetFilteredSessions[];
}

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  sessionId: number = 0;
  sessionDateTime: number = 0;
  sectionId: number = 0;
  direction: any;
  sessionsForFilter: any;

  private OrderManagement: any = this.conf.OrderManagement;
  private urlNTS: any = this.conf.backendINV;
  private SessionsManagement: any = this.conf.SessionsManagement;

  constructor(
    private readonly http: HttpClient,
    private readonly conf: AppConfigService
  ) { }

  // справочник
  public getByName(
    sessionKey: string,
    className: string,
    SectionId?: number
  ): Observable<GetByNameResponse> {
    if (className === REF_BOOK_NAMES.SESSION_NAMES && !SectionId) return;
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let sectionId = SectionId ? `&IdSection=${SectionId}` : '';

    return this.http.get<GetByNameResponse>(
      `${this.urlNTS}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=${className}${sectionId}`,
      { headers: myHeaders }
    );
  }

  // получение списка сессий для собственной фильтрации в боковых фильтрах
  public getDxGrid(
    sessionKey: string,
    sectionId: number,
    category?: number
  ): Observable<GetDxGridResponse> {
    const headerDict = {
      Authorization: sessionKey,
      'Section-Id': sectionId.toString(),
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    let Category = category === undefined ? '' : '?category=' + category;

    return this.http.get<GetDxGridResponse>(
      `${this.urlNTS}${this.SessionsManagement}/sessions/GetDxGrid${Category}`,
      requestOptions
    );
  }

  // получение списка сессий в боковых фильтрах
  public getFilteredCatalog(
    sessionKey: string,
    sectionId: number
  ): Observable<GetDxGridResponse> {
    const headerDict = {
      Authorization: sessionKey,
      'Section-Id': sectionId.toString(),
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http.get<GetDxGridResponse>(
      `${this.urlNTS}${this.SessionsManagement}/sessions/GetFilteredCatalog`,
      requestOptions
    );
  }

  //получение списка сессий в боковых фильтрах отчетов
  public getFilteredSessions(
    sectionId: number,
    filterSessionDateFrom?: number,
    filterSessionDateTo?: number,
  ): Observable<GetFilteredSessionsResponse> {

    let dateFrom: string = filterSessionDateFrom ? `&FilterSessionDateFrom=${filterSessionDateFrom}` : '';
    let dateTo: string = filterSessionDateTo ? `&FilterSessionDateTo=${filterSessionDateTo}` : '';

    return this.http.get<GetFilteredSessionsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Report/worker/GetFilteredSessions?IdSection=${sectionId}${dateFrom}${dateTo}`
    );
  }

  //глобальный поиск
  GetGlobalSearchResults(SessionKey, SearchString) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/submission/GetGlobalSearchResults?SearchString=${SearchString}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //получение перечня лотов
  GetListOffersCatalogue(
    SessionKey,
    IdDirection,
    IdSection,
    body: object,
    filterListGoods?: number[],
    filterListPropertyStr?: number[],
    filterListPropertyInt?: number[],
    filterListPaymentType?: number[],
    filterListDelivBasis?: number[]
  ) {
    let listGoods = '';
    for (let i = 0; i < filterListGoods.length; i++) {
      listGoods += '&FilterListGoods=' + filterListGoods[i];
    }

    let listPropertyStr = '';
    for (let i = 0; i < filterListPropertyStr.length; i++) {
      listPropertyStr += '&ListPropertiesStr=' + filterListPropertyStr[i];
    }

    let listPropertyInt = '';
    for (let i = 0; i < filterListPropertyInt.length; i++) {
      listPropertyInt += '&ListPropertiesInt=' + filterListPropertyInt[i];
    }

    let listPaymentType = '';
    for (let i = 0; i < filterListPaymentType.length; i++) {
      listPaymentType += '&FilterListPaymentType=' + filterListPaymentType[i];
    }

    let listDelivBasis = '';
    for (let i = 0; i < filterListDelivBasis.length; i++) {
      listDelivBasis += '&FilterListDelivBasis=' + filterListDelivBasis[i];
    }

    return {
      loadUrl: `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/GetCatalog?IdDirection=${IdDirection}&IdSection=${IdSection}${listGoods}${listPropertyStr}${listPropertyInt}${listPaymentType}${listDelivBasis}`,

      onBeforeSend(method: string, ajaxOptions: any) {
        ajaxOptions.data = body;
        ajaxOptions.headers = {
          Authorization: SessionKey || '',
          UasLang: JSON.parse(localStorage?.getItem('lang')),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
        };
      },
    };
  }

  //экспорт в Excel
  RequestExportCatSellers(SessionKey, body: object) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/RequestExportCatalog`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  cancelOffer(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/CancelDemandOffer`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }

  deleteOffer(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/DeleteDemandOffer`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }

  OffersRestoreRejected(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/RestoreRejected`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }

  GetRejectedInfo(
    SessionKey,
    IdDirection,
    IdSection,
    IdSession,
    IdDemandOffer
  ) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return firstValueFrom(this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/GetRejectedInfo?IdDirection=${IdDirection}&IdSection=${IdSection}&IdSession=${IdSession}&IdDemandOffer=${IdDemandOffer}`,
        { headers: myHeaders }
      ));
  }

  //отклонение заявки
  OffersReject(SessionKey, body) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/DemandsOffersReject`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then();
  }
}
