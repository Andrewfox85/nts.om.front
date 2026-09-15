/**
 * Утилиты для header filter грида offer-management:
 * чтение значений по dataField, проверка «(Пусто)», числовое сравнение, каскадный список значений.
 */
import query from 'devextreme/data/query';
import dxDataGrid from 'devextreme/ui/data_grid';
import { StaticColumnFieldNames } from '../../../core/enums';

/**
 * Колонки, где в строке лежит массив чисел по goods (сборный лот).
 * Для них в calculateFilterExpressionNumeric нужна функция-фильтр (some по массиву),
 * для одного числа — нативное ['field', '=', value].
 */
export const NUMERIC_ARRAY_DATA_FIELDS: Set<string> = new Set<string>([
  StaticColumnFieldNames.VOLUME,
  StaticColumnFieldNames.PRICE,
  StaticColumnFieldNames.AMOUNT_VAT,
  StaticColumnFieldNames.TOTAL_AMOUNT,
]);

/**
 * Значение поля строки по dataField DevExtreme, в т.ч. вложенному (пример goods[0].vatAmount).
 * Аналог lodash/get без внешней зависимости.
 */
export function getValueByDataField(data: object, dataField: string): unknown {
  if (data == null || !dataField) {
    return undefined;
  }

  // goods[0].field → goods.0.field для split по точке
  const path: string = dataField
    .replace(/\[(\w+)]/g, '.$1')
    .replace(/^\./, '');

  return path.split('.').reduce<unknown>(
    (current: Record<string, unknown>, key: string): unknown => {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }

      return current[key];
    }, data
  );
}

/**
 * Строка попадает под фильтр «(Пусто)» для текстовых колонок (calculateFilterExpression).
 * null, '', пробелы; для массивов — пустой или все элементы пустые.
 */
export function isHeaderFilterFieldValueEmpty(
  data: { [key: string]: unknown },
  dataField: string,
): boolean {
  const fieldValue: unknown = getValueByDataField(data, dataField);

  if (fieldValue == null || fieldValue === '') {
    return true;
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.length === 0 || fieldValue.every(
      (value: unknown) => value == null || String(value).trim() === '',
    );
  }

  return String(fieldValue).trim() === '';
}

/**
 * Пустое значение для числового фильтра (список опций и сравнение).
 * Важно: 0 — не пусто, а самостоятельное значение в фильтре.
 */
export function isNumericHeaderFilterValueEmpty(value: unknown): boolean {
  if (value == null || value === '') {
    return true;
  }

  return typeof value === 'number' && Number.isNaN(value);
}

/**
 * Совпадение числа со значением в фильтре.
 * null/undefined в данных не матчатся с 0.
 */
export function matchesNumericHeaderFilterValue(
  fieldValue: unknown,
  selectedValue: unknown,
): boolean {
  if (isNumericHeaderFilterValueEmpty(fieldValue)) {
    return false;
  }

  const selectedFilterValue: number = Number(selectedValue);
  if (Number.isNaN(selectedFilterValue)) {
    return false;
  }

  return Number(fieldValue) === selectedFilterValue;
}

/**
 * Опция «(Пусто)» по числовому полю (calculateFilterExpressionNumeric).
 * Поддерживает одно число и массив на уровне goods.
 */
export function isHeaderFilterNumericFieldValueEmpty(
  data: { [key: string]: unknown },
  dataField: string,
): boolean {
  const fieldValue: unknown = getValueByDataField(data, dataField);

  if (fieldValue == null || fieldValue === '') {
    return true;
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.length === 0 || fieldValue.every((value: unknown) =>
      isNumericHeaderFilterValueEmpty(value),
    );
  }

  return isNumericHeaderFilterValueEmpty(fieldValue);
}

/**
 * Каскадный header filter: в списке значений только то, что есть в уже отфильтрованных строках.
 * Devextreme отдает тип any, который мы не используем по правилам eslint
 */
export function getDataForHeaderFilter(
  grid: dxDataGrid,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allData: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  if (!allData?.length) {
    return [];
  }

  try {
    // eslint-disable-next-line
    const filterExpr = grid.getCombinedFilter(true);

    if (!filterExpr) {
      return allData;
    }

    // eslint-disable-next-line
    return query(allData).filter(filterExpr).toArray();
  } catch {
    // При ошибке разбора фильтра не ломаем попап — отдаём полный набор
    return allData;
  }
}
