/* eslint-disable */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { IdDirection, role, ID_DOCUMENT } from '../../api.constants';
import { SessionsScheduleService } from '../../core/services/sessions-schedule.service';
import { TranslateService } from '@ngx-translate/core';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import {
  FullInfoForBrockerAndVizitorResponse,
  ClientDetail,
  BranchFirmDetail,
  RegistrAndRevokeSessionRegistrationResponse,
  OperationSummary,
  ClientOperationResult
} from '../../core/interfaces';
import { ValueChangedEvent } from 'devextreme/ui/switch';
import { FocusedCellChangingEvent } from 'devextreme/ui/tree_list';

@Component({
  selector: 'registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.scss']
})
export class RegistrationFormComponent implements OnInit {
  @Input() user;
  @Input() idDirection: number;
  @Input() chooseSession;

  @Output() close = new EventEmitter<any>();

  public role = role;
  public form: boolean = false;
  public IdDirection = IdDirection;
  public activeTab: number = 0;
  public hideRegistrInfo: boolean = false;
  public ChangeRegistrationArray = [];
  public paticipantRegistration: FormGroup;
  public filterValueTreeList: Array<any> = [];
  public listSessions: number[];

  public warningResult: boolean = false;
  public successResult: boolean = false;
  public errorResult: boolean = false;
  public errorResultMessage: string = '';

  public disabledAssignments: boolean = true;
  public disabledCommission: boolean = true;
  public contractType: any;
  public filterIDContractType: number;
  public treeListData: any;
  public result: OperationSummary;

  public registrationResult: ClientOperationResult[] = [];
  public UserRole: number;

  public error: boolean = false;
  public messageError: string;
  public ListBranchesAllClients: ClientDetail[];
  public ListBranchesFirm: BranchFirmDetail[];

  public clientActive: boolean = false;
  public branchActive: boolean = false;
  public displayButtons: boolean = true; //отображение кнопок Отменить и сохранить, когда есть структурные подразделения

  constructor(
    public translate: TranslateService,
    private formBuilder: FormBuilder,
    public sessionsScheduleService: SessionsScheduleService
  ) {}

  public ngOnInit(): void {
    if (!this.isSelectedDifferentSection(this.chooseSession)) {
      this.error = true;
      this.messageError = getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'errors.differentSection'
      );
    } else {
      this.getData();
      this.initContractType();
    }
  }

  public isSelectedDifferentSection(selectedRow): boolean {
    return !selectedRow.some((i) => i.sectionId !== selectedRow[0].sectionId);
  }

  public initContractType(): void {
    this.contractType = [
      {
        refBookKey: ID_DOCUMENT.COMMISSION_AGREEMENT,
        refBookValue: getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'general.commissionAgreement'
        ),
        disabled: this.disabledCommission
      },
      {
        refBookKey: ID_DOCUMENT.AGENCY_AGREEMENT,
        refBookValue: getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'general.agencyAgreement'
        ),
        disabled: this.disabledAssignments
      }
    ];
  }

  public OnChangeFilter(i: number): void {
    this.activeTab = i;
    switch (i) {
      case 0: //все
        this.filterValueTreeList = [];
        break;
      case 1: //зарегистрированы
        this.filterValueTreeList = ['isRegisteredOriginal', '=', '1'];
        break;
      case 2: //не зарегистрированы
        this.filterValueTreeList = ['isRegisteredOriginal', '=', '0'];
        break;
      case 3: //операция недоступна
        this.filterValueTreeList = ['isRegisteredOriginal', '=', '-1'];
        break;
    }
  }

  public getData(paticipantRegistrationValue?: number): void {
    this.listSessions = [];
    this.chooseSession.forEach((item) => {
      this.listSessions.push(item.sessionId);
    });

    this.sessionsScheduleService
      .getFullInfoForBrockerAndVizitor(
        this.chooseSession[0].sectionId,
        this.listSessions,
        this.idDirection
      )
      .subscribe({
        next: (res: FullInfoForBrockerAndVizitorResponse) => {
          this.UserRole = Number(res.role);
          this.ListBranchesFirm = res.listBranchesFirmWithDetails.branchFirmWithDetails;
          this.ListBranchesAllClients = res.listBranchesAllClientsWithDetails.clientWithDetails;

          this.CheckData(this.ListBranchesAllClients, 'clientWithBranches');
          this.CheckData(this.ListBranchesFirm, 'branches');

          let openRole = !!paticipantRegistrationValue
            ? paticipantRegistrationValue
            : (this.UserRole == role.broker || this.UserRole == role.brokerVisitor) &&
                this.clientActive
              ? role.broker
              : (this.UserRole == role.visitor || this.UserRole == role.brokerVisitor) &&
                  this.branchActive
                ? role.visitor
                : null;

          if (openRole == null) {
            this.error = true;
            this.messageError = getTranslateResultByCurrentLang(
              this.translate.store.currentLang,
              'errors.noRulesForRegistration'
            );
          } else {
            this.paticipantRegistration = this.formBuilder.group({
              participant: [openRole]
            });
            this.getDataTreeList(Number(openRole));
          }
        },
        error: (error) => {
          this.close.emit(false);
        }
      });
  }

  public CheckData(data: BranchFirmDetail[] | ClientDetail[], roleActive: string): void {
    data.forEach((item) => {
      if (item.isRegistered == -1) {
        let branchCount = 0;
        let branchLenght = item.branchesWithDetails.length;
        item.branchesWithDetails?.forEach((branch) => {
          if (branch.isRegistered == -1) {
            branchCount++;
          }
        });
        if (branchCount != branchLenght) {
          if (roleActive == 'clientWithBranches') {
            this.clientActive = true;
          } else this.branchActive = true;
        }
      } else {
        if (roleActive == 'clientWithBranches') {
          this.clientActive = true;
        } else this.branchActive = true;
      }
    });
  }

  public getDataTreeList(openRole: number): void {
    // this.success = false;
    this.ChangeRegistrationArray.length = 0;
    this.activeTab = 0;
    this.OnChangeFilter(this.activeTab);

    if (openRole == role.broker) {
      this.treeListData = this.ListBranchesAllClients;
      this.checkDataValid(this.treeListData);
      this.displayButtons = true;
      this.filterIDContractType = !!this.filterIDContractType
        ? this.filterIDContractType
        : !this.disabledAssignments
          ? this.contractType[1].refBookKey
          : this.contractType[0].refBookKey;
    } else {
      this.ListBranchesFirm[0].nameShort =
        this.user?.userInfo?.traderRegNum + ' - ' + this.user?.userInfo?.firmName;
      this.treeListData = this.ListBranchesFirm;
      this.displayButtons = !(this.treeListData[0]?.branchesWithDetails?.length == 0);
      this.form = true;
      this.filterIDContractType = null;
      if (this.errorResult == true && this.treeListData[0]?.branchesWithDetails?.length == 0) {
        this.errorResultMessage = this.registrationResult[0].description.replace(
          /\n\r?/g,
          '<br />'
        );
      }
    }
  }

  public checkDataValid(data: any): void {
    let contractType20 = data?.filter(
      (item) => item.idContractType == this.contractType[0].refBookKey
    ); //договор комиссии
    let contractType21 = data?.filter(
      (item) => item.idContractType == this.contractType[1].refBookKey
    ); //договор поручения

    if (!this.form) {
      this.form = true;
      if (contractType20?.length != 0) {
        contractType20.forEach((item) => {
          if (item.isRegistered == -1) {
            let branchCount = 0;
            let branchLenght = item.branchesWithDetails.length;
            item.branchesWithDetails?.forEach((branch) => {
              if (branch.isRegistered == -1) {
                branchCount++;
              }
            });
            if (branchCount != branchLenght) {
              this.disabledCommission = false;
            }
          } else {
            this.disabledCommission = false;
          }
        });
      }
      if (contractType21?.length != 0) {
        contractType21.forEach((item) => {
          if (item.isRegistered == -1) {
            let branchCount = 0;
            let branchLenght = item.branchesWithDetails.length;
            item.branchesWithDetails?.forEach((branch) => {
              if (branch.isRegistered == -1) {
                branchCount++;
              }
            });
            if (branchCount != branchLenght) {
              this.disabledAssignments = false;
            }
          } else {
            this.disabledAssignments = false;
          }
        });
      }
      this.initContractType();
    }
  }

  public onChangeRegistration(item: any, change: ValueChangedEvent): void {
    item.data.isRegistered = change.value; //изменение свитчера
    if (item.data.isRegisteredOriginal != change.value) {
      item.data = Object.assign(item.data, {
        idFirmClient:
          item.data.parentId != 0 ? item.row.node.parent.data.idKeyValue : item.data.idKeyValue
      });
      this.ChangeRegistrationArray.push(item.data);
    } else {
      let i = this.ChangeRegistrationArray.findIndex((data) => data == item.data);
      this.ChangeRegistrationArray.splice(i, 1);
    }
  }

  public onFocusedCellChanging(e: FocusedCellChangingEvent): void {
    e.isHighlighted = false;
  }

  public registrationForSessionTreeList(): void {
    let idFirmClientAndIdBranch = [];

    if (this.paticipantRegistration.get('participant').value == role.visitor) {
      if (this.treeListData[0].branchesWithDetails?.length == 0) {
        idFirmClientAndIdBranch.push({
          idFirmClient: null,
          idBranch: null,
          isRegistered: Number(!this.treeListData[0].isRegistered)
        });
      } else {
        this.ChangeRegistrationArray.forEach((item) => {
          idFirmClientAndIdBranch.push({
            idFirmClient: null,
            idBranch: item?.idFirmBranch || null,
            isRegistered: Number(item.isRegistered)
          });
        });
      }
    } else {
      this.ChangeRegistrationArray.forEach((item) => {
        idFirmClientAndIdBranch.push({
          idFirmClient: item.idFirmClient,
          idBranch: item?.idFirmBranch || null,
          isRegistered: Number(item.isRegistered)
        });
      });
    }

    const body = {
      idSection: this.chooseSession[0].sectionId,
      listSessions: this.listSessions,
      idDirection: this.idDirection,
      idContractType: this.filterIDContractType || null,
      idFirmClientAndIdBranchList: idFirmClientAndIdBranch
    };

    this.sessionsScheduleService
      .registrAndRevokeSessionRegistrationClients(body)
      .subscribe((res: RegistrAndRevokeSessionRegistrationResponse) => {
        if (res) {
          this.result = res.resultOperation;
          /*Если зарегистрировано = 0 и регистрация отменена = 0, а не завершено > 0, то сообщение об ОШИБКЕ на красном фоне.
           * Если зарегистрировано > 0 либо регистрация отменена > 0, и не завершено > 0, то сообщение об ПРЕДУПРЕЖДЕНИЕ на оранжевом фоне.
           * Если зарегистрировано > 0 либо регистрация отменена > 0, и не завершено = 0, то сообщение об УСПЕХЕ на зеленом фоне */
          const hasSuccess = this.result.registered > 0 || this.result.revoked > 0;
          const hasError = this.result.errorOperation > 0;

          this.successResult = hasSuccess && !hasError;
          this.warningResult = hasSuccess && hasError;
          this.errorResult = !hasSuccess && hasError;

          this.registrationResult = res.registrOrRevokeClients;
          this.getData(this.paticipantRegistration.get('participant').value);
        }
      });
  }

  public onClose(): void {
    this.form = !this.form;
    this.close.emit(false);
  }

  protected readonly Number = Number;
}
