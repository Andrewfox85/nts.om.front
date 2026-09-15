/* eslint-disable */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { OfferManagementService } from '../../../../core/services/offer-management-service.service';
import { CommonService } from '../../../../core/services/common-service.service';
import { ExportResponse, ExportRequest } from 'src/app/shared/interfaces';
import { SECTIONS_TYPES, STATUS_DOUMENTS } from '../../enums';
import { REPORT_TYPE_KEYS } from '../../constants';
import { convertExcelDateToString, processStatusDocument } from '../../helpers';

@Component({
  selector: 'ceit-popup-export-request-list',
  templateUrl: './popup-export-request-list.component.html',
  styleUrls: ['./popup-export-request-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopupExportRequestListComponent implements AfterViewInit {
  @ViewChild('statusDocumentDownload', { static: false })
  statusDocumentDownload!: TemplateRef<ElementRef>;

  @ViewChild('statusDocumentError', { static: false })
  statusDocumentError!: TemplateRef<ElementRef>;

  @ViewChild('statusDocumentisBeingFormed', { static: false })
  statusDocumentisBeingFormed!: TemplateRef<ElementRef>;

  @ViewChild('sectionMetall', { static: false })
  sectionMetall!: TemplateRef<ElementRef>;

  @ViewChild('sectionTimber', { static: false })
  sectionTimber!: TemplateRef<ElementRef>;

  @ViewChild('sectionAgri', { static: false })
  sectionAgri!: TemplateRef<ElementRef>;

  @ViewChild('sectionPerspective', { static: false })
  sectionPerspective!: TemplateRef<ElementRef>;

  private readonly offerManagementService = inject(OfferManagementService);
  private readonly commonService = inject(CommonService);
  private readonly translate = inject(TranslateService);

  public templateStatus: Record<number, TemplateRef<ElementRef>>;
  public sectionTypes: Record<number, TemplateRef<ElementRef>>;

  public readonly token =
    JSON.parse(localStorage.getItem('user') || '{}')?.token || '';

  public readonly sections$ = this.commonService.getSections(this.token);

  public readonly exportedList$ = combineLatest([
    this.offerManagementService
      .getExportRequestList()
      .pipe(map((response: ExportResponse) => response.exportRequests)),
    this.sections$,
  ]).pipe(
    map(([exportRequests, sections]) => {
      return exportRequests.map((request: ExportRequest) => {
        const matchedSection = sections.sections.find(
          (section) => section.id === request.requestSection
        );
        return {
          ...request,
          dateCreate: convertExcelDateToString(request.dateCreate),
          sectionName: matchedSection?.name,
          statusDocument: processStatusDocument(request),
          reportTypeKey: this.translate.instant(
            REPORT_TYPE_KEYS[request.idReportType]
          ),
        };
      });
    })
  );

  public popupVisible = false;

  ngAfterViewInit(): void {
    this.templateStatus = {
      [STATUS_DOUMENTS.DOWNLOAD]: this.statusDocumentDownload,
      [STATUS_DOUMENTS.ERROR]: this.statusDocumentError,
      [STATUS_DOUMENTS.IS_BEING_FORMED]: this.statusDocumentisBeingFormed,
    };

    this.sectionTypes = {
      [SECTIONS_TYPES.METALL]: this.sectionMetall,
      [SECTIONS_TYPES.TIMBER]: this.sectionTimber,
      [SECTIONS_TYPES.AGRI]: this.sectionAgri,
      [SECTIONS_TYPES.PERSPECTIVE]: this.sectionPerspective,
    };
  }

  public showPopup(): void {
    this.popupVisible = true;
  }

  public hidePopup(): void {
    this.popupVisible = false;
  }

  public downloadFile(requestId: number): void {
    this.offerManagementService
      .getExportRequestDocument(requestId)
      .subscribe((response) => {
        const byteCharacters = atob(response.content);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/octet-stream',
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = response.fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      });
  }
}
