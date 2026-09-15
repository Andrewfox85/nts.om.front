import dxDataGrid from 'devextreme/ui/data_grid';
import { TableFiltersData } from '../../../core/interfaces';
import { GoodApiModel, OfferModel } from '../../../core/interfaces/interface';
import { FilterOption, FilterValueType } from '../../../shared/interfaces';
import {
  getDataForHeaderFilter,
  getValueByDataField,
  isNumericHeaderFilterValueEmpty,
} from './header-filter-data.helper';
import { getTranslateResultByCurrentLang } from '../../../core/helpers';
import RU from '../../../../assets/i18n/RU.json';
import EN from '../../../../assets/i18n/EN.json';

interface HeaderFilterDataSourceContext {
  component: dxDataGrid;
}

function getRootPropertyValue(offer: OfferModel, propertyName: string): unknown {
  return offer[propertyName];
}

function toFilterValue(value: unknown): FilterValueType {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return String(value ?? '');
}

function toFilterText(value: unknown): string {
  if (value == null) {
    return '';
  }

  return String(value);
}

function generateTableFilters(allFilters: FilterOption[]): TableFiltersData {
  let hasNonEmptyValues: boolean = false;
  let hasYesValue: boolean = false;
  let hasNoValue: boolean = false;

  allFilters.forEach((dest: FilterOption): void => {
    if (dest.value == null || dest.value === '') {
      hasNonEmptyValues = true;
    }
    if (dest.value === false) {
      hasNoValue = true;
    }
    if (dest.value === true) {
      hasYesValue = true;
    }
  });

  const results: FilterOption[] = allFilters.filter(
    (dest: FilterOption) =>
      dest.value != null &&
      dest.value !== '' &&
      dest.value !== false &&
      dest.value !== true,
  );

  return { results, hasNonEmptyValues, hasNoValue, hasYesValue };
}

export function generateFiltersByRoot(
  currentData: OfferModel[],
  propertyName: string,
): TableFiltersData {
  const results: FilterOption[] = currentData.reduce<FilterOption[]>(
    (acc: FilterOption[], item: OfferModel): FilterOption[] => {
      const propertyValue: unknown = getRootPropertyValue(item, propertyName);
      const filterValue: FilterValueType = toFilterValue(propertyValue);

      return [
        ...acc,
        {
          key: [filterValue],
          value: filterValue,
          text: toFilterText(propertyValue),
        },
      ];
    },
    [],
  );

  return generateTableFilters(results);
}

export function generateFiltersByGood(
  currentData: OfferModel[],
  propertyName: string,
): TableFiltersData {
  const results: FilterOption[] = currentData.reduce<FilterOption[]>(
    (acc: FilterOption[], item: OfferModel): FilterOption[] => {
      const goodsItems: FilterOption[] = (item.goods ?? []).map((good: GoodApiModel): FilterOption => {
        const tableValue: unknown = getValueByDataField(good, propertyName);
        const filterValue: FilterValueType = toFilterValue(tableValue);

        return {
          key: [filterValue],
          value: filterValue,
          text: toFilterText(tableValue),
        };
      });

      return [...acc, ...goodsItems];
    },
    [],
  );

  return generateTableFilters(results);
}

/**
 * Список значений header filter для числовых полей goods.
 * 0 остаётся в списке как «0», null/undefined — в «(Пусто)».
 */
export function generateFiltersByNumericGood(
  currentData: OfferModel[],
  propertyName: string,
): TableFiltersData {
  const results: FilterOption[] = [];
  let hasNonEmptyValues: boolean = false;

  currentData.forEach((item: OfferModel): void => {
    (item.goods ?? []).forEach((good: GoodApiModel): void => {
      const tableValue: unknown = getValueByDataField(good, propertyName);
      if (isNumericHeaderFilterValueEmpty(tableValue)) {
        hasNonEmptyValues = true;
        return;
      }

      const filterValue: FilterValueType = tableValue as FilterValueType;
      results.push({
        key: [filterValue],
        value: filterValue,
        text: String(tableValue),
      });
    });
  });

  return {
    results: getUniqueResults(results),
    hasNonEmptyValues,
    hasNoValue: false,
    hasYesValue: false,
  };
}

export function getEmptyValuesResults(results: FilterOption[], currentLang: string): FilterOption[] {
  const emptyValue: FilterOption = {
    key: [''],
    value: '',
    text: getTranslateResultByCurrentLang(
      currentLang,
      'filters.empty'
    )
  };
  return [emptyValue, ...results];
}

export function getNoValue(results: FilterOption[], currentLang: string): FilterOption[] {
  const emptyValue: FilterOption = {
    key: [false],
    value: false,
    text: getTranslateResultByCurrentLang(
      currentLang,
      'btns.no'
    )
  };
  return [emptyValue, ...results];
}

export function getYesValue(results: FilterOption[], currentLang: string): FilterOption[] {
  const emptyValue: FilterOption = {
    key: [true],
    value: true,
    text: getTranslateResultByCurrentLang(
      currentLang,
      'btns.yes'
    )
  };
  return [emptyValue, ...results];
}

export function getUniqueResults(results: FilterOption[]): FilterOption[] {
  return [...new Map(results.map((item: FilterOption) => [item['value'], item])).values()];
}

export const VAT_PERCENT_WITHOUT_VAT_FILTER_VALUE: string = '__WITHOUT_VAT__';

export function getVatPercentWithoutVatLabel(currentLang: string): string {
  return getTranslateResultByCurrentLang(
    currentLang,
    'general.withoutVAT'
  );
}

export function generateFiltersByVatPercent(
  currentData: OfferModel[],
  currentLang: string,
): FilterOption[] {
  let hasWithoutVat: boolean = false;
  const results: FilterOption[] = [];

  currentData.forEach((item: OfferModel): void => {
    const vatPercent: number | null = item.vatPercent ?? null;
    if (vatPercent == null) {
      hasWithoutVat = true;
      return;
    }

    results.push({
      key: [vatPercent],
      value: vatPercent,
      text: String(vatPercent),
    });
  });

  const uniqueResult: FilterOption[] = getUniqueResults(results).sort(
    (left: FilterOption, right: FilterOption): number => Number(left.value) - Number(right.value),
  );

  if (hasWithoutVat) {
    uniqueResult.unshift({
      key: [null as unknown as FilterValueType],
      value: VAT_PERCENT_WITHOUT_VAT_FILTER_VALUE,
      text: getVatPercentWithoutVatLabel(currentLang),
    });
  }

  return uniqueResult;
}

function addSpecificFilters(tableFilters: TableFiltersData, currentLang: string): FilterOption[] {
  let results: FilterOption[] = tableFilters.results;
  if (tableFilters.hasNonEmptyValues) {
    results = getEmptyValuesResults(results, currentLang);
  }
  if (tableFilters.hasNoValue) {
    results = getNoValue(results, currentLang);
  }
  if (tableFilters.hasYesValue) {
    results = getYesValue(results, currentLang);
  }
  return results;
}

export function updateFiltersByVatPercent(
  getAllData: () => OfferModel[],
  data: HeaderFilterDataSourceContext,
  currentLang: string,
): () => FilterOption[] {
  return (): FilterOption[] => {
    const currentData: OfferModel[] = getDataForHeaderFilter(
      data.component,
      getAllData() ?? [],
    ) as OfferModel[];
    const result: FilterOption[] = generateFiltersByVatPercent(currentData, currentLang);

    return result;
  };
}

export function updateFiltersByRootProperty(
  getAllData: () => OfferModel[],
  data: HeaderFilterDataSourceContext,
  propertyName: string,
  currentLang: string,
): () => FilterOption[] {
  return (): FilterOption[] => {
    const currentData: OfferModel[] = getDataForHeaderFilter(
      data.component,
      getAllData() ?? [],
    ) as OfferModel[];
    const generatedResults: TableFiltersData = generateFiltersByRoot(currentData, propertyName);
    const results: FilterOption[] = addSpecificFilters(generatedResults, currentLang);
    return getUniqueResults(results);
  };
}

export function updateFiltersByGoodsProperty(
  getAllData: () => OfferModel[],
  data: HeaderFilterDataSourceContext,
  propertyName: string,
  currentLang: string,
): () => FilterOption[] {
  return (): FilterOption[] => {
    const currentData: OfferModel[] = getDataForHeaderFilter(
      data.component,
      getAllData() ?? [],
    ) as OfferModel[];
    const generatedResults: TableFiltersData = generateFiltersByGood(currentData, propertyName);
    const results: FilterOption[] = addSpecificFilters(generatedResults, currentLang);
    return getUniqueResults(results);
  };
}

export function updateFiltersByNumericGoodsProperty(
  getAllData: () => OfferModel[],
  data: HeaderFilterDataSourceContext,
  propertyName: string,
  currentLang: string,
): () => FilterOption[] {
  return (): FilterOption[] => {
    const currentData: OfferModel[] = getDataForHeaderFilter(
      data.component,
      getAllData() ?? [],
    ) as OfferModel[];
    const generatedResults: TableFiltersData = generateFiltersByNumericGood(
      currentData,
      propertyName,
    );
    const results: FilterOption[] = addSpecificFilters(generatedResults, currentLang);
    return getUniqueResults(results);
  };
}

export function isHeaderFilterEmptySelection(value: unknown): boolean {
  return (
    value === '' ||
    value == null ||
    value === RU['filters'].empty ||
    value === EN['filters'].empty
  );
}
