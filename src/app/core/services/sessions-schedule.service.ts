/* eslint-disable */

import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {AppConfigService} from "../../app-config.service";
import {role, statusSession} from "../../api.constants";
import { Observable } from 'rxjs';
import { SessionRegistrationsResponse } from './../interfaces/interface';
import {
  FullInfoForBrockerAndVizitorResponse,
  RegistrAndRevokeSessionRegistrationResponse,
  RegistrAndRevokeSessionRegistrationBody,
} from "../../core/interfaces";
import { Options } from 'devextreme-aspnet-data-nojquery';



@Injectable({
  providedIn: 'root',
})
export class SessionsScheduleService {
  private url: any = this.conf.backendINV;
  private OrderManagement: any = this.conf.OrderManagement;

  role: any;
  section: string = '';
  session: string = '';
  listGoods: string = '';

  constructor(private http: HttpClient, private conf: AppConfigService) {
    this.role = role;
  }

 public getListSessionTrader(
    SessionKey: string,
    body: object,
    listSections: number[],
    filterListGoods?: number[]
  ): Options {
    this.section = '';

    for (let i = 0; i < listSections.length; i++) {
      this.section += '&ListSection=' + listSections[i];
    }

    this.listGoods = '';
    for (let i = 0; i < filterListGoods.length; i++) {
      this.listGoods += '&FilterListGoods=' + filterListGoods[i];
    }

    return {
      loadUrl: `${this.url}${this.OrderManagement}/Sessions/GetListSession?${this.section}${this.listGoods}`,

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

 public getListSessionWorker(
    SessionKey: string,
    body: object,
    listSections: number[],
    filterListGoods
  ): Options {
    this.section = '';
    for (let i = 0; i < listSections.length; i++) {
      this.section += '&ListSection=' + listSections[i];
    }

    this.listGoods = '';
    for (let i = 0; i < filterListGoods.length; i++) {
      this.listGoods += '&FilterListGoods=' + filterListGoods[i];
    }

    return {
      loadUrl: `${this.url}${this.OrderManagement}/Sessions/worker/getListSession?${this.section}${this.listGoods}`,
      onBeforeSend(method: string, ajaxOptions: any) {
        ajaxOptions.data = body;
        ajaxOptions.headers = {
          Authorization: SessionKey,
          UasLang: JSON.parse(localStorage?.getItem('lang')),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: 'Sat, 01 Jan 2000 00:00:00 GMT',
        };
      },
    };
  }

  public getListBranchesFirmWithDetails(
    IdSection,
    listSessions,
    IdDirection,
    IdFirmClient?,
    IdContractType?
  ) {
    //просто структурные подразделения
    this.session = '';
    for (let i = 0; i < listSessions.length; i++) {
      this.session += '&ListSessions=' + listSessions[i];
    }

    let idFirmClient =
      IdFirmClient === undefined ? '' : '&IdFirmClient=' + IdFirmClient;
    let idContractType =
      IdContractType === undefined ? '' : '&IdContractType=' + IdContractType;

    return this.http
      .get(
        `${this.url}${this.OrderManagement}/Registration/GetListBranchesFirmWithDetails?${idFirmClient}${idContractType}IdSection=${IdSection}${this.session}&IdDirection=${IdDirection}`
      )
      .toPromise();
  }

  public getListBranchesAllClientsWithDetails(
    IdSection,
    listSessions,
    IdDirection
  ) {
    //клиент со структурными
    this.session = '';
    for (let i = 0; i < listSessions?.length; i++) {
      this.session += '&ListSessions=' + listSessions[i];
    }
    return this.http
      .get(
        `${this.url}${this.OrderManagement}/Registration/GetListBranchesAllClientsWithDetails?IdSection=${IdSection}${this.session}&IdDirection=${IdDirection}`
      )
      .toPromise();
  }

  public getFullInfoForBrockerAndVizitor(
    idSection: number,
    listSessions: number[],
    idDirection: number
  ): Observable<FullInfoForBrockerAndVizitorResponse> {
    //клиент со структурными
  
    this.session = '';
    for (let i = 0; i < listSessions?.length; i++) {
      this.session += '&ListSessions=' + listSessions[i];
    }

    return this.http.get<FullInfoForBrockerAndVizitorResponse>(
      `${this.url}${this.OrderManagement}/Registration/GetFullInfoForBrokerAndVisitor?IdSection=${idSection}${this.session}&IdDirection=${idDirection}`
    );
  }

  /*

  RegisterForSession(SessionKey, body){
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(`${this.url}${this.OrderManagement}/Registration/RegisterForSession`, body,{headers:myHeaders})
      .toPromise()
      .then(res => res);
  }

  RevokeSessionRegistration(SessionKey, body){
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);

    return this.http
      .post(`${this.url}${this.OrderManagement}/Registration/RevokeSessionRegistration`, body,{headers:myHeaders})
      .toPromise()
      .then(res => res);
  }
*/

  public registrAndRevokeSessionRegistrationClients(
    body: RegistrAndRevokeSessionRegistrationBody
  ): Observable<RegistrAndRevokeSessionRegistrationResponse> {

    return this.http.post<RegistrAndRevokeSessionRegistrationResponse>(
      `${this.url}${this.OrderManagement}/Registration/RegistrAndRevokeSessionRegistrationClients`,
      body
    );
  }

  public getSessionsRegistrations(
    IdSection: number,
    IdSession: number,
    IdDirection: number
  ): Observable<SessionRegistrationsResponse> {
    return this.http.get<SessionRegistrationsResponse>(
      `${this.url}${this.OrderManagement}/Registration/GetSessionRegistrations?IdSection=${IdSection}&IdSession=${IdSession}&IdDirection=${IdDirection}`
    );
  }
}
