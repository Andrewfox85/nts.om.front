/* eslint-disable */
import { createReducer, on } from '@ngrx/store';
import { getAllSectionsSuccess } from './api-data.actions';
import { ApiDataState, initialApiDataState } from './api-data.state';

export const apiDataFeatureKey = 'apiData';

export const apiDataReducer = createReducer(
  initialApiDataState,
  on(getAllSectionsSuccess, (state: ApiDataState, { data }) => ({
    ...state,
    sections: data
  }))
);
