import { ActionReducerMap } from '@ngrx/store';
import { routerReducer } from '@ngrx/router-store';
import { apiDataFeatureKey, apiDataReducer } from './api-data/api-data.reducer';
import { ApiDataState } from './api-data/api-data.state';
import { loadingFeatureKey, loadingPageReducer } from "./settings/settings.reducer";
import { LoadingPageState } from "./settings/settings.state";

export interface AppState {
  router: ReturnType<typeof routerReducer>;
  [apiDataFeatureKey]: ApiDataState;
  [loadingFeatureKey]: LoadingPageState;
}

export const appReducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  [apiDataFeatureKey]: apiDataReducer,
  [loadingFeatureKey]: loadingPageReducer,
};
