/* eslint-disable */
import { OpenAccessComponent } from './../open-access.component';
import { WorkerService } from './../../../core/services/worker-service.service';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { SidebarService } from './../../../core/services/sidebar-service.service';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  HostListener,
} from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/core/classes/user';
import { DxPopupComponent } from 'devextreme-angular';
import { IdAction, IdDirection } from 'src/app/api.constants';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { InitializedEvent } from 'devextreme/ui/popup';
import {
  RegulationActionsResponse,
  Action,
  TradersListResponse,
  Trader,
  RegulationDemoffResponse,
  Offer,
} from "../../../core/interfaces";

@Component({
  selector: 'app-open-access-popup',
  templateUrl: './open-access-popup.component.html',
  styleUrls: ['./open-access-popup.component.scss'],
})
export class OpenAccessPopupComponent implements OnInit {
  public user: User;
  @Input() chooseOffers;
  @Input() sectionId: number;
  @Input() sessionId: number;
  @Output() close = new EventEmitter<boolean>();
  public successOpen: boolean = false;
  public popup: boolean = false; //popup окно

  @ViewChild(OpenAccessComponent)
  openAccessComponent: OpenAccessComponent;

  public firmFromSideBar: any;
  public choosenFirm: any;
  public firmName: string;
  public firm: any;
  public actions: Action[];
  public traders: Trader[];
  public listDemoff: any;
  public offersNumberDisable: boolean = true; //дизэбл для дропдауна Номер заявки
  public actionNumberDisable: boolean = false; //дизэбл для Кол-во действий

  public form: FormGroup = this.formBuilder.group({
    participant: [null, Validators.required],
    trader: [null, Validators.required],
    direction: [null, Validators.required],
    action: [null, Validators.required],
    actionNumber: [null, Validators.required],
    offerNumber: [null],
    note: ['', Validators.required],
  });

  public maxChars: number = 200;

  public directions: any = [
    {
      refBookKey: IdDirection.buy,
      refBookValue: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'sessions-schedule.buy'
      ),
    },
    {
      refBookKey: IdDirection.sale,
      refBookValue: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'sessions-schedule.sale'
      ),
    },
  ];

  public isOpenSidebar: boolean = false; //открыта ли боковая панель

  constructor(
    public translate: TranslateService,
    private formBuilder: FormBuilder,
    private sidebarService: SidebarService,
    private offerManagementService: OfferManagementService,
    private workerService: WorkerService
  ) {}

  ngOnInit(): void {
    this.popup = true;
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    if (this.chooseOffers) {
      //когда переходим из контекстного меню
      this.firm = [
        {
          idFirm: this.chooseOffers[0].firmId,
          firmName: this.chooseOffers[0].concatedFirmName,
        },
      ];
      this.form.get('participant')?.patchValue(this.chooseOffers[0].firmId);
      this.form.get('trader')?.patchValue(this.chooseOffers[0].traderId);
      this.form.get('direction')?.patchValue(this.chooseOffers[0].directionId);
      this.form.get('action')?.patchValue(4);
      this.form.get('actionNumber')?.patchValue(1);
      this.form
        .get('offerNumber')
        ?.patchValue(this.chooseOffers[0].idDemandOffer);

      this.onGetTradersList(this.chooseOffers[0].firmId);
      this.onRegulationActionsInit(
        this.sectionId,
        this.sessionId,
        this.chooseOffers[0].directionId
      );
      this.onRegulationDemoffInit(
        this.sectionId,
        this.sessionId,
        this.form.get('direction')?.value,
        this.form.get('participant')?.value,
        this.form.get('trader')?.value,
        this.form.get('action')?.value
      );

      this.offersNumberDisable = false;
    }
    this.firmFromSideBar = this.sidebarService.trigger$.subscribe(() =>
      this.chooseFirmFromSidebar()
    );
  }

  //получение списка действий
  public onRegulationActionsInit(
    sectionId: number,
    sessionId: number,
    directionId: number
  ): void {
    this.offerManagementService
      .getOutRegulationActions(
        sectionId,
        sessionId,
        directionId
      )
      .subscribe((res: RegulationActionsResponse) => {
        this.actions = res.actions;
        if (this.chooseOffers) {
          //когда из контекстного меню
          this.actions = this.actions.filter(
            (el) => el.id == IdAction.edit || el.id == IdAction.cancel
          );
        }
      });
  }

  //получение списка заявок
  onRegulationDemoffInit(
    sectionId: number,
    sessionId: number,
    directionId: number,
    firmId: number,
    traderId: number,
    actionId: number
  ) {
    this.offerManagementService
      .getOutRegulationDemoff(
        sectionId,
        sessionId,
        directionId,
        firmId,
        traderId,
        actionId
      )
      .subscribe((res: RegulationDemoffResponse) => {
        this.listDemoff = res.offers;
        if (this.chooseOffers) {
          //когда из контекстного меню
          this.listDemoff = this.listDemoff.filter(
            (el) => el.idDemandOffer == [this.chooseOffers[0].idDemandOffer]
          );
        }
      });
  }

  //получение списка трейдеров
  public onGetTradersList(firmId: number): void {
    const body = {
      idFirm: firmId,
      isOnlyActive: true,
    };

    this.workerService
      .getTradersList(this.user?.token, body)
      .subscribe((res: TradersListResponse) => {
        this.traders = res.traders;
      });
  }

  //выбрать участника
  public chooseFirmFromSidebar(): void {
    this.choosenFirm = this.offerManagementService.choosenFirm;
    this.firm = [
      {
        idFirm: this.choosenFirm?.idFirm,
        firmName:
          this.choosenFirm?.regNumber + ' - ' + this.choosenFirm?.nameShort,
      },
    ];
    this.onValueChanged({ value: this.choosenFirm?.idFirm }, 'participant');
  }

  public onValueChanged(e: any, select: string): void {
    if (!e.value || e.value.length == 0) {
      switch (select) {
        case 'offerNumber': {
          if (!this.chooseOffers) {
            this.form.get('actionNumber')?.patchValue(null);
            this.actionNumberDisable = false;
          }

          break;
        }
      }
    } else {
      switch (select) {
        case 'participant': {
          this.onGetTradersList(this.choosenFirm?.idFirm);
          this.form.get('participant')?.patchValue(this.choosenFirm?.idFirm);
          break;
        }

        case 'trader': {
          this.form.get('trader')?.patchValue(e.value);
          if (
            !this.chooseOffers &&
            (this.form.get('action')?.value == IdAction.edit ||
              this.form.get('action')?.value == IdAction.cancel) &&
            this.form.get('direction')?.value
          ) {
            this.form.get('offerNumber')?.patchValue([]);
            this.onRegulationDemoffInit(
              this.sectionId,
              this.sessionId,
              this.form.get('direction')?.value,
              this.form.get('participant')?.value,
              e.value,
              this.form.get('action')?.value
            );
          }
          break;
        }

        case 'direction': {
          this.onRegulationActionsInit(this.sectionId, this.sessionId, e.value);
          this.form.get('direction')?.patchValue(e.value);

          //сбрасываем действие и заявки
          if (!this.chooseOffers && this.form.get('action')?.value) {
            this.form.get('action')?.patchValue(null);
            this.form.get('offerNumber')?.patchValue([]);
            this.form.get('actionNumber')?.patchValue(null);
          }
          if (!this.chooseOffers && this.form.get('actionNumber')?.value) {
            this.form.get('actionNumber')?.patchValue(null);
          }
          break;
        }

        case 'action': {
          if (!this.chooseOffers) {
            if (e.value == IdAction.edit || e.value == IdAction.cancel) {
              //Для действий Редактирование/Отмена возможно указание конкретных 1..N заявок
              this.offersNumberDisable = false;
              this.form.get('actionNumber')?.patchValue(null);
              this.form.get('offerNumber')?.patchValue([]);
              this.onRegulationDemoffInit(
                this.sectionId,
                this.sessionId,
                this.form.get('direction')?.value,
                this.form.get('participant')?.value,
                this.form.get('trader')?.value,
                e.value
              );
            } else {
              this.offersNumberDisable = true;
            }
          }
          break;
        }

        case 'offerNumber': {
          this.form.get('actionNumber')?.patchValue(e.value.length);
          this.actionNumberDisable = true;
          break;
        }
      }
    }
  }

  /* закрытие попап окна, в зависимотси есть или нет боковая панель*/
  @ViewChild('popupOpen', { static: false }) popupOpen: DxPopupComponent;

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    //по кнопке esc
    if (this.popup && !this.isOpenSidebar) {
      //открыто отклонения заявки и закрыта панель Sidebar
      this.popupOpen.instance.hide();
    }
    if (document.getElementById('mySidebar').style.opacity == '0') {
      //панель Sidebar закрыта (условия для того чтобы, если открыта и попап и Sidebar, то при нажатии esc не закрывалось сразу два окна)
      this.isOpenSidebar = false;
    }
  }

  public onInitializedPopup(e: InitializedEvent): void {
    //запрещаем закрывать попап по клавише esc
    e.component.registerKeyHandler('escape', function (arg) {
      arg.preventDefault();
    });
  }

  public openSidebar(): void {
    //просмотр информации по выбранным заявкам
    this.isOpenSidebar = true;
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('mySidebar').style.zIndex = '1550';
    document.getElementById('dark').className = 'dark_opened_Template';
    const dataForReq = {
      name: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'filters.choiceFirm'
      ),
      chooseOffers: this.chooseOffers,
    };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('openAccess');
  }

  public submitForm(): void {
    const body = {
      idSection: this.sectionId,
      idSession: this.sessionId,
      idDirection: this.form.get('direction')?.value,
      idFirm: this.form.get('participant')?.value,
      idTrader: this.form.get('trader')?.value,
      idAction: this.form.get('action')?.value,
      actionsNumber: this.form.get('actionNumber')?.value,
      listDemoff: this.chooseOffers
        ? [this.form.get('offerNumber')?.value]
        : this.form.get('offerNumber')?.value,
      notes: this.form.get('note')?.value,
    };

    this.offerManagementService
      .setOutRegulationPermiss(body)
      .subscribe(() => {
        this.successOpen = true;
        this.closeAccessPopup();
      });
  }

  public closeAccessPopup(): void {
    this.popup = false;
    this.close.emit(false);
  }

  public ngOnDestroy(): void {
    this.firmFromSideBar.unsubscribe();
  }
}
