/* eslint-disable */
import { Component, OnInit, ViewChild } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { PageCache } from 'src/app/core/classes/PageCache';
import { numberEntriesPage, FileTypes } from '../../api.constants';
import { FiltersComponent } from '../../sub_components/filters/filters.component';
import { DxDataGridComponent } from 'devextreme-angular';
import { catchError, of, tap } from 'rxjs';
import { SessionStorageService } from 'src/app/shared/services/session-storage-service/session-storage.service';
import { LocalStorageService } from 'src/app/shared/services/local-storage-service/local-storage.service';
import { ReportService } from 'src/app/shared/services/report-service/reports.service';
import {
  ReportDealsTransactions,
  ReportDealsFields,
  ReportDealsTransactionsBody,
  ReportDealsGoods,
} from 'src/app/shared/services/report-service';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import {TranslateService} from "@ngx-translate/core";
import { ExportService } from './../../core/services/export-service.service';
import { getMainName } from 'src/app/core/helpers';
import dxDataGrid, { ExportingEvent } from 'devextreme/ui/data_grid';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { CommonService } from 'src/app/core/services/common-service.service';
import { convertExcelDateToString } from 'src/app/sub_components/header/helpers';

export const REPORT_DEALS = 'REPORT_DEALS';
export const RERORT_DEALS_PAGE_NAME = 'report-deals';
export const REPORT_DEALS_KEY = 'reportDeals';
export const REPORT_DEALS_HIDE_LOT_ITEMS_KEY: string = 'reportDealsHideLotItems';

const REPORT_DEALS_LOT_DETAIL_COLUMNS: string[] = [
  'goodName',
  'cnfea',
  'goodDescription',
  'priceWithoutVat',
  'goodVolume',
  'goodUnitName',
];

export const REPORT_DEALS_FILTERS = {
  hideFilters: 'hideFilters',
  sections: 'sections',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  session: 'session',
  nomenclatureGroup: 'nomenclatureGroup',
  goodsGroup: 'goodsGroup',
  goods: 'goods',
  refs: 'refs',
  transferredToBids: 'transferredToBids',
  syncError: 'syncError',
};

interface DataSource {
  postProcess: () => ReportDealsGoods[];
}

interface FilterData {
  dataSource: DataSource;
}

interface ColumnContext {
  dataField: string;
  defaultCalculateFilterExpression: (...args: unknown[]) => unknown;
}

type FilterExpression = unknown[];

@Component({
  selector: 'app-report-deals',
  templateUrl: './report-deals.component.html',
  styleUrls: ['./report-deals.component.scss'],
})
export class ReportDealsComponent implements OnInit {
  @ViewChild('dataGridRef', { static: false })
  public dataGridRef!: DxDataGridComponent;

  @ViewChild('dataGridRefNotVisible', { static: false })
  public dataGridNotVisible!: DxDataGridComponent;

  @ViewChild(FiltersComponent)
  public filtersComponent: FiltersComponent;

  public readonly REPORT_DEALS_FILTERS = REPORT_DEALS_FILTERS;
  public readonly RERORT_DEALS_PAGE_NAME = RERORT_DEALS_PAGE_NAME;
  public readonly REPORT_DEALS_KEY = REPORT_DEALS_KEY;

  public user: User;
  public listTransactions: ReportDealsTransactions[];
  public dynamicFields: ReportDealsFields[];
  public cache: PageCache = {} as PageCache;
  public numberEntriesPage = numberEntriesPage;
  public isHiddenLot = false;
  public loadingVisible: boolean = false;

  // колонки которые нужно разделять на строки
  public multilineFields: string[] = [
    'goodName',
    'cnfea',
    'goodDescription',
    'goodVolume',
    'goodUnitName',
    'priceWithoutVat',
    'lotSummaryTotalAmount',
    'lotSummaryTotalAmountByn',
    'lotSummaryVolume'
  ];

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
    const cache: PageCache =
      this.sessionStorageService.getItemFromSessionStorage<PageCache>(REPORT_DEALS);

    if (cache) {
      this.cache = cache;
    }

    this.restoreHideLotItemsState();

    this.checkForDealsTransaction();

    this.user = this.localStorageService.getItemFromLocalStorage('user');

    const R_DEALS = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-deals.reportDeals'
    );
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(
      null,
      R_DEALS,
      faviconUrl
    );
  }

  public hideCompositeLot(e: { value?: boolean }): void {
    this.loadingVisible = true;

    setTimeout((): void => {
      this.isHiddenLot = Boolean(e?.value);
      this.persistHideLotItemsState();
      this.applyLotColumnsVisibility();
    });
  }

  private restoreHideLotItemsState(): void {
    this.isHiddenLot =
      this.localStorageService.getItemFromLocalStorage<boolean>(
        REPORT_DEALS_HIDE_LOT_ITEMS_KEY
      ) ?? false;
  }

  private persistHideLotItemsState(): void {
    this.localStorageService.setItemToLocalStorage(
      REPORT_DEALS_HIDE_LOT_ITEMS_KEY,
      this.isHiddenLot
    );
  }

  private applyLotColumnsVisibility(): void {
    const instance: dxDataGrid<unknown, unknown> = this.dataGridRef?.instance;
    if (!instance) {
      return;
    }

    const visible: boolean = !this.isHiddenLot;
    // оптимизация изменений для грида
    // вместо отдельного пересчета каждой колонки
    instance.beginUpdate();
    REPORT_DEALS_LOT_DETAIL_COLUMNS.forEach((field: string): void => {
      instance.columnOption(field, 'visible', visible);
    });
    this.dynamicFields?.forEach((field: ReportDealsFields): void => {
      instance.columnOption(field.fieldName, 'visible', visible);
    });
    instance.endUpdate();
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
      REPORT_DEALS,
      this.cache
    );

    this.filtersComponent.enableFilters();

    this.checkForDealsTransaction();
  }

  private checkForDealsTransaction(): void {
    const token = this.user?.token;
    const filters = this.generateFilters();

    if (
      token &&
      filters?.idSection &&
      (filters?.filterSessionId || filters?.filterSessionDateFrom || filters?.filterSessionDateTo)
    ) {
      this.getReportDealsTransactions(token, filters);
    }
  }

  public trackByGoodId(_: number, item: ReportDealsGoods): number {
    return item.idDemandOfferGood;
  }

  public calculateFilterExpression(
    value: unknown,
    _: unknown,
    target: string
  ): FilterExpression {
    const column: ColumnContext = this as unknown as ColumnContext;

    if (target === 'headerFilter') {
      return [column.dataField, 'contains', value];
    }

    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  // todo move all logic into pipe
  public calculateFilterExpressionDynamic(filterValue: string): unknown {
    const column = this as unknown as ColumnContext;

    return function (data: { [key: string]: unknown }): boolean {
      const fieldValue = data[column.dataField];

      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    };
  }

  public getDataSourceDynFilter(
    idFieild: ID_INTERFACE_FIELD
  ): ReportDealsTransactions[] {
    let results = [];

    this.listTransactions.forEach((item) => {
      item.goods.forEach((el) => {
        results.push({
          key: [el.dynamicFields[idFieild.toString()]],
          value: el.dynamicFields[idFieild.toString()],
          text: el.dynamicFields[idFieild.toString()],
        });
      });
    });

    let uniqueResult = [
      ...new Map(results.map((item) => [item['value'], item])).values(),
    ];

    return uniqueResult;
  }

  public goodNameFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'goodName');
  };

  public goodCnfeaFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'cnfea');
  };

  public goodDescriptionFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'goodDescription');
  };

  public goodPriceWithoutVatFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'priceWithoutVat');
  };

  public goodVolumeFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'goodVolume');
  };

  public goodUnitNameFilter = <T extends FilterData>(data: T): void => {
    return this.getUniqueResult(data, 'goodUnitName');
  };

  public lotSummaryTotalAmountFilter = <T extends FilterData>(
    data: T
  ): void => {
    return this.getUniqueResult(data, 'lotSummaryTotalAmount');
  };

  public lotSummaryTotalAmountBynFilter = <T extends FilterData>(
    data: T
  ): void => {
    return this.getUniqueResult(data, 'lotSummaryTotalAmountByn');
  };

  public lotSummaryVolumeFilter = <T extends FilterData>(
    data: T
  ): void => {
    return this.getUniqueResult(data, 'lotSummaryVolume');
  };

  private getUniqueResult(
    data: FilterData,
    field: keyof ReportDealsGoods
  ): void {
    data.dataSource.postProcess = (): ReportDealsGoods[] => {
      const results = this.listTransactions.reduce((acc, item) => {
        const goodsItems = item.goods.map((el) => ({
          key: [el[field]],
          value: el[field],
          text: el[field],
        }));
        return [...acc, ...goodsItems];
      }, []);

      let uniqueResult: ReportDealsGoods[] = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];

      return uniqueResult;
    };
  }

  private getReportDealsTransactions(
    sessionKey: string,
    body: ReportDealsTransactionsBody
  ) {
    this.reportService
      .getReportDealsTransactions(sessionKey, body)
      .pipe(
        tap((data) => {
          this.listTransactions = data.transactions;
          this.dynamicFields = data.fields;

          if (this.listTransactions) {
            this.mapListTransactions();
          }
        }),
        catchError((error: Error) => {
          console.error('Ошибка при загрузке транзакций:', error);

          return of(null);
        })
      )
      .subscribe();
  }

  private mapListTransactions(): void {
    this.listTransactions = this.listTransactions.map((item) => {
      const goodName = item.goods.map((x) => x.goodName);
      const cnfea = item.goods.map((x) => x.cnfea);
      const goodDescription = item.goods.map((x) => x.goodDescription);
      const lotSummaryTotalAmount = item.goods.map(
        (x) => x.lotSummaryTotalAmount
      );
      const lotSummaryTotalAmountByn = item.goods.map(
        (x) => x.lotSummaryTotalAmountByn
      );
      const goodVolume = item.goods.map((x) => x.goodVolume);
      const totalAmount = item.goods.map((x) => x.totalAmount);
      const goodUnitName = item.goods.map((x) => x.goodUnitName);
      const priceWithoutVat = item.goods.map((x) => x.priceWithoutVat);
      const mainName = getMainName(item.goods);
      const lotSummaryVolume = item.goods.map((x) => x.lotSummaryVolume);

      let dynamicFieldsValues = null;

      if (this.dynamicFields) {
        dynamicFieldsValues = this.dynamicFields.reduce((acc, dyn) => {
          acc[dyn.fieldName] = item.goods.map(
            (x) => x.dynamicFields[dyn.fieldName.toString()]
          );
          return acc;
        }, {} as Record<string, string[]>);
      }

      return {
        ...item,
        goodName,
        cnfea,
        goodDescription,
        lotSummaryTotalAmount,
        lotSummaryTotalAmountByn,
        goodVolume,
        totalAmount,
        goodUnitName,
        priceWithoutVat,
        mainName,
        lotSummaryVolume,
        ...dynamicFieldsValues,
      };
    });

    setTimeout(() => this.applyLotColumnsVisibility(), 0);
  }

  private generateFilters(): ReportDealsTransactionsBody {
    const requestObject: ReportDealsTransactionsBody = {
      idSection: this.cache.filters?.sections,
      filterSessionId: this.cache.filters?.session,
      filterSessionDateFrom: this.cache.filters?.dateFrom,
      filterSessionDateTo: this.cache.filters?.dateTo,
      listPropertiesStr: this.cache?.filters?.refsStr || [],
    };

    if (!requestObject.filterSessionDateFrom) {
      delete requestObject.filterSessionDateFrom;
    }

    if (!requestObject.filterSessionDateTo) {
      delete requestObject.filterSessionDateTo;
    }

    return requestObject;
  }

  public exportGrid(e: ExportingEvent): void {
    const sectionName: string = this.commonService.choosenSection(
      this.cache.filters?.sections,
      this.translate.store.currentLang
    );

    const reportDeals: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'header.top_line.menu.report-deals'
    );

    //если выбрана конкретнаяя сессия - клеим номер сессии
    //если выбран только диапазон дат сессии - клеим диапазон дат
    //если выбран и диапазон и сессия, то приоритет у сессии - клеим номер сессии
    const filters: ReportDealsTransactionsBody = this.generateFilters();
    let dynamicPart: string = '';

    if (filters?.filterSessionId) {
      dynamicPart = `№ ${filters.filterSessionId}`;
    } else if (filters?.filterSessionDateFrom || filters?.filterSessionDateTo) {
      const dateFrom: string = filters.filterSessionDateFrom
        ? convertExcelDateToString(filters.filterSessionDateFrom)
        : '-';

      const dateTo: string = filters.filterSessionDateTo
        ? convertExcelDateToString(filters.filterSessionDateTo)
        : '-';

      const from: string = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'general.date_from'
      );

      const to: string = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'general.date_by'
      );

      dynamicPart = `${from} ${dateFrom} ${to} ${dateTo}`;
    }

    const fileName: string = `${reportDeals}, ${sectionName}, ${dynamicPart}`;

    this.exportService.onExportingReports(
      e,
      fileName,
      FileTypes.REPORT_DEALS,
      this.multilineFields
    );
  }
}
