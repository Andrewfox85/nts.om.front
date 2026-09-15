/* eslint-disable */
import { createAction, props } from '@ngrx/store';

export const setLoading = createAction(
  '[Loading Page] Show Loading Page',
  props<{ isLoading: boolean }>()
);
