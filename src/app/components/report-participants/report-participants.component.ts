/* eslint-disable */
import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { numberEntriesPage, FileTypes } from '../../api.constants';
import { catchError, of, tap } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/services/local-storage-service/local-storage.service';
import { ReportService } from 'src/app/shared/services/report-service/reports.service';
import { TradingParticipant } from 'src/app/shared/services/report-service';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { CommonService } from 'src/app/core/services/common-service.service';
import { ExportService } from './../../core/services/export-service.service';

export const REPORT_PARTICIPANTS_KEY = 'reportParticipants';

@Component({
  selector: 'app-report-participants',
  templateUrl: './report-participants.component.html',
  styleUrls: ['./report-participants.component.scss'],
})
export class ReportParticipantsComponent implements OnInit {
  public readonly REPORT_PARTICIPANTS_KEY = REPORT_PARTICIPANTS_KEY;

  public user: User;
  public listParticipants: TradingParticipant[];
  public numberEntriesPage = numberEntriesPage;

  public idSession: number;
  public idSection: number;
  public sessionDate: number;
  public sessionName: string;

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly reportService: ReportService,
    private readonly route: ActivatedRoute,
    public translate: TranslateService,
    private pageMeta: PageMetaService,
    private commonService: CommonService,
    private exportService: ExportService
  ) {}

  public ngOnInit(): void {
    this.user = this.localStorageService.getItemFromLocalStorage('user');

    this.route.queryParams.subscribe((i) => {
      this.idSession = i['idSession'];
      this.idSection = i['idSection'];
      this.sessionDate = i['sessionDate'];
      this.sessionName = i['sessionName'];
    });

    const R_PARTICIPANT_TITLE = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-participants.reportParticipants'
    );
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(
      this.idSession,
      R_PARTICIPANT_TITLE,
      faviconUrl
    );

    this.getReportParticipants();
  }

  private getReportParticipants(): void {
    this.reportService
      .getTradingParticipants(this.user?.token, this.idSection, this.idSession)
      .pipe(
        tap((data) => {
          this.listParticipants = data.participants;
        }),
        catchError((error: Error) => {
          console.error('Ошибка при загрузке:', error);

          return of(null);
        })
      )
      .subscribe();
  }

  public exportGrid(e: ExportingEvent): void {
    const sectionName: string = this.commonService.choosenSection(
      this.idSection,
      this.translate.store.currentLang
    );

    const fileName: string = `${getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-participants.reportParticipants'
    )}, ${sectionName}, № ${this.idSession}`;

    this.exportService.onExporting(
      e,
      fileName,
      FileTypes.REPORT_PARTICIPANTS
    );
  }
}
