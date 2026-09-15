/* eslint-disable */
import { OfferManagementService } from './../../core/services/offer-management-service.service';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  OnDestroy,
} from '@angular/core';
import { Subscription, Subject, interval } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { User } from '../../core/classes/user';
import { AppConfigService } from '../../app-config.service';
import { CommonService } from '../../core/services/common-service.service';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru-BY';
import localeEn from '@angular/common/locales/en-GB';
import { CatalogService } from 'src/app/core/services/catalog-service.service';
import { CookieService } from 'ngx-cookie-service';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import { AccreditedRoleService } from 'src/app/core/services/accredited-role.service';
import { SessionStorageService } from '../../shared/services/session-storage-service/session-storage.service';
import { LocalStorageService } from '../../shared/services/local-storage-service/local-storage.service';
import { PopupExportRequestListComponent } from './popups';
import { OrderManagementSignalRService } from '../../core/services/order-managment-socket.service';
import { SharedStateManagerService } from '../../core/services/shared-state-export.service';
import { filter, takeUntil } from 'rxjs/operators';
import { LANGUAGE, RU_LANG } from "../../core/constants";
import { applyDevExtremeLocale, initDevExtremeGlobalizeLocales } from '../../core/helpers';
import { formatTime } from './helpers';
import { SECONDS_IN_DAY } from './constants';

export type ButtonState = 'default' | 'success' | 'pending';
type MenuType = 'catalog' | 'sessions' | 'offers' | 'about' | null;
type SubMenuType = 'offersList' | 'archive' | 'sessionsNts' | null;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly cookieService = inject(CookieService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly config = inject(AppConfigService);
  private readonly socketService = inject(OrderManagementSignalRService);
  private readonly sharedStateExportservice = inject(SharedStateManagerService);

  public currentState: ButtonState = 'default';
  // условия для Ролей
  userInfoDropdown = false;
  authorized: boolean;
  isTrader: boolean;
  user: User;
  language = LANGUAGE;
  selectLang: string;

  @ViewChild('account') account: ElementRef;
  @ViewChild('catalog') catalog: ElementRef;
  @ViewChild('session') session: ElementRef;
  @ViewChild('subsession') subsession: ElementRef;
  @ViewChild('offers') offers: ElementRef;
  @ViewChild('suboffers') suboffers: ElementRef;
  @ViewChild('subArchive') subArchive: ElementRef;
  @ViewChild('popupExportRequestListcontainer', { read: ViewContainerRef })
  container!: ViewContainerRef;

  @ViewChild('deafultIconExport', { static: false })
  deafultIconExport!: TemplateRef<ElementRef>;

  @ViewChild('pendingIconExport', { static: false })
  pendingIconExport!: TemplateRef<ElementRef>;

  @ViewChild('successIconExport', { static: false })
  successIconExport!: TemplateRef<ElementRef>;

  public iconExportStatus: Record<string, TemplateRef<ElementRef>>;

  phonesActive: boolean;
  // часы
  time: any;
  locale: string;
  str: string;

  public today: Date = new Date();
  public formattedDate: string;
  public totalSeconds: number;
  public formattedTime: string;
  private translateSub: Subscription;

  sections: any;

  strLandingPage: string;
  strSessions: string;
  strSessionsTemplate: string;
  strModels: string;
  strRules: string;
  strAuctions: string;
  strPersonalPage: string;

  DemandOfferManagementGetPrivilegus: boolean = false; //привилегия отображения рапсисания сессий
  DemandOfferManagementEditPrivilegus: boolean = false;

  CompositeSesManNewPrivilegus: boolean = false; //привилегия отображения Управ.сессиями (нтс)
  CompositeSesManPrivilegus: boolean = false; //привилегия отображения Управ.сессиями (старое)

  DemandOfferManagementModelsGetPrivilegus: boolean = false; //привилегия отображения конструктора моделей
  DemandOfferManagementModelsEditPrivilegus: boolean = false;

  DemandOfferManagementRulesGetPrivilegus: boolean = false; //привилегия отображения конструктора правил
  DemandOfferManagementRulesEditPrivilegus: boolean = false;

  CompositeAdmissionPrivilegus: boolean = false;

  public isAccredited: boolean;

  activeMenu: MenuType = null;
  activeSubMenu: SubMenuType = null;

  private destroy$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    private router: Router,
    private commonService: CommonService,
    public catalogService: CatalogService,
    public offerManagementService: OfferManagementService,
    private createOfferService: CreateOfferService,
    private readonly accreditedRoleService: AccreditedRoleService
  ) {
    initDevExtremeGlobalizeLocales();

    translate.use(JSON.parse(localStorage?.getItem('lang')) || 'RU');
    this.locale = this.translate.currentLang;
    this.selectLang = this.language.find((el) => el.value == this.locale).name;

    if (JSON.parse(localStorage.getItem('lang')) === null) {
      localStorage.setItem(
        'lang',
        JSON.stringify(this.translate.defaultLang.toUpperCase())
      );
    }
    // don't forget to unsubscribe!
    this.translateSub = this.translate.onLangChange.subscribe(
      (langChangeEvent: LangChangeEvent) => {
        this.locale = langChangeEvent.lang;
      }
    );

    this.setServerTime();
    this.setLocaleLanguage(this.locale.toLowerCase());

    const cookieToken = this.cookieService.get('UasToken');
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    if (this.user.token !== cookieToken) {
      this.user.token = cookieToken;

      localStorage.setItem('user', JSON.stringify(this.user));
    }

    this.authorized = !!this.user.token;
    // this.authorized = false;  todo authorized
    if (this.authorized) {
      if (!this.user.userInfo) {
        this.commonService.GetFullData(this.user.token).then((res: any) => {
          this.user.userInfo = {
            firmName: res.headerInfo.nameFirm,
            traderFullName: res.headerInfo.fio,
            traderPhone: res.headerInfo.traderPhone,
            traderRegNum: res.headerInfo.regNumberTrader,
            validTo: res.headerInfo.validTo
          };
          // firmId: res.traderData.idFirm,
          localStorage.setItem(
            'privileges',
            JSON.stringify(res.privileges.privilegesList)
          );
        });
      }

      const UASLang = this.cookieService.get('UasLang');

      if (UASLang && this.locale != UASLang) {
        localStorage.setItem(
          'lang',
          JSON.stringify(UASLang.toString().toUpperCase())
        );
        translate.use(UASLang.toString().toUpperCase());
        this.locale = UASLang.toString();
        this.selectLang = this.language.find(
          (el) => el.value == this.locale
        ).name;
        this.setLocaleLanguage(this.locale.toLowerCase());
        parent.document.location.reload();
      }
      if (!this.cookieService.get('UasLang')) {
        this.cookieService.set('UasLang', this.locale.toUpperCase(), 24, '/');
      }
      this.commonService.HasWorkerRole(this.user.token).then((res: any) => {
        this.user.IsWorker = res;
        this.UserSetItem();
      });
    } else {
      this.user.IsWorker = false;
      this.UserSetItem();
      this.cookieService.set('UasLang', this.locale.toUpperCase(), 24, '/');
    }
  }

  toggleMenu(menu: MenuType) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
    this.activeSubMenu = null;
  }

  toggleSubMenu(menu: SubMenuType) {
    this.activeSubMenu = this.activeSubMenu === menu ? null : menu;
  }

  closeMenus() {
    this.activeMenu = null;
    this.activeSubMenu = null;
  }

  @HostListener('document:click')
  onOutsideClick() {
    this.closeMenus();
  }

  ngOnInit(): void {
    // Закрывать меню при любой навигации
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Only close if a menu is actually open
        if (this.activeMenu !== null) {
          this.closeMenus();
        }
      });

    this.iconExportStatus = {
      default: this.deafultIconExport,
      pending: this.pendingIconExport,
      success: this.successIconExport,
    };

    if (this.user?.token) {
      this.createOfferService
        .GetRole(this.user?.token)
        .subscribe((res: any) => {
          this.isAccredited = !!parseInt(res.role, 10);
          this.accreditedRoleService.setRole(res.role);
        });

      this.sharedStateExportservice.buttonState$.subscribe((state) => {
        this.currentState = state;
      });

      this.socketService.connect();

      this.socketService.filesExported$.subscribe((data) => {
        if (data) {
          this.sharedStateExportservice.updateState('success');
        }
      });
    }

    this.commonService.getSections(this.user?.token).subscribe((res) => {
      res.sections.splice(0, 1);
      this.sections = res.sections;
    });

    this.strLandingPage = `${this.config.domain}/landingpage`;
    this.strSessions = `${this.config.domain}${this.config.nts}/sessions/management#schedule`;
    this.strSessionsTemplate = `${this.config.domain}${this.config.nts}/sessions/management#templates`;
    this.strModels = `${this.config.domain}${this.config.nts}/demands/management#models`;
    this.strRules = `${this.config.domain}${this.config.nts}/demands/management#rules`;
    this.strAuctions = `${this.config.domain}${this.config.auctions}`;
    this.strPersonalPage =
      `${this.config.ppDomain}${this.config.ppRedirectUrl}?jwt=` +
      this.user?.token;

    if (this.user?.IsWorker) {
      this.checkPrivilegus();
    }
  }

  public enableRussianMessages(): void {
    applyDevExtremeLocale('ru');
    registerLocaleData(localeRu); //для перевода времени
  }

  public enableEnglishMessages(): void {
    applyDevExtremeLocale('en');
    registerLocaleData(localeEn); //для перевода времени
  }

  public setLocaleLanguage(language: string): void {
    if (language === RU_LANG) {
      this.enableRussianMessages();
    } else {
      this.enableEnglishMessages();
    }
  }

  public setServerTime(): void {
    this.commonService.getServerDatetime().subscribe((res: number) => {
      this.totalSeconds = Math.floor(res * SECONDS_IN_DAY);
      this.formattedTime = formatTime(this.totalSeconds);
    });

    const datePart: string = this.today.toLocaleDateString(this.locale, {
      timeZone: 'Europe/Minsk',
      day: 'numeric',
      month: 'long'
    });

    const weekdayPart: string = this.today.toLocaleDateString(this.locale, {
      timeZone: 'Europe/Minsk',
      weekday: 'short'
    });

    this.formattedDate = `${datePart}, ${weekdayPart}`;

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.totalSeconds > 0) {
          this.totalSeconds += 1;
          this.formattedTime = formatTime(this.totalSeconds);
        }
      });
  }

  UserSetItem() {
    localStorage.setItem('user', JSON.stringify(this.user));
    if (location.search.split('return=').length > 1) {
      //возвращении из авторизациии необходимо обнвить страницу
      window.location.href = location.pathname;
      sessionStorage.clear();
    }
  }

  public checkPrivilegus(): void {
    let DemandOfferManagementGetDesc = 'DemandOfferManagementGetList';
    this.DemandOfferManagementGetPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementGetDesc);
    let DemandOfferManagementEditDesc = 'DemandOfferManagementEditItem';
    this.DemandOfferManagementEditPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementEditDesc);
    let CompositeSesManNewDesc = 'CompositeSessionsManagementNew';
    this.CompositeSesManNewPrivilegus = this.commonService.checkPrivileges(
      CompositeSesManNewDesc
    );
    let CompositeSesManDesc = 'CompositeSessionsManagement';
    this.CompositeSesManPrivilegus =
      this.commonService.checkPrivileges(CompositeSesManDesc);
    let DemandOfferManagementModelsGetDesc =
      'DemandOfferManagementModelsGetList';
    this.DemandOfferManagementModelsGetPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementModelsGetDesc);
    let DemandOfferManagementModelsEditDesc =
      'DemandOfferManagementModelsEditItem';
    this.DemandOfferManagementModelsEditPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementModelsEditDesc);
    let DemandOfferManagementRulesGetDesc = 'DemandOfferManagementRulesGetList';
    this.DemandOfferManagementRulesGetPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementRulesGetDesc);
    let DemandOfferManagementRulesEditDesc =
      'DemandOfferManagementRulesEditItem';
    this.DemandOfferManagementRulesEditPrivilegus =
      this.commonService.checkPrivileges(DemandOfferManagementRulesEditDesc);
    let CompositeAdmissionDesc = 'CompositeAdmission';
    this.CompositeAdmissionPrivilegus = this.commonService.checkPrivileges(
      CompositeAdmissionDesc
    );
  }

  ngAfterViewInit(): void {
    this.iconExportStatus = {
      default: this.deafultIconExport,
      pending: this.pendingIconExport,
      success: this.successIconExport,
    };
  }

  changeLang(e: any) {
    this.selectLang = e.itemData.name;
    const lang = e.itemData.value;
    this.translate.use(lang.toUpperCase());
    localStorage.setItem('lang', JSON.stringify(lang.toUpperCase()));
    this.cookieService.set('UasLang', lang.toUpperCase(), 24, '/');
    if (this.user?.token) {
      const body = {
        language: lang,
      };
      this.commonService
        .SetPreferredLanguage(this.user?.token, body)
        .then((res: any) => {
          this.setLocaleLanguage(lang.toLowerCase());
          parent.document.location.reload();
        });
    } else {
      this.setLocaleLanguage(lang.toLowerCase());
      parent.document.location.reload();
    }
  }

  goToMain(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      return;
    }

    event.preventDefault();
    this.router
      .navigate([`/`], { skipLocationChange: true })
      .then(() => (window.location.href = this.strLandingPage));
  }

  gotoAuctions(event: MouseEvent) {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      return;
    }

    event.preventDefault();
    this.router
      .navigate([`/`], { skipLocationChange: true })
      .then(() => (window.location.href = this.strAuctions));
  }

  get personalPageUrl(): string {
    return (
      this.strPersonalPage +
      '&page=index&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get personalPageAdmissionUrl(): string {
    return (
      this.strPersonalPage +
      '&page=admission&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get personalPageCatalogueUrl(): string {
    return (
      this.strPersonalPage +
      '&page=catalogue&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get getPersonalPageNotifyingUrl(): string {
    return (
      this.strPersonalPage +
      '&page=notification&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  get personalPageSessionManageUrl(): string {
    return (
      this.strPersonalPage +
      '&page=session&lang=' +
      this.cookieService.get('UasLang')
    );
  }

  public goRouterNavigation(event: MouseEvent, str: string): void {
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      return;
    }
    event.preventDefault();
    this.router.navigate([`/${str}`]);
  }

  public getLocation(path: string): boolean {
    return window.location.pathname.includes(path);
  }

  public showExportedList(event: Event): void {
    event.stopPropagation();
    this.container.clear();
    this.container.createComponent(PopupExportRequestListComponent);
    this.sharedStateExportservice.updateState('default');
  }

  public clearFilters(): void { //при переходе на другую секцию сбрасываем все фильтры (по аналогии с другими разделами)
    sessionStorage.removeItem('OFFER_MANAGEMENT');
  }

  public loginUAS(): void {
    if (!this.authorized) {
      const lang = this.cookieService.get('UasLang').toLowerCase();
      const returnurl = document.location.href.replace(/\//g, '%2F');
      const encodedReturnUrl = encodeURIComponent(returnurl);

      const str = `${this.config.uas_front}/ppts/false/${lang}/token;returnUrl=${encodedReturnUrl};errorUrl=null`;
      window.location.href = str;
    } else {
      this.userInfoDropdown = !this.userInfoDropdown;
    }
  }

  public logOut(): void {
    const token = this.user?.token;

    this.authorized = false;
    this.userInfoDropdown = false;

    this.commonService.logOut(token).subscribe(() => {
      this.cookieService.delete('UasToken', '/');
      this.cookieService.delete('UasMessage', '/');
      this.cookieService.delete('UasLang', '/');
      this.sessionStorageService.clearSessionStorage();
      this.localStorageService.cleanLocalStorageFieldsAfterLogOut();

      window.location.href = `${this.config.domain}/landingpage`;
    });
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.translateSub?.unsubscribe();
  }
}
