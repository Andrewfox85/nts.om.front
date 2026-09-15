/* eslint-disable */
import { FiltersComponent } from './../../sub_components/filters/filters.component';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  IdDirection,
  searchIcon,
  statusSession,
  role,
  depositType
} from 'src/app/api.constants';
import { ActivatedRoute } from '@angular/router';
import { CatalogService } from 'src/app/core/services/catalog-service.service';
import { User } from 'src/app/core/classes/user';
import { PageCache } from 'src/app/core/classes/PageCache';
import { TranslateService } from '@ngx-translate/core';
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';
import { createStore } from 'devextreme-aspnet-data-nojquery';
import DataSource from 'devextreme/data/data_source';
import { numberEntriesPage, sectionID } from '../../api.constants';
import Tooltip from 'devextreme/ui/tooltip';
import { DxTooltipComponent, DxTextBoxComponent, DxDataGridComponent } from 'devextreme-angular';
import { Router } from '@angular/router';
import { CreateOfferService } from '../../core/services/create-offer-service.service';
import { OfferManagementService } from '../../core/services/offer-management-service.service';
import { CommonService } from '../../core/services/common-service.service';
import { AccreditedRoleService } from 'src/app/core/services/accredited-role.service';
import { catchError, filter, take } from 'rxjs/operators';
import { EMPTY, Subscription, tap } from 'rxjs';
import { Good } from 'src/app/core/interfaces/interface';
import { SharedStateManagerService } from '../../core/services/shared-state-export.service';
import DevExpress from 'devextreme';
import RowPreparedEvent = DevExpress.ui.dxDataGrid.RowPreparedEvent;
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { DepositTypeResponse, DepositDetailsResponse } from "../../core/interfaces";
import { CookieService } from 'ngx-cookie-service';
import { SECTIONS_TYPES } from "../../sub_components/header/enums";
@Component({
  selector: 'app-catalogs',
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss'],
})
export class CatalogsComponent implements OnInit, OnDestroy {
  @ViewChild(FiltersComponent)
  filtersComponent: FiltersComponent;

  @ViewChild(DxTooltipComponent) tooltip: DxTooltipComponent;

  private readonly sharedStateExportService = inject(SharedStateManagerService);

  // catalog: []
  user: User;
  searchIcon: any = searchIcon;
  search: string;
  popupForm = false;
  direction: number;
  globalSearchRes: any = [];
  popupTitle: string;
  sessionId: number;
  sectionId: number;
  role: any;
  UserRole: number;

  cache = {} as PageCache;

  idOffer: number;
  catalog: any;
  dataGrid: any;
  currentPage: number = 1;
  pageSize: number = 10;
  numberEntriesPage = numberEntriesPage;

  public readonly sectionID = sectionID;

  //для уведомления о выгрузке данных
  isVisible: boolean = false;
  type = 'info';
  position = 'top center';
  width = '290';
  height = '52';
  message: string = (this.translate.store.currentLang == 'RU'
    ? RU['worker'].succsessfulUnloadData
    : EN['worker'].succsessfulUnloadData
  ).replace(/\n\r?/g, '<br />');
  popup = false; //popup окно
  popupMessage: string; //текст в попапе
  popupType: string; //тип сообщения

  popupSuccess = false; //успешно завершено
  popupSuccessMess: string;

  offerData: any;

  idDirection: number;
  //регистрация /отмена регистрации на сессию
  registrationForm = false;

  sections = [];

  firstTime = true; //когда перешли из расписания сессии
  detailsDepositOffer: any; //депозит по заявке
  depositPopup: boolean = false; //просмотр задатка по заявке
  depositPopupTitle: string;
  depositRowData: any;
  depositType: number;
  currentTemplateTooltip: string;

  sessionStorageKey: string;

  private roleSubscription: Subscription;
  public isAccredited: boolean;
  chooseTheWay: boolean = false;

  inputName;

  public readonly IdDirection = IdDirection;
  public readonly depositTypeEnum = depositType;
  @ViewChild('dataCatalog', { static: false }) dataGridComponent!: DxDataGridComponent;


  get filtersOn(): Record<string, string> {
    const baseFilters = {
      hideFilters: 'hideFilters',
      sections: 'sections',
      dateFrom: 'dateFrom',
      dateTo: 'dateTo',
      bidding: 'bidding',
      preparation: 'preparation',
      sessionStage: 'sessionStage',
      marketType: 'marketType',
      session: 'session',
      lotNumber: 'lotNumber',
      nomenclatureGroup: 'nomenclatureGroup',
      goodsGroup: 'goodsGroup',
      goods: 'goods',
      refs: 'refs',
      price: 'price',
      currency: 'currency',
      quantity: 'quantity',
      units: 'units',
      termsPayment: 'termsPayment',
      termsDeliveryTime: 'termsDeliveryTime',
      multibasis: 'multibasis',
      ...(this.user?.token && !this.user?.IsWorker && {
          isMyDemandOffer: 'isMyDemandOffer'
        }),
    };

    const analogFilters =
      this.direction === IdDirection.buy
        ? {
            analogsCatalog: 'analogsCatalog',
          }
        : {};

    return {
      ...baseFilters,
      ...analogFilters,
    };
  }

  constructor(
    private route: ActivatedRoute,
    public catalogService: CatalogService,
    public translate: TranslateService,
    public router: Router,
    private createOfferService: CreateOfferService,
    public offerManagementService: OfferManagementService,
    public commonService: CommonService,
    private readonly accreditedRoleService: AccreditedRoleService,
    private pageMeta: PageMetaService,
    private cookieService: CookieService
  ) {
    this.setBrowserTabInfo();
  }

  private updatePopupTitle() {
    this.popupTitle =
      this.direction == IdDirection.buy
        ? this.translate.store.currentLang == 'RU'
          ? RU['catalogs'].searchByDemandCatalog
          : EN['catalogs'].searchByDemandCatalog
        : this.translate.store.currentLang == 'RU'
        ? RU['catalogs'].searchByOffersCatalog
        : EN['catalogs'].searchByOffersCatalog;
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
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
        });
    }
    // this.cache = JSON.parse(sessionStorage.getItem('CATALOG')) || {};
    this.isAccredited = !!parseInt(this.accreditedRoleService.getRole(), 10);

    this.route.queryParams.subscribe((params) => {
      const directionFromUrl = Number(params['direction']);

      if (!directionFromUrl) {
        return;
      }

      if (this.direction !== directionFromUrl) {
        this.direction = directionFromUrl;
        this.handleDirectionChange();
      }
    });

    this.commonService.getSections(this.user?.token).subscribe((res) => {
      this.sections = res.sections;
    });
  }

  private handleDirectionChange(): void {
    this.sessionStorageKey =
      this.direction === IdDirection.buy
        ? 'CATALOG_BUY'
        : 'CATALOG_SALE';

    const cacheFromStorage = sessionStorage.getItem(this.sessionStorageKey);

    if (cacheFromStorage) {
      // F5 или повторный заход
      this.cache = JSON.parse(cacheFromStorage);

      this.sectionId = this.catalogService.sectionId || this.cache?.filters?.sections;
      this.sessionId = this.catalogService.sessionId || this.cache?.filters?.session;

    } else {
      // новый tab или direction изменился
      //this.cache.filters = {};

      this.sectionId = null;
      this.sessionId = null;

      sessionStorage.setItem(
        this.sessionStorageKey,
        JSON.stringify(this.cache)
      );
    }
    this.updatePopupTitle();
    this.setBrowserTabInfo(this.sessionId);
    this.getData();
  }

  getInstance(e: { component: DxTextBoxComponent }): void {
    this.inputName = e.component;
  }

  setFocus(): void {
    this.inputName.focus();
  }

  getData() {
    sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.cache));
    //this.filtersComponent.enableFilters()

    let filterListGoods = this.cache?.filters?.goods || [];
    let filterListPropertyStr = this.cache?.filters?.refsStr || [];
    let filterListPropertyInt = this.cache?.filters?.refsInt || [];
    let filterListPaymentType = this.cache?.filters?.termsPayment || [];
    let filterListDelivBasis = this.cache?.filters?.termsDeliveryTime || [];

    const filters = {
      FilterSessionId: this.cache?.filters?.session || null,
      // "FilterSessionStatus": null, //??
      FilterSessionStage: this.cache?.filters?.sessionStage || null,
      FilterSessionDateFrom: this.cache?.filters?.dateFrom || null,
      FilterSessionDateTo: this.cache?.filters?.dateTo || null,
      FilterLotNumber: this.cache?.filters?.lotNumber || null,
      FilterMarketType: this.cache?.filters?.marketType || null,
      //  "FilterGroupNomen": this.cache?.filters?.nomenclatureGroup || null,
      //  "FilterGroupGood": this.cache?.filters?.goodsGroup || null,
      FilterVolumeIdUnit: this.cache?.filters?.units || null,
      FilterValueFrom: this.cache?.filters?.quantityFrom || null,
      FilterValueTo: this.cache?.filters?.quantityTo || null,
      FilterPriceIdCurrency: this.cache?.filters?.currency || null,
      FilterPriceFrom: this.cache?.filters?.priceFrom || null,
      FilterPriceTo: this.cache?.filters?.priceTo || null,
      FilterIsMultibasis: this.cache?.filters?.multibasis, // true/false
      FilterIsAnalogs: this.cache?.filters?.analogsCatalog, // true/false
      FilterIsMyOnly: this.cache?.filters?.isMyDemandOffer, // true/false
      CurrentPageNumber: this.currentPage,
      RowsPerPage: this.pageSize,
    };

    if (this.cache.filters?.sections) {
      this.catalog = createStore(
        this.catalogService.GetListOffersCatalogue(
          this.user?.token,
          this.direction,
          this.cache.filters.sections,
          filters,
          filterListGoods,
          filterListPropertyStr,
          filterListPropertyInt,
          filterListPaymentType,
          filterListDelivBasis
        )
      );
    } else {
      this.catalog = null;
    }

    this.roleSubscription = this.accreditedRoleService.role$
      .pipe(
        filter((role) => role !== '' && role !== '0'),
        take(1),
        catchError(() => EMPTY)
      )
      .subscribe((role) => {
        if (role && this.catalog) {
          this.dataGrid = new DataSource({
            store: this.catalog,
            filter: this.filterSessionStatus,
          });
        }
      });

    if (this.catalog) {
      if ([SECTIONS_TYPES.AGRI, SECTIONS_TYPES.PERSPECTIVE].includes(this.cache.filters?.sections)) {
        this.catalog.load().then((data) => {
          const hasGoodDestinationData: boolean = data.some(item =>
            item.goods?.some(good => good.destinations != null)
          );
          this.hideGoodDestinationColumn(hasGoodDestinationData);
        });
      } else {  //для остальных секций скрываем колонку
        this.hideGoodDestinationColumn(false);
      }
      this.dataGrid = new DataSource({
        store: this.catalog,
        filter: this.filterSessionStatus,
      });
    }
  }

  private hideGoodDestinationColumn(optionValue: boolean): void {
    if (this.dataGridComponent && this.dataGridComponent.instance) {
      this.dataGridComponent.instance.columnOption('destinations', 'visible', optionValue);
      this.dataGridComponent.instance.columnOption('destinations', 'showInColumnChooser', optionValue);
    }
  }

  getNumber(value) {
    return Number(value);
  }

  //вывод полного кол-ва заявок
  totalCount() {
    let items = this.dataGrid.items();
    return items[0]?.totalCnt;
  }

  onChangePage(e) {
    this.currentPage = e;
    this.getData();
  }

  onChangePageSize(e) {
    this.pageSize = e;
    this.getData();
  }

  //получаем результат поиска
  globalSearch() {
    this.catalogService
      .GetGlobalSearchResults(this.user?.token, this.search)
      .then((res: any) => {
        this.globalSearchRes = res.searchFilterRefs;
      });
  }

  //переносим результат поиска в фильтры и отрисовываем грид
  searchLink(
    idSection: number,
    idNomenGroup: number,
    idGoodGroup?: number,
    idGoodName?: number
  ) {
    this.cache.filters.sections = idSection;
    this.cache.filters.nomenclatureGroup = idNomenGroup;
    this.cache.filters.goodsGroup = idGoodGroup ? idGoodGroup : null;
    this.cache.filters.goods = idGoodName ? [idGoodName] : null;
    this.cache.filters.refsStr = [idNomenGroup].concat(-2);

    if (idGoodGroup) {
      this.cache.filters.refsStr = this.cache.filters.refsStr.concat(
        [idGoodGroup].concat(-3)
      );
    }
    if (idGoodName) {
      this.cache.filters.refsStr = this.cache.filters.refsStr.concat(
        [idGoodName].concat(-4)
      );
    }
    this.popupForm = false;
    sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.cache));
    this.filtersComponent.enableFilters();
    this.getData();
  }

  onContextMenuPreparing(e: any) {
    if (e.row.rowType != 'header') {
      if (!e.items) e.items = [];
      if (!this.user?.token) {
        e.items.push({
          icon: './assets/img/icons/sessionOffer.svg',
          text:
            this.translate.store.currentLang == 'RU'
              ? RU['catalogs'].viewApplication
              : EN['catalogs'].viewApplication,
          onItemClick: () => {
            this.createOfferService.idOffer = e.row.data.idDemandOffer;
            this.createOfferService.direction = this.direction;
            this.createOfferService.isArchive = false;
            this.createOfferService.unsold = false;
            this.createOfferService.modelResult = {
              isAllowedAnalogues: this.offerData?.isAllowAnalogs,
            };
            this.router.navigateByUrl('/view-offer');
          },
        });
      }
      if (this.user?.IsWorker) {
        e.items.push(
          {
            icon: './assets/img/icons/sessionOffer.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].viewApplication
                : EN['catalogs'].viewApplication,
            onItemClick: () => {
              this.createOfferService.idOffer = e.row.data.idDemandOffer;
              this.createOfferService.direction = this.direction;
              this.createOfferService.isArchive = false;
              this.createOfferService.unsold = false;
              this.createOfferService.modelResult = {
                isAllowedAnalogues: this.offerData?.isAllowAnalogs,
              };
              this.router.navigateByUrl('/view-offer');
            },
          },
          {
            icon: './assets/img/icons/applicationManagment.svg',
            text:
              this.translate.store.currentLang == 'RU'
                ? RU['catalogs'].goToApplicationManagement
                : EN['catalogs'].goToApplicationManagement,
            onItemClick: () => {
              this.offerManagementService.sessionId = e.row.data.sessionId;
              this.offerManagementService.sectionId = this.cache.filters.sections;
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
          }
        );
      } else {
        if (
          !!this.user.token &&
          !!parseInt(this.accreditedRoleService.getRole(), 10)
        ) {
          this.idOffer = e.row.data.idDemandOffer;
          this.offerData = e.row.data;
          e.items.push(
            {
              icon: './assets/img/icons/sessionOffer.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['catalogs'].viewApplication
                  : EN['catalogs'].viewApplication,
              onItemClick: () => {
                this.createOfferService.idOffer = e.row.data.idDemandOffer;
                this.createOfferService.direction = this.direction;
                this.createOfferService.isArchive = false;
                this.createOfferService.unsold = false;
                this.createOfferService.modelResult = {
                  isAllowedAnalogues: this.offerData?.isAllowAnalogs,
                };
                this.router.navigateByUrl('/view-offer');
              },
            },
            {
              icon: './assets/img/icons/edit.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['catalogs'].editApplication
                  : EN['catalogs'].editApplication,
              disabled: !this.offerData.isCanEdit,
              onItemClick: () => {
                this.popup = true;
                this.popupTitle =
                  this.translate.store.currentLang == 'RU'
                    ? RU['catalogs'].editApplication
                    : EN['catalogs'].editApplication;
                this.popupMessage =
                  this.translate.store.currentLang == 'RU'
                    ? RU['viewOffer'].wantToApply
                    : EN['viewOffer'].wantToApply;
                this.popupMessage = this.popupMessage.replace(
                  /\n\r?/g,
                  '<br />'
                );
                this.popupType = 'edit';
              },
            },
            {
              icon: './assets/img/icons/cancel.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['catalogs'].cancelApplication
                  : EN['catalogs'].cancelApplication,
              disabled: !this.offerData.isCanCancel,
              onItemClick: () => {
                this.popup = true;
                this.popupTitle =
                  this.translate.store.currentLang == 'RU'
                    ? RU['btns'].cancelApplication
                    : EN['btns'].cancelApplication;
                this.popupMessage =
                  this.translate.store.currentLang == 'RU'
                    ? RU['viewOffer'].wantToCancel
                    : EN['viewOffer'].wantToCancel;
                this.popupMessage = this.popupMessage.replace(
                  /\n\r?/g,
                  '<br />'
                );
                this.popupType = 'cancel';
              },
            },
            {
              icon: './assets/img/icons/buyer_registr.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].registrBuyer
                  : EN['sessions-schedule'].registrBuyer,
              disabled: !this.offerData?.isCanRegisterAsBuyer,
              onItemClick: () => {
                this.offerData.sectionId = this.cache.filters.sections;
                this.openRegistationForm(IdDirection.buy);
              },
            },
            {
              icon: './assets/img/icons/seller_registr.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].registrSaller
                  : EN['sessions-schedule'].registrSaller,
              disabled: !this.offerData?.isCanRegisterAsSeller,
              onItemClick: () => {
                this.offerData.sectionId = this.cache.filters.sections;
                this.openRegistationForm(IdDirection.sale);
              },
            },
            {
              icon: './assets/img/icons/apply_buy.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].applyBuy
                  : EN['sessions-schedule'].applyBuy,
              disabled: !this.offerData.isCanSetDemand,
              onItemClick: () => {
                this.createOfferService.idOffer = null;
                this.createOfferService.isMine = false;
                this.createOfferService.isCreateCopy = false;
                this.createOfferService.sessionName = e.row.data.sessionName;
                this.createOfferService.sessionId = e.row.data.sessionId;
                this.createOfferService.sessionDateTime =
                  e.row.data.sessionDateTimeBegin;
                this.createOfferService.sectionId = this.cache.filters.sections;
                this.createOfferService.sectionName = this.sections.find(
                  (el) => el.id == this.cache.filters.sections
                ).name;
                this.createOfferService.direction = IdDirection.buy;
                this.chooseTheWay = true;
              },
            },
            {
              icon: './assets/img/icons/apply_sale.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].applySale
                  : EN['sessions-schedule'].applySale,
              disabled: !this.offerData.isCanSetOffer,
              onItemClick: () => {
                this.createOfferService.idOffer = null;
                this.createOfferService.isMine = false;
                this.createOfferService.isCreateCopy = false;
                this.createOfferService.sessionName = e.row.data.sessionName;
                this.createOfferService.sessionId = e.row.data.sessionId;
                this.createOfferService.sessionDateTime =
                  e.row.data.sessionDateTimeBegin;
                this.createOfferService.sectionId = this.cache.filters.sections;
                this.createOfferService.sectionName = this.sections.find(
                  (el) => el.id == this.cache.filters.sections
                ).name;
                this.createOfferService.direction = IdDirection.sale;
                this.chooseTheWay = true;
              },
            },
            {
              icon: './assets/img/icons/createCopy.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['viewOffer'].createCopyApplication
                  : EN['viewOffer'].createCopyApplication,
              disabled: !this.offerData.isCanClone,
              onItemClick: () => {
                this.onPopupSubmit('createCopy');
              }
            },
            {
              icon: './assets/img/icons/sessionDeposit.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['offer-management'].offerDeposit
                  : EN['offer-management'].offerDeposit,
              disabled: !this.offerData.isCanCalculateDeposit,
              onItemClick: () => {
                this.depositPopup = true;
                let str =
                  this.translate.store.currentLang == 'RU'
                    ? RU['offer-management'].offerDepositInfo
                    : EN['offer-management'].offerDepositInfo;
                this.depositPopupTitle = str + e.row.data.lotNumber;
                this.depositRowData = e.row.data;
                this.getDetailDepositOffer(this.depositRowData);
              },
            },
            {
              icon: './assets/img/icons/sessionDeposit.svg',
              text:
                this.translate.store.currentLang == 'RU'
                  ? RU['sessions-schedule'].viewInformationDeposit
                  : EN['sessions-schedule'].viewInformationDeposit,
              disabled: e.row.data.sessionStageId == 1,
              onItemClick: () => {
                if (
                  this.UserRole == role.broker ||
                  this.UserRole == role.brokerVisitor
                ) {
                  this.router.navigateByUrl('/deposit');
                  this.offerManagementService.sectionId =
                    this.cache.filters.sections;
                  this.offerManagementService.sessionForDeposit =
                    this.offerData;
                } else {
                  this.checkDepositType();
                }
              },
            }
          );
        }
        // else {
        //   e.items.push({
        //     icon: './assets/img/icons/sessionOffer.svg',
        //     text:
        //       this.translate.store.currentLang == 'RU'
        //         ? RU['catalogs'].viewApplication
        //         : EN['catalogs'].viewApplication,
        //     onItemClick: () => {
        //       this.createOfferService.idOffer = e.row.data.idDemandOffer;
        //       this.createOfferService.direction = this.direction;
        //       this.createOfferService.isArchive = false;
        //       this.createOfferService.unsold = false;
        //       this.router.navigateByUrl('/view-offer');
        //     },
        //   });
        // }
      }
    }
  }

  closeChooseTheWay(event) {
    this.chooseTheWay = event;
  }

  getDetailDepositOffer(data: any) {
    this.offerManagementService
      .depositDetailsOffer(
        this.direction,
        this.sectionId,
        data.sessionId,
        data.idDemandOffer
      )
      .subscribe((res: DepositDetailsResponse) => {
        this.detailsDepositOffer = res.detailsList[0];
      });
  }

  checkDepositType() {
    // this.offerManagementService.GetFirmDepositType(this.user?.token, this.user?.userInfo?.firmId).then((res: any) => {
    this.offerManagementService
      .getFirmDepositType()
      .subscribe((res: DepositTypeResponse) => {
        this.depositType = res.depositType;
        if (this.depositType == this.depositTypeEnum.withoutDeposit) {
          this.isVisible = true;
          this.type = 'error';
          this.width = '320';
          this.height = '72';
          this.message = (
            this.translate.store.currentLang == 'RU'
              ? RU['deposit'].withoutDeposit
              : EN['deposit'].withoutDeposit
          ).replace(/\n\r?/g, '<br />');
        } else {
          this.router.navigateByUrl('/deposit');
          this.offerManagementService.sectionId = this.cache.filters.sections;
          this.offerManagementService.sessionForDeposit = this.offerData;
        }
      });
  }

  openRegistationForm(idDirection: number) {
    this.idDirection = idDirection;
    this.registrationForm = !this.registrationForm;
  }

  closeRegistrationForm(event) {
    this.registrationForm = event;
    this.getData();
  }

  onRowPrepared(e: RowPreparedEvent) {
    if (e.rowType !== 'data' || !e.data?.isMyDemandOffer) {
      return;
    }

    const rowEl: HTMLElement =
      e.rowElement instanceof HTMLElement
        ? e.rowElement
        : (e.rowElement as any)?.get?.(0);

    if (!rowEl) return;

    rowEl.querySelectorAll('td').forEach((td) => {
      td.style.setProperty('color', 'green', 'important');
      td.style.setProperty('font-weight', '500', 'important');
    });
  }

  //для тултипа "многобазисный лот"
  onCellPrepared(e) {
    const container = document.createElement('div');
    e.cellElement.appendChild(container);
    if (
      e.rowType === 'data' &&
      e.column.dataField === 'conditionsDelivery' &&
      e.data.isMultibasis == true
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

            this.currentTemplateTooltip = multipleLot + '<br>' + e.data.concatedConditionsDelivery;
          }
          const label = document.createElement('div');
          label.innerHTML = this.currentTemplateTooltip;
          content.appendChild(label);
        },
      });
    }
  }

  filterSessionStatus: any;

  getFilterData(e?: any) {
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

    //  if (this.firstTime) {
    // //   //когда переходим из расписания сессий
    //    this.firstTime = false;
    // //   this.cache.filters.sections = this.sectionId;
    // //   this.cache.filters.session = this.sessionId;
    // //   sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.cache));
    //    this.filtersComponent.enableFilters();
    //  }
    this.setBrowserTabInfo(this.cache.filters.session);
    this.getData();

    localStorage.removeItem('catalogFilter');

    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  onExporting() {
    this.sharedStateExportService.updateState('pending');
    const filters = {
      idDirection: this.direction,
      idSection: this.cache.filters.sections,
      searchString: '',
      filterSessionId: this.cache?.filters?.session || null,
      filterSessionStatus: null, //??
      filterSessionStage: this.cache?.filters?.sessionStage || null,
      filterSessionDateFrom: this.cache?.filters?.dateFrom || null,
      filterSessionDateTo: this.cache?.filters?.dateTo || null,
      filterLotNumber: this.cache?.filters?.lotNumber || null,
      filterMarketType: this.cache?.filters?.marketType || null, // ??
      filterListPropertyStr: this.cache?.filters?.refsStr || [],
      filterListPropertyInt: this.cache?.filters?.refsInt || [],
      filterVolumeIdUnit: this.cache?.filters?.units || null,
      filterValueFrom: this.cache?.filters?.quantityFrom || null,
      filterValueTo: this.cache?.filters?.quantityTo || null,
      filterPriceIdCurrency: this.cache?.filters?.currency || null,
      filterPriceFrom: this.cache?.filters?.priceTo || null,
      filterPriceTo: this.cache?.filters?.priceFrom || null,
      filterListPaymentType: this.cache?.filters?.termsPayment || [],
      filterListDelivBasis: this.cache?.filters?.termsDeliveryTime || [],
      filterIsMultibasis: this.cache?.filters?.multibasis, // true/false
    };

    this.catalogService
      .RequestExportCatSellers(this.user?.token, filters)
      .then((res: any) => {
        this.isVisible = true;
      });
  }

  onPopupSubmit(type) {
    switch (type) {
      case 'edit':
      case 'createCopy': {
        this.createOfferService
          .GetWorkerOfferFullInfo(
            this.user?.token,
            this.idOffer,
            this.direction
          )
          .then((res: any) => {
            this.createOfferService.idOffer = this.idOffer;
            this.createOfferService.isMine = type === 'edit' ? false : this.offerData.isMyDemandOffer;
            this.createOfferService.isCreateCopy = type === 'createCopy';
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

        /*   this.createOfferService.idOffer = this.idOffer;
           this.createOfferService.sessionName = this.offerData.sessionName;
        //   this.createOfferService.sectionName = this.offerData.sectionName;
           this.createOfferService.sessionDateTime = this.offerData.sessionDateTimeBegin;
           this.createOfferService.sessionId = this.offerData.sessionId;
           this.createOfferService.sectionId = this.cache.filters.sections;
         //  this.createOfferService.modelId = this.offerGeneral.idModel;
           this.createOfferService.choosenMarketType = this.offerData.offerMarketTypes;
         //  this.createOfferService.direction = this.offerGeneral.directionId;
         //  this.createOfferService.modelResult = {
            /!* pricingTypeId: this.offerGeneral.pricingTypeId,
             isAllowedFilesPrivate: this.offerGeneral.isAllowedFilesPrivate,
             isAllowedFilesPublic: this.offerGeneral.isAllowedFilesPublic
           };*!/
           this.router.navigateByUrl('/createOffer')*/
        break;
      }
      case 'cancel': {
        const body = {
          idDirection: this.direction,
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
    }
  }

  trackByGoodId(index: number, good: Good): number {
    return good.goodId;
  }

  onClose() {
    this.popup = false;

    if (this.popupSuccess) {
      this.getData();
    }
    this.popupSuccess = false;
  }

  ngOnDestroy(): void {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
  }

  private setBrowserTabInfo(session?: number): void {
    let CATALOGUE = 'Title';

    switch (this.direction) {
      case IdDirection.buy: {
        CATALOGUE =
          this.translate.store.currentLang === 'RU'
            ? RU['catalogs'].demandCatalog
            : EN['catalogs'].demandCatalog;
        break;
      }

      case IdDirection.sale: {
        CATALOGUE =
          this.translate.store.currentLang === 'RU'
            ? RU['catalogs'].offersCatalog
            : EN['catalogs'].offersCatalog;
        break;
      }
    }
    const faviconUrl = 'assets/img/icons/offer-managment.svg';

    this.pageMeta.setPageMeta(
      session,
      CATALOGUE,
      faviconUrl
    );
  }
}
