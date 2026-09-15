import { Pipe, PipeTransform, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
@Pipe({
  name: 'ruNumberFormat'
})
export class RuNumberFormatPipe implements PipeTransform {
  public transform(
    value: number | string | null | undefined,
    minFractionDigits?: number,
    maxFractionDigits?: number
  ): string {
    const numericValue: number = this.parseToNumber(value);
    if (numericValue === null) {
      return '–';
    }

    const options: Intl.NumberFormatOptions = this.buildOptions(
      minFractionDigits,
      maxFractionDigits
    );
    return this.formatNumber(numericValue, options);
  }

  private parseToNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed: number = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    return typeof parsed === 'number' && isFinite(parsed) ? parsed : null;
  }

  private buildOptions(min?: number, max?: number): Intl.NumberFormatOptions {
    const options: Intl.NumberFormatOptions = {};

    if (typeof min === 'number' && !isNaN(min)) {
      options.minimumFractionDigits = min;
    }

    if (typeof max === 'number' && !isNaN(max)) {
      options.maximumFractionDigits = max;
    }

    return options;
  }

  private formatNumber(value: number, options: Intl.NumberFormatOptions): string {
    try {
      return value.toLocaleString('ru-RU', options);
    } catch {
      return value.toString();
    }
  }
}
