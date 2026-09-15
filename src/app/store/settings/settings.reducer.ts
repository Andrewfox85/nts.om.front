/* eslint-disable */
import { createReducer, on } from '@ngrx/store';
import * as LoadingActions from './settings.action';
import { initialLoadingPageState, LoadingPageState } from "./settings.state";

export const loadingFeatureKey = 'loadingPage';

export const loadingPageReducer = createReducer(
  initialLoadingPageState,

  on(LoadingActions.setLoading, (state: LoadingPageState, { isLoading }) => ({
    ...state,
    isLoading
  }))
);
