/* eslint-disable */
import { OfferManagementService } from './../../core/services/offer-management-service.service';
import { CatalogsComponent } from './../../components/catalogs/catalogs.component';
import {
  CatalogService,
  GetDxGridResponse,
  RefbookItem,
  SessionDataItem,
  GetFilteredSessionsResponse
} from './../../core/services/catalog-service.service';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  HostListener,
  ViewChildren,
  QueryList,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ElementRef, OnDestroy,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { FiltersService, ListLotsNumberResponse } from './filters.service';
import { User } from '../../core/classes/user';
import { CommonService } from '../../core/services/common-service.service';
import { searchIcon, NamesOfCachePage, RefbooksNames } from '../../api.constants';
import { DatePipe } from '@angular/common';
import { SessionStorageService } from 'src/app/shared/services/session-storage-service/session-storage.service';
import { LocalStorageService } from 'src/app/shared/services/local-storage-service/local-storage.service';
import {
  REPORT_DEALS,
  RERORT_DEALS_PAGE_NAME,
} from 'src/app/components/report-deals/report-deals.component';
import {
  REPORT_TRADING_SESSION_ORDERS,
  REPORT_TRADING_SESSION_ORDERS_PAGE_NAME,
} from 'src/app/components/report-trading-session-orders/report-trading-session-orders.component';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { map, switchMap, tap, forkJoin, Observable } from 'rxjs';
import { DxTextBoxComponent } from 'devextreme-angular';
import { ContentReadyEvent } from 'devextreme/ui/text_box';
import { Title } from '@angular/platform-browser';
import { statusSession, sessionStage, GridCategoryEnum } from '../../api.constants';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { FiltersFormModel } from "../../core/interfaces/filters";
import { PageCache } from "../../core/classes/PageCache";
import { REPORT_BIDDING_PROCESS, REPORT_BIDDING_PROCESS_PAGE_NAME } from './../../components/report-bidding-process/report-bidding-process.component';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @Input() public nameOfCachePage: string = '';

  @Input() public filtersOn: any = {
    idSession: '',
  };

  @Input() sessionStorageKey!: string;

  @Output() componentData = new EventEmitter<Object>();

  @ViewChild(CatalogsComponent)
  public catalogsComponent: CatalogsComponent;

  @ViewChildren('sessionInput')
  public sessionInputs: QueryList<DxTextBoxComponent>;

  public isButtonBlockFixed: boolean = true;

  public readonly statusSessionOptions = statusSession;
  public readonly sessionStageOptions = sessionStage;
  public locale: string;
  public searchIcon: any;
  public publicsearchIcon: any;
  public nomenclatureGroup = [];
  public goodsGroup = [];
  public goods = [];
  public listBranch = [];
  public brokerClient = [];
  public ListClientBranch = [];
  public sections = [];
  public sectionsWithoutAll = [];
  public allSections = [];
  public idFirm = [];
  public workerBrokerClient = [];
  public workerListClientBranch = [];
  public sessionId: number;
  public sectionId: number;
  public sessionStage = [];
  public marketType = [];
  public session = [];
  public termsDeliveryTime = [];
  public units = [];
  public termsPayment = [];
  public currency = [];
  public dataGrid: any = [];
  public sessions: any = [];
  public sessionFilter: any = [];
  public value: string;
  public translateFilters: any;
  public hideFilters = false;
  public today: Date = new Date();
  public formDate: Date;
  public byDate: Date;
  public user: User;
  public search: string;
  public filterDataCache: any;
  public index: number;
  public chooseFirm = false;
  public page: number = 1;
  public firmList = [];
  public pagination: any;
  public chooseIdFirm: any;

  public refsVisible: boolean = false;
  public refs = [];
  public listPropertiesStr = [];
  public listPropertiesInt = [];
  public displayedInfo;
  public originalInfo;
  public choosenFromSessions;

  public listLotsNumber: number[];

  @ViewChild('filtersContainer') filtersRef!: ElementRef;

  isFixed = false;
  footerOffset = 0;

  private footerObserver!: IntersectionObserver;
  private resizeObserver!: ResizeObserver;

  public filtersForm: FormGroup = this.formBuilder.group({
    sections: [],
    sectionsMulti: [],
    allSection: [],
    dateFrom: [],
    dateTo: [],
    preparation: [false],
    bidding: [false],
    registration_seller: [false],
    registration_buyer: [false],
    submitRequestsSale: [false],
    purchaseOrdersSubmitted: [false],
    nomenclatureGroup: [],
    goodsGroup: [],
    goods: [],
    listBranch: [],
    brokerClient: [],
    ListClientBranch: [],
    idFirm: [],
    idFirmName: [],
    workerBrokerClient: [],
    workerListClientBranch: [],
    sessionStage: [],
    marketType: [],
    session: [],
    lotNumber: [],
    refsStr: [],
    refsInt: [],
    priceFrom: [],
    priceTo: [],
    currency: [],
    quantityFrom: [],
    quantityTo: [],
    units: [],
    termsPayment: [],
    termsDeliveryTime: [],
    multibasis: [false],
    analogsCatalog: [false],
    isMyDemandOffer: [false],
    analogs: [false],
    multibasisLot: [false],
    adjustablePrice: [false],
    assembledLot: [false],
    changes: [false],
    transferred: [false],
    transferredToBids: [false],
    outOfPriceRange: [false],
    indivPriceStep: [false],
    goodDeleted: [false],
    syncError: [false],
    marketTypesForDisplayCond: [],
    choosenSessionForManagement: [],
  });

  public readonly reportDeal = RERORT_DEALS_PAGE_NAME;
  public readonly reportSessionOrders = REPORT_TRADING_SESSION_ORDERS_PAGE_NAME;
  public readonly reportBiddingProcess = REPORT_BIDDING_PROCESS_PAGE_NAME;

  public fixedPages: string[] = [
    NamesOfCachePage.CATALOG,
    NamesOfCachePage.OFFER_MANAGEMENT,
    NamesOfCachePage.SESSIONS_SCHEDULE,
    NamesOfCachePage.REPORT_DEALS,
    NamesOfCachePage.REPORT_TRADING_SESSION_ORDERS,
    NamesOfCachePage.REPORT_BIDDING_PROCESS
  ];


  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly translate: TranslateService,
    private readonly filtersService: FiltersService,
    private readonly commonService: CommonService,
    private readonly createOfferService: CreateOfferService,
    private readonly catalogService: CatalogService,
    private readonly offerManagementService: OfferManagementService,
    private readonly sessionStorageService: SessionStorageService,
    private readonly localStorageService: LocalStorageService,
    private readonly title: Title
  ) {
    this.translateFilters = this.translate.instant('filters');
    this.searchIcon = searchIcon;
  }

  ngAfterViewInit() {
    const footer = document.querySelector('.footer_wrapper') as HTMLElement;

    // footer observer
    this.footerObserver = new IntersectionObserver(entries => {
      const entry = entries[0];

      if (entry.isIntersecting) {
        const footerTop = entry.boundingClientRect.top;
        const viewportHeight = window.innerHeight;

        // footer element doesnt inside viewport height
        footer.getBoundingClientRect().top < viewportHeight
          ? this.footerOffset = (viewportHeight - footerTop) + 20
          : this.footerOffset = 20;
      } else {
        this.footerOffset = 0;
      }
    }, {
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1 ]
    });

    this.footerObserver.observe(footer);

    //filter height observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateState();
    });
    this.resizeObserver.observe(this.filtersRef.nativeElement);
    this.updateState();
  }

  private updateState(): void {
    const filtersRect = this.filtersRef.nativeElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    this.isFixed = filtersRect.bottom > viewportHeight;
  }

  public ngOnDestroy(): void {
    localStorage.removeItem('catalogFilter');
    this.footerObserver?.disconnect();
    this.resizeObserver?.disconnect();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['sessionStorageKey'] && !changes['sessionStorageKey'].firstChange) {
      this.enableFilters();
    }
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.allSections.length = 0;

    if (!!this.user?.token) {
      this.getBranchesAndClients();
      this.GetBranchesListFirm();
    }

    this.commonService.getSections(this.user?.token).subscribe((res) => {
      this.sections = res.sections;
      this.sectionsWithoutAll = this.sections.concat();
      this.sectionsWithoutAll.splice(0, 1);

      this.filtersForm.controls.sections.setValue(null);

      this.sectionsWithoutAll.forEach((i) => {
        this.allSections.push(i.id);
      });

      this.filtersForm.controls.allSection.setValue(this.allSections);
      this.filtersForm.controls.sectionsMulti.setValue(this.allSections);

      const sectionDescription = [];

      this.sectionsWithoutAll.forEach((item) => {
        sectionDescription.push({ id: item.id, description: item.description });
      });

      this.localStorageService.setItemToLocalStorage(
        'sections',
        sectionDescription
      );

      this.enableFilters();

      const date = {
        dateFrom: this.filtersForm.controls.dateFrom?.value
          ? this.commonService.toOADate(
              this.filtersForm.controls.dateFrom?.value
            )
          : null,
        dateTo: this.filtersForm.controls.dateTo?.value
          ? this.commonService.toOADate(this.filtersForm.controls.dateTo?.value)
          : null,
      };

      this.componentData.emit(Object.assign(this.filtersForm.value, date));
    });

    const catalog = JSON.parse(localStorage.getItem('catalogFilter')) || {
      sectionId: this.catalogService.sectionId,
      sessionId: this.catalogService.sessionId,
    };

    if (this.catalogService.sectionId) {
      this.localStorageService.setItemToLocalStorage('catalogFilter', catalog);
    }

    // предзаполняем фильтры если переходим в каталог из расписания сессий
    if ((catalog.sessionId, catalog.sectionId)) {
      this.sessionId = catalog.sessionId;
      this.sectionId = catalog.sectionId;
      this.filtersForm.controls.sections.patchValue(this.sectionId);
      this.filtersForm.controls.session.patchValue(this.sessionId);
    }

    // предзаполняем секцию для УЗ
    const offerManagement = JSON.parse(
      localStorage.getItem('offerSection')
    ) || {
      sectionId: this.offerManagementService.sectionId,
    };

    if (
      offerManagement.sectionId &&
      this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT
    ) {
      this.sectionId = offerManagement.sectionId;
      this.filtersForm.controls.sections.patchValue(this.sectionId);

      this.getDxGrid();

      this.getNomenclaturesWithGroups();
    }

    const isReportsPage =
      this.nameOfCachePage === RERORT_DEALS_PAGE_NAME ||
      this.nameOfCachePage === REPORT_TRADING_SESSION_ORDERS_PAGE_NAME ||
      this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME;

    if (isReportsPage) {
      this.getDxGridForReports();
    }
  }


  private getDxGridForReports(): void {
    const token: string = this.user?.token;
    const sections: number = this.filtersForm.get('sections')?.value;

    const dateFrom: number = this.filtersForm.controls.dateFrom?.value
      ? this.commonService.toOADate(this.filtersForm.controls.dateFrom?.value)
      : null;
    const dateTo: number = this.filtersForm.controls.dateTo?.value
      ? this.commonService.toOADate(this.filtersForm.controls.dateTo?.value)
      : null;

    if (!token || !sections) {
      return;
    }

    this.catalogService.getFilteredSessions(sections, dateFrom, dateTo).subscribe({
      next: (res: GetFilteredSessionsResponse) => {
        this.handleGridResponse(res);
      },
    });
  }

  private handleGridResponse(res: GetFilteredSessionsResponse): void {
    this.sessionFilter = res.sessions;
    this.displayedInfo = [...this.sessionFilter];
    this.originalInfo = [...this.sessionFilter];

    const selectedSession = this.filtersForm.controls.session?.value;
    if (this.sessionFilter.length > 0 && selectedSession) {
      this.onChoosenSessionForManagement(selectedSession);
    }
  }

  private getListLotsNumber(): void {
    this.filtersService
      .getListLotsNumber(
        this.user?.token,
        this.filtersForm.controls.sections?.value,
        this.filtersForm.controls.session?.value
      )
      .subscribe({
        next: (res: ListLotsNumberResponse) => {
          this.listLotsNumber = res.lotNumbers;
        }
      });
  }

  private getDxGrid(): void {
    this.catalogService
      .getFilteredCatalog(
        this.user?.token,
        this.filtersForm.get('sections').value
      )
      .subscribe((res: GetDxGridResponse) => {
        const sortedData: SessionDataItem[] = [...res.data].sort((a, b) => {
          const dateComparison =
            new Date(a.startDateTime).getTime() -
            new Date(b.startDateTime).getTime();
          if (dateComparison !== 0) {
            return dateComparison;
          }
          return a.id - b.id;
        });

        this.dataGrid = sortedData;
        this.sessionFilter = [...sortedData];

        // получаем наименоание сессии
        this.getByName();

        if (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) {
          this.displayedInfo = [...sortedData];
          this.originalInfo = [...sortedData];

          if (
            this.sessionFilter?.length > 0 &&
            this.filtersForm.controls.session?.value
          ) {
            this.onChoosenSessionForManagement(
              this.filtersForm.controls.session?.value
            );
          }
        }

        if (this.nameOfCachePage === NamesOfCachePage.CATALOG) {
          if (
            this.filtersForm.controls?.dateFrom?.value ||
            this.filtersForm.controls?.dateTo?.value
          ) {
            this.onChangeSelectBox(
              {
                value: this.filtersForm.controls?.dateFrom?.value,
              } as ValueChangedEvent,
              'date'
            );
          }

          this.loadAllRefbooks();

          /* Navigate in catalog from any place with assigned parameter @session in filter
           *   if @session not found in available session list => reset @session in filter and refresh data in grid
           */
          if (this.filtersForm?.get('session').value) {
            const searchResult = this.dataGrid?.find(
              (item) => item.id === this.filtersForm.get('session').value
            );
            if (!searchResult) {
              this.filtersForm.get('session').setValue(null);
              this.componentData.emit(this.filtersForm.value);
            }
          }
        }
      });
  }

  private getByName(): void {
    let sessionNames = [];

    this.catalogService
      .getByName(
        this.user?.token,
        'sessionnames',
        this.filtersForm.get('sections').value
      )
      .subscribe((res) => {
        sessionNames = res.refbooks;

        this.sessionFilter.forEach((item) => {
          sessionNames.forEach((i) => {
            if (i.id == item.sessionNameId) {
              item.sessionName = i.name;
            }
          });
        });
      });
  }

  private getNomenclaturesWithGroups(): void {
    const token = this.user?.token;
    const sections = this.filtersForm.get('sectionsMulti').value?.length == 1
      ? this.filtersForm.get('sectionsMulti').value[0]
      : this.filtersForm.get('sections').value;

      this.filtersService
        .getNomenclaturesWithGroups(token, sections)
        .subscribe((res) => {
          this.nomenclatureGroup = res.nomenclaturesWithGroups;

          if (this.filtersForm.get('nomenclatureGroup')?.value) {
            this.goodsGroup = this.nomenclatureGroup?.find(
              (el) => el.id == this.filtersForm.get('nomenclatureGroup')?.value
            )?.groups;

            if (this.filtersForm.controls?.goods.value) {
              let goodsGroupIdLink = this.goodsGroup?.find(
                (el) => el.id == this.filtersForm.get('goodsGroup')?.value
              )?.idLink;

              this.getGoodsList(goodsGroupIdLink);
            }

            if (this.filtersForm.controls?.dateFrom?.value || this.filtersForm.controls?.dateTo?.value) {
              this.onChangeSelectBox(
                {
                  value: this.filtersForm.controls?.dateFrom?.value
                } as ValueChangedEvent,
                'date'
              );
            }
          }
        });
  }

  private getGoodsList(goodsGroupIdLink: number): void {
    this.filtersService
      .getGoodsList(
        this.user?.token,
        this.filtersForm.get('sectionsMulti').value?.length == 1
          ? this.filtersForm.get('sectionsMulti').value[0]
          : this.filtersForm.get('sections').value,
        goodsGroupIdLink
      )
      .subscribe((res) => {
        this.goods = res.goods;
        if (
          this.filtersForm.get('goods')?.value?.length === 1 &&
          this.goods?.length > 0
        ) {
          const idGood = this.filtersForm.get('goods')?.value[0];
          let goodsIdLink = this.goods?.find((el) => el.id == idGood)?.idLink;
          this.getRefs(goodsIdLink);
        }

        if (
          this.filtersForm.get('goods')?.value?.length == 1 &&
          this.nameOfCachePage === NamesOfCachePage.CATALOG
        ) {
          this.onChangeSelectBox(
            {
              value: this.filtersForm.get('goods')?.value,
            } as ValueChangedEvent,
            'goods'
          );
        }
      });
  }

  public enableFilters(): void {
    let filterCacheProps = [];
    let previousFilters: FiltersFormModel;

    if (this.nameOfCachePage) {
      if (this.nameOfCachePage === NamesOfCachePage.SESSIONS_SCHEDULE) {
        previousFilters = JSON.parse(
          sessionStorage.getItem('SESSION_SCHEDULE')
        )?.filters;
      }

      if (this.nameOfCachePage === NamesOfCachePage.CATALOG) {
        if (!this.sessionStorageKey) return;

        const stored = sessionStorage.getItem(this.sessionStorageKey);
        if (!stored) return;

        previousFilters = this.sessionStorageService.getItemFromSessionStorage<PageCache>(
          this.sessionStorageKey
        )?.filters;
        if (!previousFilters) return;
      }

      if (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) {
        previousFilters =
          this.sessionStorageService.getItemFromSessionStorage<PageCache>(
            'OFFER_MANAGEMENT'
          )?.filters;
      }

      if (this.nameOfCachePage === RERORT_DEALS_PAGE_NAME) {
        previousFilters =
          this.sessionStorageService.getItemFromSessionStorage<PageCache>(
            REPORT_DEALS
          )?.filters;
      }

      if (this.nameOfCachePage === REPORT_TRADING_SESSION_ORDERS_PAGE_NAME) {
        previousFilters = this.sessionStorageService.getItemFromSessionStorage<PageCache>(
          REPORT_TRADING_SESSION_ORDERS
        )?.filters;
      }

      if (this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME) {
        previousFilters = this.sessionStorageService.getItemFromSessionStorage<PageCache>(
          REPORT_BIDDING_PROCESS
        )?.filters;
      }
    }

    if (previousFilters) {
      // ключи фильтров кэшированных

      this.filterDataCache = previousFilters;
      this.filterDataCache['dateFrom'] = this.filterDataCache['dateFrom']
        ? (this.filterDataCache['dateFrom'] - 25569) * 24 * 3600 * 1000
        : null;
      this.filterDataCache['dateTo'] = this.filterDataCache['dateTo']
        ? (this.filterDataCache['dateTo'] - 25569) * 24 * 3600 * 1000
        : null;
      this.filterDataCache['idFirm']
        ? this.filtersForm.controls.idFirmName.patchValue(
            this.filterDataCache['idFirmName']
          )
        : null;

      this.patchIfExists('sections');
      this.patchIfExists('nomenclatureGroup');
      this.patchIfExists('goodsGroup');
      this.patchIfExists('session');
      this.patchIfExists('choosenSessionForManagement');
      this.patchIfExists('refsStr');
      this.patchIfExists('refsInt');
      this.patchIfExists('priceFrom');
      this.patchIfExists('priceTo');
      this.patchIfExists('quantityFrom');
      this.patchIfExists('quantityTo');

      if (this.nameOfCachePage !== NamesOfCachePage.SESSIONS_SCHEDULE) {
        this.listPropertiesStr = this.filterDataCache['refsStr'];
      }

      filterCacheProps = Object.keys(this.filterDataCache);
    }

    // перебор ключей приходящих фильтров и их отображение
    const responseFilterProps = Object.keys(this.filtersOn);

    for (const prop of responseFilterProps) {
      // перебор ключей приходящих фильтров и их отображение
      if (this.filtersOn[prop]) {
        // this.filtersForm.controls[this.filtersOn[prop]]?.enable();

        // перебор ключей приходящих фильтров из кэша и установка значений
        if (this.nameOfCachePage && previousFilters) {
          for (const propCache of filterCacheProps) {
            if (prop === propCache) {
              this.filtersForm.controls[this.filtersOn[prop]]?.patchValue(
                this.filterDataCache[propCache]
              );
            }
          }
        }
      }
    }
  }

  private patchIfExists(controlName: string): void {
    this.filterDataCache[controlName]
    ? this.filtersForm.controls[controlName].patchValue(
        this.filterDataCache[controlName]
      )
    : null;
  }

  public todayValue(): void {
    this.filtersForm.controls.dateFrom.patchValue(
      this.today.setHours(0, 0, 0, 0)
    );
    this.filtersForm.controls.dateTo.patchValue(
      this.today.setHours(0, 0, 0, 0)
    );
  }

  public clearFilters(): void {
    if (
      this.nameOfCachePage === NamesOfCachePage.SESSIONS_SCHEDULE ||
      this.nameOfCachePage === NamesOfCachePage.CATALOG
    ) {
      this.filtersForm.get('sections').setValue(null);
    }

    this.filtersForm.get('nomenclatureGroup').setValue(null);
    this.filtersForm.get('goodsGroup').setValue(null);
    this.filtersForm.get('goods').setValue(null);
    this.filtersForm.get('sectionsMulti').setValue(this.allSections);
    this.filtersForm.get('dateFrom').setValue(null);
    this.filtersForm.get('dateTo').setValue(null);
    this.filtersForm.get('preparation').reset(false);
    this.filtersForm.get('bidding').reset(false);
    this.filtersForm.get('registration_seller').reset(false);
    this.filtersForm.get('registration_buyer').reset(false);
    this.filtersForm.get('submitRequestsSale').reset(false);
    this.filtersForm.get('purchaseOrdersSubmitted').reset(false);
    this.filtersForm.get('listBranch').setValue(null);
    this.filtersForm.get('brokerClient').setValue(null);
    this.filtersForm.get('ListClientBranch').setValue(null);
    this.filtersForm.get('workerBrokerClient').setValue(null);
    this.filtersForm.get('workerListClientBranch').setValue(null);
    this.filtersForm.get('idFirm').setValue(null);
    this.filtersForm.get('idFirmName').setValue(null);
    this.filtersForm.get('sessionStage').setValue(null);
    this.filtersForm.get('marketType').setValue(null);
    this.filtersForm.get('lotNumber').setValue(null);
    this.filtersForm.get('priceFrom').setValue(null);
    this.filtersForm.get('priceTo').setValue(null);
    this.filtersForm.get('currency').setValue(null);
    this.filtersForm.get('units').setValue(null);
    this.filtersForm.get('termsPayment').setValue([]);
    this.filtersForm.get('termsDeliveryTime').setValue([]);
    this.filtersForm.get('multibasis').reset(false);
    this.filtersForm.get('analogsCatalog').reset(false);
    this.filtersForm.get('isMyDemandOffer').reset(false);
    this.filtersForm.get('analogs').reset(false);
    this.filtersForm.get('multibasisLot').reset(false);
    this.filtersForm.get('adjustablePrice').reset(false);
    this.filtersForm.get('assembledLot').reset(false);
    this.filtersForm.get('changes').reset(false);
    this.filtersForm.get('transferred').reset(false);
    this.filtersForm.get('transferredToBids').reset(false);
    this.filtersForm.get('outOfPriceRange').reset(false);
    this.filtersForm.get('indivPriceStep').reset(false);
    this.filtersForm.get('goodDeleted').reset(false);
    this.filtersForm.get('syncError').reset(false);
    this.filtersForm.get('refsStr').setValue([]);
    this.filtersForm.get('refsInt').setValue([]);

    this.chooseIdFirm = {};
    this.displayedInfo = this.sessionFilter;

    // в УЗ работник - сессию не сбрасываем
    if (
      !(
        (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) &&
        this.user.IsWorker
      )
    ) {
      this.filtersForm.get('session').setValue(null);
      this.filtersForm.get('choosenSessionForManagement').reset(null);
    }
    if (
      this.nameOfCachePage === RERORT_DEALS_PAGE_NAME ||
      this.nameOfCachePage === REPORT_TRADING_SESSION_ORDERS_PAGE_NAME ||
      this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME
    ) {
      this.getDxGridForReports();
    }
    this.componentData.emit(this.filtersForm.value);
  }

  public onSelectAllValue(e): void {
    //обработка "все" в выпадающем списке секций
    var selectAll = document.querySelector(
      '.dx-tagbox-popup-wrapper .dx-list-select-all'
    );
    if (selectAll != null) {
      if (e?.value) {
        selectAll.classList.add('disabled');
      } else {
        selectAll.classList.remove('disabled');
      }
    }
  }

  public onOpenSelectAll(): void {
    //обработка "все" в выпадающем списке секций
    var selectAll = document.querySelector(
      '.dx-tagbox-popup-wrapper .dx-list-select-all'
    );
    if (selectAll != null) {
      if (
        this.filtersForm.controls.sectionsMulti.value.length ==
        this.allSections.length
      ) {
        selectAll.classList.add('disabled');
      } else {
        selectAll.classList.remove('disabled');
      }
    }
  }

  public scrollInputToStart(e: ContentReadyEvent): void {
    requestIdleCallback(() => {
      const inputElement: HTMLInputElement = e.component
        ?.element()
        .querySelector('input');

      if (inputElement) {
        inputElement.selectionStart = 0;
        inputElement.selectionEnd = 0;
        inputElement.scrollLeft = 0;
      }
    });
  }

  public sessionTemplateSelectBox(data): string {
    if (!data) return '';
    const datepipe = new DatePipe('en-US');
    const date = datepipe.transform(
      data.startDateTime,
      'dd.MM.yyyy'
    );

    return `№${data.id} ${date} ${data.sessionName}`;
  }

  private loadAllRefbooks(): void {
    let sessionStageParam;

    sessionStageParam = this.user.IsWorker
      ? RefbooksNames.SESSIONSTAGESPRESALE
      : RefbooksNames.DEMOFFSESSIONSTAGES;

    forkJoin({
      sessionStage: this.loadRefbook(sessionStageParam),
      marketType: this.loadRefbook(RefbooksNames.MARKETTYPES),
      units: this.loadRefbook(RefbooksNames.UNITS),
      currency: this.loadRefbook(RefbooksNames.CURRENCIES),
      termsPayment: this.loadRefbook(RefbooksNames.PAYMENTTYPES),
      termsDeliveryTime: this.loadRefbook(RefbooksNames.DELIVERYBASISES),
    }).subscribe((result) => {
      this.sessionStage = result.sessionStage;
      this.marketType = result.marketType;
      this.units = result.units;
      this.currency = result.currency;
      this.termsPayment = result.termsPayment;
      this.termsDeliveryTime = result.termsDeliveryTime;
    });
  }

  public loadRefbook(name: string): Observable<RefbookItem[]> {
    return this.catalogService
      .getByName(this.user?.token, name)
      .pipe(map((res) => res.refbooks));
  }

  public onChangeSelectBox(e: ValueChangedEvent, select: string): void {
    if (!e.value || e.value.length == 0) {
      switch (select) {
        case 'section': {
          this.filtersForm.controls.sectionsMulti.setValue(null);
          this.filtersForm.controls.nomenclatureGroup.setValue(null);
          this.filtersForm.controls.sections.setValue(null);
          break;
        }
        case 'nomenclatureGroup': {
          this.filtersForm.controls.goodsGroup.setValue(null);
          this.filtersForm.controls.goods.setValue(null);
          this.listPropertiesStr = [];
          this.listPropertiesInt = [];
          this.filtersForm.controls.refsStr.patchValue(this.listPropertiesStr);
          this.filtersForm.controls.refsInt.patchValue(this.listPropertiesInt);
          break;
        }
        case 'goodsGroup': {
          this.filtersForm.controls.goods.setValue(null);

          if (this.listPropertiesStr?.includes(-3)) {
            //если в  массиве есть -3 - id справочника тов. группы
            let index = this.listPropertiesStr.indexOf(-3); // Находим индекс id справочника
            if (index !== -1) {
              // удаляем TG, G и динамические фильтры
              this.listPropertiesStr.splice(index - 1);
              this.filtersForm.controls.refsStr.patchValue(
                this.listPropertiesStr
              );
            }
          }

          this.filtersForm.controls.priceFrom.setValue(null);
          this.filtersForm.controls.priceTo.setValue(null);
          this.filtersForm.controls.currency.setValue(null);

          this.filtersForm.controls.quantityFrom.setValue(null);
          this.filtersForm.controls.quantityTo.setValue(null);
          this.filtersForm.controls.units.setValue(null);

          this.filtersForm.controls.termsPayment.setValue(null);
          this.filtersForm.controls.termsDeliveryTime.setValue(null);
          break;
        }
        case 'goods': {
          this.refs = [];
          this.listPropertiesInt = [];

          if (this.listPropertiesStr?.includes(-4)) {
            //если в  массиве есть -4 - id справочника товара
            let indexG = this.listPropertiesStr.indexOf(-4); // Находим индекс id справочника
            let indexTG = this.listPropertiesStr.indexOf(-3);
            if (indexG !== -1 && indexTG !== -1 && indexTG < indexG) {
              // удаляем G и динамические фильтры
              this.listPropertiesStr.splice(indexTG + 1, );
              this.filtersForm.controls.refsStr.patchValue(
                this.listPropertiesStr
              );
            }
          }
          break;
        }
        case 'broker': {
          this.filtersForm.controls.ListClientBranch.setValue(null);
          this.filtersForm.controls.workerListClientBranch.setValue(null);
          this.GetBranchesListFirmWorker();
          break;
        }
        case 'idFirm': {
          this.filtersForm.controls.workerBrokerClient.setValue(null);
          this.filtersForm.controls.workerListClientBranch.setValue(null);
          this.chooseIdFirm = {};
          break;
        }

        case 'preparation': {
          this.filtersForm.controls.preparation.setValue(false);
          this.sessionFilter = this.dataGrid;

          if (this.filtersForm.get('bidding').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.inProcessForAuction;
            });
          }

          if (this.filtersForm.get('sessionStage').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.stageId == this.filtersForm.get('sessionStage').value;
            });
          }

          if (this.filtersForm.get('marketType').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return (
                item.marketTypeIds.find(
                  (el) => el == this.filtersForm.get('marketType').value
                ) == this.filtersForm.get('marketType').value
              );
            });
          }
          break;
        }

        case 'bidding': {
          this.filtersForm.controls.bidding.setValue(false);
          this.sessionFilter = this.dataGrid;

          if (this.filtersForm.get('preparation').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.preparation;
            });
          }

          if (this.filtersForm.get('sessionStage').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.stageId == this.filtersForm.get('sessionStage').value;
            });
          }

          if (this.filtersForm.get('marketType').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return (
                item.marketTypeIds.find(
                  (el) => el == this.filtersForm.get('marketType').value
                ) == this.filtersForm.get('marketType').value
              );
            });
          }

          break;
        }

        case 'sessionStage': {
          this.filtersForm.controls.sessionStage.setValue(null);
          this.sessionFilter = this.dataGrid;

          if (this.filtersForm.get('preparation').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.preparation;
            });
          }

          if (this.filtersForm.get('bidding').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.inProcessForAuction;
            });
          }

          if (this.filtersForm.get('marketType').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return (
                item.marketTypeIds.find(
                  (el) => el == this.filtersForm.get('marketType').value
                ) == this.filtersForm.get('marketType').value
              );
            });
          }

          break;
        }

        case 'marketType': {
          this.filtersForm.controls.marketType.setValue(null);
          this.sessionFilter = this.dataGrid;

          if (this.filtersForm.get('preparation').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.preparation;
            });
          }

          if (this.filtersForm.get('bidding').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.inProcessForAuction;
            });
          }

          if (this.filtersForm.get('sessionStage').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return (
                item.stageId ==
                this.filtersForm.get('sessionStage').value
              );
            });
          }
          break;
        }

        case 'session': {
          this.filtersForm.controls.session.setValue(null);
          this.filtersForm.controls.lotNumber.setValue(null);
          this.filtersForm.get('choosenSessionForManagement').setValue(null);
          this.setDefaultTitle();
          break;
        }

        case 'units': {
          this.filtersForm.controls.session.setValue(null);
          this.filtersForm.controls.lotNumber.setValue(null);
          this.filtersForm.get('choosenSessionForManagement').setValue(null);
          break;
        }

        case 'price': {
          if (
            !this.filtersForm.get('priceFrom').value &&
            !this.filtersForm.get('priceTo').value
          ) {
            this.filtersForm.controls.currency.setValue(null);
          }
          break;
        }

        case 'quantity': {
          if (
            !this.filtersForm.get('quantityFrom').value &&
            !this.filtersForm.get('quantityTo').value
          ) {
            this.filtersForm.controls.units.setValue(null);
          }
          break;
        }
      }
    } else {
      switch (select) {
        case 'section': {
          if (
            this.filtersForm.get('sections').value != null ||
            this.filtersForm.get('sectionsMulti')?.value?.length == 1
          ) {
            this.clearAfterChangeSection();

            if (this.nameOfCachePage === NamesOfCachePage.CATALOG) {
              this.getDxGrid();
            }

            if (
              this.nameOfCachePage === RERORT_DEALS_PAGE_NAME ||
              this.nameOfCachePage === REPORT_TRADING_SESSION_ORDERS_PAGE_NAME ||
              this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME
            ) {
              this.getDxGridForReports();
            }

            this.getNomenclaturesWithGroups();
          } else {
            this.clearAfterChangeSection();
          }
          break;
        }
        case 'nomenclatureGroup': {
          this.filtersForm.controls.goodsGroup.setValue(null);
          //  this.filtersForm.controls.goods.setValue(null);
          if (this.nomenclatureGroup.length > 0) {
            this.goodsGroup = this.nomenclatureGroup?.find(
              (el) => el.id == this.filtersForm.get('nomenclatureGroup')?.value
            )?.groups;

            this.listPropertiesStr = [e.value].concat(-2); // -2 - id справочника ном. группы
            this.filtersForm.controls.refsStr.patchValue(
              this.listPropertiesStr
            );
          }
          break;
        }
        case 'goodsGroup': {
          this.filtersForm.controls.goods.setValue(null);
          if (this.goodsGroup.length > 0) {
            let goodsGroupIdLink = this.goodsGroup?.find(
              (el) => el.id == this.filtersForm.get('goodsGroup')?.value
            )?.idLink;

            if (goodsGroupIdLink) {
              this.filtersService
                .getGoodsList(
                  this.user?.token,
                  this.filtersForm.get('sectionsMulti').value?.length == 1
                    ? this.filtersForm.get('sectionsMulti').value[0]
                    : this.filtersForm.get('sections').value,
                  goodsGroupIdLink
                )
                .subscribe((res) => {
                  this.goods = res.goods;

                  if (this.listPropertiesStr?.includes(-3)) {
                    //если в  массиве есть -3 - id справочника тов. группы
                    let index = this.listPropertiesStr.indexOf(-3); // Находим индекс id справочника
                    if (index !== -1) {
                      // Заменяем пред. id ТГ
                      this.listPropertiesStr.splice(index - 1, 1, e.value);
                    }
                  } else {
                    this.listPropertiesStr = this.listPropertiesStr.concat(
                      [e.value].concat(-3)
                    );
                  }
                  this.filtersForm.controls.refsStr.patchValue(
                    this.listPropertiesStr
                  );

                  if (
                    this.filtersForm.get('goods')?.value?.length == 1 &&
                    this.nameOfCachePage === NamesOfCachePage.CATALOG
                  ) {
                    this.onChangeSelectBox(
                      {
                        value: this.filtersForm.get('goods')?.value,
                      } as ValueChangedEvent,
                      'goods'
                    );
                  }
                });
            }
          }
          break;
        }
        case 'goods': {
          if (this.nameOfCachePage != NamesOfCachePage.SESSIONS_SCHEDULE) {
            if (e.value?.length > e.previousValue?.length) {
              if (this.listPropertiesStr?.includes(-4)) {
                //если в массиве есть -4 - id справочника товара
                let index = this.listPropertiesStr.indexOf(-4); // Находим индекс id справочника
                if (index !== -1) {
                  // добавляем id товара перед -4
                  this.listPropertiesStr.splice(
                    index,
                    0,
                    e.value[e.value.length - 1]
                  );
                }
              } else {
                this.listPropertiesStr = this.listPropertiesStr.concat(
                  e.value.concat(-4)
                );
              }
            } else {
              //находим удаленный id
              if (e.previousValue !== null && e.previousValue) {
                let missingElem = e.previousValue.filter(
                  (element) => !e.value.includes(element)
                );
                this.listPropertiesStr = this.listPropertiesStr.filter(
                  (el) => el !== missingElem[0]
                );
              }
            }

            this.filtersForm.controls.refsStr.patchValue(
              this.listPropertiesStr
            );

            if (
              this.goods.length > 0 &&
              (e.value?.length == 1 ||
                this.filtersForm.get('goods')?.value.length == 1)
            ) {
              //выводим доп хар-ки товара только если выбрали 1 товар
              let goodsIdLink = this.goods?.find(
                (el) => el.id == this.filtersForm.get('goods')?.value
              )?.idLink;

              if (goodsIdLink) {
                this.getRefs(goodsIdLink)
              }
              this.filtersForm.controls.refsStr.patchValue(
                this.listPropertiesStr
              );
            }
          }
          break;
        }

        case 'broker': {
          this.filtersForm.controls.listBranch.setValue(null);
          if (this.brokerClient.length > 0)
            this.ListClientBranch = this.brokerClient.find(
              (el) =>
                el.firmClient == this.filtersForm.get('brokerClient').value
            ).branchesClients;
          if (this.workerBrokerClient.length > 0)
            this.workerListClientBranch =
              this.workerBrokerClient.find(
                (el) =>
                  el.firmClient ==
                  this.filtersForm.get('workerBrokerClient').value
              ).branchesClients || [];
          break;
        }

        case 'idFirm': {
          this.getBranchesFirmsOfAllClientsWorker();
          this.GetBranchesListFirmWorker();
          break;
        }

        case 'date': {
          if (this.nameOfCachePage !== NamesOfCachePage.SESSIONS_SCHEDULE) {
            const dateFromRaw = this.filtersForm.controls?.dateFrom?.value;
            const dateToRaw = this.filtersForm.controls?.dateTo?.value;

            let dateFromValue =
              typeof dateFromRaw === 'number'
                ? new Date(dateFromRaw)
                : dateFromRaw instanceof Date
                ? dateFromRaw
                : null;

            let dateToValue =
              typeof dateToRaw === 'number'
                ? new Date(dateToRaw)
                : dateToRaw instanceof Date
                ? dateToRaw
                : null;

            const date = {
              dateFrom: dateFromValue
                ? `${dateFromValue.getFullYear()}-${(
                    dateFromValue.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, '0')}-${dateFromValue
                    .getDate()
                    .toString()
                    .padStart(2, '0')}`
                : null,
              dateTo: dateToValue
                ? `${dateToValue.getFullYear()}-${(dateToValue.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}-${dateToValue
                    .getDate()
                    .toString()
                    .padStart(2, '0')}`
                : null,
            };

            if (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) {
              this.displayedInfo = this.filterByDate(this.originalInfo, date);
              if (this.displayedInfo?.length == 0) {
                this.filtersForm.controls.session.setValue(null);
              }
            }
            if (
              this.nameOfCachePage === RERORT_DEALS_PAGE_NAME ||
              this.nameOfCachePage === REPORT_TRADING_SESSION_ORDERS_PAGE_NAME ||
              this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME
            ) {
              this.getDxGridForReports();
            }
            if (this.nameOfCachePage === NamesOfCachePage.CATALOG) {
              this.sessionFilter = this.filterByDate(this.sessionFilter, date);
            }
          }
          break;
        }

        case 'preparation': {
          if (!this.filtersForm.get('bidding').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.preparation;
            });
          }
          break;
        }

        case 'bidding': {
          if (!this.filtersForm.get('preparation').value) {
            this.sessionFilter = this.sessionFilter.filter((item) => {
              return item.statusId === statusSession.inProcessForAuction;
            });
          }
          break;
        }
        case 'sessionStage': {
          if (this.sessionFilter.length == 0) {
            this.sessionFilter = this.dataGrid;
          }

          this.sessionFilter = this.sessionFilter.filter((item) => {
            return item.stageId == this.filtersForm.get('sessionStage').value;
          });
          break;
        }
        case 'marketType': {
          if (this.sessionFilter.length == 0) {
            this.sessionFilter = this.dataGrid;
          }

          this.sessionFilter = this.sessionFilter.filter((item) => {
            return (
              item.marketTypeIds.find(
                (el) => el == this.filtersForm.get('marketType').value
              ) == this.filtersForm.get('marketType').value
            );
          });
          break;
        }
        case 'session': {
          //находим и передаем в кэш инфу о сессии (типы рынка для отображения доп условий, стадия и имя в шапку
          if (e.value && this.sessionFilter?.length > 0) {
            this.onChoosenSessionForManagement(e.value);
          }
          this.filtersForm.controls.lotNumber.setValue(null);

          if (this.nameOfCachePage === REPORT_BIDDING_PROCESS_PAGE_NAME) {
            this.getListLotsNumber();
          }

          break;
        }
      }
    }
  }

  private filterByDate(data: SessionDataItem[], { dateFrom, dateTo }): SessionDataItem[] {
    return data.filter(item => {
      const itemDate = item.startDateTime.split('T')[0];

      const itemFrom = dateFrom ? itemDate >= dateFrom : true;
      const itemTo = dateTo ? itemDate <= dateTo : true;

      return itemFrom && itemTo;
    });
  };

  private getRefs(goodsIdLink: number): void {
    this.createOfferService
    .getNomenclatureRefsSubmission(
      this.user?.token,
      // this.filtersForm.get('sections').value,
      this.filtersForm.get('sectionsMulti').value?.length == 1
        ? this.filtersForm.get('sectionsMulti').value[0]
      ``  : this.filtersForm.get('sections').value,
      goodsIdLink
    )
    .subscribe((res) => {
      this.refs = res.references;
      this.refs.forEach((i) => {
        this.createOfferService
          .getFilterRefValuesSubmission(
            this.user?.token,
            // this.filtersForm.get('sections').value,
            this.filtersForm.get('sectionsMulti').value?.length == 1
              ? this.filtersForm.get('sectionsMulti').value[0]
              : this.filtersForm.get('sections').value,
            i.id,
            goodsIdLink
          )
          .subscribe((res) => {
            i.values = res.values;
            i.isHidden = false; //для скрытия фильтра
            i.start = res.values[0].rangeBoundLeft; //для слайдеров
            i.end = res.values[0].rangeBoundRight; //для слайдеров
          });
      });
      this.listPropertiesInt = [];

        if (this.listPropertiesStr?.length > 0) {
          this.initRefsFromSaved();
        }
    });
  }

  private onChoosenSessionForManagement(session: number): void {
    if (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) {
      let choosenSession = this.sessionFilter.filter((item) => {
        return item.id == session;
      });
      this.filtersForm.controls.choosenSessionForManagement.patchValue(
        choosenSession[0]
      );
      sessionStorage.setItem(
        'OFFER_MANAGEMENT',
        JSON.stringify(this.filtersForm.value)
      ); //перезаписываем сессию в кэш, чтоб в УЗ взять оттуда инфу о сессиии
      const offerSectionChange = {
        sectionId: choosenSession[0].tradeSectionId,
        sessionId: session,
        typeOfSession: 'current',
      };
      localStorage.setItem('offerSection', JSON.stringify(offerSectionChange));
      this.sendFiltersData();
    }
  }

  chooseRefsValue(e, id, type, idCh?) {
    if (type === 'checkbox') {
      //обработка чекбокса
      if (e.value) {
        //ставим
        if (this.listPropertiesStr?.includes(-id)) {
          //если в конечном массиве есть id справочника
          // Находим индекс id справочника
          let index = this.listPropertiesStr.indexOf(-id);
          // Добавляем idCh !обязательно перед! id справочника (id справочника служит разделителем)
          if (index !== -1) {
            this.listPropertiesStr.splice(index, 0, idCh[idCh.length - 1]);
          }
        } else {
          if (this.listPropertiesStr.length == 0) {
            this.listPropertiesStr = idCh.concat(id * -1);
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              idCh.concat(id * -1)
            );
          }
        }
      } else {
        //удаляем
        this.listPropertiesStr = this.listPropertiesStr.filter(
          (el) => el !== idCh[0]
        ); //удаляем id хар-ки

        for (let i = 0; i < this.listPropertiesStr.length; i++) {
          //удаляем id самого спраовчника если удалили все id хар-к
          if (
            this.listPropertiesStr[i] === -id &&
            ((i > 0 && this.listPropertiesStr[i - 1] < 0) ||
              (i < this.listPropertiesStr.length - 1 &&
                this.listPropertiesStr[i + 1] < 0))
          ) {
            this.listPropertiesStr.splice(i, 1);
          }
        }
      }

      this.filtersForm.controls.refsStr.patchValue(this.listPropertiesStr);
    }

    if (type === 'str') {
      //обработка дропдауна

      if (e.value.length > e.previousValue.length) {
        //добавление
        if (this.listPropertiesStr?.includes(-id)) {
          //если в конечном массиве есть id справочника
          // Находим индекс id справочника
          let index = this.listPropertiesStr.indexOf(-id);
          // Добавляем value !обязательно перед! id справочника (id справочника служит разделителем)
          if (index !== -1) {
            this.listPropertiesStr.splice(
              index,
              0,
              e.value[e.value.length - 1]
            );
          }
        } else {
          if (this.listPropertiesStr.length == 0) {
            this.listPropertiesStr = e.value.concat(id * -1);
          } else {
            this.listPropertiesStr = this.listPropertiesStr.concat(
              e.value.concat(id * -1)
            );
          }
        }
      } else {
        //удаление

        if (e.value.length > 0) {
          //находим удаленный id
          let missingElem = e.previousValue.filter(
            (element) => !e.value.includes(element)
          );
          this.listPropertiesStr = this.listPropertiesStr.filter(
            (el) => el !== missingElem[0]
          );
        }

        if (e.value.length == 0) {
          let indexTG = this.listPropertiesStr.indexOf(-id); // Находим индекс id справочника

          if (indexTG !== -1) {
            let startIndex = indexTG;

            //идем влево от найденного индекса, пока не найдем следующее отрицательное число
            for (let i = indexTG - 1; i >= 0; i--) {
              if (this.listPropertiesStr[i] < 0) {
                startIndex = i;
                break;
              }
            }

            //удаляем от найденного индекса до самого id
            this.listPropertiesStr.splice(startIndex + 1, indexTG - startIndex);
         }
        }
      }
      this.filtersForm.controls.refsStr.patchValue(this.listPropertiesStr);
    }

    if (type === 'range') {
      //обработка слайдеров
      if (e.value) {
        if (this.listPropertiesInt?.includes(-id)) {
          //если в массиве есть id справочника
          let index = this.listPropertiesInt.indexOf(-id);
          if (index !== -1) {
            this.listPropertiesInt.splice(index - 2, 2, e.start, e.end);
          }
        } else {
          if (this.listPropertiesInt.length == 0) {
            this.listPropertiesInt = e.value.concat(id * -1);
          } else {
            this.listPropertiesInt = this.listPropertiesInt.concat(
              e.value.concat(id * -1)
            );
          }
        }
      }
      this.filtersForm.controls.refsInt.patchValue(this.listPropertiesInt);
    }
  }

  private initRefsFromSaved(): void {
    const parsed: Record<number, number[]> = {};

    let buffer: number[] = [];

    for (const el of this.listPropertiesStr) {
      if (el < 0) {
        const refId = Math.abs(el);
        parsed[refId] = buffer;
        buffer = [];
      } else {
        buffer.push(el);
      }
    }

    this.refs.forEach((ref) => {
      ref.selectedValues = parsed[ref.id] ?? [];
    });
  }

  private clearAfterChangeSection(): void {
    this.filtersForm.controls.nomenclatureGroup.setValue(null);
    this.filtersForm.controls.goodsGroup.setValue(null);
    this.filtersForm.controls.goods.setValue(null);
    this.filtersForm.controls.session.setValue(null);
  }

  getBranchesAndClients() {
    const bodyFilter = {
      isOnlyActiveBranchesClient: true,
    };
    this.commonService
      .GetBranchesFirmsOfAllClientsFilter(this.user?.token, bodyFilter)
      .subscribe((res) => {
        if (res) {
          this.brokerClient = res.branchesFirmsOfAllClients;
          if (this.filtersForm.get('brokerClient')?.value) {
            const selectedBrokerClient =
              this.filtersForm.get('brokerClient').value;
            const foundEl = this.brokerClient.find(
              (el) => el.firmClient == selectedBrokerClient
            );
            if (foundEl) {
              this.ListClientBranch = foundEl.branchesClients;
            } else {
              this.ListClientBranch = [];
            }
          } else {
            this.ListClientBranch = [];
          }
        } else {
          this.brokerClient = [];
          this.ListClientBranch = [];
        }
      });
  }

  async getBranchesFirmsOfAllClientsWorker() {
    const body = {
      isOnlyActiveBranchesClient: true,
      idFirm: this.filtersForm.get('idFirm')?.value,
    };
    try {
      const res = await this.filtersService.GetBranchesFirmsOfAllClients(
        this.user?.token,
        body
      );
      if (this.isResponseDefined(res)) {
        this.workerBrokerClient = res.branchesFirmsOfAllClients;
        if (this.filtersForm.get('workerBrokerClient')?.value) {
          const selectedFirmClient =
            this.filtersForm.get('workerBrokerClient').value;
          const foundBranch = this.workerBrokerClient?.find(
            (el) => el.firmClient == selectedFirmClient
          );
          if (foundBranch && 'branchesClients' in foundBranch) {
            this.workerListClientBranch = (foundBranch as any).branchesClients;
          } else {
            this.workerListClientBranch = [];
          }
        } else {
          this.workerListClientBranch = [];
        }
      } else {
        this.workerBrokerClient = [];
        this.workerListClientBranch = [];
      }
    } catch (error) {
      this.workerBrokerClient = [];
      this.workerListClientBranch = [];
    }
  }

  GetBranchesListFirm() {
    const body = {
      isOnlyActive: true,
    };

    this.commonService
      .GetBranchesListFirmForFilter(this.user?.token, body)
      .subscribe((res) => {
        if (res) {
          this.listBranch = res.branchesFirms;
        } else {
          this.listBranch = [];
        }
      });
  }

  async GetBranchesListFirmWorker() {
    if (this.filtersForm.get('idFirm')?.value) {
      const body = {
        idFirm: this.filtersForm.get('idFirm')?.value,
        isOnlyActive: true,
      };

      await this.filtersService
        .GetBranchesListFirm(this.user?.token, body)
        .then((res: any) => {
          this.workerListClientBranch = res.branchesFirms || [];
        });
    }
  }

  getFirmsList() {
    if (this.search.length > 0) {
      this.filtersService
        .BuceGetFirmsList(this.user?.token, this.search, this.page)
        .then((res: any) => {
          this.firmList = res.buceFirms;
          this.pagination = res.pagination;
        });
    }
  }

  public onChangePage(e): void {
    this.page = e;
    this.getFirmsList();
  }

  public onMultiTagPreparing(e): void {
    const selectedItemsLength = e.selectedItems.length;

    if (selectedItemsLength < this.allSections.length) {
      e.text =
        getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'filters.sectionsSelected'
        ) + `: ${selectedItemsLength}`;
    } else {
      e.text = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'general.all'
      );
    }
  }

  public onChooseIdFirm(item): void {
    this.chooseIdFirm = item;
    this.filtersForm.controls.idFirm.setValue(item.idFirm);
    this.search = '';
    this.clearFirmList();
    this.chooseFirm = !this.chooseFirm;
  }

  public clearFirmList(): void {
    this.page = 1;
    this.firmList.length = 0;
  }

  public sendFiltersData(): void {
    const date = {
      //перевод формата даты к числовому
      dateFrom: this.filtersForm.controls.dateFrom?.value
        ? this.commonService.toOADate(this.filtersForm.controls.dateFrom?.value)
        : null,
      dateTo: this.filtersForm.controls.dateTo?.value
        ? this.commonService.toOADate(this.filtersForm.controls.dateTo?.value)
        : null,
    };

    if (
      this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT &&
      this.filtersForm.controls.session?.value !=
        this.filterDataCache?.['session']
    ) {
      localStorage.removeItem('offerManagement');
    }
    this.componentData.emit(Object.assign(this.filtersForm.value, date));
    this.scrollToTheTopOfThePage();
  }

  private scrollToTheTopOfThePage(): void {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  private isResponseDefined(
    res: any | undefined
  ): res is { branchesFirmsOfAllClients: any[] } {
    return (
      res !== undefined &&
      res !== null &&
      typeof res === 'object' &&
      'branchesFirmsOfAllClients' in res
    );
  }

  private setDefaultTitle(): void {
    if (this.nameOfCachePage === NamesOfCachePage.OFFER_MANAGEMENT) {
      const textTab = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'offer-management.offerManagement'
      );
      this.title.setTitle(textTab);
    }
  }
}
