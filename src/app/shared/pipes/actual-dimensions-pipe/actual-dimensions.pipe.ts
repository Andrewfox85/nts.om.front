import { Pipe, PipeTransform } from '@angular/core';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';

@Pipe({
  name: 'actualDimensions'
})
export class ActualDimensionsPipe implements PipeTransform {
  public transform(
    fieldName: ID_INTERFACE_FIELD,
    dynamicFields: { [key: string]: string }
  ): string {
    const value: string = dynamicFields?.[fieldName];
    const fieldNameNum: number = Number(fieldName);

    if (
      [
        ID_INTERFACE_FIELD.ACTUAL_DIAMETER,
        ID_INTERFACE_FIELD.ACTUAL_WIDTH,
        ID_INTERFACE_FIELD.ACTUAL_THICKNESS,
        ID_INTERFACE_FIELD.ACTUAL_LENGTH
      ].includes(fieldNameNum)
    ) {
      return value ? value.split('#')[0] : '-';
    }

    return value || '-';
  }
}
