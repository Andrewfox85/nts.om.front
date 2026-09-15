/* eslint-disable */
import { Component, OnInit, ViewChild } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { PageCache } from 'src/app/core/classes/PageCache';
import { numberEntriesPage, FileTypes, DIFF_PRICE_TREND } from '../../api.constants';
import { FiltersComponent } from '../../sub_components/filters/filters.component';
import { catchError, of, tap } from 'rxjs';
import { SessionStorageService } from 'src/app/shared/services/session-storage-service/session-storage.service';
import { LocalStorageService } from 'src/app/shared/services/local-storage-service/local-storage.service';
import { ReportService } from 'src/app/shared/services/report-service/reports.service';
import { ReportBiddingProcess, ReportBiddingProcessResponse } from 'src/app/shared/services/report-service';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { TranslateService } from '@ngx-translate/core';
import { ExportService } from '../../core/services/export-service.service';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { CommonService } from 'src/app/core/services/common-service.service';
import { CURRENCY_PRECISION, VOLUME_PRECISION } from './../../api.constants';

export const REPORT_BIDDING_PROCESS = 'REPORT_BIDDING_PROCESS';
export const REPORT_BIDDING_PROCESS_PAGE_NAME = 'report-bidding-process';
export const REPORT_BIDDING_PROCESS_KEY = 'reportBiddingProcess';
export const REPORT_BIDDING_PROCESS_HIDE_LOT_ITEMS_KEY: string = 'reportBiddingProcessHideLotItems';

export const REPORT_BIDDING_PROCESS_FILTERS = {
  hideFilters: 'hideFilters',
  sections: 'sections',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  session: 'session',
  lotNumber: 'lotNumber'
};

@Component({
  selector: 'app-report-bidding-process',
  templateUrl: './report-bidding-process.component.html',
  styleUrls: ['./report-bidding-process.component.scss']
})
export class ReportBiddingProcessComponent implements OnInit {
  @ViewChild(FiltersComponent)
  public filtersComponent: FiltersComponent;

  public readonly REPORT_BIDDING_PROCESS_FILTERS = REPORT_BIDDING_PROCESS_FILTERS;
  public readonly REPORT_BIDDING_PROCESS_PAGE_NAME = REPORT_BIDDING_PROCESS_PAGE_NAME;
  public readonly REPORT_BIDDING_PROCESS_KEY = REPORT_BIDDING_PROCESS_KEY;
  public readonly CURRENCY_PRECISION = CURRENCY_PRECISION;
  public readonly VOLUME_PRECISION = VOLUME_PRECISION;
  public readonly DIFF_PRICE_TREND = DIFF_PRICE_TREND;

  public user: User;
  public biddingProcessesList: ReportBiddingProcess[];
  public cache: PageCache = {} as PageCache;
  public numberEntriesPage = numberEntriesPage;
  public loadingVisible: boolean = false;

  constructor(
    private readonly sessionStorageService: SessionStorageService,
    private readonly localStorageService: LocalStorageService,
    private readonly reportService: ReportService,
    public translate: TranslateService,
    private pageMeta: PageMetaService,
    private exportService: ExportService,
    private commonService: CommonService
  ) {}

  public ngOnInit(): void {
    const cache: PageCache = this.sessionStorageService.getItemFromSessionStorage<PageCache>(REPORT_BIDDING_PROCESS);

    if (cache) {
      this.cache = cache;
    }

    if (this.cache.filters?.sections && this.cache.filters?.session) {
      this.getReportBiddingProcess();
    }

    this.user = this.localStorageService.getItemFromLocalStorage('user');

    const R_BIDDING_PROCESS: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-bidding-process.biddingProcess'
    );
    const faviconUrl: string = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(null, R_BIDDING_PROCESS, faviconUrl);
  }

  public onLoadPanelShown(): void {
    const minVisibleTime: number = 500;
    setTimeout((): void => {
      this.loadingVisible = false;
    }, minVisibleTime);
  }

  public getFilterData(e: unknown): void {
    this.cache.filters = e;

    this.sessionStorageService.setItemToSessionStorage<PageCache>(
      REPORT_BIDDING_PROCESS,
      this.cache
    );

    this.filtersComponent.enableFilters();

    if (this.cache.filters?.sections && this.cache.filters?.session) {
      this.getReportBiddingProcess();
    }
  }

  private getReportBiddingProcess(): void {
    this.reportService
      .getReportBiddingProcess(
        this.user?.token,
        this.cache.filters?.sections,
        this.cache.filters?.session,
        this.cache.filters?.lotNumber
      )
      .pipe(
        tap((data: ReportBiddingProcessResponse) => {
          this.biddingProcessesList = data.biddingProcesses;
        }),
        catchError((error: Error) => {
          console.error('Ошибка при загрузке:', error);

          return of(null);
        })
      )
      .subscribe();
  }

  public exportGrid(e: ExportingEvent): void {
    const sectionName: string = this.commonService.choosenSection(
      this.cache.filters?.sections,
      this.translate.store.currentLang
    );

    const reportBiddingProcess: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-bidding-process.biddingProcess'
    );

    const fileName: string = `${sectionName}, ${reportBiddingProcess} № ${this.cache.filters?.session}`;

    this.exportService.onExporting(e, fileName, FileTypes.REPORT_BIDDING_PROCESS);
  }
}
