/* eslint-disable */
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { PageCache } from 'src/app/core/classes/PageCache';
import { sessionStage, depositType, FileTypes } from 'src/app/api.constants';
import { TranslateService } from '@ngx-translate/core';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { CommonService } from 'src/app/core/services/common-service.service';
import {
  FirmDealDetail,
  FirmTax,
  Client,
  ClientDealDetail,
  ClientTaxDetail,
  DepositDealDetail,
  DepositTaxDetail,
  DepositTypeResponse,
  DepositFirmDealsResponse,
  DepositFirmTaxResponse,
  DepositClientsResponse,
  DepositClientDealsResponse,
  DepositClientTaxResponse,
  DepositDealsResponse,
  DepositTaxResponse
} from "../../core/interfaces";
import { ValueChangedEvent } from 'devextreme/ui/check_box';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { ExportService } from './../../core/services/export-service.service';
@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit {
  public user: User;
  public cache = {} as PageCache;
  public sessionInfo: any = [];
  public sectionId: number;
  public nameSessionStage: string;
  public search: string;
  public filterTab: number = 0;
  public currentTimeDate: Date;
  public depositType: number;
  public detailsFirmDeals: FirmDealDetail[];
  public firmTax: FirmTax;
  public listDepositTax: (ClientTaxDetail | DepositTaxDetail)[];
  public listDepositDeals: (ClientDealDetail | DepositDealDetail)[];
  public listTaxForTable: (ClientTaxDetail | DepositTaxDetail)[];
  public listDealsForTable: (ClientDealDetail | DepositDealDetail)[];
  public listDealsLength: number;
  public listTaxLength: number;
  public taxTab: string = getTranslateResultByCurrentLang(
    this.translate.store.currentLang,
    'deposit.collectionDeposit'
  );
  public dealsTab: string = getTranslateResultByCurrentLang(
    this.translate.store.currentLang,
    'deposit.dealsDeposit'
  );
  public clients = [];

  public tabsData = [{ name: this.taxTab }, { name: this.dealsTab }];

  public formClient: FormGroup = this.formBuilder.group({
    client: [],
  });

  public formAv: FormGroup = this.formBuilder.group({
    available: [false],
  });

  public numberDate: number;

  public readonly depositTypeEnum = depositType;
  public readonly sessionStage = sessionStage;
  public readonly FileTypes = FileTypes;

  constructor(
    public translate: TranslateService,
    private formBuilder: FormBuilder,
    public offerManagementService: OfferManagementService,
    private pageMeta: PageMetaService,
    private commonService: CommonService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.cache = JSON.parse(sessionStorage.getItem('OFFER_MANAGEMENT')) || {};
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    if (this.offerManagementService.sessionForDeposit) {
      // когда передаем через сервис
      const offerSession = {
        sessionInfo: this.offerManagementService.sessionForDeposit,
        sectionId: this.offerManagementService.sectionId,
      };
      localStorage.setItem('offerSession', JSON.stringify(offerSession));
    } else {
      // когда открываем в новой вкладке
      const offerSession = {
        sessionInfo: this.cache.filters.choosenSessionForManagement,
        sectionId: this.cache.filters.sections,
      };
      localStorage.setItem('offerSession', JSON.stringify(offerSession));
    }

    const offerSession = JSON.parse(localStorage.getItem('offerSession')) || {
      sessionInfo: this.offerManagementService.sessionForDeposit
        ? this.offerManagementService.sessionForDeposit
        : this.cache.filters.choosenSessionForManagement,
      sectionId: this.offerManagementService.sectionId
        ? this.offerManagementService.sectionId
        : this.cache.filters.sections,
    };

    this.sessionInfo = {
      startDateTime:
        offerSession.sessionInfo.sessionDatetimeBeginString ||
        offerSession.sessionInfo.sessionDateTime ||
        offerSession.sessionInfo.sessionDateTimeBegin,
      id: offerSession.sessionInfo.sessionId || offerSession.sessionInfo.id,
      sessionName: offerSession.sessionInfo.sessionName,
      stageId:
        offerSession.sessionInfo.sessionStageId ||
        offerSession.sessionInfo.stageId,
    };
    if (offerSession.sessionInfo.sessionDateTime) {
      this.numberDate = offerSession.sessionInfo.sessionDateTime;
    }
    if (offerSession.sessionInfo.sessionDateTimeBegin) {
      this.numberDate = offerSession.sessionInfo.sessionDateTimeBegin;
    }
    this.sectionId = offerSession.sectionId;
    if (this.user.IsWorker) {
      //this.sessionInfo = this.cache.filters.choosenSessionForManagement; //информация о сессии для работника
      this.getDepositDetailsTaxWorker();
      this.getDepositDetailsDealsWorker();
    } else {
      //информация о сессии для трейдера
      //получение типа задатка
      this.offerManagementService
        .getFirmDepositType()
        .subscribe((res: DepositTypeResponse) => {
          this.depositType = res.depositType;

          if (this.depositType == this.depositTypeEnum.dealsDeposit) {
            //получаем данные для верхней части
            this.offerManagementService
              .depositDetailsFirmDeals(
                this.sectionId ? this.sectionId : this.cache.filters.sections,
                this.sessionInfo.id
              )
              .subscribe((res: DepositFirmDealsResponse) => {
                this.detailsFirmDeals = res.detailsFirmDeals;
              });
          }
          if (this.depositType == this.depositTypeEnum.taxDeposit) {
            //получаем данные для верхней части
            this.offerManagementService
              .depositDetailsFirmTax()
              .subscribe((res: DepositFirmTaxResponse) => {
                this.firmTax = res.firmTax;
              });
          }
          this.getDepositDetailsClientTax();
          this.getDepositDetailsClientDeals();
          this.getDepositGetClients();
        });
    }
    this.nameSessionStage = this.commonService.choosenSessionStage(
      Number(this.sessionInfo?.stageId),
      this.user?.IsWorker,
      this.translate.store.currentLang
    );
    this.currentTimeDate = new Date();

    const DEPOSIT_TITLE: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'deposit.depositInfo'
    );
    const faviconUrl = 'assets/img/icons/part-deposit.svg';
    this.pageMeta.setPageMeta(
      offerSession.sessionInfo.sessionId || offerSession.sessionInfo.id,
      DEPOSIT_TITLE,
      faviconUrl
    );
  }

  public traderRegNumber(): string {
    const regNum = this.user?.userInfo?.traderRegNum;

    if (!regNum) {
      return '';
    }
  
    return regNum.slice(0, 9).replace(/^0+/, '');
  }

  //получение клиентов для поиска и фильтрации
  public getDepositGetClients(): void {
    this.offerManagementService
      .depositGetClients(
        this.sectionId ? this.sectionId : this.cache.filters.sections,
        this.sessionInfo.id
      )
      .subscribe((res: DepositClientsResponse) => {
        this.clients = res.clients;
      });
  }

  public clientTemplateSelectBox(data: Client): string {
    return data && data?.clientRegNumber + ' - ' + data?.clientNameShort;
  }

  public getDepositGetClientsWorker(type: any): Client[] {
    type.forEach((item) => {
      if (item.clientId != null) {
        this.clients.push({
          clientId: item.clientId,
          clientNameShort: item.clientNameShort,
          clientRegNumber: item.clientRegNumber,
          isFirm: false, //для понимания для какой колонки поиск
        });
      }

      if (item.firmId != null) {
        this.clients.push({
          clientId: item.firmId,
          clientNameShort: item.firmNameShort,
          clientRegNumber: item.firmRegNumber,
          isFirm: true,
        });
      }
    });

    this.clients = [
      ...new Map(this.clients.map((item) => [item['clientId'], item])).values(),
    ];

    this.clients.sort((a, b) =>
      a.clientNameShort.localeCompare(b.clientNameShort, 'ru-RU', {
        sensitivity: 'base',
      })
    );

    return this.clients;
  }

  public onSearchClient(e: ValueChangedEvent): void {
    let listTax = this.listDepositTax;
    let listDeals = this.listDepositDeals;

    if (e.value) {
      if (this.user.IsWorker) {
        //поиск участника/клиента у работника
        this.listTaxForTable = listTax.filter((el) => {
          if (e.value.isFirm) {
            return el.firmId == e.value.clientId;
          } else {
            return el.clientId == e.value.clientId;
          }
        });

        this.listDealsForTable = listDeals.filter((el) => {
          if (e.value.isFirm) {
            return el.firmId == e.value.clientId;
          } else {
            return el.clientId == e.value.clientId;
          }
        });

        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );

        if (this.formAv.get('available')?.value) { //сбрасываем фильтр при поиске
          this.formAv.get('available')?.patchValue(false);
        }
      } else {
        //поиск только клиента у трейдера
        this.listTaxForTable = listTax.filter((el) => {
          return el.clientId == e.value.clientId;
        });

        this.listDealsForTable = listDeals.filter((el) => {
          return el.clientId == e.value.clientId;
        });
        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );
      }
    } else {
      if (!this.formAv.get('available')?.value) {
        //учитываем фильтр по недоступности средств
        this.listTaxForTable = this.listDepositTax;
        this.listDealsForTable = this.listDepositDeals;
        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );
      } else {
        /*  let listTax = this.listDepositTax
      let listDeals = this.listDepositDeals; */

        this.listTaxForTable = listTax.filter((el) => {
          return el.isUnavailable == true;
        });

        this.listDealsForTable = listDeals.filter((el) => {
          return el.isUnavailable == true;
        });
        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );
      }
    }
  }

  //трейдер получение  данных таблицы для задатка по сбору
  public getDepositDetailsClientTax(): void {
    this.offerManagementService
      .depositDetailsClientTax(
        this.sectionId ? this.sectionId : this.cache.filters.sections,
        this.sessionInfo.id
      )
      .subscribe((res: DepositClientTaxResponse) => {
        this.listDepositTax = res.detailsClientTaxes;
        this.listTaxLength = res.detailsClientTaxes.length;
        this.listDepositTax.forEach((i) => {
          if (i.sumRate > i.sumFree) {
            i.isUnavailable = true; //недостаточно задатка
          } else {
            i.isUnavailable = false;
          }
        });
        this.listTaxForTable = this.listDepositTax;
        this.tabsArray(this.listTaxLength, this.listDealsLength);
      });
  }

  //трейдер получение  данных таблицы для задатка по сделкам
  public getDepositDetailsClientDeals(): void {
    this.offerManagementService
      .depositDetailsClientDeals(
        this.sectionId ? this.sectionId : this.cache.filters.sections,
        this.sessionInfo.id
      )
      .subscribe((res: DepositClientDealsResponse) => {
        this.listDepositDeals = res.detailsClientDeals;
        this.listDealsLength = res.detailsClientDeals.length;

        this.listDepositDeals.forEach((i) => {
          if (i.depositSumRequiredBuy != null) {
            if (i.depositSumRequiredBuy > i.depositSumFree) {
              i.isUnavailable = true; //недостаточно задатка
            } else {
              i.isUnavailable = false;
            }
          }

          if (i.depositSumRequiredSale != null) {
            if (i.depositSumRequiredSale > i.depositSumFree) {
              i.isUnavailable = true; //недостаточно задатка
            } else {
              i.isUnavailable = false;
            }
          }

          if (
            i.depositSumRequiredSale != null &&
            i.depositSumRequiredBuy != null
          ) {
            //если обе суммы есть -> сравниваем с меньшей

            if (i.depositSumRequiredSale > i.depositSumRequiredBuy) {
              if (i.depositSumRequiredBuy > i.depositSumFree) {
                i.isUnavailable = true; //недостаточно задатка
              } else {
                i.isUnavailable = false;
              }
            } else {
              if (i.depositSumRequiredSale > i.depositSumFree) {
                i.isUnavailable = true; //недостаточно задатка
              } else {
                i.isUnavailable = false;
              }
            }
          }
        });

        this.listDealsForTable = this.listDepositDeals;
        this.tabsArray(this.listTaxLength, this.listDealsLength);
      });
  }

  //работник получение  данных таблицы для задатка по сбору
  public getDepositDetailsTaxWorker(): void {
    this.offerManagementService
      .depositDetailsClientTaxWorker(
        this.sectionId ? this.sectionId : this.cache.filters.sections,
        this.sessionInfo.id
      )
      .subscribe((res: DepositTaxResponse) => {
        this.listDepositTax = res.detailsTaxes;
        this.listTaxLength = res.detailsTaxes.length;

        this.listDepositTax.forEach((i) => {
          if (i.sumRate > i.sumFree) {
            i.isUnavailable = true; //недостаточно задатка
          } else {
            i.isUnavailable = false;
          }
        });

        this.tabsArray(this.listTaxLength, this.listDealsLength);

        this.listTaxForTable = this.listDepositTax;
        this.getDepositGetClientsWorker(this.listDepositTax);
      });
  }

  //работник получение  данных таблицы для задатка по сделкам
  public getDepositDetailsDealsWorker(): void {
    this.offerManagementService
      .depositDetailsClientDealsWorker(
        this.sectionId ? this.sectionId : this.cache.filters.sections,
        this.sessionInfo.id
      )
      .subscribe((res: DepositDealsResponse) => {
        this.listDepositDeals = res.detailsDeals;
        this.listDealsLength = res.detailsDeals.length;

        this.listDepositDeals.forEach((i) => {
          if (i.depositSumRequiredBuy != null) {
            if (i.depositSumRequiredBuy > i.depositSumFree) {
              i.isUnavailable = true; //недостаточно задатка
            } else {
              i.isUnavailable = false;
            }
          }

          if (i.depositSumRequiredSale != null) {
            if (i.depositSumRequiredSale > i.depositSumFree) {
              i.isUnavailable = true; //недостаточно задатка
            } else {
              i.isUnavailable = false;
            }
          }

          if (
            i.depositSumRequiredSale != null &&
            i.depositSumRequiredBuy != null
          ) {
            //если обе суммы есть -> сравниваем с меньшей

            if (i.depositSumRequiredSale > i.depositSumRequiredBuy) {
              if (i.depositSumRequiredBuy > i.depositSumFree) {
                i.isUnavailable = true; //недостаточно задатка
              } else {
                i.isUnavailable = false;
              }
            } else {
              if (i.depositSumRequiredSale > i.depositSumFree) {
                i.isUnavailable = true; //недостаточно задатка
              } else {
                i.isUnavailable = false;
              }
            }
          }
        });
        this.tabsArray(this.listTaxLength, this.listDealsLength);

        this.listDealsForTable = this.listDepositDeals;
        this.getDepositGetClientsWorker(this.listDepositDeals);
      });
  }

  public onFilterTable(e: ValueChangedEvent): void {
    if (e.value == true) {
      this.listTaxForTable = this.listTaxForTable.filter((el) => {
        return el.isUnavailable == true;
      });
      this.listDealsForTable = this.listDealsForTable.filter((el) => {
        return el.isUnavailable == true;
      });

      this.tabsArray(
        this.listTaxForTable.length,
        this.listDealsForTable.length
      );
    } else {
      if (!this.formClient.get('client')?.value) {
        //учитываем фильтр по клиенту
        this.listTaxForTable = this.listDepositTax;
        this.listDealsForTable = this.listDepositDeals;
        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );
      } else {
        let listTax = this.listDepositTax;
        let listDeals = this.listDepositDeals;

        const selectedClientId = this.formClient.get('client')?.value?.clientId;

        this.listTaxForTable = listTax.filter((el) => {
          return (
            el.firmId == selectedClientId ||
            el.clientId == selectedClientId
          );
        });

        this.listDealsForTable = listDeals.filter((el) => {
          return (
            el.firmId == selectedClientId ||
            el.clientId == selectedClientId
          );
        });

        this.tabsArray(
          this.listTaxForTable.length,
          this.listDealsForTable.length
        );
      }
    }
  }

  //переключаем на другую вкладку, если в текущей ничего не найдено
  public tabsArray(taxLength: number, dealsLength: number): void {
    if (taxLength == 0 && dealsLength > 0) {
      this.onChangeTab({ itemIndex: 1 });
    }

    if (dealsLength == 0 && taxLength > 0) {
      this.onChangeTab({ itemIndex: 0 });
    }
  }

  public onChangeTab(e: any): void {
    this.filterTab = e.itemIndex;
  }

  public updateInfo(): void {
    this.currentTimeDate = new Date();
    if (this.user?.IsWorker) {
      this.getDepositDetailsTaxWorker();
      this.getDepositDetailsDealsWorker();
    } else {
      this.getDepositDetailsClientTax();
      this.getDepositDetailsClientDeals();
    }
  }

  public onExportGrid(e: ExportingEvent, type: string): void {
    const sectionName: string = this.commonService.choosenSection(
      this.sectionId ? this.sectionId : this.cache.filters.sections,
      this.translate.store.currentLang
    );
 
    const fileName: string = `${getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'deposit.depositInfo'
    )}, ${sectionName}, № ${this.sessionInfo.id}`;

    this.exportService.onExporting(e, fileName, type);
  }
}
