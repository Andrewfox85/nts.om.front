/* eslint-disable */
import { Injectable } from '@angular/core';
import { AppConfigService } from '../../app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom, firstValueFrom, Observable } from 'rxjs';
import {
  IResponse,
  LimitsTreeNode,
  LimitsTreeResult,
  ListOffersCatalogueApiModel,
} from '../interfaces/interface';
import {
  DemandOfferCataloguePayload,
  DemandOfferCatalogueResponse,
  ExportResponse,
  DownloadResponse,
} from 'src/app/shared/interfaces';
import { REF_BOOK_NAMES } from '../enums';
import {
  DepositTypeResponse,
  DepositDetailsResponse,
  DepositFirmDealsResponse,
  DepositFirmTaxResponse,
  DepositClientsResponse,
  DepositClientDealsResponse,
  DepositClientTaxResponse,
  DepositDealsResponse,
  DepositTaxResponse,
  RegulationPermissResponse,
  OffersDetailsResponse,
  SetOutRegulationPermissBody,
  SetOutRegulationNoticeBody,
  DeleteOutRegulationPermissBody,
  RegulationActionsResponse,
  RegulationDemoffResponse,
  LimitationsResponse,
  LimitsParticipantsResponse,
  LimitationSpecifiesResponse,
  SetLimitationBody,
  SetLimitationResponse,
  DeleteLimitationBody,
  PriceStepBody
} from "../../core/interfaces";

@Injectable({
  providedIn: 'root',
})
export class OfferManagementService {
  sectionId: number = 0;
  typeOfSession: string;
  sessionId: number = null;

  choosenFirm: any;

  sessionForDeposit: any;

  private OrderManagement: any = this.conf.OrderManagement;
  private urlNTS: any = this.conf.backendINV;
  private NSIManagement: any = this.conf.NSIManagement;
  private trading: any = this.conf.trading;

  constructor(private http: HttpClient, private conf: AppConfigService) {}

  //справочник
  getByName(ClassName, SectionId?) {
    if (ClassName === REF_BOOK_NAMES.SESSION_NAMES && !SectionId) return;
    let sectionId = SectionId === undefined ? '' : '&SectionId=' + SectionId;

    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Filters/GetRefbookByName?RefbookName=${ClassName}${sectionId}`
      )
      .toPromise();
  }

  //шаблоны для отклонения
  getRejectionTemplates(SectionId?) {
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/GetRejectionTemplates?IdSection=${SectionId}`
      )
      .toPromise();
  }

  //заявки Работник
  public getListOffersCatalogueWorker(body: object): Observable<ListOffersCatalogueApiModel> {
    return this.http
      .post<ListOffersCatalogueApiModel>(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/GetListOffersCatalogue`,
        body
      );
  }

  //заявки Трейдер
  public getListOffersCatalogueTrader(body: object): Observable<ListOffersCatalogueApiModel> {
    return this.http
      .post<ListOffersCatalogueApiModel>(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/GetListOffersCatalogueTrader`,
        body
      );
  }

  //создание/ редактирование нового шаблона
  setRejectionTemplates(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/SetRejectionTemplates`,
        body
      )
      .toPromise()
      .then((res) => res);
  }

  //удаление шаблона
  deleteRejectionTemplate(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/DeleteRejectionTemplate`,
        body
      )
      .toPromise()
      .then((res) => res);
  }

  // включение заявки в реестр
  public offersApprove(
    body: DemandOfferCataloguePayload
  ): Observable<DemandOfferCatalogueResponse> {
    return this.http.post<DemandOfferCatalogueResponse>(
      `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/Approve`,
      body,
    );
  }

  //экспорт в Excel работник
  requestExportManageWorker(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/worker/RequestExportManageWorker`,
        body
      )
      .toPromise()
      .then((res) => res);
  }

  //экспорт в Excel трейдер
  requestExportManageTrader(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/RequestExportManageTrader`,
        body
      )
      .toPromise()
      .then((res) => res);
  }

  /* ------------------Открытие доступа---------------------- */

  //изменения заголовка кнопки в УЗ
  getManageDetails(SectionId, SessionId) {
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Permissions/worker/GetManageDetails?IdSection=${SectionId}&IdSession=${SessionId}`,
      )
      .toPromise();
  }

  //доступные действия
  public getOutRegulationActions(
    sectionId: number,
    sessionId: number,
    directionId: number
  ): Observable<RegulationActionsResponse> {
    return this.http.get<RegulationActionsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/GetOutRegulationActions?IdSection=${sectionId}&IdSession=${sessionId}&IdDirection=${directionId}`,
    );
  }

  //список заявок
  public getOutRegulationDemoff(
    sectionId: number,
    sessionId: number,
    directionId: number,
    firmId: number,
    traderId: number,
    actionId: number
  ): Observable<RegulationDemoffResponse> {
    return this.http
      .get<RegulationDemoffResponse>(
        `${this.urlNTS}${this.OrderManagement}/Permissions/worker/GetOutRegulationDemoff?IdSection=${sectionId}&IdSession=${sessionId}&IdDirection=${directionId}&IdFirm=${firmId}&IdTrader=${traderId}&IdAction=${actionId}`,
      );
  }

  //список ранее выданных разрешений
  public getOutRegulationPermiss(
    sectionId: number,
    sessionId: number
  ): Observable<RegulationPermissResponse> {
    return this.http.get<RegulationPermissResponse>(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/GetOutRegulationPermiss?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //список заявка - дата использования
  public getOutRegulationDetails(
    permissionId: number
  ): Observable<OffersDetailsResponse> {
    return this.http.get<OffersDetailsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/GetOutRegulationDetails?IdPermission=${permissionId}`,
    );
  }

  // сохранение изменений
  public setOutRegulationPermiss(
    body: SetOutRegulationPermissBody
  ): Observable<Object> {
    return this.http.post(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/SetOutRegulationPermiss`,
      body,
    );
  }

  // повторное уведомление участника
  public setOutRegulationNotice(
    body: SetOutRegulationNoticeBody
  ): Observable<Object> {
    return this.http.post(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/SetOutRegulationNotice`,
      body,
    );
  }

  // удаление разрешения
  public deleteOutRegulationPermiss(
    body: DeleteOutRegulationPermissBody
  ): Observable<Object> {
    return this.http.post(
      `${this.urlNTS}${this.OrderManagement}/Permissions/worker/DeleteOutRegulationPermiss`,
      body,
    );
  }

  /* -----------------------Добаление ограничений---------------------------- */

  //получение ограничений
  public getLimitations(
    sectionId: number,
    sessionId: number
  ): Observable<LimitationsResponse> {
    return this.http.get<LimitationsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Sessions/worker/GetLimitations?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //получение участников
  public getLimitParticipants(
    sectionId: number,
    sessionId: number,
    ListLimits?: number[]
  ): Observable<LimitsParticipantsResponse> {
    let listLimits = '';
    for (let i = 0; i < ListLimits?.length; i++) {
      listLimits += '&ListLimits=' + ListLimits[i];
    }

    return this.http.get<LimitsParticipantsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Sessions/worker/GetLimitParticipants?IdSection=${sectionId}&IdSession=${sessionId}${listLimits}`,
    );
  }

  //получение выбранных товарных хар-к
  public getLimitationSpecify(
    sectionId: number,
    sessionId: number,
    limitationId: number
  ): Observable<LimitationSpecifiesResponse> {
    return this.http.get<LimitationSpecifiesResponse>(
      `${this.urlNTS}${this.OrderManagement}/Sessions/worker/GetLimitationSpecify?IdSection=${sectionId}&IdSession=${sessionId}&IdLimitation=${limitationId}`,
    );
  }

  //добавление/изменение ограничения
  public setLimitation(
    body: SetLimitationBody
  ): Observable<SetLimitationResponse> {
    return this.http.post<SetLimitationResponse>(
      `${this.urlNTS}${this.OrderManagement}/Sessions/worker/SetLimitation`,
      body,
    );
  }

  //удаление ограничения
  public deleteLimitation(
    body: DeleteLimitationBody
  ): Observable<Object> {
    return this.http.post(
      `${this.urlNTS}${this.OrderManagement}/Sessions/worker/DeleteLimitation`,
      body,
    );
  }

  //получение НГ/ТГ/товаров в зав-сти от настройки сессии
  public getTreeGroupsBySessionId(
    SectionId: number,
    SessionId: string
  ): Observable<IResponse<LimitsTreeResult[]>> {
    const headerDict = {
      'Section-Id': SectionId.toString(),
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http.get<IResponse<LimitsTreeResult[]>>(
      `${this.urlNTS}${this.NSIManagement}/goods/GetTreeGroupsBySessionId?session_id=${SessionId}`,
      requestOptions
    );
  }

  public getTreeGroups(
    SectionId: number
  ): Observable<IResponse<LimitsTreeNode[]>> {
    const headerDict = {
      'Section-Id': SectionId.toString(),
    };

    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };

    return this.http.get<IResponse<LimitsTreeNode[]>>(
      `${this.urlNTS}${this.NSIManagement}/goods/GetTreeGroups?section_id=${SectionId}`,
      requestOptions
    );
  }

  /* ---------------------------Задаток----------------------------------- */

  //получение типа задатка, по которому работат участник - 0-без задатка, 1 - задаток по сделкам, 2- задаток по биржевому сбору
  public getFirmDepositType(): Observable<DepositTypeResponse> {
    return this.http.get<DepositTypeResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/GetFirmDepositType`
    );
  }

  //получение задатка по заявке
  public depositDetailsOffer(
    directionId: number,
    sectionId: number,
    sessionId: number,
    offerId: number
  ): Observable<DepositDetailsResponse> {
    return this.http.get<DepositDetailsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositDetails?IdDirection=${directionId}&IdSection=${sectionId}&IdSession=${sessionId}&IdDemandOffer=${offerId}`,
    );
  }

  //получение задатка по сделкам
  public depositDetailsFirmDeals(
    sectionId: number,
    sessionId: number
  ): Observable<DepositFirmDealsResponse> {
    return this.http.get<DepositFirmDealsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositDetailsFirmDeals?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //получение задатка по биржевому сбору
  public depositDetailsFirmTax(
  ): Observable<DepositFirmTaxResponse> {
    return this.http.get<DepositFirmTaxResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositDetailsFirmTax`,
    );
  }

  //получение списка клиентов работающих по задатку
  public depositGetClients(
    sectionId: number,
    sessionId: number
  ): Observable<DepositClientsResponse> {
    return this.http.get<DepositClientsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositGetClients?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //для клиентов работающих по задатку по сделкам
  public depositDetailsClientDeals(
    sectionId: number,
    sessionId: number
  ): Observable<DepositClientDealsResponse> {
    return this.http.get<DepositClientDealsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositDetailsClientDeals?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //для клиентов работающих по задатку по биржевому сбору
  public depositDetailsClientTax(
    sectionId: number,
    sessionId: number
  ): Observable<DepositClientTaxResponse> {
    return this.http.get<DepositClientTaxResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/DepositDetailsClientTax?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //для клиентов работающих по задатку по сделкам РАботник
  public depositDetailsClientDealsWorker(
    sectionId: number,
    sessionId: number
  ): Observable<DepositDealsResponse> {
    return this.http.get<DepositDealsResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/worker/GetDepositDetailsDeals?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //для клиентов работающих по задатку по биржевому сбору  РАботник
  public depositDetailsClientTaxWorker(
    sectionId: number,
    sessionId: number
  ): Observable<DepositTaxResponse> {
    return this.http.get<DepositTaxResponse>(
      `${this.urlNTS}${this.OrderManagement}/Deposit/worker/GetDepositDetailsTax?IdSection=${sectionId}&IdSession=${sessionId}`,
    );
  }

  //-------------------------------Передача заявок др трейдеру-----------------------------------

  //получение списка трейдеров
  detTradersList(body) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/Accred/GetTradersList`,
        body,
      )
      .toPromise()
      .then();
  }

  //определение доступных для переноса направлений
  detTransferDirection(SectionId) {
    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/GetTransferDirection?IdSection=${SectionId}`,
      )
      .toPromise();
  }

  //перенос выбранных заявок
  transferDemandOffers(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/TransferDemandOffers`,
        body,
      )
      .toPromise()
      .then((res) => res);
  }

  //перенос всех заявок по направлению
  transferAllDemandOffers(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/TransferAllDemandOffers`,
        body,
      )
      .toPromise()
      .then((res) => res);
  }

  //перенос заявок в торги
  transferDemandOffer(body: object) {
    return this.http
      .post(
        `${this.urlNTS}${this.OrderManagement}/Transfer/worker/TransferDemandOffer`,
        body,
      )
      .toPromise()
      .then((res) => res);
  }

  //получения идентификатора действующего режима активации заявок
  checkActivationMode(
    SectionId,
    SessionId,
    NumberOffers,
    NumberDemands
  ) {
    return lastValueFrom(
      this.http.get<ResponseType>(
        `${this.urlNTS}${this.trading}/DemandOffer/CheckActivationMode?IdSection=${SectionId}&IdSession=${SessionId}&NumberOffers=${NumberOffers}&NumberDemands=${NumberDemands}`,
      )
    );
  }

  //проверка были ли проведена процедура допуска
  isAdmissionProcessed(SectionId, SessionId) {
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/Transfer/worker/IsAdmissionProcessed?IdSection=${SectionId}&IdSession=${SessionId}`,
      )
      .toPromise();
  }

  //получение параметров допуска
  buceGetAdmissionOptions(SectionId, SessionId) {
    return this.http
      .get(
        `${this.urlNTS}${this.trading}/Transfer/worker/BuceGetAdmissionOptions?IdSection=${SectionId}&IdSession=${SessionId}`,
      )
      .toPromise();
  }

  //-------------------------------Ценовой контроль-----------------------------------

  //проверка наличия контроля ценовых параметров
  checkActivePriceLimit(
    SectionId,
    SessionId,
    ModelId,
    DirectionId
  ) {
    return firstValueFrom(
      this.http.get(
        `${this.urlNTS}${this.OrderManagement}/Submission/CheckActivePriceLimit?IdSection=${SectionId}&IdSession=${SessionId}&IdModel=${ModelId}&IdDirection=${DirectionId}`,
      )
    );
  }

  //получение котировки для биржевого товара
  getPriceLimitQuotation(
    SectionId,
    SessionId,
    ModelId,
    DirectionId,
    goodId,
    currencyId,
    vatPercent,
    unitId,
    volume,
    paymentTypeId,
    basisValueId,
    placeLinkId?,
    placeDetails?
  ) {
    let IdPlaceLink = placeLinkId === null ? '' : '&IdPlaceLink=' + placeLinkId;
    let PlaceDetails =
      placeDetails === null ? '' : '&PlaceDetails=' + placeDetails;
    let VatPercent = vatPercent === null ? '' : '&VatPercent=' + vatPercent;

    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPriceLimitQuotation?IdSection=${SectionId}&IdSession=${SessionId}&IdModel=${ModelId}&IdDirection=${DirectionId}&IdGood=${goodId}&IdCurrency=${currencyId}${VatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${IdPlaceLink}${PlaceDetails}`,
      )
      .toPromise();
  }

  //получения котировки для товара-аналога
  getPriceLimitQuotationAnalog(
    SectionId,
    SessionId,
    ModelId,
    groupNomenclatureId,
    groupGoodId,
    nameGoodId,
    goodDescription,
    currencyId,
    vatPercent,
    unitId,
    volume,
    paymentTypeId,
    basisValueId,
    placeLinkId?,
    placeDetails?
  ) {
    let IdGroupNomenclature =
      groupNomenclatureId === null
        ? ''
        : '&IdGroupNomenclature=' + groupNomenclatureId;
    let IdGroupGood = groupGoodId === null ? '' : '&IdGroupGood=' + groupGoodId;
    let IdNameGood = nameGoodId === null ? '' : '&IdNameGood=' + nameGoodId;
    let GoodDescription =
      goodDescription === null ? '' : '&GoodDescription=' + goodDescription;
    let IdPlaceLink = placeLinkId === null ? '' : '&IdPlaceLink=' + placeLinkId;
    let PlaceDetails =
      placeDetails === null ? '' : '&PlaceDetails=' + placeDetails;
    let VatPercent = vatPercent === null ? '' : '&VatPercent=' + vatPercent;

    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPriceLimitQuotationAnalog?IdSection=${SectionId}&IdSession=${SessionId}&IdModel=${ModelId}${IdGroupNomenclature}${IdGroupGood}${IdNameGood}${GoodDescription}&IdCurrency=${currencyId}${VatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${IdPlaceLink}${PlaceDetails}`,
      )
      .toPromise();
  }

  //получение ценового коридора для биржевого товара
  getPriceLimitCorridor(
    SectionId,
    SessionId,
    ModelId,
    DirectionId,
    goodId,
    currencyId,
    vatPercent,
    unitId,
    volume,
    paymentTypeId,
    basisValueId,
    placeLinkId?,
    placeDetails?
  ) {
    let IdPlaceLink = placeLinkId === null ? '' : '&IdPlaceLink=' + placeLinkId;
    let PlaceDetails =
      placeDetails === null ? '' : '&PlaceDetails=' + placeDetails;
    let VatPercent = vatPercent === null ? '' : '&VatPercent=' + vatPercent;

    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPriceLimitCorridor?IdSection=${SectionId}&IdSession=${SessionId}&IdModel=${ModelId}&IdDirection=${DirectionId}&IdGood=${goodId}&IdCurrency=${currencyId}${VatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${IdPlaceLink}${PlaceDetails}`,
      )
      .toPromise();
  }

  //получения ценового коридора для товара-аналога
  getPriceLimitCorridorAnalog(
    SectionId,
    SessionId,
    ModelId,
    groupNomenclatureId,
    groupGoodId,
    nameGoodId,
    goodDescription,
    currencyId,
    vatPercent,
    unitId,
    volume,
    paymentTypeId,
    basisValueId,
    placeLinkId?,
    placeDetails?
  ) {
    let VatPercent = vatPercent === null ? '' : '&VatPercent=' + vatPercent;
    let IdGroupNomenclature =
      groupNomenclatureId === null
        ? ''
        : '&IdGroupNomenclature=' + groupNomenclatureId;
    let IdGroupGood = groupGoodId === null ? '' : '&IdGroupGood=' + groupGoodId;
    let IdNameGood = nameGoodId === null ? '' : '&IdNameGood=' + nameGoodId;
    let GoodDescription =
      goodDescription === null ? '' : '&GoodDescription=' + goodDescription;
    let IdPlaceLink = placeLinkId === null ? '' : '&IdPlaceLink=' + placeLinkId;
    let PlaceDetails =
      placeDetails === null ? '' : '&PlaceDetails=' + placeDetails;

    return this.http
      .get(
        `${this.urlNTS}${this.OrderManagement}/Submission/GetPriceLimitCorridorAnalog?IdSection=${SectionId}&IdSession=${SessionId}&IdModel=${ModelId}${IdGroupNomenclature}${IdGroupGood}${IdNameGood}${GoodDescription}&IdCurrency=${currencyId}${VatPercent}&IdUnit=${unitId}&Volume=${volume}&IdPaymentType=${paymentTypeId}&IdBasisValue=${basisValueId}${IdPlaceLink}${PlaceDetails}`,
      )
      .toPromise();
  }

  //----------------------------------------
  //индивидуальный шаг цены
  public bucePriceSteps(body: PriceStepBody): Observable<void> {
    return this.http.post<void>(
      `${this.urlNTS}${this.OrderManagement}/Submission/worker/BucePriceSteps`,
      body
    );
  }

  public getExportRequestList(): Observable<ExportResponse> {
    return this.http.get<ExportResponse>(
      `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/GetExportRequestsList`,
    );
  }

  public getExportRequestDocument(
    requestId: number
  ): Observable<DownloadResponse> {
    return this.http.get<DownloadResponse>(
      `${this.urlNTS}${this.OrderManagement}/DemandOfferCatalogue/GetExportRequestDocument?RequestId=${requestId}`,
    );
  }
}
