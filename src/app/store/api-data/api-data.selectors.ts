/* eslint-disable */
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { apiDataFeatureKey } from './api-data.reducer';
import { ApiDataState } from './api-data.state';
import { GetByNameResponse, RefbookItem } from '../../core/services/catalog-service.service';

export const selectApiDataState =
  createFeatureSelector<ApiDataState>(apiDataFeatureKey);

export const selectApiSections = createSelector(
  selectApiDataState,
  (state: ApiDataState): GetByNameResponse | null => state.sections
);

export const selectSectionNamesById = createSelector(
  selectApiSections,
  (sections: GetByNameResponse): Record<number, string> =>
    (sections?.refbooks ?? []).reduce<Record<number, string>>((acc: Record<number, string>, item: RefbookItem) => {
      const id: number = Number(item.id);
      acc[id] = item.name;
      return acc;
    }, {})
);
