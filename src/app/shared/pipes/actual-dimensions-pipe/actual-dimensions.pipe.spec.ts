import { ActualDimensionsPipe } from './actual-dimensions.pipe';
import { ID_INTERFACE_FIELD } from 'src/app/shared/enums';

describe('ActualDimensionsPipe', () => {
  let pipe: ActualDimensionsPipe;

  beforeEach(() => {
    pipe = new ActualDimensionsPipe();
  });

  it('should return actual dimension (split by "#") for specific fieldNames', () => {
    const dynamicFields: { [key: string]: string } = {
      [ID_INTERFACE_FIELD.ACTUAL_DIAMETER]: '100#200',
      [ID_INTERFACE_FIELD.ACTUAL_WIDTH]: '300#400',
      [ID_INTERFACE_FIELD.ACTUAL_THICKNESS]: '500#600',
      [ID_INTERFACE_FIELD.ACTUAL_LENGTH]: '700#800'
    };

    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_DIAMETER, dynamicFields)).toBe('100');
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_WIDTH, dynamicFields)).toBe('300');
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_THICKNESS, dynamicFields)).toBe('500');
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_LENGTH, dynamicFields)).toBe('700');
  });

  it('should return full value for non-special fieldNames', () => {
    const dynamicFields: { [key: string]: string } = {
      [ID_INTERFACE_FIELD.FINANCE_SOURCE]: 'nonSplitValue',
      [ID_INTERFACE_FIELD.OKRB007]: 'anotherValue'
    };

    expect(pipe.transform(ID_INTERFACE_FIELD.FINANCE_SOURCE, dynamicFields)).toBe('nonSplitValue');
    expect(pipe.transform(ID_INTERFACE_FIELD.OKRB007, dynamicFields)).toBe('anotherValue');
  });

  it('should return "-" if value is missing for special fieldNames', () => {
    const dynamicFields: { [key: string]: string } = {
      [ID_INTERFACE_FIELD.ACTUAL_DIAMETER]: '',
      [ID_INTERFACE_FIELD.ACTUAL_WIDTH]: null
    };

    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_DIAMETER, dynamicFields)).toBe('-');
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_WIDTH, dynamicFields)).toBe('-');
  });

  it('should return "-" if dynamicFields is null or undefined', () => {
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_DIAMETER, null)).toBe('-');
    expect(pipe.transform(ID_INTERFACE_FIELD.ACTUAL_WIDTH, undefined)).toBe('-');
  });

  it('should return "-" if fieldName is not in dynamicFields', () => {
    const dynamicFields: { [key: string]: string } = {
      [ID_INTERFACE_FIELD.FINANCE_SOURCE]: 'something'
    };

    expect(pipe.transform('999' as unknown as ID_INTERFACE_FIELD, dynamicFields)).toBe('-');
  });
});
