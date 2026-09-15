import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uniqueById'
})
export class UniqueByIdPipe implements PipeTransform {

  transform(value: any[]): any[] {
    if (!value) return [];

    return [
      ...new Map(
        value.map(
          (
            item //уникальные значения в массиве по ид
          ) => [item['id'], item]
        )
      ).values(),
    ];
  }
}
