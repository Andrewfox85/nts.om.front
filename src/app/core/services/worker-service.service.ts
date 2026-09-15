/* eslint-disable */
import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SessionRegistrationWorkerResponse,
  RegistrationDateEndResponse,
  RegistrationAnnulBody,
  RegistrationAnnulResponse,
  RegistrationRestoreBody,
  RegistrationRestoreResponse,
  TradersListBody,
  TradersListResponse,
  SessionStageDateEndResponse,
  TransferRegistrationBody,
  TransferRegistrationResponse,
} from '../../core/interfaces';
@Injectable({
  providedIn: 'root',
})
export class WorkerService {
  private url: any = this.conf.backendINV;
  private OrderManagement: any = this.conf.OrderManagement;
  session: string = '';

  constructor(private http: HttpClient, private conf: AppConfigService) {}

  /* Просмотр регистраций на сессию  - получение данных в грид*/
  public getSessionRegistrations(
    sessionKey: string,
    idSection: number,
    idSession: number,
    SearchString: string
  ): Observable<SessionRegistrationWorkerResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    let searchString =
      SearchString === undefined ? '' : '&SearchString=' + SearchString;

    return this.http.get<SessionRegistrationWorkerResponse>(
      `${this.url}${this.OrderManagement}/Registration/worker/GetSessionRegistrations?IdSection=${idSection}&IdSession=${idSession}${searchString}`,
      { headers: myHeaders }
    );
  }

  /* Просмотр регистраций на сессию  - получение дат регистрации*/
  public getRegistrationDateEndAllDirections(
    sessionKey: string,
    idSection: number,
    idSession: number
  ): Observable<RegistrationDateEndResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http.get<RegistrationDateEndResponse>(
      `${this.url}${this.OrderManagement}/Registration/worker/GetRegistrationDateEndAllDirections?IdSection=${idSection}&IdSession=${idSession}`,
      { headers: myHeaders }
    );
  }

  /* Отмена регистрации */
  public registrationAnnulClients(
    sessionKey: string,
    body: RegistrationAnnulBody
  ): Observable<RegistrationAnnulResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<RegistrationAnnulResponse>(
      `${this.url}${this.OrderManagement}/Registration/worker/RegistrationAnnulClients`,
      body,
      { headers: myHeaders }
    );
  }

  /* Восстановление регистрации */
  public registrationRestoreClients(
    sessionKey: string,
    body: RegistrationRestoreBody
  ): Observable<RegistrationRestoreResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<RegistrationRestoreResponse>(
      `${this.url}${this.OrderManagement}/Registration/worker/RegistrationRestoreClients`,
      body,
      { headers: myHeaders }
    );
  }

  public getTradersList(
    sessionKey: string,
    body: TradersListBody
  ): Observable<TradersListResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http.post<TradersListResponse>(
      `${this.url}${this.OrderManagement}/Accred/worker/GetTradersList`,
      body,
      { headers: myHeaders }
    );
  }

  //получение даты окончания сессии
  public getSessionStageDateEnd(
    sessionKey: string,
    idSection: number,
    idSession: number,
    idDirection: number,
    isForDemoff: boolean
  ): Observable<SessionStageDateEndResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<SessionStageDateEndResponse>(
      `${this.url}${this.OrderManagement}/Submission/GetSessionStageDateEnd?IdSection=${idSection}&IdSession=${idSession}&IdDirection=${idDirection}&IsForDemoff=${isForDemoff}`,
      { headers: myHeaders }
    );
  }

  //перенос регистраций в торги
  public transferRegistration(
    sessionKey,
    body: TransferRegistrationBody
  ): Observable<TransferRegistrationResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post<TransferRegistrationResponse>(
      `${this.url}${this.OrderManagement}/Transfer/worker/TransferRegistration`,
      body,
      { headers: myHeaders }
    );
  }
}
