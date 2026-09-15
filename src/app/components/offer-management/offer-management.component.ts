/* eslint-disable */
import {
  OpenAccessPopupComponent
} from './../../sub_components/open-access/open-access-popup/open-access-popup.component';
import {
  Component,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { User } from 'src/app/core/classes/user';
import { PageCache } from 'src/app/core/classes/PageCache';
import { TranslateService } from '@ngx-translate/core';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import { Router, ActivatedRoute, UrlTree } from '@angular/router';
import {
  numberEntriesPage,
  sessionStage,
  statusSession,
  role,
  offerStatus,
  IdDirection,
  AuctionType,
  filterTabsInOM,
  sectionID,
  ACTUAL_SIZE_FIELDS,
  depositType,
  VOLUME_PRECISION,
  IdDirectionsForTransfer
} from '../../api.constants';
import Tooltip from 'devextreme/ui/tooltip';
import { CatalogService } from 'src/app/core/services/catalog-service.service';
import { CreateOfferService } from '../../core/services/create-offer-service.service';
import { CommonService } from '../../core/services/common-service.service';
import { FiltersComponent } from '../../sub_components/filters/filters.component';
import { SidebarService } from '../../core/services/sidebar-service.service';
import { DxPopupComponent } from 'devextreme-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabStateService } from 'src/app/core/services/tab-state.service';
import { Subject, catchError, of, takeUntil, tap, Observable } from 'rxjs';
import {
  FieldOptionsApiModel,
  FieldsModel,
  Good,
  GoodApiModel,
  GridOptionsApiModel,
  GridVisibilityOptionsApiModel,
  IServiceError,
  ListOffersCatalogueApiModel,
  OfferModel
} from 'src/app/core/interfaces/interface';
import dxDataGrid, { Column, ContextMenuPreparingEvent } from 'devextreme/ui/data_grid';
import {
  ApproveOfferApiError,
  DemandOfferCataloguePayload,
  DemandOfferCatalogueResponse, FilterOption
} from 'src/app/shared/interfaces';
import { SharedStateManagerService } from '../../core/services/shared-state-export.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { map, take } from 'rxjs/operators';
import {
  domesticCondition,
  foreignCondition,
  generateCloseButtonOptions,
  generateColumnsForPopUpDisplay,
  generateInitialVisibilityForGridColumns,
  generateVisibilityForGridColumns,
  getActiveGridCategoryBySelectedTabIndex,
  updateFiltersByGoodsProperty,
  updateFiltersByNumericGoodsProperty,
  updateFiltersByRootProperty,
  updateFiltersByVatPercent,
  VAT_PERCENT_WITHOUT_VAT_FILTER_VALUE,
  recalculateTableVisibleIndexes,
} from "./helpers/generate-columns-data.helper";
import {
  getDataForHeaderFilter,
  isHeaderFilterFieldValueEmpty,
  isHeaderFilterNumericFieldValueEmpty,
  matchesNumericHeaderFilterValue,
  NUMERIC_ARRAY_DATA_FIELDS,
} from './helpers/header-filter-data.helper';
import { Properties as ButtonProperties } from 'devextreme/ui/button';
import { UserTableOptionsService } from "./user-table-options.service";
import {
  GridType,
  PRICE_ADJUSTMENT_TYPE,
  SavedColumnProperties,
  SectionType,
  STATIC_COLUMN_CAPTION_NAMES,
  StaticColumnFieldNames
} from '../../core/enums';
import {
  ColumnsDataModel,
  ColumnsVisibilityModel,
  ColumnState,
  DynamicTableDataModel,
  GridState,
  SectionIdModel,
  DepositTypeResponse,
  DepositDetailsResponse,
  RowData,
} from "../../core/interfaces";
import { TableDataFacadeService } from "./table-data-facade.service";
import { dynamicDataSort, GenerateFiltersHelpers, updateRightPanelHeight, generateDynamicData } from "../../core/helpers";
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { AppFacade } from '../../store/app.facade';
import { ID_INTERFACE_FIELD } from '../../shared/enums';
import { isHeaderFilterEmptySelection } from './helpers/table-header-filters.helper';
import { EditPriceStepService } from './../../core/services/edit-price-step-service.service';
import { ErrorServiceService } from "../../core/services/error-service.service";
import { SERVER_ERROR_CODE } from "../../core/constants";

@Component({
  selector: 'app-offer-management',
  templateUrl: './offer-management.component.html',
  styleUrls: ['./offer-management.component.scss'],
  providers: [UserTableOptionsService, TableDataFacadeService]
})
export class OfferManagementComponent implements OnInit, OnDestroy {
  @ViewChild(FiltersComponent)
  protected filtersComponent: FiltersComponent;

  @ViewChild('dataGridRef', {static: false})
  protected dataGridRef!: DxDataGridComponent;

  /* закрытие попап окна для отклонения заявки, в зависимотси есть или нет боковая панель*/
  @ViewChild('rejectPopupOpen', {static: false})
  protected rejectPopupOpen: DxPopupComponent;

  @ViewChild('customColumnChooserPopup', {static: false})
  protected customColumnChooserPopup: DxPopupComponent;

  @ViewChild(DxPopupComponent) protected transferErrors: DxPopupComponent;

  @ViewChild(OpenAccessPopupComponent)
  protected openAccessPopupComponent: OpenAccessPopupComponent;

  @HostListener('window:resize')
  private onWindowResize(): void {
    this.scheduleRightPanelUpdate();
  }

  @HostListener('document:keydown.escape', ['$event'])
  public onKeydownHandler(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    //по кнопке esc
    if (this.rejectPopup && !this.isOpenSidebar) {
      //открыто отклонения заявки и закрыта панель Sidebar
      this.rejectPopupOpen.instance.hide();
    }

    const sidebar = document.getElementById('mySidebar');
    if (sidebar && sidebar.style.opacity === '0') {
      //панель Sidebar закрыта
      this.isOpenSidebar = false;
    }
  }

  protected user: User;
  protected search: string;
  protected sectionId: number;
  protected typeOfSession: string;
  protected cache: PageCache = {} as PageCache;
  protected filterTab: number = 1;
  protected listOfOffers: any;
  public dynamicFields: DynamicTableDataModel = {
    refFields: [],
    generalFields: [],
    quotationRelatedFields: []
  };
  protected dataGrid: any;
  protected options: boolean = false;
  protected selectedRows: any[] = [];
  protected disableToolbar: boolean = true;
  protected chooseOffers: any[] = [];
  protected currentTimeDate: Date;
  protected readonly numberEntriesPage: number[] = numberEntriesPage;
  protected readonly sessionStage = sessionStage;
  protected nameSessionStage: string;
  protected sessionInfo: any = [];
  protected hidePanel: boolean = false;
  protected detailsDepositOffer: any; //депозит по заявке

  protected role: any;
  protected UserRole: number;

  protected idOffer: number;
  protected direction: number; //направление покупка/продажа
  protected offerData: any;
  protected numberTotal: number;

  protected popup: boolean = false; //popup окно
  protected popupMessage: string; //текст в попапе
  protected popupType: string; //тип сообщения
  protected popupTitle: string;

  protected rejectPopup: boolean = false; //попап для отклонения заявок работником
  protected rejectPopupTitle: string = '';

  protected popupSuccess: boolean = false; //успешно завершено
  protected popupSuccessMess: string;

  protected popupWarning: boolean = false; //при отклонении если какое-то количество успешно, а какое-то - неуспешно

  protected privileges: boolean = false;
  protected accessPrivileges: boolean = false; //привилегия для открытия доступа
  protected limitationsPrivileges: boolean = false; //привилегия для добавление ограничений
  protected depositPrivileges: boolean = false; //привилегия для просмотра задатка
  protected outOfRegulationPrivileges: boolean = false; //привилегия для переноса заявок в торги

  protected sessionId: number;
  protected firstTime: boolean = true;
  protected chooseOffersPopup: boolean = false;
  protected createTemplateSideBar: any;

  protected rejectionTemplates: any[] = []; //список шаблонов для отклонения (с фильтром мои или секции)
  protected rejectionTemplatesFull: any[] = []; //полный список шаблонов
  protected chooseRejectionTempl: any = {}; //выбранный шаблон
  protected rejectReason: string = ''; //причина отклонения
  protected myTemplate: number = 0; //вкладка на попапе мои шаблоны
  protected failureOffersCount: number; //неуспешно отклонено
  protected rejectedOffersCount: number; //успешно отклонено
  protected listFailureOffers: any; //массив отклоненных заявок с причиной отклонения

  protected permissions: any; //разрешения для кнопки
  protected successPopup: boolean = false; //успешное открытиe доступа

  protected readonly dataSource = [
    {
      id: 1251,
      name: 'Наименование сессии',
    } /* namedata: 'name', cellTemplate: 'cellTemplatesessionName' */,
    {id: 3, name: 'Номер'},
    {id: 4, name: 'Статус'},
    {id: 1, name: 'Валюта'},
    {id: 5, name: 'Условия поставки'},
    {id: 7, name: 'Условия оплаты сессии'},
  ];

  protected choosenSessionForManagement: any;
  protected isVisibleToast: boolean = false;
  protected type: string = 'info';
  protected message: string = ' ';

  protected accessPopup: boolean = false;
  protected depositPopup: boolean = false; //просмотр задатка по заявке
  protected depositPopupTitle: string;
  protected depositRowData: any;
  protected depositType: number;

  protected transferOffersPopup: boolean = false; //передача заявок др трейдеру
  protected transferErrorsPopup: boolean = false;
  protected transferOffersRes: any;
  protected readonly directions: any[] = [
    {
      refBookKey: IdDirectionsForTransfer.buy,
      refBookValue: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'sessions-schedule.buy'
      ),
    },
    {
      refBookKey: IdDirectionsForTransfer.sale,
      refBookValue: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'sessions-schedule.sale'
      ),
    },
    {
      refBookKey: IdDirectionsForTransfer.buyAndSale,
      refBookValue: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'general.buyAndSale'
      ),
    },
  ];
  protected traders: any;

  protected readonly transferForm: FormGroup = this.formBuilder.group({
    direction: [null, Validators.required],
    trader: [null, Validators.required],
  });

  protected readonly transferToBidsForm: FormGroup = this.formBuilder.group({
    violationsControl: [false],
    depositControl: [false],
    depositCalculation: [false],
    specialAdmissionProcedure: [false],
    syncGias: [true],
  });

  protected transferOffersToBidsPopup: boolean = false; //перенос заявок в торги
  protected transferToBidsResPopup: boolean = false;

  protected editPriceStepPopup: boolean = false;

  protected infoForRestore: any = [];
  protected isActiveQuotation: boolean = false;
  protected isActiveRange: boolean = false;
  protected activePriceLimit: any;
  protected offerGeneral: any;
  protected offerGoods: any;
  protected deliveryConditions: any;
  protected paymentCond: any;
  protected infoForPriceStep: any = [];
  protected currentTemplateTooltip: string;

  public selectedRowKeys: number[] = [];
  public selectedIndex: number = 0;

  public readonly auctionType: typeof AuctionType = AuctionType;
  public readonly filterTabsInOM: typeof filterTabsInOM = filterTabsInOM;
  private readonly depositTypeEnum: typeof depositType = depositType;
  public readonly VOLUME_PRECISION = VOLUME_PRECISION;

  public readonly STATIC_COLUMN_FIELD_NAMES: typeof StaticColumnFieldNames = StaticColumnFieldNames;
  public readonly STATIC_COLUMN_CAPTION_NAMES: { [key in StaticColumnFieldNames]: string } = STATIC_COLUMN_CAPTION_NAMES;
  public readonly closePopupButtonOptions: ButtonProperties = generateCloseButtonOptions(() => this.customColumnChooserPopup.visible = false);
  private pendingGridSettings: GridOptionsApiModel;
  /** Стейт колонок с API уже применён — повторный pending не накатываем (сбрасывал header filter после ОК). */
  private pendingGridSettingsApplied: boolean = false;
  /** Счётчик запросов getData: устаревший ответ игнорируем при двойном вызове на старте. */
  private gridDataLoadGeneration: number = 0;
  private initialHeaderFiltersApplied: boolean = false;
  public columnsData$: Observable<ColumnsDataModel>;
  public isTableSettingsChanged$: Observable<boolean>;
  public columnVisibilitySettings: ColumnsVisibilityModel;
  public sectionNamesById$: Observable<Record<number, string>>;

  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly sharedStateExportService: SharedStateManagerService = inject(SharedStateManagerService);
  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    public translate: TranslateService,
    public commonService: CommonService,
    public offerManagementService: OfferManagementService,
    public router: Router,
    public catalogService: CatalogService,
    private readonly createOfferService: CreateOfferService,
    private readonly sidebarService: SidebarService,
    private readonly formBuilder: FormBuilder,
    private readonly tabState: TabStateService,
    private pageMeta: PageMetaService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private userTableOptionsService: UserTableOptionsService,
    private tableDataFacadeService: TableDataFacadeService,
    private readonly appFacade: AppFacade,
    private editPriceStepService: EditPriceStepService
  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterAmountVAT =
      this.orderHeaderFilterAmountVAT.bind(this);
    this.orderHeaderFilterTotalAmount =
      this.orderHeaderFilterTotalAmount.bind(this);
    this.orderHeaderFilterAmendment =
      this.orderHeaderFilterAmendment.bind(this);
    this.orderHeaderFilterQuotation =
      this.orderHeaderFilterQuotation.bind(this);
    this.orderHeaderFilterLocation = this.orderHeaderFilterLocation.bind(this);
    this.orderHeaderFilterDestinations =
      this.orderHeaderFilterDestinations.bind(this);
    this.saveTableState = this.saveTableState.bind(this);
    this.orderHeaderFilterByStatusName = this.orderHeaderFilterByStatusName.bind(this);
    this.orderHeaderFilterByRejectionDate = this.orderHeaderFilterByRejectionDate.bind(this);
    this.orderHeaderFilterByRejectionReason = this.orderHeaderFilterByRejectionReason.bind(this);
    this.orderHeaderFilterByDirectionName = this.orderHeaderFilterByDirectionName.bind(this);
    this.orderHeaderFilterByMarketType = this.orderHeaderFilterByMarketType.bind(this);
    this.orderHeaderFilterByAnalog = this.orderHeaderFilterByAnalog.bind(this);
    this.orderHeaderFilterByCreateOfferDate = this.orderHeaderFilterByCreateOfferDate.bind(this);
    this.orderHeaderFilterByConcatedFirmName = this.orderHeaderFilterByConcatedFirmName.bind(this);
    this.orderHeaderFilterByContractType = this.orderHeaderFilterByContractType.bind(this);
    this.orderHeaderFilterByClient = this.orderHeaderFilterByClient.bind(this);
    this.orderHeaderFilterByBranch = this.orderHeaderFilterByBranch.bind(this);
    this.orderHeaderFilterByTrader = this.orderHeaderFilterByTrader.bind(this);
    this.orderHeaderFilterLotSummaryVolume = this.orderHeaderFilterLotSummaryVolume.bind(this);
    this.orderHeaderFilterByCurrency = this.orderHeaderFilterByCurrency.bind(this);
    this.orderHeaderFilterByVatPercent = this.orderHeaderFilterByVatPercent.bind(this);
    this.orderHeaderFilterByLotSummaryVatAmount = this.orderHeaderFilterByLotSummaryVatAmount.bind(this);
    this.orderHeaderFilterByLotSummaryTotalAmount = this.orderHeaderFilterByLotSummaryTotalAmount.bind(this);
    this.orderHeaderFilterBySessionNumber = this.orderHeaderFilterBySessionNumber.bind(this);
    this.orderHeaderFilterBySessionName = this.orderHeaderFilterBySessionName.bind(this);
    this.orderHeaderFilterBySessionDate = this.orderHeaderFilterBySessionDate.bind(this);
    this.orderHeaderFilterBySessionStage = this.orderHeaderFilterBySessionStage.bind(this);
    this.orderHeaderFilterByDeliveryConditions = this.orderHeaderFilterByDeliveryConditions.bind(this);
    this.orderHeaderFilterByDeliveryConditionsPeriod = this.orderHeaderFilterByDeliveryConditionsPeriod.bind(this);
    this.orderHeaderFilterByDeliverySchedule = this.orderHeaderFilterByDeliverySchedule.bind(this);
    this.orderHeaderFilterByPaymentConditions = this.orderHeaderFilterByPaymentConditions.bind(this);
    this.orderHeaderFilterByImportDomesticDetails = this.orderHeaderFilterByImportDomesticDetails.bind(this);
    this.orderHeaderFilterByExportDetails = this.orderHeaderFilterByExportDetails.bind(this);
    this.orderHeaderFilterByPrivateFiles = this.orderHeaderFilterByPrivateFiles.bind(this);
    this.orderHeaderFilterByPublicFiles = this.orderHeaderFilterByPublicFiles.bind(this);

    this.sectionNamesById$ = this.appFacade.sectionNamesById$;

    this.setBrowserTabInfo();

    this.columnsData$ = this.userTableOptionsService.columnsData$;
    this.isTableSettingsChanged$ = this.userTableOptionsService.hasUnsavedGridStateChanges$;
  }

  get stateKey(): string {
    // <offerMgmt_><role><tab>
    return `offer-mgmt_role${this.UserRole}_tab${this.filterTab}`;
  }

  get customColumnPopUpWidth(): number {
    const MIN_POP_UP_WIDTH: number = 1088;
    const MAX_POP_UP_WIDTH: number = 1288;
    const MIN_WINDOW_WIDTH: number = 1440;
    return window.innerWidth < MIN_WINDOW_WIDTH ? MIN_POP_UP_WIDTH : MAX_POP_UP_WIDTH;
  }

  get emptyData(): boolean {
    return !(this.listOfOffers?.length);
  }

  public infoTextFormatter = (currentPage: number, pageCount: number, totalCount: number): string => {
    const records: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.records'
    );

    const found: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.totalFound'
    );

    // Исправляем -1, которое DevExtreme передает в totalCount во время загрузки
    const correctedTotal = totalCount < 0 ? 0 : totalCount;

    return `${records} ${this.numberTotal}. ${found} ${correctedTotal}`;
  };

  public ngOnInit(): void {
    this.selectedIndex = this.tabState.getIndex('offers');

    this.tabState
      .getIndex$('offers')
      .pipe(
        takeUntil(this.destroy$),
        tap((index: number) => {
          this.selectedIndex = index;
          this.filterTab = index + 1;
          if (this.filtersComponent) {
            this.filtersComponent.sendFiltersData();
          }
        })
      ).subscribe();

    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cache = JSON.parse(sessionStorage.getItem('OFFER_MANAGEMENT')) || {};
    this.role = role;

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const sectionId = Number(params['idSection']);
        const typeOfSession = params['type'];

        if (sectionId) {
          //from URL for newTab / right click
          const isSameSection = sectionId === this.cache?.filters?.sections;

          const sessionFromCache = isSameSection ? this.cache?.filters?.session : null;

          this.offerManagementService.sessionId =
            this.sessionId ??
            sessionFromCache ??
            this.offerManagementService.sessionId ??
            null; //при наличии сессии в кэше - берем оттуда, иначе берем сессию которую передали из create-offer

          this.offerManagementService.sectionId = sectionId;
          this.offerManagementService.typeOfSession = typeOfSession;
        } else {
          const stored = JSON.parse(
            localStorage.getItem('offerSection') || '{}'
          );
          this.offerManagementService.sectionId = stored.sectionId;
          this.offerManagementService.typeOfSession = stored.typeOfSession;
          this.offerManagementService.sessionId = stored.sessionId;
        }

        // Persist for other pages
        const offerSection = {
          sectionId: this.offerManagementService.sectionId,
          typeOfSession: this.offerManagementService.typeOfSession,
          sessionId: this.offerManagementService.sessionId,
        };

        localStorage.setItem('offerSection', JSON.stringify(offerSection));

        this.sectionId = offerSection.sectionId;
        this.typeOfSession = offerSection.typeOfSession;
        this.sessionId = offerSection.sessionId;
      });

    this.createOfferService.GetRole(this.user?.token).subscribe((res: any) => {
      this.UserRole = res.role;

      //скрываем колонку из отображения таблицы, если она была выбрана в сельхоз продукции, а перешли на другую сессию
      if (this.sectionId != sectionID.agricultural) {
        let filtersInfo = JSON.parse(localStorage.getItem(this.stateKey));
        if (filtersInfo) {
          const index = filtersInfo?.columns?.findIndex(
            (el) => el.dataField == 'destinations'
          );
          if (index != -1) {
            filtersInfo.columns[index].visible = false;
            const filter = filtersInfo.filterValue?.findIndex(
              (el) => Array.isArray(el) && el[0] === 'destinations'
            );
            if (filter) {
              if (filter != -1) {
                if (filter == 0) filtersInfo.filterValue.splice(filter, 2);
                else filtersInfo.filterValue.splice(filter - 1, 2);
              }
            }

            localStorage.setItem(this.stateKey, JSON.stringify(filtersInfo));
          }
        }
      }
    });

    //привилегии для работника
    if (this.user?.IsWorker) {
      this.checkPriveleges();
    }

    this.createTemplateSideBar = this.sidebarService.template$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onGetRejectionTemplates();
        this.isVisibleToast = true;
        this.message =
          this.translate.store.currentLang == 'RU'
            ? RU['offer-management'].сhangesTemplatesSavedSuccessfully
            : EN['offer-management'].сhangesTemplatesSavedSuccessfully;
      });
  }

  public getPermissions(): void {
    this.offerManagementService
      .getManageDetails(
        this.sectionId,
        this.cache?.filters?.session
      )
      .then((res: any) => {
        this.permissions = res.permissions[0];
      });
  }

  private checkPriveleges(): void {
    const sectionsArray = JSON.parse(localStorage.getItem('sections'));
    let sectionDescription = sectionsArray.find(
      (el) => el.id === Number(this.sectionId)
    )?.description;
    let accessSectionDescription = sectionsArray.find(
      (el) => el.id === Number(this.sectionId)
    )?.description;
    let limitationsSectionDescription = sectionsArray.find(
      (el) => el.id === Number(this.sectionId)
    )?.description;
    let depositSectionDescription = sectionsArray.find(
      (el) => el.id === Number(this.sectionId)
    )?.description;
    let outOfRegulationSectionDescription = sectionsArray.find(
      (el) => el.id === Number(this.sectionId)
    )?.description;
    sectionDescription =
      'DemandOfferManagementProcessDemoff' + sectionDescription;
    accessSectionDescription =
      'DemandOfferManagementOutOfRegulations' + accessSectionDescription;
    limitationsSectionDescription =
      'DemandOfferManagementLimitations' + limitationsSectionDescription;
    depositSectionDescription =
      'DemandOfferManagementDeposit' + depositSectionDescription;
    outOfRegulationSectionDescription =
      'DemandOfferManagementOutOfRegulations' +
      outOfRegulationSectionDescription;

    this.privileges = this.commonService.checkPrivileges(sectionDescription);

    this.accessPrivileges = this.commonService.checkPrivileges(
      accessSectionDescription
    );
    this.limitationsPrivileges = this.commonService.checkPrivileges(
      limitationsSectionDescription
    );
    this.depositPrivileges = this.commonService.checkPrivileges(
      depositSectionDescription
    );
    this.outOfRegulationPrivileges = this.commonService.checkPrivileges(
      outOfRegulationSectionDescription
    );
  }

  public trackByDynamicField(index: number, item: any): string {
    return item.fieldName; // MUST be unique and stable
  }

  public getData(): void {
    // Параллельные getData() на первой загрузке: обрабатываем только последний ответ.
    // TODO: переписать этот кусок и сделать так чтобы не было двойного запроса на F5
    // он происходит в случае когда в LS у нас есть сессия и при F5 мы подставляем ее
    const loadGeneration: number = ++this.gridDataLoadGeneration;

    try {
      this.sessionInfo = this.cache?.filters?.choosenSessionForManagement;
      if (this.sessionInfo) {
        this.nameSessionStage = this.commonService.choosenSessionStage(Number(this.sessionInfo?.stageId), this.user?.IsWorker, this.translate.store.currentLang);
      }

      this.currentTimeDate = new Date();
      sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(this.cache));

      const filters = this.user?.IsWorker
        ? GenerateFiltersHelpers.getFiltersForWorker(this.sectionId, this.filterTab, this.cache)
        : GenerateFiltersHelpers.getFiltersForTrader(this.sectionId, this.filterTab, this.cache);

      if (!filters.filterSessionId) {
        this.listOfOffers = null;
        return;
      }

      if (this.user?.IsWorker) {
        this.checkPriveleges();

        this.tableDataFacadeService.getTableDataForWorker(this.user, filters, this.sectionId, this.filterTab)
          .pipe(
            tap(({data, userGridSettings}: {
              data: ListOffersCatalogueApiModel;
              userGridSettings: GridOptionsApiModel
            }) => {
              if (loadGeneration !== this.gridDataLoadGeneration) {
                return;
              }

              this.columnVisibilitySettings = generateVisibilityForGridColumns(
                userGridSettings,
                data['fields'],
                this.user,
                this.sessionInfo
              );
              if (!this.pendingGridSettingsApplied) {
                // Повторный ответ getData не должен снова ставить pending
                this.pendingGridSettings = userGridSettings;
              }
              this.applyResponseData(data);
            })
          )
          .subscribe();

      } else {
        this.tableDataFacadeService.getTableDataForTrader(this.user, filters, this.sectionId, this.filterTab)
          .pipe(
            tap(({data, userGridSettings}: {
              data: ListOffersCatalogueApiModel;
              userGridSettings: GridOptionsApiModel
            }) => {
              if (loadGeneration !== this.gridDataLoadGeneration) {
                return;
              }

              this.columnVisibilitySettings = generateVisibilityForGridColumns(
                userGridSettings,
                data['fields'],
                this.user,
                this.sessionInfo
              );
              if (!this.pendingGridSettingsApplied) {
                // Повторный ответ getData не должен снова ставить
                this.pendingGridSettings = userGridSettings;
              }
              this.applyResponseData(data);
            })
          )
          .subscribe();
      }
    } catch (e) {
      console.error(e);
    }
  }

  private applyResponseData(res: ListOffersCatalogueApiModel): void {
    this.listOfOffers = res.offers || [];
    this.dynamicFields = generateDynamicData(res.fields, this.user?.IsWorker);
    this.numberTotal = res.numberTotal;


    this.listOfOffers.forEach((item) => {
      item.names = item.goods.map((x) => x.goodName);
      item.desc = item.goods.map((x) => x.goodDescription);
      item.units = item.goods.map((x) => x.goodUnitName);
      item.vol = item.goods.map((x) => x.goodVolume);
      item.prices = item.goods.map((x) => x.priceWithoutVat);
      item.amountVAT = item.goods.map((x) => x.vatAmount);
      item.totalAmount = item.goods.map((x) => x.totalAmount);
      item.quotationCurrencyPrecision = item.goods.map((x) => x.quotationCurrencyPrecision);

      item.generalDynamicFields = {};
      item.refDynamicFields = {};
      item.defaultVisibleFields = {};

      this.dynamicFields.generalFields.forEach((dyn: FieldsModel) => {
        item.generalDynamicFields[dyn.fieldName] = item.goods.map(
          (good: GoodApiModel) => good.dynamicFields?.[dyn.fieldName]
        );
      });
      this.dynamicFields.refFields.forEach((dyn: FieldsModel) => {
        item.refDynamicFields[dyn.fieldName] = item.goods.map(
          (good: GoodApiModel) => good.dynamicFields?.[dyn.fieldName]
        );
      });

      this.dynamicFields.quotationRelatedFields.forEach((dyn: FieldsModel) => {
        item.defaultVisibleFields[dyn.fieldName] = item.goods.map(
          (good: GoodApiModel) => good.dynamicFields?.[dyn.fieldName]
        );
      });
    });

    this.cdr.detectChanges();

    this.ngZone.onStable.pipe(take(1)).subscribe(() => {
      this.disableToolbar = false;
    });
  }

  public getNumber(value: unknown): number {
    return Number(value);
  }

  public domesticCondition(): boolean {
    return domesticCondition(this.sessionInfo);
  }

  public foreignCondition(): boolean {
    return foreignCondition(this.sessionInfo);
  }

  public onSelectionChanged(data: any): void {
    this.selectedRows = data.selectedRowsData;
    this.selectedRowKeys = data.selectedRowKeys;
    this.options = data.selectedRowKeys.length > 0;

    if (this.selectedRows.length === 1) {
      this.idOffer = this.selectedRows[0].idDemandOffer;
      this.offerData = this.selectedRows[0];
    }

    this.chooseOffers = this.selectedRows;
  }

  public onRowPrepared(e: any): void {
    if (e.rowType === 'data') {
      if (e.key.isOutOfPriceCorridor)
        e.rowElement.classList.add('outOfPriceRange');
    }
  }

  public onContextMenuPreparing(event: ContextMenuPreparingEvent): void {
    if (event?.row?.rowType === 'header' || event?.target === 'header') {
      event.items = [];
      return;
    }

    if (event.row.rowType !== 'header') {
      this.chooseOffers = [];

      if (!event.items) event.items = [];

      if (this.selectedRows.length > 0) {
        this.chooseOffers = this.selectedRows;
      } else {
        this.chooseOffers.push(event.row.data);
      }
      if (this.chooseOffers.length === 1) {
        this.idOffer = event.row.data.idDemandOffer;
        this.direction = event.row.data.directionId;
        this.offerData = event.row.data;
      }

      if (this.user?.IsWorker) {
        event.items.push(
          {
            icon: './assets/img/icons/sessionOffer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].viewApplication
                : EN['catalogs'].viewApplication,
            disabled: this.chooseOffers.length > 1,
            onItemClick: () => {
              this.onViewOffer();
            },
          },
          {
            icon: './assets/img/icons/edit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].editApplication
                : EN['catalogs'].editApplication,
            disabled:
              this.chooseOffers.length > 1 ||
              (this.chooseOffers.length == 1 && !this.offerData.isCanEdit) ||
              !this.privileges,
            onItemClick: () => {
              this.onEditOffer();
            },
          },
          {
            icon: './assets/img/icons/edit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].editPriceStep
                : EN['offer-management'].editPriceStep,
            disabled: this.chooseOffers.length > 1 || !this.privileges,
            onItemClick: () => {
              this.onOpenEditPriceStep();
            },
          },
          {
            icon: './assets/img/icons/cancel.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].rejecteApplication
                : EN['offer-management'].rejecteApplication,
            disabled: this.rejecteOfferWorker() || !this.privileges,
            onItemClick: () => {
              this.onRejectOffer();
            },
          },
          {
            icon: './assets/img/icons/transferToBids.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].transferToBids
                : EN['offer-management'].transferToBids,
            disabled:
              this.transferOfferWorker() || !this.outOfRegulationPrivileges,
            onItemClick: () => {
              this.checkActivationMode();
            },
          },
          {
            icon: './assets/img/icons/registry.svg',
            text:
              this.translate.store.currentLang === 'RU'
                ? RU['offer-management'].includeInRegister
                : EN['offer-management'].includeInRegister,
            disabled:
              !this.chooseOffers.length ||
              !this.chooseOffers?.some((o) => o?.isCanApprove) ||
              this.filterTab === filterTabsInOM.rejected,
            onItemClick: () => {
              this.onApproveOffer();
            },
          },
          {
            icon: './assets/img/icons/changes.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].showChanges
                : EN['offer-management'].showChanges,
            disabled:
              this.chooseOffers.length > 1 ||
              this.chooseOffers[0].idDemandOfferParent == null ||
              this.chooseOffers[0].statusId != offerStatus.submitted,
            onItemClick: () => {
              this.onAutoControl();
            },
          },
          {
            icon: './assets/img/icons/access.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].openAccess
                : EN['offer-management'].openAccess,
            disabled: this.chooseOffers.length > 1 || !this.accessPrivileges,
            onItemClick: () => {
              this.openAccessPopup();
            },
          }
        );
        if (this.filterTab === filterTabsInOM.rejected) {
          // Отклоненные заявки: Восстановить заявку
          event.items.push({
            icon: './assets/img/icons/ArrowUDownLeft.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].restoreOffer
                : EN['offer-management'].restoreOffer,
            disabled:
              this.chooseOffers.length > 1 ||
              this.restoreOfferWorker() ||
              !this.privileges,
            onItemClick: () => {
              this.onRestoreOfferWorker();
            },
          });
        }
      } else {
        event.items.push(
          {
            icon: './assets/img/icons/sessionOffer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].viewApplication
                : EN['catalogs'].viewApplication,
            disabled: this.chooseOffers.length > 1,
            onItemClick: () => {
              this.onViewOffer();
            },
          },
          {
            icon: './assets/img/icons/edit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].editApplication
                : EN['catalogs'].editApplication,
            disabled: this.chooseOffers.length > 1 || !this.offerData.isCanEdit,
            onItemClick: () => {
              this.onEditOffer();
            },
          },
          {
            icon: './assets/img/icons/createCopy.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['viewOffer'].createCopyApplication
                : EN['viewOffer'].createCopyApplication,
            disabled: this.chooseOffers.length > 1 || !this.offerData.isCanClone,
            onItemClick: () => {
              this.onPopupSubmit('createCopy');
            },
          },
          {
            icon: './assets/img/icons/cancel.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['btns'].cancelApplication
                : EN['btns'].cancelApplication,
            disabled:
              this.chooseOffers.length > 1 || !this.offerData.isCanCancel,
            onItemClick: () => {
              this.onCancelOffer();
            },
          },
          {
            icon: './assets/img/icons/trash.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].deleteOffer
                : EN['offer-management'].deleteOffer,
            disabled:
              this.chooseOffers.length > 1 || !this.offerData.isCanDelete,
            onItemClick: () => {
              this.onDeleteOffer();
            },
          },
          {
            icon: './assets/img/icons/transfer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].transferOffers
                : EN['offer-management'].transferOffers,
            disabled:
              this.chooseOffers.length == 0 ||
              this.disabledTransferBySessionStatus() ||
              this.filterTab === filterTabsInOM.rejected,
            onItemClick: () => {
              this.onTransferOffers();
            },
          },
          {
            icon: './assets/img/icons/sessionDeposit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].offerDeposit
                : EN['offer-management'].offerDeposit,
            disabled:
              this.chooseOffers.length > 1 ||
              !this.offerData.isCanCalculateDeposit,
            onItemClick: () => {
              this.onOpenDepositOffer();
            },
          },
          {
            icon: './assets/img/icons/sessionDeposit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].viewInformationDeposit
                : EN['sessions-schedule'].viewInformationDeposit,
            disabled: this.disabledDepositBySession(),
            onItemClick: () => {
              if (
                this.UserRole == role.broker ||
                this.UserRole == role.brokerVisitor
              ) {
                this.onOpenDeposit(this.offerData);
              } else {
                this.checkDepositType();
              }
            },
          }
        );
      }
    }
  }

  public disabledDepositBySession(): boolean {
    //дизэблим просмотр задатка у разных сессий
    let disabled = false;
    let sessions = [];
    this.chooseOffers.forEach((session) => {
      this.chooseOffers.forEach((item) => {
        sessions.push(item.sessionId);
      });

      sessions = [...new Map(sessions.map((item) => [item, item])).values()];

      if (sessions.length != 1) {
        disabled = true;
      }
    });
    return disabled;
  }

  public disabledTransferBySessionStatus(): boolean {
    //дизэблим возможность переноса заявок в зав-сти от статуса сессии
    let disabled = false;
    this.chooseOffers.forEach((session) => {
      if (session.sessionStatusId != statusSession.preparation) {
        disabled = true;
      }
    });
    return disabled;
  }

  public listDemandsOffers: any[] = [];
  public sessionsForTransfer: any;

  //удаляем повторяющиеся сессии для кнопки дропдаун
  public deleteSameSessions(): void {
    this.sessionsForTransfer = [
      ...new Map(
        this.chooseOffers.map((item) => [item['sessionId'], item])
      ).values(),
    ];
    return this.sessionsForTransfer;
  }

  public sessionTemplateTextBox(data): string {
    return (
      data &&
      data?.sessionDatetimeBeginString +
      '  ' +
      '№' +
      data?.sessionId +
      '  ' +
      data?.sessionName
    );
  }

  public isDisabledApproveOffer(): boolean {
    return !this.selectedRows.length ||
      !this.chooseOffers?.some((o) => o?.isCanApprove) ||
      this.filterTab === filterTabsInOM.rejected;
  }

  public onTransferOffers(): void {
    this.transferOffersPopup = true;
    this.deleteSameSessions(); //сделать еще
    let directions = []; //проверкa на покупка/продажа и заполнение поля направления

    this.chooseOffers.forEach((item) => {
      directions.push(item.directionId);
    });

    directions = [...new Map(directions.map((item) => [item, item])).values()];
    directions.length == 1
      ? this.transferForm.get('direction')?.patchValue(directions[0])
      : this.transferForm.get('direction')?.patchValue(3); // 3 - id покупка и продажа вместе

    //получение списка трейдеров
    this.offerManagementService
      .detTradersList({})
      .then((res: any) => {
        this.traders = res.traders;
        //удаляем самого сея из списка трейдеров
      });

    //заполняем массив id offers
    if (this.listDemandsOffers.length == 0) {
      this.chooseOffers.forEach((i) => {
        this.listDemandsOffers.push(i.idDemandOffer);
      });
    }
  }

  public transferDemandOffers(): void {
    const body = {
      idSection: this.sectionId,
      idDirection: this.transferForm.get('direction')?.value,
      listDemandsOffers: this.listDemandsOffers,
      idTrader: this.transferForm.get('trader')?.value?.idTrader,
    };

    let traderName = this.transferForm.get('trader')?.value?.traderFio;

    this.offerManagementService
      .transferDemandOffers(body)
      .then((res: any) => {
        this.transferOffersRes = res;
        this.transferOffersPopup = false;
        this.transferForm.get('trader').reset();
        if (
          res.logFilterSelected.length == 0 &&
          res.logPreprocessing.length == 0 &&
          res.logExecution.length == 0
        ) {
          this.isVisibleToast = true;

          let operation: string = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'offer-management.operationSuccess'
          );

          let transferMessage: string = getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'offer-management.transferMessage'
          );

          this.message = `${operation} ${res.numberDemoffTransf} ${transferMessage} ${traderName}`;
          this.getData();
        } else {
          this.transferErrorsPopup = true;
        }
      });
  }

  public resetTransferForm(): void {
    this.transferForm.get('direction').reset(null);
    this.transferForm.get('trader').reset(null);
    this.listDemandsOffers = [];
  }

  public print(): void {
    window.print();
  }

  public onOpenDepositOffer(): void {
    this.depositPopup = true;
    let str =
      this.translate.store.currentLang == 'RU'
        ? RU['offer-management'].offerDepositInfo
        : EN['offer-management'].offerDepositInfo;
    this.depositPopupTitle = str + this.offerData.lotNumber;
    this.depositRowData = this.offerData;
    this.getDetailDepositOffer(this.depositRowData);
  }

  public getDetailDepositOffer(data: any): void {
    this.offerManagementService
      .depositDetailsOffer(
        data.directionId,
        this.sectionId,
        data.sessionId,
        data.idDemandOffer
      )
      .subscribe((res: DepositDetailsResponse) => {
        this.detailsDepositOffer = res.detailsList[0];
      });
  }

  public checkDepositType(): void {
    // this.offerManagementService.GetFirmDepositType(this.user?.token, this.user?.userInfo?.firmId).then((res: any) => {
    this.offerManagementService
      .getFirmDepositType()
      .subscribe((res: DepositTypeResponse) => {
        this.depositType = res.depositType;
        if (this.depositType == this.depositTypeEnum.withoutDeposit) {
          this.isVisibleToast = true;
          this.type = 'error';
          this.message = (
            this.translate.store.currentLang == 'RU'
              ? RU['deposit'].withoutDeposit
              : EN['deposit'].withoutDeposit
          ).replace(/\n\r?/g, '<br />');
        } else {
          this.onOpenDeposit(this.offerData);
        }
      });
  }

  public rejecteOfferWorker(): boolean {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanReject) {
        disabled = true;
      }
    });
    return disabled;
  }

  public transferOfferWorker(): boolean {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanTransfer) {
        disabled = true;
      }
    });
    return disabled;
  }

  public cancelOfferWorker(): boolean {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanCancel) {
        disabled = true;
      }
    });
    return disabled;
  }

  public restoreOfferWorker(): boolean {
    let disabled = false;
    this.chooseOffers.forEach((item) => {
      if (!item.isCanRestoreRejected) {
        disabled = true;
      }
    });

    return disabled;
  }

  // скрыть столбцы по определенным правилам
  public onGridContentReady(e: any): void {
    this.applyPendingApiData();

    if (!this.initialHeaderFiltersApplied) {
      this.initialHeaderFiltersApplied = true;
      // «Выбрать все» в header filter: filterType exclude + filterValues [] на первой загрузке.
      this.applyInitialHeaderFilters();
    }

    // синхронизация размера fixed и обычных колонок после того
    // как можно будет рассчитать размер ячеек по контенту
    requestAnimationFrame(() => {
      this.dataGridRef.instance.updateDimensions();

      const gridRoot: HTMLElement = e.component.element();

      if (gridRoot) {
        updateRightPanelHeight(gridRoot);
      }
    });
  }

  /**
   * Накатывает сохранённые на API настройки колонок (ширина, порядок, фильтры из прошлой сессии).
   * force=true — при откате настроек из попапа «Сбросить».
   */
  private applyPendingApiData(force: boolean = false): void {
    if (!this.pendingGridSettings) {
      return;
    }

    if (this.pendingGridSettingsApplied && !force) {
      this.pendingGridSettings = null;
      return;
    }

    if (this.pendingGridSettings) {
      const currentState: GridState = structuredClone(this.dataGridRef.instance.state());

      this.pendingGridSettings.fieldOptions.forEach((field: FieldOptionsApiModel) => {
        if (field.columnSettings) {
          const existingColumnIndex: number = currentState.columns.findIndex(
            (column) => column.dataField === field.idField
          );
          if (existingColumnIndex >= 0) {
            currentState.columns[existingColumnIndex] = {
              ...currentState.columns[existingColumnIndex],
              ...JSON.parse(field.columnSettings)
            }
          }
        }
      });
      currentState.columns = recalculateTableVisibleIndexes(currentState, this.dynamicFields);

      const normalizedState: GridState = this.normalizeHeaderFiltersInState(currentState, false);
      this.dataGridRef.instance.state(normalizedState);
      this.pendingGridSettingsApplied = true;
      this.pendingGridSettings = null;
    }
  }

  public onCellPrepared(e: any): void {
    const container = document.createElement('div');
    e.cellElement.appendChild(container);

    //делаем тултип только для определенных ячеек
    if (
      e.rowType === 'data' &&
      ((e.column.dataField === 'conditionsDelivery' &&
          e.data.isMultibasis == true) ||
        (e.column.dataField === 'prices' && e.data.isPriceAdjusted == true))
    ) {
      new Tooltip(container, {
        target: e.cellElement,
        visible: false,
        showEvent: 'mouseenter',
        hideEvent: 'mouseleave click',
        contentTemplate: (content) => {
          if (e.column.dataField === 'conditionsDelivery') {
            let multipleLot =
              this.translate.store.currentLang == 'RU'
                ? RU['filters'].multibasisLot
                : EN['filters'].multibasisLot;

            this.currentTemplateTooltip =
              multipleLot + '<br>' + e.data.concatedConditionsDelivery;
          }

          if (e.column.dataField === 'prices') {
            let adjustablePrice =
              this.translate.store.currentLang == 'RU'
                ? RU['offer-management'].adjustablePrice
                : EN['offer-management'].adjustablePrice;

            this.currentTemplateTooltip = adjustablePrice;
          }
          const label = document.createElement('div');
          label.innerHTML = this.currentTemplateTooltip;
          content.appendChild(label);
        },
      });
    }
  }

  public onChangeTab(e: any): void {
    const newIndex =
      e.itemIndex !== undefined
        ? e.itemIndex
        : e.component.option('selectedIndex');

    if (this.dataGridRef?.instance) {
      this.dataGridRef.instance.state(null);
    }

    if (newIndex !== undefined && newIndex !== this.selectedIndex) {
      this.tabState.setIndex(newIndex, 'offers');
    }

    this.filterTab = e.itemIndex + 1;
  }

  public getFilterData(e: any = {}): void {
    const previousSession = this.cache?.filters?.session;
    this.cache.filters = e;

    // если меняется секция (ч/з меню или ч/з строку браузера) -> сбрасываем сессию в фильтре
    const isEqual =
      this.cache?.filters?.sections == null ||
      this.cache.filters.sections == this.sectionId;

    this.cache.filters.sections = this.sectionId;

    if (this.firstTime) {
      //для получения списка товара, если зашли или изменили секцию через меню
      this.firstTime = false;
      if (this.sessionId) {
        //когда переходим из каталога или расписания сессии
        this.cache.filters.session = this.sessionId;
        //this.cache.filters.choosenSessionForManagement = null
      }
      if (!isEqual) {
        this.cache.filters.session = null;
      }

      sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(this.cache));

      this.filtersComponent.enableFilters();
    }

    if (this.cache.filters.session) {
      this.setBrowserTabInfo(this.cache.filters.session);
    }

    if (this.cache.filters.session !== previousSession) {
      // Новая сессия — снова разрешаем применить column settings с API.
      this.pendingGridSettingsApplied = false;
    }

    this.getData();
  }

  //экспорт в excel
  public onExporting(): void {
    if (this.user?.IsWorker) {
      this.sharedStateExportService.updateState('pending');
      const filters = {
        idSection: this.sectionId,
        filterSessionId: this.cache?.filters?.session,
        filterTabManage: this.filterTab, //1-активные, 2-откл
        filterListPropertyStr: this.cache?.filters?.refsStr || [],
        filterListPropertyInt: this.cache?.filters?.refsInt || [],
        filterIsMultibasis: this.cache?.filters?.multibasisLot, // true/false
        filterIsAdjustedPrice: this.cache?.filters?.adjustablePrice,
        filterIsCompositeLot: this.cache?.filters?.assembledLot,
        filterIsModified: this.cache?.filters?.changes,
        //"":" this.cache?.filters?.outOfRange"
      };

      this.offerManagementService
        .requestExportManageWorker(filters)
        .then((res: any) => {
          this.isVisibleToast = true;
          this.message =
            this.translate.store.currentLang == 'RU'
              ? RU['worker'].succsessfulUnloadData
              : EN['worker'].succsessfulUnloadData;
        });
    } else {
      const filters = {
        idSection: this.sectionId,
        filterSessionId: this.cache?.filters?.session || null,
        filterTabManage: this.filterTab, //1-активные, 2-откл
        filterListPropertyStr: this.cache?.filters?.refsStr || [],
        filterListPropertyInt: this.cache?.filters?.refsInt || [],
        filterIsMultibasis: this.cache?.filters?.multibasisLot, // true/false
        filterIsAdjustedPrice: this.cache?.filters?.adjustablePrice,
        filterIsCompositeLot: this.cache?.filters?.assembledLot,
        filterIsTransferred: this.cache?.filters?.transferred,
        // "":" this.cache?.filters?.outOfRange"
      };

      this.offerManagementService
        .requestExportManageTrader(filters)
        .then(() => {
          this.isVisibleToast = true;
          this.message =
            this.translate.store.currentLang == 'RU'
              ? RU['worker'].succsessfulUnloadData
              : EN['worker'].succsessfulUnloadData;
        });
    }
  }

  //-------------------------для фильтрации в таблице-------------------

  public orderHeaderFilterName(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.GOOD_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterDesc(data: any): void {
    let searchQuery = '';
    data.dataSource.load = function (options) {
      if (options && options?.filter) {
        let filterValue;
        if (options?.filter?.length == 1) {
          filterValue = options?.filter?.find(
            (el) => Array.isArray(el) && !el.find((a) => a.columnIndex)
          )?.[2];
        } else {
          filterValue = options?.filter?.find(
            (el) =>
              Array.isArray(el) &&
              Array.isArray(el[0]) &&
              !el[0].find((a) => a.columnIndex)
          )?.[0]?.[2];
        }
        searchQuery = filterValue || '';
      } else {
        searchQuery = '';
      }
    };
    data.dataSource.postProcess = () => {
      const currentData = getDataForHeaderFilter(data.component, this.listOfOffers ?? []);
      const items = currentData.reduce((acc, item) => {
        const goodsItems = item.goods.map((el) => ({
          key: [el[RowData.GOOD_DESCRIPTION]],
          value: el[RowData.GOOD_DESCRIPTION],
          text: el[RowData.GOOD_DESCRIPTION],
        }));
        return [...acc, ...goodsItems];
      }, []);

      let uniqueResult = [
        ...new Map(items.map((item) => [item['value'], item])).values(),
      ];

      if (searchQuery) {
        uniqueResult = uniqueResult.filter(
          (item: FilterOption) =>
            (item.value as string)?.toLowerCase().includes(searchQuery?.toLowerCase())
        );
      }

      return uniqueResult;
    };
  }

  public orderHeaderFilterUnits(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.GOOD_UNIT_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterVol(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.GOOD_VOLUME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterPrice(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.PRICE_WITHOUT_VAT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterAmountVAT(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.VAT_AMOUNT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterTotalAmount(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.TOTAL_AMOUNT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterAmendment(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.PRICE_ADJUSTMENT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterQuotation(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.QUOTATION_VALUE, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterLocation(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.LOCATION_GOOD, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterDestinations(data: any): void {
    data.dataSource.postProcess = updateFiltersByGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DESTINATIONS, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByStatusName(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.STATUS_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByRejectionDate(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.REJECTION_DATE_STRING, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByRejectionReason(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.REJECTION_REASON, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByDirectionName(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DIRECTION_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByMarketType(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DEMOFF_MARKET_TYPES, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByAnalog(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.IS_ALLOW_ANALOGS, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByCreateOfferDate(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DATE_CREATE_STRING, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByConcatedFirmName(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CONCATED_FIRM_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByContractType(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CLIENT_CONTRACT_TYPE_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByClient(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CONCATED_CLIENT_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByBranch(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.BRANCH_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByTrader(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.TRADER_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterLotSummaryVolume(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.LOT_SUMMARY_VOLUME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByCurrency(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CURRENCY_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByVatPercent(data: any): void {
    data.dataSource.postProcess = updateFiltersByVatPercent(
      () => this.listOfOffers ?? [],
      data,
      this.translate.store.currentLang,
    );
  }

  public orderHeaderFilterByLotSummaryVatAmount(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.LOT_SUMMARY_VAT_AMOUNT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByLotSummaryTotalAmount(data: any): void {
    data.dataSource.postProcess = updateFiltersByNumericGoodsProperty(
      () => this.listOfOffers ?? [],
      data, RowData.LOT_SUMMARY_TOTAL_AMOUNT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterBySessionNumber(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.SESSION_ID, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterBySessionName(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.SESSION_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterBySessionDate(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.SESSION_DATETIME_BEGIN_STRING, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterBySessionStage(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.SESSION_STAGE_NAME, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByDeliveryConditions(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CONDITIONS_DELIVERY, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByDeliveryConditionsPeriod(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CONDITIONS_DELIVERY_PERIOD, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByDeliverySchedule(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.IS_EXIST_DELIV_SCHEDULE, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByPaymentConditions(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.CONDITIONS_PAYMENT, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByImportDomesticDetails(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DETAILS_IMPORT_DOMESTIC, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByExportDetails(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.DETAILS_EXPORT_FOREIGN, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByPrivateFiles(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.IS_EXIST_FILES_PRIVATE, this.translate.store.currentLang
    );
  }

  public orderHeaderFilterByPublicFiles(data: any): void {
    data.dataSource.postProcess = updateFiltersByRootProperty(
      () => this.listOfOffers ?? [],
      data, RowData.IS_EXIST_FILES_PUBLIC, this.translate.store.currentLang
    );
  }

  //для фильтрации в таблице
  public calculateFilterExpression(
    value: unknown,
    selectedFilterOperations: unknown,
    target: string
  ): any {
    const column = this as any;
    if (target === 'headerFilter') {
      // Если выбрана опция "(Пусто)" из headerFilter
      if (isHeaderFilterEmptySelection(value)) {
        const dataField: string = column.dataField;
        return (data: { [key: string]: unknown }) =>
          isHeaderFilterFieldValueEmpty(data, dataField);
      }
      return [column.dataField, 'contains', value];
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  // Числовые колонки:
  // более бысттое вычисление ['field','=',value];
  public calculateFilterExpressionNumeric(
    value: unknown,
    selectedFilterOperations: unknown,
    target: string
  ): any {
    const column = this as any;
    if (target === 'headerFilter') {
      if (isHeaderFilterEmptySelection(value)) {
        return (data: { [key: string]: unknown }) =>
          isHeaderFilterNumericFieldValueEmpty(data, column.dataField);
      }

      const selectedValue: number = Number(value);
      if (Number.isNaN(selectedValue)) {
        return column.defaultCalculateFilterExpression.apply(this, arguments);
      }

      if (!NUMERIC_ARRAY_DATA_FIELDS.has(column.dataField)) {
        // DevExtreme-native фильтр: без функции на каждую строку
        return [column.dataField, '=', selectedValue];
      }

      const dataField: string = column.dataField;
      return (data: Record<string, unknown>): boolean => {
        const tableValue = data[dataField];

        if (Array.isArray(tableValue)) {
          return tableValue.some((item: unknown) =>
            matchesNumericHeaderFilterValue(item, value),
          );
        }

        return matchesNumericHeaderFilterValue(tableValue, value);
      };
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  /** Ставка НДС:
   *  «без НДС» — null;
   *  число — ['vatPercent','=',n] для скорости фильтрации.
   *  */
  public calculateFilterExpressionVatPercent(
    value: unknown,
    selectedFilterOperations: unknown,
    target: string
  ): any {
    const column = this as any;
    const dataField: string = column.dataField;

    if (target === 'headerFilter') {
      if (value === VAT_PERCENT_WITHOUT_VAT_FILTER_VALUE) {
        return (data: { [key: string]: unknown }): boolean => data[dataField] == null;
      }

      const selectedVatPercent: number = Number(value);
      if (Number.isNaN(selectedVatPercent)) {
        return column.defaultCalculateFilterExpression.apply(this, arguments);
      }

      return [dataField, '=', selectedVatPercent];
    }

    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  //------------------------------------------

  /*              фильтрация динамических колонок                */
  public getDataSourceDynFilter(idField: string): FilterOption[] {
    let hasNonEmptyValues = false;
    let results = [];
    const tableData = getDataForHeaderFilter(
      this.dataGridRef?.instance,
      this.listOfOffers ?? [],
    );
    if (tableData) {
      tableData.forEach((item) => {
        item?.goods?.forEach((el) => {
          if (el?.dynamicFields?.[idField.toString()]) {
            let actualDimensionValue = this.commonService.actualDimensions(
              el.dynamicFields[idField.toString()],
              0
            );
            results.push({
              key: [el.dynamicFields[idField.toString()]],
              value: el.dynamicFields[idField.toString()],
              text: ACTUAL_SIZE_FIELDS.includes(Number(idField))
                ? actualDimensionValue
                : el.dynamicFields[idField.toString()],
            });
          } else {
            hasNonEmptyValues = true;
          }
        });
      });
    }

    // Добавляем отдельную запись для пустых значений
    if (hasNonEmptyValues) {
      results.unshift({
        key: [null],
        value: null,
        text:
          this.translate.store.currentLang == 'RU'
            ? RU['filters'].empty
            : EN['filters'].empty,
      });
    }
    //уникальные значения в массиве results
    const uniqueResult: FilterOption[] = [
      ...new Map(results.map((item) => [item['value'], item])).values(),
    ];
    return uniqueResult;
  }

  public calculateFilterExpressionGeneralDynamic(filterValue: string): unknown {
    const column = this as any;

    return function (data: { [key: string]: unknown, generalDynamicFields: { [key: string]: unknown } }): boolean {
      const fieldValue = data.generalDynamicFields[column.dataField];
      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    };
  }

  public calculateFilterExpressionRefDynamic(filterValue: string): unknown {
    const column = this as any;

    return function (data: { [key: string]: unknown, refDynamicFields: { [key: string]: unknown } }): boolean {
      const fieldValue = data.refDynamicFields[column.dataField];
      return Array.isArray(fieldValue) && fieldValue.includes(filterValue);
    };
  }

  public calculateSortRefDynamicValue(
    data: { refDynamicFields?: { [key: string]: string | number } }
  ): string | number {
    const field: string = this['dataField'];
    const raw: string | number = data?.refDynamicFields?.[field];
    const values: Array<string | number> = Array.isArray(raw) ? raw : [raw];

    return dynamicDataSort(values);
  }

  public calculateSortGeneralDynamicValue(
    data: { generalDynamicFields?: { [key: string]: string | number } }
  ): string | number {
    const field: string = this['dataField'];
    const raw: string | number = data?.generalDynamicFields?.[field];
    const values: Array<string | number> = Array.isArray(raw) ? raw : [raw];

    return dynamicDataSort(values);
  }

  public onOpenDeposit(data: any): void {
    this.offerManagementService.sessionForDeposit = data;
    if (this.user?.IsWorker) {
      //возможность открывать в новой вкалдке для работника
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`ordermanagement/deposit`])
      );
      window.open(url, '_blank');
    } else {
      this.router.navigateByUrl('/deposit');
    }
  }

  public onOpenRegistrations(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`ordermanagement/sessions-schedule/worker-view-registration`],
        {
          queryParams: {
            idSection: this.sessionInfo?.tradeSectionId,
            idSession: this.sessionInfo?.id,
            sessionDate: this.sessionInfo?.startDateTime,
            sessionName: this.sessionInfo?.sessionName,
            sessionType: this.sessionInfo?.statusId,
            sessionStage: this.sessionInfo?.stageId,
            accessType: 'management',
          },
        }
      )
    );
    window.open(url, '_blank');
  }

  public onAddLimitations(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`ordermanagement/limitations`])
    );
    window.open(url, '_blank');
    // this.router.navigateByUrl('/limitations')
  }

  public onOpenAccess(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`ordermanagement/open-access`])
    );
    window.open(url, '_blank');
  }

  public openAccessPopup(): void {
    this.accessPopup = !this.accessPopup;
  }

  public closeAccessPopup(event: boolean): void {
    this.accessPopup = event;
    if (this.openAccessPopupComponent.successOpen === true) {
      this.successPopup = true;
    }
  }

  public onViewOffer(info?: any[]): void {
    this.createOfferService.idOffer = this.idOffer;
    this.createOfferService.direction = info
      ? info[0].directionId
      : this.direction;
    this.createOfferService.isArchive = false;
    this.createOfferService.unsold = false;
    this.createOfferService.modelResult = {
      isAllowedAnalogues: this.offerData?.isAllowAnalogs,
    };
    this.router.navigateByUrl('/view-offer');
  }

  public onAutoControl(): void {
    this.createOfferService.idOffer = this.idOffer;
    this.createOfferService.direction = this.direction;
    this.router.navigateByUrl('/autoControl');
  }

  public onEditOffer(): void {
    this.popup = true;
    this.popupTitle =
      this.translate.store.currentLang == 'RU'
        ? RU['catalogs'].editApplication
        : EN['catalogs'].editApplication;
    this.popupMessage =
      this.translate.store.currentLang == 'RU'
        ? RU['viewOffer'].wantToApply
        : EN['viewOffer'].wantToApply;
    this.popupType = 'edit';
  }

  public onCancelOffer(): void {
    this.popup = true;
    this.popupTitle =
      this.translate.store.currentLang == 'RU'
        ? RU['btns'].cancelApplication
        : EN['btns'].cancelApplication;
    this.popupMessage =
      this.translate.store.currentLang == 'RU'
        ? RU['viewOffer'].wantToCancel
        : EN['viewOffer'].wantToCancel;
    this.popupType = 'cancel';
  }

  public onDeleteOffer(): void {
    this.popup = true;
    this.popupTitle =
      this.translate.store.currentLang == 'RU'
        ? RU['btns'].deleteApplication
        : EN['btns'].deleteApplication;
    this.popupMessage =
      this.translate.store.currentLang == 'RU'
        ? RU['viewOffer'].deleteMess
        : EN['viewOffer'].deleteMess;
    this.popupType = 'delete';
  }

  public onApproveOffer(): void {
    this.popup = true;
    this.popupTitle =
      this.translate.store.currentLang == 'RU'
        ? RU['offer-management'].includeInRegister
        : EN['offer-management'].includeInRegister;
    this.popupMessage =
      this.translate.store.currentLang == 'RU'
        ? RU['offer-management'].approveOfferMess
        : EN['offer-management'].approveOfferMess;
    this.popupType = 'approve';
  }

  public costVatBasis(priceWithoutVat: number, vatBasis: any, volume: number): number {
    let vat: number;
    if (vatBasis.fieldValueNumber != 1) {
      vat = Number(vatBasis.fieldValue.replace(/[^0-9]/g, ''));
    } else vat = 0;
    return (
      this.commonService.round(volume * priceWithoutVat, 2) +
      this.commonService.round((volume * priceWithoutVat * vat) / 100, 2)
    );
  }

  public checkPrices(): Promise<void> {
    return this.offerManagementService
      .checkActivePriceLimit(
        this.sectionId,
        this.cache?.filters?.session,
        this.chooseOffers[0].idModel,
        this.chooseOffers[0].directionId
      )
      .then((res: any) => {
        this.activePriceLimit = res.activePriceLimit;

        if (
          this.activePriceLimit.isActiveQuotation ||
          this.activePriceLimit.isActiveCorridor
        ) {
          this.createOfferService
            .GetWorkerOfferFullInfo(
              this.user?.token,
              this.chooseOffers[0].idDemandOffer,
              this.chooseOffers[0].directionId
            )
            .then((res: any) => {
              this.offerGeneral = res.generalInfo;
              this.offerGoods = res.goods;
              this.deliveryConditions = res.deliveryConditions;
              this.paymentCond = res.paymentCond;

              this.infoForRestore = {
                pricingTypeId: this.offerGeneral.pricingTypeId,
                deliveryConditions: this.deliveryConditions,
                offerGoods: this.offerGoods,
                currencyPrecision: this.chooseOffers[0].currencyPrecision,
                volumePrecision: this.offerGoods[0].goodsSpecifications.find(
                  (field) => field.idInterfaceField == 1
                ).fieldPrecision,
                quoteCurrencyPrecision:
                  this.chooseOffers[0].currencyPrecision || null,
                isActiveQuotation: this.activePriceLimit.isActiveQuotation,
                isActiveRange: this.activePriceLimit.isActiveCorridor,
              };

              if (
                this.infoForRestore?.deliveryConditions.length > 0 &&
                !this.infoForRestore?.deliveryConditions[0][1]
              ) {
                //базисы поставки
                this.infoForRestore.deliveryConditions.forEach((basis) => {
                  this.infoForRestore.offerGoods.forEach((good) => {
                    if (
                      good.goodsSpecifications[0].idDemandOfferGood ==
                      basis.idDemandOfferGood
                    ) {
                      Object.assign(basis, {
                        goodId: good.idGood,
                        goodGroupId: good.idGoodGroup,
                        goodNomenclatureId: good.idNomenclatureGroup,
                        goodNameId: good.idGoodName,
                        goodValues: good.goodValues,
                        goodName: good.goodName,
                        unitId: good.unitId,
                        unitName: good.unitName,
                        properties: good.goodDescription,
                        volume: good.goodsSpecifications.find(
                          (el) => el.idInterfaceField == 1
                        ).fieldValueNumber, //количество
                        quotation:
                          good.goodsSpecifications?.find(
                            (el) => el.idInterfaceField == 56
                          )?.fieldValue || null, //Котировка
                        quoteCurrency:
                          good.goodsSpecifications?.find(
                            (el) => el.idInterfaceField == 55
                          )?.fieldValue || null, //Валюта котировки
                        amendment:
                          good.goodsSpecifications?.find(
                            (el) => el.idInterfaceField == 54
                          )?.fieldValue || null, //поправка
                        priceAdjustment:
                          good.goodsSpecifications?.find(
                            (el) => el.idInterfaceField == 53
                          )?.fieldValueNumber || null, //Тип поправки
                        currency: this.chooseOffers[0].currencyName, //Валюта
                        currencyId: good.goodsSpecifications.find(
                          (el) => el.idInterfaceField == 4
                        ).fieldValueNumber,
                        vat: this.chooseOffers[0].vatPercent, //ставка НДС
                        costVat: this.costVatBasis(
                          basis.priceWithoutVat,
                          good.goodsSpecifications.find(
                            (el) => el.idInterfaceField == 5
                          ),
                          good.goodsSpecifications.find(
                            (el) => el.idInterfaceField == 1
                          ).fieldValueNumber
                        ),
                      });
                    }
                  });
                });

                let mainBasis = this.infoForRestore.deliveryConditions.find(
                  (el) => el.isMain == true
                );
                this.infoForRestore.deliveryConditions.splice(
                  this.infoForRestore.deliveryConditions.indexOf(mainBasis),
                  1
                );
                this.infoForRestore.deliveryConditions.splice(0, 0, mainBasis);
                this.infoForRestore.deliveryConditions =
                  this.infoForRestore?.deliveryConditions.reduce(function (
                    r,
                    a
                  ) {
                    //сгруппированы поля по concatedCondition
                    r[a.concatedCondition] = r[a.concatedCondition] || [];
                    r[a.concatedCondition].push(a);
                    return r;
                  },
                  {});
                this.infoForRestore.deliveryConditions = Object.entries(
                  this.infoForRestore.deliveryConditions
                );

                //получение данных если есть котировки
                if (this.activePriceLimit.isActiveQuotation) {
                  this.infoForRestore.deliveryConditions.forEach(
                    (condition) => {
                      const basis = condition[1];

                      basis.forEach((b) => {
                        if (b.goodId) {
                          //для биржевых товаров
                          this.offerManagementService
                            .getPriceLimitQuotation(
                              this.offerGeneral.sectionId,
                              this.offerGeneral.idSession,
                              this.offerGeneral.idModel,
                              this.direction,
                              b.goodId,
                              b.currencyId,
                              b.vat,
                              b.unitId,
                              b.volume,
                              this.paymentCond.idPaymentType,
                              b.idBasisValue,
                              b.idPlaceLink || null,
                              b.placeDetails || null
                            )
                            .then((res: any) => {
                              b.quotationPrice = res.priceWithoutVat;
                              //сравниваем цену и котировку
                              if (b.quotationPrice) {
                                if (b.priceWithoutVat === b.quotationPrice) {
                                  b.quote = false; //для подсветки в табл
                                  //this.isActiveQuotation = false
                                } else {
                                  b.quote = true;
                                  this.isActiveQuotation = true;
                                }
                              }
                            });
                        } else {
                          //для товаров аналогов
                          let goodDescription = '';
                          b.goodValues.forEach((el) => {
                            if (!el.isAllowAnalog && el.idReference != 4) {
                              //правила формирования строки в #9257
                              if (el.listValues?.length > 0) {
                                let valuesStr = '';
                                el.listValues.forEach((v) => {
                                  valuesStr = valuesStr + v.idValue + ';';
                                });
                                goodDescription =
                                  goodDescription +
                                  el.idReference +
                                  ':' +
                                  valuesStr;
                              }
                            }
                          });
                          this.offerManagementService
                            .getPriceLimitQuotationAnalog(
                              this.offerGeneral.sectionId,
                              this.offerGeneral.idSession,
                              this.offerGeneral.idModel,
                              b.goodNomenclatureId,
                              b.goodGroupId,
                              b.goodNameId,
                              goodDescription,
                              b.currencyId,
                              b.vat,
                              b.unitId,
                              b.volume,
                              this.paymentCond.idPaymentType,
                              b.idBasisValue,
                              b.idPlaceLink || null,
                              b.placeDetails || null
                            )
                            .then((res: any) => {
                              b.quotationPrice = res.priceWithoutVat;
                              //сравниваем цену и котировку
                              if (b.quotationPrice) {
                                if (b.priceWithoutVat === b.quotationPrice) {
                                  b.quote = false; //для подсветки в табл
                                  //    this.isActiveQuotation = false
                                } else {
                                  b.quote = true;
                                  this.isActiveQuotation = true;
                                }
                              }
                            });
                        }
                      });
                    }
                  );
                }

                //получение данных если есть ценовой контроль
                if (this.activePriceLimit.isActiveCorridor) {
                  //
                  this.infoForRestore.deliveryConditions.forEach(
                    (condition) => {
                      const basis = condition[1];

                      basis.forEach((b) => {
                        if (b.goodId) {
                          //для биржевых товаров
                          this.offerManagementService
                            .getPriceLimitCorridor(
                              this.offerGeneral.sectionId,
                              this.offerGeneral.idSession,
                              this.offerGeneral.idModel,
                              this.direction,
                              b.goodId,
                              b.currencyId,
                              b.vat,
                              b.unitId,
                              b.volume,
                              this.paymentCond.idPaymentType,
                              b.idBasisValue,
                              b.idPlaceLink || null,
                              b.placeDetails || null
                            )
                            .then((res: any) => {
                              b.leftBound = res.leftBound;
                              b.rightBound = res.rightBound;

                              //проверяем попадает ли цена в коридор
                              if (b.leftBound && b.rightBound) {
                                if (
                                  b.priceWithoutVat >= b.leftBound &&
                                  b.priceWithoutVat <= b.rightBound
                                ) {
                                  b.range = false;
                                  //this.isActiveRange = false
                                } else {
                                  b.range = true;
                                  this.isActiveRange = true;
                                }
                              }
                            });
                        } else {
                          //для товаров аналогов
                          let goodDescription = '';
                          b.goodValues.forEach((el) => {
                            if (!el.isAllowAnalog && el.idReference != 4) {
                              //правила формирования строки в #9257
                              if (el.listValues?.length > 0) {
                                let valuesStr = '';
                                el.listValues.forEach((v) => {
                                  valuesStr = valuesStr + v.idValue + ';';
                                });
                                goodDescription =
                                  goodDescription +
                                  el.idReference +
                                  ':' +
                                  valuesStr;
                              }
                            }
                          });

                          this.offerManagementService
                            .getPriceLimitCorridorAnalog(
                              this.offerGeneral.sectionId,
                              this.offerGeneral.idSession,
                              this.offerGeneral.idModel,
                              b.goodNomenclatureId,
                              b.goodGroupId,
                              b.goodNameId,
                              goodDescription,
                              b.currencyId,
                              b.vat,
                              b.unitId,
                              b.volume,
                              this.paymentCond.idPaymentType,
                              b.idBasisValue,
                              b.idPlaceLink || null,
                              b.placeDetails || null
                            )
                            .then((res: any) => {
                              b.leftBound = res.leftBound;
                              b.rightBound = res.rightBound;

                              //проверяем попадает ли цена в коридор
                              if (b.leftBound && b.rightBound) {
                                if (
                                  b.priceWithoutVat >= b.leftBound &&
                                  b.priceWithoutVat <= b.rightBound
                                ) {
                                  b.range = false;
                                  //this.isActiveRange = false
                                } else {
                                  b.range = true;
                                  this.isActiveRange = true;
                                }
                              }
                            });
                        }
                      });

                      /*   basis.forEach(b => {
                const matchingRange = this.priceRange.find(range => range.id === b.goodId);
                  if (b.priceWithoutVat >= matchingRange.minValue && b.priceWithoutVat <= matchingRange.maxValue) {
                    b.range = false;
                    this.isActiveRange = false
                  } else {
                    b.range = true;
                    this.isActiveRange = true;
                  }
              }); */
                    }
                  );
                }
              }
            });
        }
      });
  }

  async onRestoreOfferWorker() {
    try {
      await this.checkPrices();
    } catch (e) {
      // interceptor already showed popup / intentionally ignore error
    }

    this.catalogService
      .GetRejectedInfo(
        this.user?.token,
        this.chooseOffers[0].directionId,
        this.sectionId,
        this.cache?.filters?.session,
        this.chooseOffers[0].idDemandOffer
      )
      .then((res: any) => {
        if (res) {
          this.popup = true;
          this.popupTitle =
            this.translate.store.currentLang == 'RU'
              ? RU['offer-management'].restoreOffer
              : EN['offer-management'].restoreOffer;
          let message = '';
          if (res.warningDeletedGoods)
            message =
              message +
              (this.translate.store.currentLang == 'RU'
                ? RU['viewOffer'].deletedGoodRestoreRejectMess
                : EN['viewOffer'].deletedGoodRestoreRejectMess) +
              '<br />' +
              '<br />';

          if (res.warningAttachments)
            message =
              message +
              (this.translate.store.currentLang == 'RU'
                ? RU['viewOffer'].dontAllowFileRestoreRejectMess
                : EN['viewOffer'].dontAllowFileRestoreRejectMess) +
              '<br />' +
              '<br />';
          this.popupMessage =
            message +
            (this.translate.store.currentLang == 'RU'
              ? RU['viewOffer'].restoreRejectMess
              : EN['viewOffer'].restoreRejectMess);
          this.popupType = 'restoreRejected';
        }
      });
  }

  disabledDepositControl: boolean = false;
  disabledDepositCalculation: boolean = false;
  admissionOptions: any;
  succeedRes: any = []; //результат переноса заявки в торги
  unsucceedRes: any = [];
  popupIsActivatedTransferToBids = false;

  //проверяет текущее состояние режима активации заявок в связке с торговым периодом
  public checkActivationMode(): void {
    this.offerManagementService
      .checkActivationMode(
        this.sectionId,
        this.sessionInfo?.id,
        this.chooseOffers.filter((el) => el.directionId == IdDirection.sale)
          ?.length,
        this.chooseOffers.filter((el) => el.directionId == IdDirection.buy)
          ?.length
      )
      .then((res: any) => {
        if (res.isCanBeActivated) {
          this.popupIsActivatedTransferToBids = true;
        } else this.checkAdmissionProcessed();
      });
  }

  isAdmissionProcessed: boolean = false;

  // выполнялась ли процедура допуска и получение его параметров если выполнялась
  public checkAdmissionProcessed(): void {
    this.offerManagementService
      .isAdmissionProcessed(
        this.sectionId,
        this.sessionInfo?.id
      )
      .then((res: any) => {
        this.isAdmissionProcessed = res;
        this.transferOffersToBidsPopup = true;
        if (this.isAdmissionProcessed == true) {
          this.offerManagementService
            .buceGetAdmissionOptions(
              this.sectionId,
              this.sessionInfo?.id
            )
            .then((res: any) => {
              this.admissionOptions = res.admissionOptions[0];
              this.transferToBidsForm
                .get('violationsControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlViols);
              this.transferToBidsForm
                .get('depositControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlDeposit);
              this.transferToBidsForm
                .get('specialAdmissionProcedure')
                ?.patchValue(this.admissionOptions.isAdmissionBySpecialRules);
              if (
                this.transferToBidsForm.get('depositControl')?.value == true
              ) {
                this.transferToBidsForm
                  .get('depositCalculation')
                  ?.patchValue(true);
                this.disabledDepositCalculation = true;
              } else {
                this.transferToBidsForm
                  .get('depositCalculation')
                  ?.patchValue(false);
                this.disabledDepositCalculation = true;
                this.disabledDepositControl = true;
              }
            });
        }
      });
  }

  public onChangeControlSwitcher(e: any, type: string): void {
    if (type == 'depositControl') {
      e.value == false
        ? (this.disabledDepositCalculation = false)
        : (this.disabledDepositCalculation = true);

      e.value == false
        ? this.transferToBidsForm.get('depositCalculation')?.patchValue(true)
        : this.transferToBidsForm.get('depositCalculation')?.patchValue(true);
    }
  }

  public transferOfferToBids(): void {
    let chooseOffersToSale = [];
    let chooseOffersToBuy = [];

    //разделяем заявки на покупку/продажу
    this.chooseOffers.forEach((item) => {
      if (item.directionId == 1) chooseOffersToBuy.push(item);
      if (item.directionId == 2) chooseOffersToSale.push(item);
    });

    chooseOffersToBuy.forEach((item) => {
      const body = {
        idDirection: item.directionId,
        idSection: this.sectionId,
        idSession: this.sessionInfo?.id,
        idDemandOffer: item.idDemandOffer,
        isControlViolations:
          this.transferToBidsForm.get('violationsControl')?.value,
        isControlDeposit: this.transferToBidsForm.get('depositControl')?.value,
        isLockDeposit: this.transferToBidsForm.get('depositCalculation')?.value,
        isSyncWithGias: this.transferToBidsForm.get('syncGias')?.value,
      };

      this.offerManagementService
        .transferDemandOffer(body)
        .then((res: any) => {
          if (res.isSucceed == true)
            this.succeedRes.push({ idDemandOffer: item.idDemandOffer });
          else
            this.unsucceedRes.push({
              idDemandOffer: item.idDemandOffer,
              message: res.infoMessage,
            });
        });
    });

    chooseOffersToSale.forEach((item) => {
      const body = {
        idDirection: item.directionId,
        idSection: this.sectionId,
        idSession: this.sessionInfo?.id,
        idDemandOffer: item.idDemandOffer,
        isControlViolations:
          this.transferToBidsForm.get('violationsControl')?.value,
        isControlDeposit: this.transferToBidsForm.get('depositControl')?.value,
        isLockDeposit: this.transferToBidsForm.get('depositCalculation')?.value,
        isSyncWithGias: this.transferToBidsForm.get('syncGias')?.value,
      };

      this.offerManagementService
        .transferDemandOffer(body)
        .then((res: any) => {
          if (res.isSucceed == true) this.succeedRes.push(item.idDemandOffer);
          else
            this.unsucceedRes.push({
              idDemandOffer: item.idDemandOffer,
              message: res.infoMessage,
            });
        });
    });

    this.transferOffersToBidsPopup = false;
    this.transferToBidsResPopup = true;
  }

  public resetTransferToBidsForm(): void {
    this.succeedRes = []; //результат переноса заявки в торги
    this.unsucceedRes = [];
  }

  public onOpenEditPriceStep(): void {
    this.createOfferService
      .GetWorkerOfferFullInfo(
        this.user?.token,
        this.chooseOffers[0].idDemandOffer,
        this.chooseOffers[0].directionId
      )
      .then((res: any) => {
        this.offerGeneral = res.generalInfo;
        this.offerGoods = res.goods;
        this.deliveryConditions = res.deliveryConditions;
        this.paymentCond = res.paymentCond;

        this.infoForPriceStep = {
          idSection: this.cache.filters.sections,
          idSession: this.cache.filters.session,
          idDemandOffer: this.chooseOffers[0].idDemandOffer,
          idDirection: this.chooseOffers[0].directionId,
          pricingTypeId: this.offerGeneral.pricingTypeId,
          deliveryConditions: this.deliveryConditions,
          offerGoods: this.offerGoods,
          currencyPrecision: this.chooseOffers[0].currencyPrecision,
          volumePrecision: this.offerGoods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 1
          ).fieldPrecision,
          quoteCurrencyPrecision:
            this.chooseOffers[0].currencyPrecision || null,
        };

        this.editPriceStepService.prepareDeliveryConditions(
          this.infoForPriceStep,
          this.chooseOffers[0]?.vatPercent
        );

        this.editPriceStepPopup = true;
      });
  }

  public closeEditPriceStepPopup(event: boolean): void {
    this.editPriceStepPopup = event;
    this.getData();
  }

  public onRejectOffer(): void {
    this.rejectPopup = true;
    if (this.chooseOffers.length > 1) {
      this.chooseOffersPopup = true;
      this.rejectPopupTitle =
        this.translate.store.currentLang == 'RU'
          ? RU['offer-management'].rejectionOfApplications
          : EN['offer-management'].rejectionOfApplications;
    } else
      this.rejectPopupTitle =
        this.translate.store.currentLang == 'RU'
          ? RU['viewOffer'].rejectionOfTheApp
          : EN['viewOffer'].rejectionOfTheApp;
    this.popupType = 'reject';
    this.onGetRejectionTemplates();
  }

  public onGetRejectionTemplates(): void {
    this.offerManagementService
      .getRejectionTemplates(this.cache.filters.sections)
      .then((res: any) => {
        this.rejectionTemplatesFull = res.rejectionTemplates;
        this.getRejectionTemplates();
      });
  }

  public getRejectionTemplates(): void {
    this.chooseRejectionTempl = {};
    this.rejectReason = '';
    if (this.myTemplate == 0)
      //мои шаблоны
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == true
      );
    //шаблоны секции
    else
      this.rejectionTemplates = this.rejectionTemplatesFull.filter(
        (el) => el.isPersonal == false
      );
  }

  public condEditButton(): boolean {
    //Отображение кнопки редактировать и удалить в выпадающем списке
    return (
      Object.keys(this.chooseRejectionTempl).length !== 0 &&
      this.myTemplate == 0
    );
  }

  public openSidebar(): void {
    //просмотр информации по выбранным заявкам
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    const data = {
      name:
        this.translate.store.currentLang == 'RU'
          ? RU['btns'].viewSelectedApplications
          : EN['btns'].viewSelectedApplications,
      chooseOffers: this.chooseOffers,
    };
    this.sidebarService.dataForReqSubject.next(data);
    this.sidebarService.typeSubject.next('listOffers');
  }

  public onPopupSubmit(type: string): void {
    switch (type) {
      case 'edit':
      case 'createCopy': {
        this.createOfferService
          .GetWorkerOfferFullInfo(
            this.user?.token,
            this.idOffer,
            this.chooseOffers[0].directionId
          )
          .then((res: any) => {
            this.createOfferService.isMine = true;
            this.createOfferService.isCreateCopy = type === 'createCopy';
            this.createOfferService.isArchiveSubmit = false;
            this.createOfferService.idOffer = this.idOffer;
            this.createOfferService.sessionName = res.generalInfo.sessionName;
            this.createOfferService.sectionName = res.generalInfo.sectionName;
            this.createOfferService.sessionDateTime =
              res.generalInfo.sessionDatetime;
            this.createOfferService.sessionId = res.generalInfo.idSession;
            this.createOfferService.sectionId = res.generalInfo.sectionId;
            this.createOfferService.modelId = res.generalInfo.idModel;
            this.createOfferService.choosenMarketType =
              res.generalInfo.concatedMarketTypes;
            this.createOfferService.direction = res.generalInfo.directionId;
            this.createOfferService.modelResult = {
              pricingTypeId: res.generalInfo.pricingTypeId,
              isAllowedFilesPrivate: res.generalInfo.isAllowedFilesPrivate,
              isAllowedFilesPublic: res.generalInfo.isAllowedFilesPublic,
              isAllowedAnalogues: this.offerData.isAllowAnalogs,
            };
            this.router.navigateByUrl('/createOffer');
          });
        break;
      }
      case 'cancel': {
        const body = {
          idDirection: this.chooseOffers[0].directionId,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .cancelOffer(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle =
                this.translate.store.currentLang == 'RU'
                  ? RU['btns'].cancelApplication
                  : EN['btns'].cancelApplication;
              this.popupSuccess = true;
              this.popupSuccessMess =
                this.translate.store.currentLang == 'RU'
                  ? RU['viewOffer'].sucсessCancelMess
                  : EN['viewOffer'].sucсessCancelMess;
            } else this.popup = false;
          });
        break;
      }
      case 'delete': {
        const body = {
          idDirection: this.chooseOffers[0].directionId,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .deleteOffer(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle =
                this.translate.store.currentLang == 'RU'
                  ? RU['btns'].deleteApplication
                  : EN['btns'].deleteApplication;
              this.popupSuccess = true;
              this.popupSuccessMess =
                this.translate.store.currentLang == 'RU'
                  ? RU['viewOffer'].successDeleteMess
                  : EN['viewOffer'].successDeleteMess;
            }
          });
        break;
      }
      case 'restoreRejected': {
        const body = {
          idDirection: this.chooseOffers[0].directionId,
          idSection: this.cache.filters.sections,
          idSession: this.cache.filters.session,
          idDemandOffer: this.idOffer,
        };
        this.catalogService
          .OffersRestoreRejected(this.user?.token, body)
          .then((res: any) => {
            if (!res) {
              this.popup = true;
              this.popupTitle =
                this.translate.store.currentLang == 'RU'
                  ? RU['offer-management'].restoreOffer
                  : EN['offer-management'].restoreOffer;
              this.popupSuccess = true;
              this.popupSuccessMess =
                this.translate.store.currentLang == 'RU'
                  ? RU['viewOffer'].successRestoreRejectMess
                  : EN['viewOffer'].successRestoreRejectMess;
            }
          });
        break;
      }

      case 'reject': {
        let listOffers = this.chooseOffers.map((item) => item.idDemandOffer);

        const body = {
          idDirection: this.chooseOffers[0].directionId,
          idSection: this.cache.filters.sections,
          idSession: this.cache.filters.session,
          listDemandsOffers: listOffers,
          rejectionText: this.rejectReason,
        };
        this.catalogService
          .OffersReject(this.user?.token, body)
          .then((res: any) => {
            this.chooseOffersPopup = false;
            this.listFailureOffers = res.listFailures;
            if (res.isSuccessful) {
              this.popup = true;
              if (this.chooseOffers.length > 1) {
                this.popupTitle =
                  this.translate.store.currentLang == 'RU'
                    ? RU['offer-management'].rejectionOfApplications
                    : EN['offer-management'].rejectionOfApplications;
                this.popupSuccessMess =
                  this.translate.store.currentLang == 'RU'
                    ? RU['offer-management'].rejectionOfTheAppSuccessMess
                    : EN['offer-management'].rejectionOfTheAppSuccessMess;
              } else {
                this.popupTitle =
                  this.translate.store.currentLang == 'RU'
                    ? RU['viewOffer'].rejectionOfTheApp
                    : EN['viewOffer'].rejectionOfTheApp;
                this.popupSuccessMess =
                  this.translate.store.currentLang == 'RU'
                    ? RU['viewOffer'].rejectionOfTheAppSuccessMess
                    : EN['viewOffer'].rejectionOfTheAppSuccessMess;
              }
              this.popupSuccess = true;
            }

            if (res.failureCount > 0) {
              this.popup = true;
              this.popupSuccess = true;
              this.popupTitle =
                this.translate.store.currentLang == 'RU'
                  ? RU['offer-management'].rejectionOfApplications
                  : EN['offer-management'].rejectionOfApplications;
              this.failureOffersCount = res.failureCount;
              this.rejectedOffersCount = res.rejectedCount;
              this.popupWarning = true;
            }
          });
        break;
      }

      case 'approve': {
        this.approveOffer();

        break;
      }
    }
  }

  private approveOffer(): void {
    const body = this.generateApproveOfferBody();

    this.offerManagementService
      .offersApprove(body)
      .pipe(
        tap((res: DemandOfferCatalogueResponse) => {
          if (res) {
            const successCount =
              (res.demands?.filter((d) => d.isSucceeded)?.length || 0) +
              (res.offers?.filter((o) => o.isSucceeded)?.length || 0);

            const failCount =
              (res.demands?.filter((d) => !d.isSucceeded)?.length || 0) +
              (res.offers?.filter((o) => !o.isSucceeded)?.length || 0);

            if (successCount === 1 && failCount === 0) {
              this.closePopupWithSingleOffer();
            } else {
              this.closePopUpWithCounters(successCount, failCount);
            }
          } else {
            this.closePopUpError();
          }
        }),
        catchError((_: ApproveOfferApiError) => {
          this.closePopUpError();
          return of(null);
        })
      )
      .subscribe();
  }

  private generateApproveOfferBody(): DemandOfferCataloguePayload {
    const idDemands: number[] = [];
    const idOffers: number[] = [];

    this.chooseOffers.forEach((offer) => {
      if (offer.directionId === IdDirection.buy) {
        idDemands.push(offer.idDemandOffer);
      } else if (offer.directionId === IdDirection.sale) {
        idOffers.push(offer.idDemandOffer);
      }
    });

    const body: DemandOfferCataloguePayload = {
      idSection: this.cache.filters.sections,
      idSession: this.cache.filters.session,
      idDemands: idDemands.length > 0 ? idDemands : null,
      idOffers: idOffers.length > 0 ? idOffers : null,
    };

    return body;
  }

  private closePopupWithSingleOffer(): void {
    this.popup = true;

    this.popupTitle =
      this.translate.store.currentLang === 'RU'
        ? RU['offer-management'].includingInRegister
        : EN['offer-management'].includingInRegister;

    this.popupSuccess = true;

    this.popupSuccessMess =
      this.translate.store.currentLang === 'RU'
        ? RU['offer-management'].approveOfferMessSucc
        : EN['offer-management'].approveOfferMessSucc;
  }

  private closePopUpWithCounters(
    successCount: number,
    failCount: number
  ): void {
    this.popup = true;

    this.popupTitle =
      this.translate.store.currentLang === 'RU'
        ? RU['offer-management'].includingInRegister
        : EN['offer-management'].includingInRegister;

    this.popupSuccess = true;

    this.popupSuccessMess =
      this.translate.store.currentLang === 'RU'
        ? `Включенно: успешно - ${successCount}, неуспешно - ${failCount}`
        : `Enabled: successfully - ${successCount}, unsuccessfully - ${failCount}`;
  }

  private closePopUpError(): void {
    this.popup = false;
  }

  public onInitializedPopup(e: any): void {
    //запрещаем закрывать попап по клавише esc
    e.component.registerKeyHandler('escape', function (arg) {
      arg.preventDefault();
    });
  }

  isOpenSidebar = false; //открыта ли боковая панель

  public onEditTemplate(str: string): void {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    let dataForReq;
    if (str == 'create') {
      dataForReq = {
        sectionId: this.sectionId,
        idTemplate: {name: '', text: ''},
        name:
          this.translate.store.currentLang == 'RU'
            ? RU['viewOffer'].addingTemplate
            : EN['viewOffer'].addingTemplate,
      };

    } else
      dataForReq = {
        sectionId: this.sectionId,
        idTemplate: this.chooseRejectionTempl,
        name:
          this.translate.store.currentLang == 'RU'
            ? RU['viewOffer'].editingTemplate
            : EN['viewOffer'].editingTemplate,
      };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('createTemplate');
  }

  public onDeleteTemplate(): void {
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    const dataForReq = {
      sectionId: this.sectionId,
      idTemplate: this.chooseRejectionTempl,
      name:
        this.translate.store.currentLang == 'RU'
          ? RU['viewOffer'].deletingTemplate
          : EN['viewOffer'].deletingTemplate,
    };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('deleteTemplate');
  }

  public onViewDetail(type: string): void {
    const outputArray: any[] = [];

    if (type == 'rejection') {
      this.chooseOffers.forEach((offer) => {
        this.listFailureOffers.forEach((fail) => {
          if (fail.id == offer.idDemandOffer) {
            outputArray.push(
              Object.assign(
                {
                  lotNumber: offer.lotNumber,
                  firmBranchName: offer.concatedFirmName,
                  clientContractTypeName: offer.clientContractTypeName,
                  clientName: offer.concatedClientName,
                  clientBranchName: offer.branchName,
                  traderName: offer.traderName,
                  description: fail.reason,
                  idOffer: offer.idDemandOffer,
                  direction: offer.directionId,
                },
                {}
              )
            );
          }
        });
      });
    }

    if (type == 'transferToBids') {
      this.chooseOffers.forEach((offer) => {
        this.unsucceedRes.forEach((fail) => {
          if (offer.idDemandOffer == fail.idDemandOffer) {
            outputArray.push(
              Object.assign(
                {
                  lotNumber: offer.lotNumber,
                  firmBranchName: offer.concatedFirmName,
                  clientContractTypeName: offer.clientContractTypeName,
                  clientName: offer.concatedClientName,
                  clientBranchName: offer.branchName,
                  traderName: offer.traderName,
                  description: fail.message,
                  idOffer: offer.idDemandOffer,
                  direction: offer.directionId,
                },
                {}
              )
            );
          }
        });
      });
    }
    let sessionsParam = {
      idSection: this.cache.filters.sections,
      idSession: this.cache.filters.session,
    };
    sessionsParam = Object.assign(this.sessionInfo, sessionsParam);

    let title =
      type == 'transferToBids'
        ? 'Результат переноса заявок в торги'
        : 'Результат отклонения заявок';

    const key: string = `temp_data_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      sessionStorage.setItem(key, JSON.stringify({
        json: outputArray,
        session: sessionsParam,
        title: title
      }));
    } catch (e) {
      const error: IServiceError = {
        error: true,
        errorStatus: SERVER_ERROR_CODE,
        messageError: this.translate.instant(
          'errors.dataTooLarge'
        )
      };
      this.errorServiceService.callErrorPopup(error);
      console.error('Data too large for sessionStorage:', e);
      return;
    }

    const url: UrlTree = this.router.createUrlTree([`/ordermanagement/detailRejectionInfo`], {
      queryParams: {
        key: key,
        timestamp: Date.now() // Предотвращаем кэширование
      }
    });
    window.open(this.router.serializeUrl(url), '_blank');
  }

  public trackByGoodId(_: number, good: Good): number {
    return good.goodId;
  }

  public onClose(): void {
    this.popup = false;

    if (this.popupSuccess) {
      this.getData();
      this.clearSelection();
    }

    this.popupWarning = false;
    this.popupSuccess = false;
  }

  public ngOnDestroy(): void {
    if (this.columnOptionChangeTimeoutId !== null) {
      clearTimeout(this.columnOptionChangeTimeoutId);
    }

    if (this.rightPanelFilterLayoutTimeoutId !== null) {
      clearTimeout(this.rightPanelFilterLayoutTimeoutId);
    }

    if (this.rightPanelUpdateRafId !== null) {
      cancelAnimationFrame(this.rightPanelUpdateRafId);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private clearSelection(): void {
    if (this.dataGridRef) {
      this.dataGridRef.instance.clearSelection();
    }

    this.selectedRowKeys = [];
    this.selectedRows = [];
    this.chooseOffers = [];
  }

  private setBrowserTabInfo(session?: number): void {
    const OFFER_MANAGEMENT =
      this.translate.store.currentLang === 'RU'
        ? RU['offer-management'].offerManagement
        : EN['offer-management'].offerManagement;

    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(session, OFFER_MANAGEMENT, faviconUrl);
  }

  protected readonly sectionID: SectionIdModel = sectionID;
  private rightPanelUpdateRafId: number | null = null;
  private rightPanelFilterLayoutTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private columnOptionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /*              динамические колонки для таблицы                */

  public onChooseColumnsClick(): void {
    this.customColumnChooserPopup.visible = true;
    this.userTableOptionsService.scrollToTheTop();
    const activeTabCategory: GridType = getActiveGridCategoryBySelectedTabIndex(this.selectedIndex);
    const columnsData: ColumnsDataModel = generateColumnsForPopUpDisplay(
      activeTabCategory,
      Object.assign({}, this.columnVisibilitySettings),
      this.dynamicFields,
      this.sessionInfo,
      this.sectionId,
      this.user
    );
    this.userTableOptionsService.updateCurrentColumnDataSource(columnsData);
  }

  public onApplyColumnChanges(columnsData: ColumnsDataModel): void {
    this.customColumnChooserPopup.visible = false;
    const apiData: GridVisibilityOptionsApiModel = this.userTableOptionsService.parseColumnsDataToGridVisibilityOptionsApiModel(columnsData);
    this.userTableOptionsService.setVisibilityColumnsData(this.sectionId, apiData);
    this.chooseColumnsVisibilityByUserSettings(apiData);
  }

  public onCloseDialog(): void {
    this.customColumnChooserPopup.visible = false;
  }

  private chooseColumnsVisibilityByUserSettings(apiData: GridVisibilityOptionsApiModel): void {
    this.dataGridRef.instance.beginCustomLoading("");
    const columnVisibilityFields: string[] = Object.keys(this.columnVisibilitySettings);
    apiData.fieldOptionsVisibility.forEach((option: FieldOptionsApiModel) => {
      if (columnVisibilityFields.includes(option.idField)) {
        this.columnVisibilitySettings[option.idField] = option.isColumnVisible;
      }
    });
    this.dataGridRef.instance.endCustomLoading();
  }

  public dynamicDataForCellByField(
    fieldName: string | number,
    good: GoodApiModel,
  ): string {
    const fieldKey: string = fieldName.toString();
    const actualDimensionFieldIds: string[] = ['57', '58', '59', '40'];

    if (actualDimensionFieldIds.includes(fieldKey)) {
      const value: string = good.dynamicFields[fieldKey];
      if (value) {
        return this.commonService.actualDimensions(value, 0);
      }
      return value;
    }

    return good.dynamicFields[fieldKey];
  }

  public dynamicSpecDataForCellByField(
    fieldName: string | number,
    good: Good,
    data: OfferModel,
  ): string {
    return this.dynamicSpecDataForCell(
      { fieldName: fieldName.toString() } as FieldsModel,
      good,
      data,
    );
  }

  public dynamicSpecDataForCell(item: FieldsModel, good: Good, data: OfferModel): string {
    if (!this.user.IsWorker) {
      if (Number(item.fieldName) === ID_INTERFACE_FIELD.AMENDMENT) {
        if (data.idPriceAdjustment === PRICE_ADJUSTMENT_TYPE.ABSOLUTE_TYPE) {
          return Number(good.dynamicFields[ID_INTERFACE_FIELD.AMENDMENT]).toLocaleString("ru", {
            minimumFractionDigits: data.currencyPrecision,
            maximumFractionDigits: data.currencyPrecision
          });
        }
        if (data.idPriceAdjustment === PRICE_ADJUSTMENT_TYPE.RELATIVE_TYPE) {
          return good.dynamicFields[ID_INTERFACE_FIELD.AMENDMENT] + '%';
        }
      } else if (Number(item.fieldName) === ID_INTERFACE_FIELD.QUOTATION) {
        const quotationValue: number = Number(good.dynamicFields[ID_INTERFACE_FIELD.QUOTATION]);
        if (quotationValue > 0) {
          return Number(quotationValue).toLocaleString("ru", {
            minimumFractionDigits: good.quotationCurrencyPrecision,
            maximumFractionDigits: good.quotationCurrencyPrecision
          }) + ' ' + good.dynamicFields[ID_INTERFACE_FIELD.QUOTE_CURRENCY];
        }
      }
    }
    return good.dynamicFields[item.fieldName.toString()];
  }

  public getTableState(): Promise<GridState> {
    return Promise.resolve({
      allowedPageSizes:[10, 20, 50, 100],
      columns: [],
      filterPanel: {filterEnabled: true},
      filterValue: null,
      pageIndex: 0,
      pageSize: 20,
      searchText: "",
      selectedRowKeys: []
  });
  }

  public saveTableState(state: GridState): void {
    this.userTableOptionsService.preSaveTableSettings(
      this.sectionId,
      this.filterTab,
      state,
      this.sessionInfo,
      this.dynamicFields,
    );
  }

  public onSaveTableSettings(): void {
    this.userTableOptionsService.hasUnsavedGridStateChangesSource.next(false);
    const currentState: GridState = this.dataGridRef.instance.state();
    this.userTableOptionsService.saveTableSettings(
      this.sectionId,
      this.filterTab,
      currentState,
      this.sessionInfo,
      this.user,
      this.dynamicFields,
    );
  }

  public onOptionChanges(event: any): void {
    if (event.name !== 'columns' || !event.fullName) {
      return;
    }

    const watchedProps: SavedColumnProperties[] = [
      SavedColumnProperties.WIDTH,
      SavedColumnProperties.VISIBLE_INDEX,
      SavedColumnProperties.FILTER_VALUES,
      SavedColumnProperties.SORT_ORDER,
    ];

    if (watchedProps.some((prop: SavedColumnProperties) => event.fullName.endsWith(`.${prop}`))) {
      const isFilterChange: boolean = event.fullName.endsWith(
        `.${SavedColumnProperties.FILTER_VALUES}`,
      );

      if (isFilterChange) {
        // не делаем layout и сохранение стейта в том же тике, что клиентский фильтр (~1 с).
        this.scheduleDeferredColumnOptionChange();
        this.scheduleRightPanelUpdateDeferred();
      } else {
        this.userTableOptionsService.handleColumnOptionChange();
        this.scheduleRightPanelUpdate();
      }
    }
  }

  /** Отложить флаг «есть несохранённые настройки» — не в критическом пути ОК фильтра. */
  private scheduleDeferredColumnOptionChange(): void {
    if (this.columnOptionChangeTimeoutId !== null) {
      clearTimeout(this.columnOptionChangeTimeoutId);
    }

    this.columnOptionChangeTimeoutId = setTimeout((): void => {
      this.userTableOptionsService.handleColumnOptionChange();
      this.columnOptionChangeTimeoutId = null;
    }, 0);
  }

  /** updateRightPanelHeight после фильтра: чтение offsetHeight/clientWidth не в кадре с repaint грида. */
  private scheduleRightPanelUpdateDeferred(delayMs: number = 300): void {
    if (this.rightPanelFilterLayoutTimeoutId !== null) {
      clearTimeout(this.rightPanelFilterLayoutTimeoutId);
    }

    if (this.rightPanelUpdateRafId !== null) {
      cancelAnimationFrame(this.rightPanelUpdateRafId);
      this.rightPanelUpdateRafId = null;
    }

    this.rightPanelFilterLayoutTimeoutId = setTimeout((): void => {
      const gridRoot: HTMLElement | null = this.dataGridRef?.instance?.element?.() ?? null;
      if (gridRoot) {
        updateRightPanelHeight(gridRoot);
      }
      this.rightPanelFilterLayoutTimeoutId = null;
    }, delayMs);
  }

  private scheduleRightPanelUpdate(): void {
    if (this.rightPanelUpdateRafId !== null) {
      cancelAnimationFrame(this.rightPanelUpdateRafId);
    }

    const runUpdate = (): void => {
      const gridRoot: HTMLElement | null = this.dataGridRef?.instance?.element?.() ?? null;
      if (gridRoot) {
        updateRightPanelHeight(gridRoot);
      }
      this.rightPanelUpdateRafId = null;
    };

    this.rightPanelUpdateRafId = requestAnimationFrame(runUpdate);
  }

  public resetTableStateToPreviousSavedData(): void {
    this.userTableOptionsService.apiData$.pipe(
      take(1),
      map((apiData: GridOptionsApiModel) => {
        this.dataGridRef.instance.state(null);
        this.pendingGridSettingsApplied = false;
        this.pendingGridSettings = apiData;
        this.applyPendingApiData(true);

      })
    ).subscribe();
    this.userTableOptionsService.clearPreSavedData();
  }

  private clearAllHeaderFilters(): void {
    const grid: dxDataGrid = this.dataGridRef.instance;

    grid.getVisibleColumns().forEach((column: Column): void => {
      if (!column.dataField || column.allowHeaderFiltering === false) {
        return;
      }

      grid.columnOption(column.dataField, {
        filterValues: [],
        filterType: 'exclude',
        filterValue: undefined,
      });
    });
  }

  private hasActiveHeaderFilter(column: ColumnState): boolean {
    return Array.isArray(column.filterValues) && column.filterValues.length > 0;
  }

  /**
   * Синхронизация UI «Выбрать все» в header filter с DevExtreme:
   * exclude + [] = ничего не исключаем;
   * сохранённые partial filter не трогаем.
   */
  private normalizeHeaderFiltersInState(
    state: GridState,
    forceResetAll: boolean = false,
  ): GridState {
    if (!state.columns?.length) {
      return {
        ...state,
        filterValue: state.filterValue ?? null,
      };
    }

    const columns: ColumnState[] = state.columns.map((column: ColumnState): ColumnState => {
      if (!forceResetAll && this.hasActiveHeaderFilter(column)) {
        return column;
      }

      return {
        ...column,
        filterValue: undefined,
        filterValues: [],
        filterType: 'exclude' as const,
      };
    });

    return {
      ...state,
      filterValue: state.filterValue ?? null,
      columns,
    };
  }

  /** Однократная нормализация header filter после первого contentReady. */
  private applyInitialHeaderFilters(): void {
    if (!this.dataGridRef?.instance) {
      return;
    }

    const normalizedState: GridState = this.normalizeHeaderFiltersInState(
      structuredClone(this.dataGridRef.instance.state()),
      false,
    );
    this.dataGridRef.instance.state(normalizedState);
  }

  private getGridStateWithoutHeaderFilters(state: GridState): GridState {
    return this.normalizeHeaderFiltersInState(state, true);
  }

  public resetTableStateToInitialState(): void {
    this.dataGridRef.instance.state(null);
    this.clearAllHeaderFilters();
    const currentState: GridState = this.getGridStateWithoutHeaderFilters(
      structuredClone(this.dataGridRef.instance.state()),
    );
    this.columnVisibilitySettings = generateInitialVisibilityForGridColumns(
      this.dynamicFields,
      this.user,
      this.sessionInfo,
      this.filterTab,
      this.sectionId as SectionType
    );
    this.userTableOptionsService.saveInitialTableSettings(
      this.sectionId,
      this.filterTab,
      currentState,
      this.columnVisibilitySettings,
      this.sessionInfo,
      this.user,
      this.dynamicFields,
    );
    this.dataGridRef.instance.state(currentState);
    this.userTableOptionsService.clearPreSavedData();
    this.customColumnChooserPopup.visible = false;
  }
}
