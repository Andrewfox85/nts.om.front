/* eslint-disable */
import { createFeatureSelector, createSelector } from "@ngrx/store";
import { LoadingPageState } from "./settings.state";
import { loadingFeatureKey } from "./settings.reducer";

export const selectLoadingState = createFeatureSelector<LoadingPageState>(loadingFeatureKey);

export const selectIsLoading = createSelector(
  selectLoadingState,
  (state: LoadingPageState): boolean => state.isLoading
);
