import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'excelDate'
})
export class ExcelDatePipe implements PipeTransform {
  public transform(value: number | string, skipOffset: boolean = false): number | null {
    const numValue: number = Number(value);

    if (isNaN(numValue)) {
      return null;
    }

    const excelEpoch: number = 25569;
    const millisecondsPerDay: number = 86400000;

    const offset: number = (numValue - excelEpoch) * millisecondsPerDay + (skipOffset ? 0 : 1);

    return offset;
  }
}
