/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AppConfigService } from 'src/app/app-config.service';
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { FullCharacteristics } from "./add-nsi-good.service";

export interface GoodDescriptionFull {
  goodDescriptions: FullCharacteristics[]
}

@Injectable({
  providedIn: 'root'
})

export class SidebarService {
  private OrderManagement: any = this.conf.OrderManagement;
  private url: any = this.conf.backendINV;

  constructor(
    private http: HttpClient,
    private conf: AppConfigService
  ) {
  }
  //получение детальных сведений о товаре
  GetGoodDescriptionFull(SessionKey: string, IdGood: number): Observable<GoodDescriptionFull> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get<GoodDescriptionFull>
    (`${this.url}${this.OrderManagement}/Submission/GetGoodDescriptionFull?IdGood=${IdGood}`, {headers: myHeaders})
  }

  private _trigger = new Subject<void>();

  get trigger$() {
    return this._trigger.asObservable();
  }

  private template = new Subject<void>();

  get template$() {
    return this.template.asObservable();
  }


  public editButton() {
    this._trigger.next();
  }

  public createEditTemplate() {
    this.template.next();
  }


  public chooseFirm() {
    this._trigger.next();
  }

  public dataForReqSubject = new BehaviorSubject<any>({});
  dataForReq$ = this.dataForReqSubject.asObservable();

  public typeSubject = new BehaviorSubject<string>('');
  type$ = this.typeSubject.asObservable();
}
