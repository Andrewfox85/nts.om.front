/* eslint-disable */
import { CookieService } from 'ngx-cookie-service';
import { CatalogService } from '../../core/services/catalog-service.service';
import {
  applicationForm,
  searchIcon,
  sectionID,
  sessionStage,
  statusSession,
  AuctionType,
  depositType
} from '../../api.constants';
import {
  Component,
  OnInit,
  ViewChild,
  OnDestroy,} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import { SessionsScheduleService } from '../../core/services/sessions-schedule.service';
import { User } from '../../core/classes/user';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import { PageCache } from '../../core/classes/PageCache';
import { Router, ActivatedRoute} from '@angular/router';
import { numberEntriesPage, role, IdDirection, TARGET_PERIOD } from '../../api.constants';
import DataSource from 'devextreme/data/data_source';
import List from 'devextreme/ui/list';
import TreeView from 'devextreme/ui/tree_view';
import { CommonService } from '../../core/services/common-service.service';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import { OfferManagementService } from '../../core/services/offer-management-service.service';
import { FiltersComponent } from '../../sub_components/filters/filters.component';
import { AppConfigService } from 'src/app/app-config.service';
import { AccreditedRoleService } from '../../core/services/accredited-role.service';
import { TabStateService } from 'src/app/core/services/tab-state.service';
import { Subject, takeUntil, distinctUntilChanged, delay } from 'rxjs';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { SessionInfo } from './../../core/interfaces/interface';
import { DepositTypeResponse } from "../../core/interfaces";

@Component({
  selector: 'app-sessions-schedule',
  templateUrl: './sessions-schedule.component.html',
  styleUrls: ['./sessions-schedule.component.scss'],
})
export class SessionsScheduleComponent implements OnInit, OnDestroy {
  cache = {} as PageCache;
  searchIcon: any = searchIcon;

  search: string;

  store: any;
  sessions: any;
  options = false; //toolbar над гридом
  sectionFilter: number[] = [];
  filterListGoods = [];

  filterTab: number = 1;
  currentTimeDate: Date;
  ru: string = '/assets/i18n/RU.json';
  en: string = '/assets/i18n/EN.json';

  selectedRows = [];
  disableUpdate = false; //задизейблить кнопку обновления данных

  numberEntriesPage = numberEntriesPage;
  user: User;

  role: any;
  UserRole: string;

  isVisible: boolean = false;
  type = 'error';
  position = 'top center';
  message: string =
    this.translate.store.currentLang == 'RU'
      ? RU['deposit'].withoutDeposit
      : EN['deposit'].withoutDeposit;
  depositType: number;
  depositPrivileges: boolean = false; //привилегия для просмотра задатка

  auctionsPrivileges: boolean = false;
  privilegesObserver: boolean = false;

  chooseOfferPopup: boolean = false; //модалка для выбора архивной заявки при подаче адресной с/х
  archiveOffersForDirect: any;

  chooseTheWay: boolean = false;
  public isAccredited: boolean;
  AuctionType = AuctionType;
  sessionStage = sessionStage;

  public selectedIndex: number = 0;
  private destroy$ = new Subject<void>();

  public viewRegistrationsPopup = false;
  public readonly ID_DIRECTION = IdDirection;
  public readonly depositTypeEnum = depositType;

  @ViewChild(FiltersComponent)
  filtersComponent: FiltersComponent;
  constructor(
    public translate: TranslateService,
    public sessionsScheduleService: SessionsScheduleService,
    public router: Router,
    public commonService: CommonService,
    private createOfferService: CreateOfferService,
    public catalogService: CatalogService,
    public offerManagementService: OfferManagementService,
    private config: AppConfigService,
    private readonly accreditedRoleService: AccreditedRoleService,
    private readonly tabState: TabStateService,
    private pageMeta: PageMetaService,
    private route: ActivatedRoute,
    private cookieService: CookieService
  ) {
    // Добавление tooltip в фильтрацию заголовков таблицы
    List.defaultOptions({
      device: { deviceType: 'desktop' },
      options: {
        onItemRendered: this.onItemRendered.bind(this),
      },
    });
    TreeView.defaultOptions({
      device: { deviceType: 'desktop' },
      options: {
        onItemRendered: this.onItemRendered.bind(this),
      },
    });

    this.cache = JSON.parse(sessionStorage.getItem('SESSION_SCHEDULE')) || {};
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onItemRendered(args) {
    args.itemElement.setAttribute('title', args.itemData.text || '');
  }

  getNodeByLevel = (node, level) => {
    if (!node.parent) {
      return;
    }

    if (node.parent.level === level) {
      // Remove the "|| node.parent.level === undefined" part after release
      return node.parent;
    } else {
      return this.getNodeByLevel(node.parent, level);
    }
  };

  onContentReady(e) {
    this.disableUpdate = false;
    const unsortedHeaders = e.element.getElementsByClassName(
      'dx-column-indicators'
    );
    // we loop thru each column headers
    for (let i = 0; i < unsortedHeaders.length; i++) {
      const element = unsortedHeaders[i];
      const children = element.childNodes;
      //we create an element for the icon
      const sortableIcon = document.createElement('i');
      sortableIcon.classList.add('dx-icon', 'dx-sort-icon');

      let isSortable = false;
      let hasIcon = false;
      let existingSortableIcon = '';

      //since we are going to add a custom icon, we must make sure we only add it once and when column is not sorted
      for (let i = 0; i < children.length; i++) {
        //check if column already has the icon so we don't infinitely add it
        if (
          element.querySelector('.dx-sort')?.getElementsByTagName('i').length > 0
        ) {
          hasIcon = true;
          existingSortableIcon = children[i];
        }

        // check if column isn't sorted
        if (children[i].classList.contains('dx-sort-none')) isSortable = true;
      }

      //if can add icon
      if (isSortable && !hasIcon) {
        const sortSpan = element.querySelector('.dx-sort');
        element.querySelector('.dx-sort-none').style.display = 'inline-block';
        sortSpan.appendChild(sortableIcon);
        hasIcon = true;
      }

      //if column is sorted and we added an icon earlier, we remove it
      // you can also remove all the icons when one column is sorted, it depends on your preference
      if (!isSortable && hasIcon) element.removeChild(existingSortableIcon);
    }
    this.filtersComponent.isButtonBlockFixed =
      document.documentElement.clientHeight +
        document.documentElement.scrollTop <=
      document.documentElement.scrollHeight - 183;
  }

  onTreeListCellPrepared(e) {
    if (e.rowType === 'data' && e.columnIndex === 0) {
      var currentNode = e.row.node,
        $emptySpaceElements = e.cellElement.querySelectorAll(
          '.dx-treelist-text-content'
        ),
        children = currentNode.parent.children,
        isLasChildren = children[children.length - 1].key === currentNode.key;

      for (var i = 0; i < $emptySpaceElements.length; i++) {
        var node = this.getNodeByLevel(currentNode, i - 1);

        if (
          (node &&
            currentNode.hasChildren == false &&
            currentNode.level == 0) ||
          (currentNode.hasChildren == true && currentNode.level == 0)
        ) {
          $emptySpaceElements[i].classList.add('dx-line__dark');
        } else {
          $emptySpaceElements[i].classList.add('dx-line__light');
        }
      }
    }
  }

  ngOnInit(): void {
    this.role = role;

    this.route.queryParamMap.pipe(
        tap((params) => {
          const returned = params.get('returned');
          if (returned === '1') {
            this.user.token = this.cookieService.get('UasToken');

            this.router.navigate([], { //очищаем queryParams
              queryParams: { returned: null },
              queryParamsHandling: 'merge'
            })
          }
        })
    ).subscribe();

    if (this.user?.token) {
      this.createOfferService
        .GetRole(this.user?.token)
        .subscribe((res: any) => {
          this.UserRole = res.role;
          this.isAccredited = !!parseInt(res.role, 10);

          if (this.UserRole === String(role.worker)) {
            this.user.IsWorker = true;
          }

          if(!this.user?.IsWorker) {
            this.selectedIndex = this.tabState.getIndex('sessions');

            this.tabState
              .getIndex$('sessions')
              .pipe(takeUntil(this.destroy$),
              distinctUntilChanged(),
              delay(0))
              .subscribe((index) => {
                this.selectedIndex = index;
                this.filterTab = index + 1;
                this.getData();
              });
          }
        });
    }

    const SESSION_SCHEDULE = this.translate.store.currentLang == 'RU'
      ? RU['header']['top_line']['menu'].sessionsSchedule
      : EN['header']['top_line']['menu'].sessionsSchedule
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(
      null,
      SESSION_SCHEDULE,
      faviconUrl
    );

  }

  getData() {
    this.currentTimeDate = new Date();
    this.filterListGoods.length = 0;
    this.cache?.filters?.goods?.forEach((i) => {
      this.filterListGoods.push(i);
    });
    this.sectionFilter = this.cache?.filters?.sectionsMulti;

    if (this.sectionFilter?.length > 0) {
      if (!this.user.IsWorker) {
        const filters = {
          //"ListSection": this.sectionFilter,
          filterTab: this.filterTab,
          searchString: this.search || null,
          filterIdClient: this.cache?.filters?.brokerClient || null,
          filterIdBranch: this.cache?.filters?.brokerClient
            ? this.cache?.filters?.ListClientBranch
            : this.cache?.filters?.listBranch || null,
          filterIsRegisterAsBuyer: this.cache?.filters?.registration_buyer,
          filterIsRegisterAsSeller: this.cache?.filters?.registration_seller,
          filterIsExistDemands: this.cache?.filters?.purchaseOrdersSubmitted,
          filterIsExistOffers: this.cache?.filters?.submitRequestsSale,
          filterGroupNomen: this.cache?.filters?.nomenclatureGroup || null,
          filterGroupGood: this.cache?.filters?.goodsGroup || null,
          filterSessionDateFrom: this.cache?.filters?.dateFrom || null,
          filterSessionDateTo: this.cache?.filters?.dateTo || null,
        };
        this.store = createStore(
          this.sessionsScheduleService.getListSessionTrader(
            this.user?.token,
            filters,
            this.sectionFilter,
            this.filterListGoods
          )
        ); //
      } else {
        const filters = {
          SearchString: this.search || null,
          FilterIdFirm: this.cache?.filters?.idFirm || null,
          FilterIdClient: this.cache?.filters?.workerBrokerClient || null,
          FilterIdBranch: this.cache?.filters?.workerListClientBranch || null,
          FilterIsExistRegBuyers: this.cache?.filters?.registration_buyer,
          FilterIsExistRegSellers: this.cache?.filters?.registration_seller,
          FilterIsExistDemands: this.cache?.filters?.purchaseOrdersSubmitted,
          FilterIsExistOffers: this.cache?.filters?.submitRequestsSale,
          FilterGroupNomen: this.cache?.filters?.nomenclatureGroup || null,
          FilterGroupGood: this.cache?.filters?.goodsGroup || null,
          FilterSessionDateFrom: this.cache?.filters?.dateFrom || null,
          FilterSessionDateTo: this.cache?.filters?.dateTo || null,
        };

        this.store = createStore(
          this.sessionsScheduleService.getListSessionWorker(
            this.user.token,
            filters,
            this.sectionFilter,
            this.filterListGoods
          )
        ); //
      }

      this.sessions = new DataSource({
        store: this.store,
        filter: this.filterSessionStatus, //боковые фильтры Статус сессии
      });
    }
    sessionStorage.setItem('SESSION_SCHEDULE', JSON.stringify(this.cache));
    if (location.search.split('jwt=').length > 1) {
      //todo без нее не очищается sessionStorage при авторизации с привилегиями
      sessionStorage.clear();
    }
  }

  onCellPrepared(e) {
    if (e.rowType === 'data') {
      if (e.column.command === 'select') {
        e.cellElement.classList.add('myCellFixShadowLeft');
      }

      if (e.column.dataField === 'numberRegistrationBuy') {
        e.cellElement.classList.add('myCellFixShadowRight');
      }

      if (e.column.dataField === 'sessionId') {
        e.cellElement.classList.add('date-roboto-mono');
      }
    }

    if (e.rowType === 'header') {
      if (e.column.command === 'select') {
        e.cellElement.classList.add('myCellFixShadowLeft');
      }
      if (e.column.dataField === 'numberRegistrationBuy') {
        e.cellElement.classList.add('myCellFixShadowRight');
      }
    }
  }

  onChangeTab(e: any) {
    const newIndex =
      e.itemIndex !== undefined
        ? e.itemIndex
        : e.component.option('selectedIndex');
    if (newIndex !== undefined && newIndex !== this.selectedIndex) {
      this.tabState.setIndex(newIndex, 'sessions');
    }
    this.filterTab = e.itemIndex + 1;
    this.filtersComponent.sendFiltersData();
    this.getData();
  }

  onSelectionChanged(data: any) {
    this.selectedRows = data.selectedRowsData;
    this.options = data.selectedRowKeys.length > 0;
    this.chooseSession = this.selectedRows;
  }

  filterSessionStatus: any;

  getFilterData(e: any) {
    this.filterSessionStatus = null;
    this.cache.filters = e;
    if (this.cache.filters.preparation) {
      this.filterSessionStatus = [
        'sessionStatusId',
        '=',
        statusSession.preparation,
      ];
    }
    if (this.cache.filters.bidding) {
      this.filterSessionStatus = [
        'sessionStatusId',
        '=',
        statusSession.bidding,
      ];
    }
    if (this.cache.filters.preparation && this.cache.filters.bidding) {
      this.filterSessionStatus = [
        ['sessionStatusId', '=', statusSession.preparation],
        'or',
        ['sessionStatusId', '=', statusSession.bidding],
      ];
    }
    this.chooseSession = [];
    this.getData();
  }

  chooseSession = [];
  disableConditionRegistrBuyer: any;
  disableConditionRegistrSeller: any;
  sectionDescription: string;
  Privileges: boolean = false;

  onContextMenuPreparing(e: any) {
    if (e.row.rowType != 'header') {
      this.chooseSession = [];
      if (!e.items) e.items = [];
      if (this.selectedRows.length > 0) {
        this.chooseSession = this.selectedRows;
      } else {
        this.chooseSession.push(e.row.data);
      }

      if (this.user?.IsWorker) {
        if (this.chooseSession.length == 1) {
          const sectionArray = JSON.parse(localStorage.getItem('sections'));
          this.sectionDescription = sectionArray.find(
            (el) => el.id === Number(this.chooseSession[0].sectionId)
          )?.description;
          this.sectionDescription =
            'DemandOfferManagementGetList' + this.sectionDescription;
          let depositSectionDescription = sectionArray.find(
            (el) => el.id === Number(this.chooseSession[0].sectionId)
          )?.description;
          depositSectionDescription =
            'DemandOfferManagementDeposit' + depositSectionDescription;
          let privilegesObserverDescription = sectionArray.find(
            (el) => el.id === Number(this.chooseSession[0].sectionId)
          )?.description;
          privilegesObserverDescription =
            'TradingGetList' + privilegesObserverDescription;
          let auctionsDescription = sectionArray.find(
            (el) => el.id === Number(this.chooseSession[0].sectionId)
          )?.description;
          auctionsDescription = 'TradingEditItem' + auctionsDescription;
          this.Privileges = this.commonService.checkPrivileges(
            this.sectionDescription
          );
          this.depositPrivileges = this.commonService.checkPrivileges(
            depositSectionDescription
          );
          this.auctionsPrivileges =
            this.commonService.checkPrivileges(auctionsDescription);
          this.privilegesObserver = this.commonService.checkPrivileges(
            privilegesObserverDescription
          );
        }
        e.items.push(
          {
            icon: './assets/img/icons/offer_catalog.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].goOfferCatalog
                : EN['sessions-schedule'].goOfferCatalog,
            disabled: this.chooseSession.length > 1,
            onItemClick: () => {
              this.catalogService.direction = IdDirection.sale;
              this.catalogService.sessionId = e.row.data.sessionId;
              this.catalogService.sectionId = e.row.data.sectionId;

              this.cache.filters.session = e.row.data.sessionId;
              this.cache.filters.sections = e.row.data.sectionId;
              sessionStorage.setItem('CATALOG_SALE', JSON.stringify(this.cache));

              this.router.navigate(['/catalog'], {
                queryParams: { direction: IdDirection.sale }
              });
            },
          },
          {
            icon: './assets/img/icons/demandCatalog.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].goDemandCatalog
                : EN['sessions-schedule'].goDemandCatalog,
            disabled: this.chooseSession.length > 1,
            onItemClick: () => {
              this.catalogService.direction = IdDirection.buy;
              this.catalogService.sessionId = e.row.data.sessionId;
              this.catalogService.sectionId = e.row.data.sectionId;

              this.cache.filters.session = e.row.data.sessionId;
              this.cache.filters.sections = e.row.data.sectionId;
              sessionStorage.setItem('CATALOG_BUY', JSON.stringify(this.cache));

              this.router.navigate(['/catalog'], {
                queryParams: { direction: IdDirection.buy }
              });
            },
          },
          {
            icon: './assets/img/icons/sessionDeposit.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].viewInformationDeposit
                : EN['sessions-schedule'].viewInformationDeposit,
            disabled:
              this.chooseSession.length > 1 ||
              e.row.data.sessionStageId == 1 ||
              !this.depositPrivileges ||
              (e.row.data.numberDemands == 0 &&
                e.row.data.numberOffers == 0 &&
                e.row.data.numberRegistrationBuy == 0 &&
                e.row.data.numberRegistrationSale == 0),
            onItemClick: () => {
              this.router.navigateByUrl('/deposit');
              this.offerManagementService.sectionId = e.row.data.sectionId;
              this.offerManagementService.sessionForDeposit = e.row.data;
            },
          },
          {
            icon: './assets/img/icons/sessionOffer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].viewSubmittedRequest
                : EN['sessions-schedule'].viewSubmittedRequest,
            disabled:
              this.chooseSession.length > 1 ||
              e.row.data.sessionStageId == 1 ||
              (e.row.data.numberDemands == 0 && e.row.data.numberOffers == 0),
            onItemClick: () => {
              this.offerManagementService.sessionId = e.row.data.sessionId;
              this.offerManagementService.sectionId = e.row.data.sectionId;
              this.offerManagementService.typeOfSession = 'current';

              this.cache.filters.session = e.row.data.sessionId;
              sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(this.cache));

              this.router.navigate(['/offer-management'], {
                queryParams: {
                  idSection: this.offerManagementService.sectionId,
                  type: this.offerManagementService.typeOfSession
                }
              });
            },
          },
          {
            icon: './assets/img/icons/registrationUser.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['sessions-schedule'].viewSessionRegistrations
                : EN['sessions-schedule'].viewSessionRegistrations,
            disabled:
              !this.Privileges ||
              (e.row.data.numberRegistrationBuy == 0 &&
                e.row.data.numberRegistrationSale == 0),
            onItemClick: () => {
              this.router.navigate(
                [`/sessions-schedule/worker-view-registration`],
                {
                  queryParams: {
                    idSection: e.row.data.sectionId,
                    idSession: e.row.data.sessionId,
                    sessionDate: e.row.data.sessionDateTime,
                    sessionName: e.row.data.sessionName,
                    sessionType: e.row.data.sessionStatusId,
                    sessionStage: e.row.data.sessionStageId,
                  },
                }
              );
            },
          },
          {
            icon: './assets/img/icons/transferToBids.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['btns'].goToAuctions
                : EN['btns'].goToAuctions,
            disabled: !(
              e.row.data.isCanLogin &&
              (this.auctionsPrivileges || this.privilegesObserver)
            ),
            onItemClick: () => {
              this.commonService
                .SessionLogin(
                  this.user?.token,
                  e.row.data.sectionId,
                  e.row.data.sessionId
                )
                .then((res: any) => {
                  let auctionsType = this.getAuctionPath(
                    e.row.data.auctionTypeId
                  );
                  const url = this.router.serializeUrl(
                    this.router.createUrlTree(
                      [`${this.config.auctions}/${auctionsType}/main-page`],
                      {
                        queryParams: {
                          isExistsViolations: res.isExistsViolations,
                          idDirection: res.idDirection,
                          idSection: e.row.data.sectionId,
                          idSession: e.row.data.sessionId,
                        },
                      }
                    )
                  );
                  window.open(url, '_blank');
                });
            },
          },
          {
            icon: './assets/img/icons/sessionOffer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['report-participants'].reportParticipants
                : EN['report-participants'].reportParticipants,
            disabled:
              this.chooseSession.length > 1 ||
              !this.Privileges ||
              ![
                sessionStage.applicationsOpen,
                sessionStage.purchaseOrdersOpen,
                sessionStage.applicationsSaleOpen,
                sessionStage.applicationsClosed,
                sessionStage.completedProcessingApplications
              ].includes(e.row.data.sessionStageId),
            onItemClick: () => {
              const url = this.router.serializeUrl(
                this.router.createUrlTree([`ordermanagement/report-participants`], {
                  queryParams: {
                    idSection: e.row.data.sectionId,
                    idSession: e.row.data.sessionId,
                    sessionDate: e.row.data.sessionDateTime,
                    sessionName: e.row.data.sessionName
                  },
                })
              );
              window.open(url, '_blank');
            },
          },
        );
      } else {
        if (!!this.user.token && this.isAccredited) {
          e.items.push(
            {
              icon: './assets/img/icons/buyer_registr.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].registrBuyer
                  : EN['sessions-schedule'].registrBuyer,
              disabled: this.disabledBuyerRegistration(),
              onItemClick: () => {
                this.openRegistationForm(IdDirection.buy);
              },
            },
            {
              icon: './assets/img/icons/seller_registr.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].registrSaller
                  : EN['sessions-schedule'].registrSaller,
              disabled: this.disabledSallerRegistration(),
              onItemClick: () => {
                this.openRegistationForm(IdDirection.sale);
              },
            },
            {
              icon: './assets/img/icons/apply_buy.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].applyBuy
                  : EN['sessions-schedule'].applyBuy,
              disabled:
                this.chooseSession.length > 1 || this.disabledApplyBuy(),
              onItemClick: () => {
                this.createOfferService.idOffer = null;
                this.createOfferService.isMine = false;
                this.createOfferService.isCreateCopy = false;
                this.createOfferService.sessionName = e.row.data.sessionName;
                this.createOfferService.sessionId = e.row.data.sessionId;
                this.createOfferService.sessionDateTime =
                  e.row.data.sessionDateTime;
                this.createOfferService.sectionId = e.row.data.sectionId;
                this.createOfferService.sectionName = e.row.data.sectionName;
                this.createOfferService.direction = IdDirection.buy;
                //  this.router.navigate([`/`] );
                this.chooseTheWay = true;
                // this.router.navigateByUrl('/sessions-schedule/startcreateOffer', {skipLocationChange: true})
              },
            },
            {
              icon: './assets/img/icons/apply_sale.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].applySale
                  : EN['sessions-schedule'].applySale,
              disabled:
                this.chooseSession.length > 1 || this.disabledApplySale(),
              onItemClick: () => {
                this.createOfferService.idOffer = null;
                this.createOfferService.isMine = false;
                this.createOfferService.isCreateCopy = false;
                this.createOfferService.sessionName = e.row.data.sessionName;
                this.createOfferService.sessionId = e.row.data.sessionId;
                this.createOfferService.sessionDateTime =
                  e.row.data.sessionDateTime;
                this.createOfferService.sectionId = e.row.data.sectionId;
                this.createOfferService.sectionName = e.row.data.sectionName;
                this.createOfferService.direction = IdDirection.sale;
                // this.router.navigate([`/sessions-schedule/startcreateOffer`]);
                this.chooseTheWay = true;
                // this.router.navigateByUrl('/sessions-schedule/startcreateOffer', {skipLocationChange: true})
              },
            }
          );

          if (e.row.data.isAllowedTargetTransact) {
            e.items.push({
              //Подать адресную заявку на продажу
              icon: './assets/img/icons/apply_sale.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].applyDirectSale
                  : EN['sessions-schedule'].applyDirectSale,
              disabled:
                this.chooseSession.length > 1 ||
                !this.chooseSession[0].isCanTargetedOffer,
              onItemClick: () => {
                if (e.row.data.sectionId == 2) {
                  //подаем лесную
                  this.createOfferService.idOffer = null;
                  this.createOfferService.sessionName = e.row.data.sessionName;
                  this.createOfferService.sessionId = e.row.data.sessionId;
                  this.createOfferService.sessionDateTime =
                    e.row.data.sessionDateTime;
                  this.createOfferService.sectionId = e.row.data.sectionId;
                  this.createOfferService.sectionName = e.row.data.sectionName;
                  this.createOfferService.direction = IdDirection.sale;
                  // this.router.navigate([`/sessions-schedule/startcreateOffer`]);
                  this.router.navigateByUrl(
                    '/sessions-schedule/startCreateDirectOffer',
                    { skipLocationChange: true }
                  );
                }

                if (e.row.data.sectionId == 3) {
                  //подаем с/х
                  this.createOfferService
                    .TargetGetListMasterWithDetails(
                      this.user?.token,
                      e.row.data.sectionId,
                      e.row.data.sessionId
                    )
                    .then((res: any) => {
                      this.archiveOffersForDirect = res.offers;

                      this.archiveOffersForDirect.sort((a, b) => {
                        return a.lotNumber - b.lotNumber;
                      });

                      this.archiveOffersForDirect.forEach((item) => {
                        let names = item.goods.map((x) => x.goodInfo.goodName); //создаю массив имен и добавляю в объект для фильтрации
                        item['names'] = names;

                        let desc = item.goods.map(
                          (x) => x.goodInfo.goodDescription
                        );
                        item['desc'] = desc;

                        let vol = item.goods.map((x) => x.goodInfo.goodVolume);
                        item['vol'] = vol;

                        let prices = item.goods.map(
                          (x) => x.priceParams.priceWithoutVat
                        );
                        item['prices'] = prices;

                        let amountVAT = item.goods.map(
                          (x) => x.priceParams.vatAmount
                        );
                        item['amountVAT'] = amountVAT;

                        let totalAmount = item.goods.map(
                          (x) => x.priceParams.totalAmount
                        );
                        item['totalAmount'] = totalAmount;
                      });
                      this.chooseOfferPopup = true;
                    });
                }
              },
            });
          }
          e.items.push(
            {
              icon: './assets/img/icons/sessionOffer.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].viewSubmittedRequest
                  : EN['sessions-schedule'].viewSubmittedRequest,
              disabled:
                this.chooseSession.length > 1 ||
                this.chooseSession[0].isCanTargetedOffer ||
                this.chooseSession[0].idSessionPeriod === TARGET_PERIOD,
              onItemClick: () => {
                this.offerManagementService.sessionId = e.row.data.sessionId;
                this.offerManagementService.sectionId = e.row.data.sectionId;
                this.offerManagementService.typeOfSession = 'current';

                this.cache.filters.session = e.row.data.sessionId;
                sessionStorage.setItem('OFFER_MANAGEMENT', JSON.stringify(this.cache));

                this.router.navigate(['/offer-management'], {
                  queryParams: {
                    idSection: this.offerManagementService.sectionId,
                    type: this.offerManagementService.typeOfSession
                  }
                });
              },
            },
            {
              icon: './assets/img/icons/sessionDeposit.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].viewInformationDeposit
                  : EN['sessions-schedule'].viewInformationDeposit,
              disabled:
                this.chooseSession.length > 1 ||
                e.row.data.sessionStageId == 1 ||
                (e.row.data.numberDemands == 0 &&
                  e.row.data.numberOffers == 0 &&
                  e.row.data.numberRegistrationBuy == 0 &&
                  e.row.data.numberRegistrationSale == 0) ||
                this.chooseSession[0].isCanTargetedOffer ||
                this.chooseSession[0].idSessionPeriod === TARGET_PERIOD,
              onItemClick: () => {
                if (
                  this.UserRole === String(role.broker) ||
                  this.UserRole === String(role.brokerVisitor)
                ) {
                  this.router.navigateByUrl('/deposit');
                  this.offerManagementService.sectionId = e.row.data.sectionId;
                  this.offerManagementService.sessionForDeposit = e.row.data;
                } else {
                  this.checkDepositType();
                }
              },
            },
            {
              icon: './assets/img/icons/demandCatalog.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].goDemandCatalog
                  : EN['sessions-schedule'].goDemandCatalog,
              disabled:
                this.chooseSession.length > 1 ||
                this.chooseSession[0].isCanTargetedOffer ||
                this.chooseSession[0].idSessionPeriod === TARGET_PERIOD,
              onItemClick: () => {
                this.catalogService.direction = IdDirection.buy;
                this.catalogService.sessionId = e.row.data.sessionId;
                this.catalogService.sectionId = e.row.data.sectionId;

                this.cache.filters.session = e.row.data.sessionId;
                this.cache.filters.sections = e.row.data.sectionId;
                sessionStorage.setItem('CATALOG_BUY', JSON.stringify(this.cache));

                this.router.navigate(['/catalog'], {
                  queryParams: { direction: IdDirection.buy }
                });
              },
            },
            {
              icon: './assets/img/icons/offer_catalog.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].goOfferCatalog
                  : EN['sessions-schedule'].goOfferCatalog,
              disabled:
                this.chooseSession.length > 1 ||
                this.chooseSession[0].isCanTargetedOffer ||
                this.chooseSession[0].idSessionPeriod === TARGET_PERIOD,
              onItemClick: () => {
                this.catalogService.direction = IdDirection.sale;
                this.catalogService.sessionId = e.row.data.sessionId;
                this.catalogService.sectionId = e.row.data.sectionId;

                this.cache.filters.session = e.row.data.sessionId;
                this.cache.filters.sections = e.row.data.sectionId;
                sessionStorage.setItem('CATALOG_SALE', JSON.stringify(this.cache));

                this.router.navigate(['/catalog'], {
                  queryParams: { direction: IdDirection.sale }
                });
              },
            },
            {
              icon: './assets/img/icons/transferToBids.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['btns'].goToAuctions
                  : EN['btns'].goToAuctions,
              disabled: !e.row.data.isCanLogin,
              onItemClick: () => {
                this.commonService
                  .SessionLogin(
                    this.user?.token,
                    e.row.data.sectionId,
                    e.row.data.sessionId
                  )
                  .then((res: any) => {
                    let auctionsType = this.getAuctionPath(
                      e.row.data.auctionTypeId
                    );
                    const url = this.router.serializeUrl(
                      this.router.createUrlTree(
                        [`${this.config.auctions}/${auctionsType}/main-page`],
                        {
                          queryParams: {
                            isExistsViolations: res.isExistsViolations,
                            idDirection: res.idDirection,
                            idSection: e.row.data.sectionId,
                            idSession: e.row.data.sessionId,
                          },
                        }
                      )
                    );
                    window.open(url, '_blank');
                  });
              },
            }
          );
        } else {
          e.items.push(
            {
              icon: './assets/img/icons/demandCatalog.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].goDemandCatalog
                  : EN['sessions-schedule'].goDemandCatalog,
              disabled: this.chooseSession.length > 1,
              onItemClick: () => {
                this.catalogService.direction = IdDirection.buy;
                this.catalogService.sessionId = e.row.data.sessionId;
                this.catalogService.sectionId = e.row.data.sectionId;

                this.cache.filters.session = e.row.data.sessionId;
                this.cache.filters.sections = e.row.data.sectionId;
                sessionStorage.setItem('CATALOG_BUY', JSON.stringify(this.cache));

                this.router.navigate(['/catalog'], {
                  queryParams: { direction: IdDirection.buy }
                });
              },
            },
            {
              icon: './assets/img/icons/offer_catalog.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].goOfferCatalog
                  : EN['sessions-schedule'].goOfferCatalog,
              disabled: this.chooseSession.length > 1,
              onItemClick: () => {
                this.catalogService.direction = IdDirection.sale;
                this.catalogService.sessionId = e.row.data.sessionId;
                this.catalogService.sectionId = e.row.data.sectionId;

                this.cache.filters.session = e.row.data.sessionId;
                this.cache.filters.sections = e.row.data.sectionId;
                sessionStorage.setItem('CATALOG_SALE', JSON.stringify(this.cache));

                this.router.navigate(['/catalog'], {
                  queryParams: { direction: IdDirection.sale }
                });
              },
            }
          );
        }
      }
    }
  }

  getAuctionPath(type: number): string {
    switch (type) {
      case AuctionType.englishUpgrading:
        return 'english-upgrading-auction';
      case AuctionType.dutchDown:
        return 'dutch-down-auction';
      case AuctionType.doubleCounter:
        return 'double-counter-auction';
    }
  }

  closeChooseOfferPopup(event) {
    this.chooseOfferPopup = event;
  }

  closeChooseTheWay(event) {
    this.chooseTheWay = event;
  }

  checkDepositType() {
    // this.offerManagementService.GetFirmDepositType(this.user?.token, this.user?.userInfo?.firmId).then((res: any) => {
    this.offerManagementService
      .getFirmDepositType()
      .subscribe((res: DepositTypeResponse) => {
        this.depositType = res.depositType;
        if (this.depositType == this.depositTypeEnum.withoutDeposit) {
          this.isVisible = true;
        } else {
          this.router.navigateByUrl('/deposit');
          this.offerManagementService.sectionId =
            this.chooseSession[0].sectionId;
          this.offerManagementService.sessionForDeposit = this.chooseSession[0];
        }
      });
  }

  disabledBuyerRegistration() {
    let disabled = false;
    this.chooseSession.forEach((session) => {
      if (!session?.isCanRegisterAsBuyer) {
        disabled = true;
      }
    });
    return disabled;
  }

  disabledSallerRegistration() {
    let disabled = false;
    this.chooseSession.forEach((session) => {
      if (!session?.isCanRegisterAsSeller) {
        disabled = true;
      }
    });
    return disabled;
  }

  disabledApplyBuy() {
    let disabled = false;
    this.chooseSession.forEach((session) => {
      if (!session?.isCanSetDemand) {
        disabled = true;
      }
    });
    return disabled;
  }

  disabledApplySale() {
    let disabled = false;
    this.chooseSession.forEach((session) => {
      if (!session?.isCanSetOffer) {
        disabled = true;
      }
    });
    return disabled;
  }

  //регистрация /отмена регистрации на сессию
  registrationForm = false;
  idDirection: number;
  IdDirection = IdDirection;
  activeTab: number = 0;
  hideRegistrInfo = false;

  treeListData = [];
  listSessions: Array<number>;

  openRegistationForm(idDirection: number) {
    this.idDirection = idDirection;
    this.registrationForm = !this.registrationForm;
  }

  closeRegistrationForm(event) {
    this.registrationForm = event;
    this.getData();
  }

  pagingChange() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  public openViewRegistrations(sessionInfo: SessionInfo, IdDirection: number): void {
    this.chooseSession = [{ ...sessionInfo, idDirection: IdDirection }];
    this.viewRegistrationsPopup = true;
  }

  public closeViewRegistrations(event): void {
    this.viewRegistrationsPopup = event;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
