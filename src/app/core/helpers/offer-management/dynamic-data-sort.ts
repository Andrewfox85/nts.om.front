/* eslint-disable */
export function dynamicDataSort(values: Array<string | number>): string | number {
  const sortSourceValue: string | number = values.find((value: string | number): boolean => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
  });

  if (sortSourceValue === null || sortSourceValue === undefined) {
    return null;
  }

  if (typeof sortSourceValue === 'number') {
    return sortSourceValue;
  }

  const text: string = String(sortSourceValue).trim();

  if (text === '') {
    return null;
  }

  return text.toLowerCase();
}
