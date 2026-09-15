import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import {
  GetTradingSessionDemandOffersResponse,
  ReportDealsTransactionsBody,
  ReportDealsTransactionsPayload,
  TradingSessionDemandOffersBody,
  GetTradingParticipantsResponse,
  ReportBiddingProcessResponse
} from './';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly orderManagement: string = this.conf.OrderManagement;
  private readonly urlNTS: string = this.conf.backendINV;

  constructor(
    private readonly http: HttpClient,
    private readonly conf: AppConfigService
  ) {}

  public getReportDealsTransactions(
    sessionKey: string,
    body: ReportDealsTransactionsBody
  ): Observable<ReportDealsTransactionsPayload> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<ReportDealsTransactionsPayload>(
      `${this.urlNTS}${this.orderManagement}/Report/worker/GetTransactions`,
      body,
      { headers: myHeaders }
    );
  }

  public getTradingSessionDemandOffers(
    sessionKey: string,
    body: TradingSessionDemandOffersBody
  ): Observable<GetTradingSessionDemandOffersResponse> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<GetTradingSessionDemandOffersResponse>(
      `${this.urlNTS}${this.orderManagement}/Report/worker/GetTradingSessionDemandOffers`,
      body,
      { headers: myHeaders }
    );
  }

  public getTradingParticipants(
    sessionKey: string,
    sectionId: number,
    sessionId: number
  ): Observable<GetTradingParticipantsResponse> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<GetTradingParticipantsResponse>(
      `${this.urlNTS}${this.orderManagement}/Report/worker/GetTradingParticipants?IdSection=${sectionId}&IdSession=${sessionId}`,
      { headers: myHeaders }
    );
  }

  public getReportBiddingProcess(
    sessionKey: string,
    sectionId: number,
    sessionId: number,
    listLotNumber?: number[]
  ): Observable<ReportBiddingProcessResponse> {
    const myHeaders: HttpHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let ListLotNumber: string = this.buildQueryParam(listLotNumber);

    return this.http.get<ReportBiddingProcessResponse>(
      `${this.urlNTS}${this.orderManagement}/Report/worker/GetBiddingProcess?IdSection=${sectionId}&IdSession=${sessionId}${ListLotNumber}`,
      { headers: myHeaders }
    );
  }

  private buildQueryParam(listLotNumber: number[]): string {
    let query: string = '';

    for (let i = 0; i < listLotNumber?.length; i++) {
      query += '&ListLotNumber=' + listLotNumber[i];
    }

    return query;
  }

}
