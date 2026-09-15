/* eslint-disable */
import { CommonService } from './../../core/services/common-service.service';
import { Component, OnInit } from '@angular/core';
import { User } from '../../core/classes/user';
import { WorkerService } from './../../core/services/worker-service.service';
import { numberEntriesPage, searchIcon } from 'src/app/api.constants';
import { TranslateService } from '@ngx-translate/core';
import SelectBox from 'devextreme/ui/select_box';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { getTranslateResultByCurrentLang, excelToJSDate } from 'src/app/core/helpers';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import {
  SessionRegistrationWorker,
  OperationResult,
  ClientResult,
} from '../../core/interfaces';
import {
  IdDirection,
  sessionStage,
  statusSession,
} from 'src/app/api.constants';
import { SucceedRes, UnsucceedRes } from './../../core/interfaces/interface';
import { ValueChangedEvent } from 'devextreme/ui/check_box';
import { ContextMenuPreparingEvent, ContentReadyEvent, SelectionChangedEvent } from 'devextreme/ui/data_grid';
@Component({
  selector: 'app-worker-view-registration',
  templateUrl: './worker-view-registration.component.html',
  styleUrls: ['./worker-view-registration.component.scss'],
})
export class WorkerViewRegistrationComponent implements OnInit {
  public searchIcon: any = searchIcon;
  public search: string;
  public registrations: SessionRegistrationWorker[];
  public chooseRegistration: SessionRegistrationWorker[] = [];
  public selectedRows: SessionRegistrationWorker[] = [];
  public options: boolean = false;
  public regDateEndBuy: number;
  public regDateEndSale: number;
  public isScheduleExistBuy: boolean;
  public isScheduleExistSale: boolean;
  public showFilterRow: boolean = true;
  public numberEntriesPage = numberEntriesPage;
  public user: User;

  public selectBox: any;
  public all: string;
  public selected: string;
  public unselected: string;
  public idSession: number;
  public idSection: number;
  public sessionDate: number;
  public sessionName: string;

  public success: boolean = false; //отображение сообщения при отмене и восстановлении регистраций

  public type: string = 'info';
  public position: string = 'top center';
  public message: string = getTranslateResultByCurrentLang(
    this.translate.store.currentLang,
    'worker.succsessfulUnloadData'
  );

  //для отмены регистрации
  public cancel: boolean = false;
  public cancelForm: FormGroup;
  public dataForCancel: SessionRegistrationWorker[];
  public maxChars: number = 200;

  //восстановление регистрации
  public restoreForm: boolean = false;
  public sectionDescription: string;

  public result: OperationResult; //результат обработки отмены и восстановления регистрации
  public registrationClients: ClientResult[];
  public Privileges: boolean = false;
  public access: boolean;
  public outOfRegulationPrivileges: boolean = false; //привилегия для переноса регистраций в торги

  public accessType: string; //для отображения даты при переходе с УЗ
  public sessionStatus: number;
  public sessionStage: number;

  public transferToBidsForm: FormGroup = this.formBuilder.group({
    violationsControl: [false],
    depositControl: [false],
    syncGias: [true],
  });

  public succeedRes: SucceedRes[] = []; //результат переноса заявки в торги
  public unsucceedRes: UnsucceedRes[] = [];
  public admissionOptions: any;
  public transferRegToBidsPopup: boolean = false;
  public transferToBidsResPopup: boolean = false;
  public isAdmissionProcessed: boolean = false;

  constructor(
    public translate: TranslateService,
    public workerService: WorkerService,
    public commonService: CommonService,
    public router: Router,
    private route: ActivatedRoute,
    public offerManagementService: OfferManagementService,
    private formBuilder: FormBuilder,
    private pageMeta: PageMetaService
  ) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.route.queryParams.subscribe((i) => {
      this.idSession = i['idSession'];
      this.idSection = i['idSection'];
      this.sessionDate = i['sessionDate'];
      this.sessionName = i['sessionName'];
      this.accessType = i['accessType'];
      this.sessionStatus = i['sessionType'];
      this.sessionStage = i['sessionStage'];

      const sectionArray = JSON.parse(localStorage.getItem('sections'));
      this.sectionDescription = sectionArray.find(
        (el) => el.id === Number(this.idSection)
      )?.description;
      let description =
        'DemandOfferManagementProcessRegistrs' + this.sectionDescription;
      let outOfRegulationSectionDescription = sectionArray.find(
        (el) => el.id === Number(this.idSection)
      )?.description;
      outOfRegulationSectionDescription =
        'DemandOfferManagementOutOfRegulations' +
        outOfRegulationSectionDescription;
      this.Privileges = this.commonService.checkPrivileges(description);
      this.outOfRegulationPrivileges = this.commonService.checkPrivileges(
        outOfRegulationSectionDescription
      );

      let access = 'DemandOfferManagementGetList' + this.sectionDescription;
      this.access = this.commonService.checkPrivileges(access);
      if (!this.access) {
        this.router.navigate([`/*`]);
      }
    });
  }

  ngOnInit(): void {
    this.getData();
    this.getSessionDate();

    const SESSION_SCHEDULE_TITLE = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'worker.registration'
    );
    const faviconUrl = 'assets/img/icons/part-registrations.svg';
    this.pageMeta.setPageMeta(
      this.idSession,
      SESSION_SCHEDULE_TITLE,
      faviconUrl
    );
  }

  public getData(): void {
    this.workerService
      .getSessionRegistrations(
        this.user.token,
        this.idSection,
        this.idSession,
        this.search
      )
      .subscribe((res) => {
        this.registrations = res.sessionRegistrationWorkers;
      });
  }

  public getSessionDate(): void {
    this.workerService
      .getSessionStageDateEnd(
        this.user.token,
        this.idSection,
        this.idSession,
        Number(IdDirection.buy),
        false
      )
      .subscribe((res) => {
        this.regDateEndBuy = res.dateEnd;
        this.isScheduleExistBuy = res.isScheduleExist;
      });

    this.workerService
      .getSessionStageDateEnd(
        this.user.token,
        this.idSection,
        this.idSession,
        Number(IdDirection.sale),
        false
      )
      .subscribe((res) => {
        this.regDateEndSale = res.dateEnd;
        this.isScheduleExistSale = res.isScheduleExist;
      });
  }

  public onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows = event.selectedRowsData;
  }

  //контекстное меню
  public onContextMenuPreparing(e: ContextMenuPreparingEvent): void {
    if (e.row.rowType != 'header') {
      let disableCancel, disableRestore = true;

      this.chooseRegistration = [];
      if (!e.items) e.items = [];

      if (this.selectedRows.length > 0) {
        this.chooseRegistration = this.selectedRows;
      } else {
        this.chooseRegistration.push(e.row.data);
      }

      const allDeleted = this.chooseRegistration.every(
        (item) => !!item.deletionReason
      );
      const allActive = this.chooseRegistration.every(
        (item) => !item.deletionReason
      );

      disableCancel = !allActive;
      disableRestore = !allDeleted;

      e.items.push(
        {
          icon: './assets/img/icons/registration_cancel.svg',
          text: getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'worker.registrationCancel'
          ),
          disabled:
            disableCancel ||
            !this.Privileges ||
            (this.sessionStatus != statusSession.preparation &&
              this.transferRegistrationWorker()),
          onItemClick: () => {
            this.openCancelRegistrationForm(this.chooseRegistration);
          },
        },
        {
          icon: './assets/img/icons/registration_restore.svg',
          text: getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'worker.registrationRestore'
          ),
          disabled:
            disableRestore ||
            !this.Privileges ||
            (this.sessionStatus != statusSession.preparation &&
              this.transferRegistrationWorker()),
          onItemClick: () => {
            this.openRestoreRegistrationForm();
          },
        },
        {
          template: `<div class="error">${getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'worker.selectSameStatus'
          )}</div>`,
          visible: !!disableCancel && !!disableRestore && !!this.Privileges,
        },
        {
          icon: './assets/img/icons/transferToBids.svg',
          text: getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'offer-management.transferToBids'
          ),
          disabled:
            this.transferRegistrationWorker() ||
            this.sessionStatus != statusSession.bidding ||
            this.sessionStage != sessionStage.transferAuctionCompleted ||
            !this.outOfRegulationPrivileges,
          onItemClick: () => {
            this.checkAdmissionProcessed();
          },
        }
      );
    }
  }

  public transferRegistrationWorker(): boolean {
    return this.chooseRegistration.some(
      (item) => !item.isCreatedAfterDataTransfer
    );
  }

  public onFilterTable(e: ValueChangedEvent): void {
    if (e.value == true) {
      this.registrations = this.registrations.filter((el) => {
        return el.isCreatedAfterDataTransfer == true;
      });
    } else {
      this.getData();
    }
  }

  public pagingChange(): void {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  //фильтрация по выбранным/невыбранным чекбоксам
  public onContentReady(e: ContentReadyEvent): void {
    let grid = e.component;
    //экспорт в Excel
    const btn = document.getElementById('exportButton');
    btn.onclick = (event) => {
      const sectionName: string = this.commonService.choosenSection(
        this.idSection,
        this.translate.store.currentLang
      );
  
      const fileName: string = `${getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'worker.registration'
      )}, ${sectionName}, № ${this.idSession}`;
  
      {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('DataGrid');
        worksheet.columns = [
          { width: 30 },
          { width: 40 },
          { width: 40 },
          { width: 40 },
          { width: 25 },
          { width: 50 },
          { width: 40 },
          { width: 40 },
          { width: 40 },
        ];
        exportDataGrid({
          component: e.component,
          worksheet,
          keepColumnWidths: false,
          selectedRowsOnly:
            grid.getSelectedRowsData()?.length > 0 ? true : false,
          customizeCell: ({ gridCell, excelCell }) => {
            if (gridCell.rowType === 'data') {
              if (gridCell.column.dataField === 'registrationDate') {
                let valueToDoc = excelToJSDate(
                  gridCell.data.transactionInfo.transactionDatetime
                );
                excelCell.value = valueToDoc.toLocaleString();
              }
            }
          },
        }).then(function () {
          workbook.xlsx.writeBuffer().then(function (buffer) {
            saveAs(
              new Blob([buffer], { type: 'application/octet-stream' }),
              `${fileName}.xlsx`
            );
          });
        });
      }
    };

    //выпадайка все/выбраны/невыбраны
    this.all = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'worker.registrationAll'
    );
    this.selected = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'worker.registrationSelected'
    );
    this.unselected = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'worker.registrationUnselected'
    );

    this.selectBox = new SelectBox(
      e.element.querySelector('.dx-datagrid-filter-row .dx-command-select'),
      {
        dataSource: [
          { id: 1, value: this.all },
          { id: 2, value: this.selected },
          { id: 3, value: this.unselected },
        ],
        displayExpr: 'value',
        valueExpr: 'id',
        onValueChanged: function (args) {
          if (args.value == 1) {
            grid.clearFilter('dataSource');
          } else {
            var keys = grid.getSelectedRowsData();
            var filter = [];
            keys.forEach(function (key) {
              filter.push(['id', key.id]);
              filter.push('or');
            });
            filter.pop();
            if (args.value == 3) {
              filter = ['!', filter];
            }
            grid.filter(filter);
          }
        },
        dropDownOptions: { width: 150 },
        placeholder: '',
      }
    );
  }

  //открыть модалку отмена регистрации
  public openCancelRegistrationForm(data: SessionRegistrationWorker[]): void {
    this.cancel = true;
    this.success = false;
    this.dataForCancel = data;
    this.cancelForm = this.formBuilder.group({
      deletionReason: ['', Validators.required],
    });
  }

  public submitCancelRegistrationForm(): void {
    const body = {
      idSection: this.idSection,
      idSession: this.idSession,
      registrationAnnulClients: this.mapСhooseRegistration(
        this.cancelForm.get('deletionReason')?.value
      ),
    };

    this.workerService
      .registrationAnnulClients(this.user?.token, body)
      .subscribe((res) => {
        this.registrationClients = res.registrationAnnulClients;
        this.result = res.resultOperation;
        this.success = true;
      });
  }

  //восстановить регистрацию
  public openRestoreRegistrationForm(): void {
    this.success = false;
    this.restoreForm = true;
  }

  public onRestoreRegistration(): void {
    this.selectedRows = [];

    const body = {
      idSection: this.idSection,
      idSession: this.idSession,
      registrationRestoreClients: this.mapСhooseRegistration(),
    };

    this.workerService
      .registrationRestoreClients(this.user.token, body)
      .subscribe((res) => {
        this.registrationClients = res.registrationRestoreClients;
        this.result = res.resultOperation;
        this.success = true;
      });
  }

  private mapСhooseRegistration(deletionReason?: string) {
    return this.chooseRegistration.map((item) => ({
      id: item.id,
      idTrader: item.traderId,
      idFirm: item.firmId,
      idFirmClient: item.clientId || null,
      contractType: item.clientContractTypeId || null,
      idDirection: item.directionID || null,
      idBranch: item.clientId ? item.clientBranchId : item.firmBranchId || null,
      ...(deletionReason && { deletionReason }),
    }));
  }

  // выполнялась ли процедура допуска и получение его параметров если выполнялась
 public checkAdmissionProcessed(): void {
    this.offerManagementService
      .isAdmissionProcessed(this.idSection, this.idSession)
      .then((res: any) => {
        this.isAdmissionProcessed = res;
        this.transferRegToBidsPopup = true;

        if (this.isAdmissionProcessed == true) {
          this.offerManagementService
            .buceGetAdmissionOptions(
              this.idSection,
              this.idSession
            )
            .then((res: any) => {
              this.admissionOptions = res.admissionOptions[0];
              this.transferToBidsForm
                .get('violationsControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlViols);
              this.transferToBidsForm
                .get('depositControl')
                ?.patchValue(this.admissionOptions.isAdmissionControlDeposit);
            });
        }
      });
  }

  public transferOfferToBids(): void {
    this.chooseRegistration.forEach((item) => {
      const body = {
        idSection: this.idSection,
        idSession: this.idSession,
        idTrader: item.traderId,
        idFirm: item.firmId,
        idFirmClient: item.clientId || null,
        contractType: item.clientContractTypeId,
        idBranch: item.firmBranchId || item.clientBranchId || null,
        idDirection: item.directionID,
        isControlViolations:
          this.transferToBidsForm.get('violationsControl')?.value,
        isControlDeposit: this.transferToBidsForm.get('depositControl')?.value,
        isSyncWithGias: this.transferToBidsForm.get('syncGias')?.value,
      };

      this.workerService
        .transferRegistration(this.user?.token, body)
        .subscribe((res) => {
          if (res.isSucceed == true) this.succeedRes.push({ id: item.id });
          else
            this.unsucceedRes.push({
              id: item.id,
              description: res.infoMessage,
            });
        });
    });

    this.transferRegToBidsPopup = false;
    this.transferToBidsResPopup = true;
  }

  public resetTransferToBidsForm(): void {
    this.succeedRes = []; //результат переноса заявки в торги
    this.unsucceedRes = [];
  }

  public onOpenDetailInfo(type: string): void {
    let outputArray = [];
    outputArray.length = 0;

    if (type == 'cancel' || type == 'restore') {
      this.registrationClients.forEach((item) => {
        this.registrations.forEach((registr) => {
          if (item.id == registr.id) {
            outputArray.push(Object.assign(registr, item));
          }
        });
      });
    }

    if (type == 'transferToBids') {
      this.unsucceedRes.forEach((item) => {
        this.registrations.forEach((registr) => {
          if (item.id == registr.id) {
            outputArray.push(Object.assign(registr, item));
          }
        });
      });
    }

    let sessionsParam = {
      idSession: this.idSession,
      sessionDate: this.sessionDate,
    };

    let title =
      type == 'transferToBids' ? 'Результат переноса регистраций в торги' : '';

    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [`/ordermanagement/sessions-schedule/detailInfo`],
        {
          queryParams: {
            json: JSON.stringify(outputArray),
            session: JSON.stringify(sessionsParam),
            title: title,
          },
        }
      )
    );
    window.open(url, '_blank');
  }

  public onClose(): void {
    this.cancel = false;
    this.restoreForm = false;
    this.getData();
    this.getSessionDate();
  }
}
