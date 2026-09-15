import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'textwrapper'
})
export class TextWrapperPipe implements PipeTransform {
  public transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.replace(/\r?\n/g, '\n');
  }
}
