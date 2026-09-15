/* eslint-disable */
import { CommonService } from 'src/app/core/services/common-service.service';
import { CatalogService } from './../../core/services/catalog-service.service';
import { OfferManagementService } from './../../core/services/offer-management-service.service';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PageCache } from 'src/app/core/classes/PageCache';
import { sessionStage } from 'src/app/api.constants';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/core/classes/user';
import { OpenAccessPopupComponent } from './open-access-popup/open-access-popup.component';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import {
  RegulationPermissResponse,
  Permission,
  OffersDetailsResponse,
  OfferDetail,
} from "../../core/interfaces";
import { GetByNameResponse } from './../../core/services/catalog-service.service';

@Component({
  selector: 'app-open-access',
  templateUrl: './open-access.component.html',
  styleUrls: ['./open-access.component.scss'],
})
export class OpenAccessComponent implements OnInit, OnDestroy {
  public user: User;
  public cache = {} as PageCache;
  public sessionId: number;
  public sessionInfo: any;
  public sessionStage = sessionStage;
  public nameSessionStage: string;
  public currentTimeDate: Date;
  public listOfPermissions: Permission[] = [];
  public noDataText: string;
  public accessPopup: boolean = false;
  public viewOffersPopup: boolean = false;
  public offersDetails: OfferDetail[];
  public successPopup: boolean = false; //успешное открытиe доступа
  public message: string = ' ';
  public isVisibleToast: boolean = false;
  public sessionData: any;

  @ViewChild(OpenAccessPopupComponent)
  openAccessPopupComponent: OpenAccessPopupComponent;

  constructor(
    public translate: TranslateService,
    private offerManagementService: OfferManagementService,
    private catalogService: CatalogService,
    private pageMeta: PageMetaService,
    private commonService: CommonService
  ) {}

  public ngOnInit(): void {
    this.noDataText = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'openAccess.noTableData'
    );
    this.cache = JSON.parse(sessionStorage.getItem('OFFER_MANAGEMENT')) || null;
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    //информация о сессии

    let sectionId: number;

    if (this.cache) {
      sectionId = this.cache.filters.sections;
      this.sessionId = this.cache.filters.session;
    } else {
      // пришли с торгов
      const sessionIds = JSON.parse(
        sessionStorage.getItem('permissions_sessionIds')
      );
      sectionId = sessionIds?.sectionId;
      this.sessionId = sessionIds?.sessionId;
    }

    const OPEN_ACCESS_TITLE = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'openAccess.openAccess'
    );
    const faviconUrl = 'assets/img/icons/part-openaccess.svg';
    this.pageMeta.setPageMeta(this.sessionId, OPEN_ACCESS_TITLE, faviconUrl);

    this.catalogService
      .getDxGrid(this.user?.token, sectionId)
      .subscribe((res) => {
        this.sessionData = res.data;
        this.sessionData = this.sessionData.filter(
          (el) => el.id === this.sessionId
        );
        let sessionNames = [];

        this.catalogService
          .getByName(this.user?.token, 'sessionnames', sectionId)
          .subscribe((res: GetByNameResponse) => {
            sessionNames = res.refbooks;
            sessionNames.forEach((i) => {
              if (i.id == this.sessionData[0].sessionNameId) {
                this.sessionData[0].sessionName = i.name;
              }
            });
            this.sessionInfo = this.sessionData[0];
            this.nameSessionStage = this.commonService.choosenSessionStage(
              Number(this.sessionInfo?.stageId),
              this.user?.IsWorker,
              this.translate.store.currentLang
            );
            this.getData();
          });
      });
  }

  public getData(): void {
    this.currentTimeDate = new Date();
    this.offerManagementService
      .getOutRegulationPermiss(
        this.sessionInfo?.tradeSectionId,
        this.sessionInfo?.id
      )
      .subscribe((res: RegulationPermissResponse) => {
        this.listOfPermissions = res.permissions;
      });
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

  //просмотр заявок
  public openViewOffersPopup(id: number): void {
    this.viewOffersPopup = true;
    this.offerManagementService
      .getOutRegulationDetails(id)
      .subscribe((res: OffersDetailsResponse) => {
        this.offersDetails = res.offersDetails;
      });
  }

  //удаление разрешения
  public deleteOutRegulationPermiss(id: number): void {
    const body = {
      idPermission: id,
    };
    this.offerManagementService
      .deleteOutRegulationPermiss(body)
      .subscribe(() => {
        this.message = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'openAccess.successDeleteMessage'
        );
        this.isVisibleToast = true;
        this.getData();
      });
  }

  //повторное уведомление
  public setOutRegulationNotice(id: number): void {
    const body = {
      idPermission: id,
    };
    this.offerManagementService
      .setOutRegulationNotice(body)
      .subscribe(() => {
        this.message = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'openAccess.successNoteMessage'
        );
        this.isVisibleToast = true;
        this.getData();
      });
  }

  public ngOnDestroy(): void {
    sessionStorage.removeItem('permissions_sessionIds');
  }
}
