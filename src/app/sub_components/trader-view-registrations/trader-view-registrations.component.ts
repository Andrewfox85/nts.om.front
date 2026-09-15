/* eslint-disable */
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { IdDirection } from 'src/app/api.constants';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { TranslateService } from '@ngx-translate/core';
import { SessionsScheduleService } from 'src/app/core/services/sessions-schedule.service';
import { SessionRegistrations, SessionInfo } from './../../core/interfaces/interface';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { CommonService } from './../../core/services/common-service.service';

@Component({
  selector: 'app-trader-view-registrations',
  templateUrl: './trader-view-registrations.component.html',
  styleUrls: ['./trader-view-registrations.component.scss'],
})
export class TraderViewRegistrationsComponent implements OnInit {
  @Input() viewRegistrationsPopup: boolean;
  @Input() sessionInfo: SessionInfo | null;
  @Output() close = new EventEmitter<boolean>();

  public user: User;
  public registrations: SessionRegistrations[];
  public readonly IdDirection = IdDirection;

  private readonly gridRowHeight: number = 48;
  private readonly gridChromeHeight: number = 140;
  private readonly gridMinRows: number = 4;
  private readonly popupChromeHeight: number = 250;

  constructor(
    public translate: TranslateService,
    public offerManagementService: OfferManagementService,
    private sessionSheduleService: SessionsScheduleService,
    private commonService: CommonService,
  ) {}

  public get gridHeight(): number {
    const rows: number = this.registrations?.length ?? 0;
    const minHeight: number = this.gridChromeHeight + this.gridMinRows * this.gridRowHeight;
    const contentHeight: number = this.gridChromeHeight + Math.max(rows, 1) * this.gridRowHeight;
    const maxHeight: number = Math.round(window.innerHeight * 0.9) - this.popupChromeHeight;
    return Math.min(maxHeight, Math.max(minHeight, contentHeight));
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  public onShowing(e): void {
    this.sessionSheduleService
      .getSessionsRegistrations(
        this.sessionInfo?.sectionId,
        this.sessionInfo?.sessionId,
        this.sessionInfo?.idDirection
      )
      .subscribe((res) => {
        this.registrations = res.sessionRegistrations;
      });
  }

  onCellPrepared(e) {
    let grid = e.component;
    //экспорт в Excel
    const btn = document.getElementById('exportButton');
    btn.onclick = (event) => {
      const sectionName: string = this.commonService.choosenSection(
        this.sessionInfo?.sectionId,
        this.translate.store.currentLang
      );

      const fileName: string = `${getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'worker.registration'
      )}, ${sectionName}, № ${this.sessionInfo?.sessionId}`;

      {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('DataGrid');

        exportDataGrid({
          component: e.component,
          worksheet,
          keepColumnWidths: true,
          }).then(function () {
              workbook.xlsx.writeBuffer().then(function (buffer) {
                saveAs(
                  new Blob([buffer], { type: 'application/octet-stream' }),
                  `${fileName}.xlsx`
                );
              });
            });
          }
          e.cancel = true;
    };
  }

  public closePopup(): void {
    this.close.emit(false);
  }
}
