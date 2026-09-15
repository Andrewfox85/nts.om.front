/* eslint-disable */
import { CommonService } from 'src/app/core/services/common-service.service';
import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { Cell } from 'exceljs';
import { ACTUAL_SIZE_FIELDS, IdDirection, FileTypes, ID_DOCUMENT } from './../../api.constants';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { TranslateService } from '@ngx-translate/core';
import { convertExcelDateToString } from 'src/app/sub_components/header/helpers';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(
    private commonService: CommonService,
    private translate: TranslateService
  ) {}

  //для отчетов отдельная функция, тк строки сборных лотов нужно разбивать/дублировать на разные строки по кол-ву товаров 
  public onExportingReports(
    e: ExportingEvent,
    fileName: string,
    type?: string,
    multilineFields?: string[]
  ): void {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('DataGrid');

    const visibleColumns = e.component.getVisibleColumns();

    worksheet.columns = visibleColumns.map((col) => ({
      header: col.caption,
      key: col.dataField,
      width: 40
    }));

    const rows = e.component.getDataSource().items();

    rows.forEach((row) => {
      if (type === FileTypes.REPORT_ORDERS || type === FileTypes.REPORT_DEALS || type === FileTypes.UNREALIZED_VOLUMES) {
        row.goods.forEach((good) => {
          const exportRow = {};

          visibleColumns.forEach((col) => {
            const field = col.dataField;

            if (type === FileTypes.REPORT_ORDERS || type === FileTypes.REPORT_DEALS ) {
              if (multilineFields.includes(field)) {
                exportRow[field] = good[field] || '';
                return;
              }
            } else {
              if (multilineFields.includes(field)) {
                switch (field) {
                  case 'goods[0].lotSummary.totalAmount':
                    exportRow[field] = row.goods[0].lotSummary.totalAmount || '';
                    break;
                  case 'goods[0].lotSummary.volume':
                    exportRow[field] = row.goods[0].lotSummary.volume || '';
                    break;
                  default:
                    exportRow[field] = good.goodInfo[field] || good.priceParams[field] || '';
                }
                return;
              }
            }
           
            if (good.dynamicFields && field in good.dynamicFields) {

              if (ACTUAL_SIZE_FIELDS.includes(Number(field))) {
                const value = row[field]?.[0];
                exportRow[field] = value ? this.commonService.actualDimensions(value, 0) : '';
                return;
              }

              exportRow[field] = good.dynamicFields[field] || '';
              return;
            }

            if (type === FileTypes.UNREALIZED_VOLUMES) {
              exportRow[field] = this.makeUnrealizedVolumesGrid(field, row)
            } else {
              exportRow[field] = this.makeReportsGrid(field, row);
            }
          });

          worksheet.addRow(exportRow);
        });

        worksheet.getRow(1).font = {
          bold: true
        };

        return;
      }

      const exportRow = {};

      visibleColumns.forEach((col) => {
        const field = col.dataField;

        exportRow[field] = row[field];
      });

      worksheet.addRow(exportRow);
    });

    workbook.xlsx.writeBuffer().then((buffer) => {
      saveAs(
        new Blob([buffer], {
          type: 'application/octet-stream'
        }),
        `${fileName}.xlsx`
      );
    });

    e.cancel = true;
  }

  public onExporting(e: ExportingEvent, fileName: string, type?: string): void {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('DataGrid');
    const columnCount = e.component.getVisibleColumns().length;
    worksheet.columns = Array.from({ length: columnCount }, () => ({
      width: 30
    }));

    exportDataGrid({
      component: e.component,
      worksheet,
      keepColumnWidths: false,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          const field: string = gridCell.column.dataField;

          if (type === FileTypes.REPORT_PARTICIPANTS) {
            this.makeReportParticipantGrid(excelCell, gridCell);
          }

          if (type === FileTypes.DEPOSIT) {      //экспорт задатка
            this.makeDepositGrid(excelCell, gridCell);
          }

          if (type === FileTypes.DEPOSIT_LIST_TAX) {          //экспорт задатка по сбору
            this.makeDepositTaxGrid(excelCell, gridCell);
          }

          if (type === FileTypes.DEPOSIT_LIST_DEAL) {           //экспорт задатка по сделкам
            this.makeDepositDealGrid(excelCell, gridCell);
          }

          if (ACTUAL_SIZE_FIELDS.includes(Number(field))) {            //обрабатываем поля фактических размеров
            const value = gridCell.data[field][0];
            excelCell.value = value
              ? this.commonService.actualDimensions(value, 0)
              : '';
          }
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `${fileName}.xlsx`
        );
      });
    });
    e.cancel = true;
  }

  private makeDepositGrid(excelCell: Cell, gridCell): void {
    if (gridCell.column.dataField === '') {
      if (gridCell.data.idDirection === IdDirection.regs) {
        excelCell.value = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'worker.registration'
        );
      } else if (gridCell.data.idDirection === IdDirection.buy) {
        excelCell.value = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'deposit.buyOffers'
        );
      } else if (gridCell.data.idDirection === IdDirection.sale) {
        excelCell.value = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'deposit.saleOffers'
        );
      }
    }

    if (gridCell.column.dataField === 'depositSumRequired') {
      if (gridCell.data.idDirection === IdDirection.regs) {
        excelCell.value = `${gridCell.data.depositSumRequired} ${gridCell.data.currencyName}`;
      } else if (gridCell.data.idDirection === IdDirection.buy) {
        excelCell.value = `${gridCell.data.depositSumRequired} ${gridCell.data.currencyName}`;
      } else if (gridCell.data.idDirection === IdDirection.sale) {
        excelCell.value = `${gridCell.data.depositSumRequired} ${gridCell.data.currencyName}`;
      }
    }

    if (gridCell.column.dataField === 'depositSumTrader') {
      if (gridCell.data.idDirection === IdDirection.regs) {
        excelCell.value = `${gridCell.data.depositSumTrader} ${gridCell.data.currencyName}`;
      } else if (gridCell.data.idDirection === IdDirection.buy) {
        excelCell.value = `${gridCell.data.depositSumTrader} ${gridCell.data.currencyName}`;
      } else if (gridCell.data.idDirection === IdDirection.sale) {
        excelCell.value = `${gridCell.data.depositSumTrader} ${gridCell.data.currencyName}`;
      }
    }

    if (gridCell.column.dataField === 'fullDeposit') {
      excelCell.value = `${gridCell.data.depositSumFirm} ${gridCell.data.currencyName}`;
    }

    if (gridCell.column.dataField === 'fullSumma') {
      excelCell.value = `${gridCell.data.depositSumFree} ${gridCell.data.currencyName}`;
    }
  }

  private makeDepositTaxGrid(excelCell: Cell, gridCell): void {
    const depositFields: string[] = ['sumRate', 'sumFree'];

    if (depositFields.includes(gridCell.column.dataField)) {
      excelCell.value = `${gridCell.data[gridCell.column.dataField]} ${
        gridCell.data.currencyName
      }`;
    }
  }

  private makeDepositDealGrid(excelCell: Cell, gridCell): void {
    const depositFields: string[] = [
      'depositSumRequiredSale',
      'depositSumRequiredBuy',
      'depositSumTraderSale',
      'depositSumTraderBuy',
      'depositSumFirm',
      'depositSumSale',
      'depositSumBuy',
      'depositSumFree',
    ];

    if (depositFields.includes(gridCell.column.dataField)) {
      const value = gridCell.data[gridCell.column.dataField];
      excelCell.value = value ? `${value} ${gridCell.data.currencyName}` : '';
    }
  }

  private makeReportsGrid(field: string, row: any): number | string {
    const yesOrNoFields: string[] = ['isTargeted', 'isParticipateInTrading'];

    if (yesOrNoFields.includes(field)) {
      return row[field]
        ? getTranslateResultByCurrentLang(this.translate.store.currentLang, 'btns.yes')
        : getTranslateResultByCurrentLang(this.translate.store.currentLang, 'btns.no');
    }

    return row[field];
  }

  private makeUnrealizedVolumesGrid(field: string, row: any): number | string {
    let commissionText: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.commissionAgreement'
    );

    let agencyText: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.agencyAgreement'
    );

    if (field === 'clientContractTypeName') {
      const agreementToFile: string =
        Number(row.clientContractTypeName) === ID_DOCUMENT.COMMISSION_AGREEMENT
          ? commissionText
          : Number(row.clientContractTypeName) === ID_DOCUMENT.AGENCY_AGREEMENT
            ? agencyText
            : '';

      return agreementToFile;
    }

    return row[field];
  }

  private dataRowCounter: number = 0;

  private makeReportParticipantGrid(excelCell: Cell, gridCell): void {
    if (
      gridCell.column.dataField === undefined &&
      gridCell.column.caption === '№'
    ) {
      this.dataRowCounter += 1;
      excelCell.value = this.dataRowCounter;
    } 

    if (gridCell.column.dataField === 'firmDateAccreditation') {
      let valueToDoc = convertExcelDateToString(
        gridCell.data.firmDateAccreditation
      );
      excelCell.value = valueToDoc.toLocaleString().slice(0, -5);
    }

    if (gridCell.column.dataField === 'isExistRegistration') {
        excelCell.value = gridCell.data.isExistRegistration ? getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'btns.yes'
        )
      : getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'btns.no'
        );
      }
  }
}
