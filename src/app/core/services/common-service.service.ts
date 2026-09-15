/* eslint-disable */
import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AccreditedRoleService } from './accredited-role.service';
import { filter, switchMap, take } from 'rxjs/operators';
import { Observable, EMPTY } from 'rxjs';
import { UnsoldGetListSessArchResponse } from '../interfaces/interface';
import { REF_BOOK_NAMES } from '../enums';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { sessionStage, sectionID } from 'src/app/api.constants';
import { GetByNameResponse } from "./catalog-service.service";

export interface FirmBranch {
  idFirmBranch: number;
  nameShort: string;
  nameFull: string;
  taxNumber: string;
}

export interface IDocFileContentResponse {
  content: string;
  fileName: string;
}

export interface FirmBranchResponse {
  branchesFirms: FirmBranch[];
}

export interface FirmClient {
  firmClient: number;
  nameShort: string;
  nameFull: string;
  regNumber: string;
  regNumberWithNameShort: string;
  contractType: number;
  branchesClients: null | unknown;
}

export interface FirmClientResponse {
  branchesFirmsOfAllClients: FirmClient[];
}

export interface IContractType {
  refBookKey: number;
  refBookValue: string;
  disabled: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  private get urlNTS(): string {
    return this.conf.backendINV;
  }

  private get OrderManagement(): string {
    return this.conf.OrderManagement;
  }

  private get NSIManagement(): string {
    return this.conf.NSIManagement;
  }

  private get uasService(): string {
    return this.conf.uasService;
  }

  private get trading(): string {
    return this.conf.trading;
  }

  error = false;
  messageError: string;

  constructor(
    private http: HttpClient,
    private conf: AppConfigService,
    private readonly accreditedRoleService: AccreditedRoleService
  ) {}

  toOADate(date) {
    let utc18991230 = new Date('1899-12-30').getTime();
    let msPerDay = 24 * 60 * 60 * 1000;
    let offsetTime = new Date().getTimezoneOffset() * -1; // correct value from negative to positive number
    if (date instanceof Date) {
      date = new Date(date).getTime();
    }
    let res = -utc18991230 + date + offsetTime * 60 * 1000;

    return Number(Math.trunc(res / msPerDay));
  }

  public actualDimensions(value: string, part: number): string {
    //отображение фактических размеров без типа данных
    return value.split('#')[part];
  }

  public choosenSessionStage(
    stageId: number,
    isWorker: boolean,
    currentLang: string
  ): string {
    const stageKeys: Record<number, string> = {
      [sessionStage.new]: 'sessionStage.new',
      [sessionStage.applicationsOpen]: 'sessionStage.applicationsOpen',
      [sessionStage.purchaseOrdersOpen]: 'sessionStage.purchaseOrdersOpen',
      [sessionStage.applicationsSaleOpen]: 'sessionStage.applicationsSaleOpen',
      [sessionStage.applicationsClosed]: 'sessionStage.applicationsClosed',
      [sessionStage.completedProcessingApplications]:
        'sessionStage.completedProcessingApplications',
      [sessionStage.sessionEnded]: 'sessionStage.sessionEnded',
      [sessionStage.completedDataTransferArchive]:
        'sessionStage.completedDataTransferArchive',
    };

    if (stageId === sessionStage.transferAuctionCompleted) {
      stageKeys[stageId] = isWorker
        ? 'sessionStage.transferAuctionCompletedWorker'
        : 'sessionStage.transferAuctionCompleted';
    }

    return stageKeys[stageId]
      ? getTranslateResultByCurrentLang(currentLang, stageKeys[stageId])
      : '';
  }

  public choosenSection(
    sectionId: number,
    currentLang: string
  ): string {
    const sectionNames: Record<number, string> = {
      [sectionID.metalProducts]: 'section-types.metalProducts',
      [sectionID.forestProducts]: 'section-types.forestProducts',
      [sectionID.agricultural]: 'section-types.agriculturalProducts',
      [sectionID.promising]: 'section-types.promisingProducts'
    };

    return sectionNames[sectionId]
      ? getTranslateResultByCurrentLang(currentLang, sectionNames[sectionId])
      : '';
  }

  public getContractOption(
    key: number,
    currentLang: string,
    labelKey: string,
    disabled: boolean
  ): IContractType {
    return {
      refBookKey: key,
      refBookValue: getTranslateResultByCurrentLang(currentLang, labelKey),
      disabled: disabled,
    };
  }

  handleInput(e: any, field) {
    //при вводе в dx-number-box значения - не добавляются лишние нули
    const input = e.event.target;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const value = input.value;

    // Проверяем, выделена ли запятая
    if (
      selectionStart !== selectionEnd &&
      value.includes(',') &&
      selectionStart <= value.indexOf(',') &&
      selectionEnd > value.indexOf(',')
    ) {
      // Отменяем стандартное поведение
      e.event.preventDefault();

      // Вручную обрабатываем ввод
      const newValue =
        value.substring(0, selectionStart) +
        e.event.key +
        (value[selectionEnd - 1].endsWith(',') ? ',' : '') +
        value.substring(selectionEnd);
      const parsedValue = parseFloat(newValue.replace(',', '.'));

      if (!isNaN(parsedValue)) {
        // Восстанавливаем позицию курсора
        input.setSelectionRange(selectionEnd, selectionEnd);
        field.patchValue(parsedValue);
      }
    }
  }

  round(value, p) {
    const precision = Math.pow(10, p);
    return Math.round(value * precision) / precision;
  }

  public checkPrivileges(str: string): boolean {
    let privilegesArray = localStorage.getItem('privileges');

    return privilegesArray?.includes(str);
  }

  HasWorkerRole(SessionKey) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(`${this.urlNTS}${this.OrderManagement}/Auth/HasWorkerRole`, {
        headers: myHeaders,
      })
      .toPromise();
  }

  // получение языка пользователя
  /*GetLanguageFromRedis(SessionKey) {
   const myHeaders = new HttpHeaders().set('Authorization', SessionKey).set('Accept', 'application/json')
    return this.http
      .get(`${this.urlNTS}${this.uasService}/RedisExchange/GetLanguageFromRedis`,{headers:myHeaders}).toPromise()

  }
  */

  // todo deprecated on swagger
  public getSections(sessionKey: string): Observable<any> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return sessionKey === ''
      ? this.http.get(
          `${this.urlNTS}${this.OrderManagement}/Filters/GetSections`
        )
      : this.http.get(
          `${this.urlNTS}${this.OrderManagement}/Filters/GetSections`,
          {
            headers: myHeaders,
          }
        );
  }

  ConvertCurrency(SessionKey, Number, IdCurrencyFrom, IdCurrencyTo, Date) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get(
      `${this.urlNTS}${this.OrderManagement}/Currency/ConvertCurrency?Number=${Number}&IdCurrencyFrom=${IdCurrencyFrom}&IdCurrencyTo=${IdCurrencyTo}&Date=${Date}`,
      { headers: myHeaders }
    );
  }

  GetPrecision(SessionKey, IdCurrency) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get(
      `${this.urlNTS}${this.OrderManagement}/Currency/GetPrecision?IdCurrency=${IdCurrency}`,
      { headers: myHeaders }
    );
  }

  GetFullData(SessionKey) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(`${this.urlNTS}${this.uasService}/RedisExchange/GetDataForFront`, {
        headers: myHeaders,
      })
      .toPromise();
  }

  /*  GetHeaderInfoFromRedis(SessionKey){
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get(`${this.urlNTS}${this.uasService}/RedisExchange/GetHeaderInfoFromRedis`, {headers:myHeaders}).toPromise();
  }*/

  /*
  GetPrivilegesFromRedis(SessionKey){
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return   SessionKey === "" ?
    this.http.get(`${this.urlNTS}${this.uasService}/RedisExchange/GetPrivilegesFromRedis`).toPromise():
    this.http.get(`${this.urlNTS}${this.uasService}/RedisExchange/GetPrivilegesFromRedis`, {headers:myHeaders}).toPromise();
  }
*/

  GetRefbookByName(SessionKey, refbookName, IdSection?, IdRelatedObject?) {
    if (refbookName === REF_BOOK_NAMES.SESSION_NAMES && !IdSection) return;
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    let idSection = IdSection === undefined ? '' : '&IdSection=' + IdSection;
    let idRelatedObject =
      IdRelatedObject === undefined
        ? ''
        : '&IdRelatedObject=' + IdRelatedObject;

    return SessionKey === ''
      ? this.http
          .get(
            `${this.urlNTS}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=${refbookName}${idSection}${idRelatedObject}`
          )
          .toPromise()
      : this.http
          .get(
            `${this.urlNTS}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=${refbookName}${idSection}${idRelatedObject}`,
            { headers: myHeaders }
          )
          .toPromise();
  }

  getById(
    sessionKey: string,
    refbookId: number,
    idSection: number
  ): Observable<Object> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    return this.http.get(
      `${this.urlNTS}${this.NSIManagement}/classifiers/GetById?reference_id=${refbookId}&section_id=${idSection}`,
      { headers: myHeaders }
    );
  }

  GetBranchesFirmsOfAllClients(
    SessionKey: string,
    body: any
  ): Promise<any | undefined> {
    return this.accreditedRoleService.role$
      .pipe(
        filter((role) => role !== ''),
        take(1),
        switchMap((role) => {
          if (role === '0') {
            return EMPTY;
          }
          let myHeaders = new HttpHeaders();
          myHeaders = myHeaders.set('Authorization', SessionKey);
          return this.http.post(
            `${this.urlNTS}${this.OrderManagement}/Accred/GetBranchesFirmsOfAllClients`,
            body,
            { headers: myHeaders }
          );
        })
      )
      .toPromise();
  }

  GetBranchesFirmsOfAllClientsFilter(
    SessionKey: string,
    body: Record<string, boolean>
  ): Observable<FirmClientResponse> {
    return this.accreditedRoleService.role$.pipe(
      filter((role) => role !== ''),
      switchMap((role) => {
        if (role === '0') {
          return EMPTY;
        }
        let myHeaders = new HttpHeaders();
        myHeaders = myHeaders.set('Authorization', SessionKey);
        return this.http.post<FirmClientResponse>(
          `${this.urlNTS}${this.OrderManagement}/Accred/GetBranchesFirmsOfAllClients`,
          body,
          { headers: myHeaders }
        );
      })
    );
  }

  GetDirectOfferDocumentContent(
    SessionKey: string,
    IdOffer: number,
    IdDocument: number,
    IdDirection: number
  ): Observable<IDocFileContentResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http.get<IDocFileContentResponse>(
      `${this.urlNTS}${this.trading}/DemandOffer/GetDocContent?IdDirection=${IdDirection}&IdDemandOffer=${IdOffer}&IdDocument=${IdDocument}`,
      { headers: myHeaders }
    );
  }

  GetBranchesListFirm(SessionKey: string, body: any): Promise<any | undefined> {
    return this.accreditedRoleService.role$
      .pipe(
        take(1),
        filter((role) => role !== ''),
        switchMap((role) => {
          if (role === '0') {
            return EMPTY;
          }
          let myHeaders = new HttpHeaders();
          myHeaders = myHeaders.set('Authorization', SessionKey);
          return this.http.post(
            `${this.urlNTS}${this.OrderManagement}/Accred/GetBranchesListFirm`,
            body,
            { headers: myHeaders }
          );
        })
      )
      .toPromise();
  }

  GetBranchesListFirmForFilter(
    SessionKey: string,
    body: Record<string, boolean>
  ): Observable<FirmBranchResponse> {
    return this.accreditedRoleService.role$.pipe(
      filter((role) => role !== ''),
      switchMap((role) => {
        if (role === '0') {
          return EMPTY;
        }
        let myHeaders = new HttpHeaders();
        myHeaders = myHeaders.set('Authorization', SessionKey);
        return this.http.post<FirmBranchResponse>(
          `${this.urlNTS}${this.OrderManagement}/Accred/GetBranchesListFirm`,
          body,
          { headers: myHeaders }
        );
      })
    );
  }

  // идентификатор документа, поле ID_DOCUMENT курсора процедуры PRC_GET_OFFER_DOCUMENTS
  GetOfferDocumentContent(
    sessionKey: string,
    idOffer: number,
    idDocument: number,
    idDirection: number,
    typeRequest?: boolean
  ): Observable<IDocFileContentResponse> {
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);
    const url = typeRequest
      ? `${this.trading}/DemandOffer/GetDocContent`
      : `${this.OrderManagement}/Documents/GetDocumentContent`;
    const IdOffer = typeRequest
      ? `IdDemandOffer=${idOffer}`
      : `IdOffer=${idOffer}`;

    return this.http.get<IDocFileContentResponse>(
      `${this.urlNTS}${url}?IdDirection=${idDirection}&${IdOffer}&IdDocument=${idDocument}`,
      { headers: myHeaders }
    );
  }

  ucFirst(str) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
  }

  SetPreferredLanguage(SessionKey: string, body: any) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.uasService}/Buce/SetPreferredLanguage`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  public logOut(sessionKey: string): Observable<unknown> {
    localStorage.removeItem('privileges');
    sessionStorage.removeItem('createOffer');
    localStorage.removeItem('sections');
    localStorage.removeItem('autoControlChanges');
    //localStorage.removeItem('offerManagement');
    localStorage.removeItem('viewOffer');
    localStorage.removeItem('unrealizedVolumesData');
    // sessionStorage.removeItem('CATALOG');
    const myHeaders = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.post(
      `${this.urlNTS}${this.uasService}/Auth/Logout`,
      {},
      {
        headers: myHeaders,
      }
    );
  }

  //вход в торги
  SessionLogin(SessionKey: string, SectionId, SessionId) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/Sessions/SessionLogin?IdSection=${SectionId}&IdSession=${SessionId}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  // получение списка сессий, с которых может быть выполнен перенос
  public unsoldGetListSessArch(
    sessionKey: string,
    idSection: number
  ): Observable<UnsoldGetListSessArchResponse> {
    const headers = new HttpHeaders().set('Authorization', sessionKey);

    return this.http.get<UnsoldGetListSessArchResponse>(
      `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/UnsoldGetListSessArch?IdSection=${idSection}`,
      { headers }
    );
  }

  //получение списка сессий, на которые может быть выполнен перенос
  UnsoldGetListSessTrade(SessionKey, IdSection, IdSession) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/UnsoldGetListSessTrade?IdSection=${IdSection}&IdSession=${IdSession}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //отображение списка архивных заявок с детализацией по товарам
  UnsoldGetListMasterWithDetails(SessionKey, IdSection, IdSession) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/UnsoldGetListMasterWithDetails?IdSection=${IdSection}&IdSession=${IdSession}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //просмотр архивной заявки для непроданных лотов
  UnsoldGetOfferFullInfo(SessionKey, IdSection, IdSession, IdOffer) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/GetOfferFullInfo?IdSection=${IdSection}&IdSession=${IdSession}&IdOffer=${IdOffer}`,
        { headers: myHeaders }
      )
      .toPromise();
  }

  //первичная проверка заявок
  UnsoldCheckOffers(SessionKey: string, body: any) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/UnsoldCheckOffers`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  //перенос лота на выбранную сессию
  UnsoldCopyLot(SessionKey: string, body: any) {
    const myHeaders = new HttpHeaders().set('Authorization', SessionKey);
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/UnsoldOffers/worker/UnsoldCopyLotWithValidation`,
        body,
        { headers: myHeaders }
      )
      .toPromise()
      .then((res) => res);
  }

  public getAllSections(): Observable<GetByNameResponse> {
    return this.http.get<GetByNameResponse>(
      `${this.urlNTS}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=sections`
    );
  }

   // получение серверного времени
   public getServerDatetime(): Observable<number> {
    return this.http.get<number>(
      `${this.urlNTS}${this.trading}/General/GetServerDatetime`
    );
  }
}
