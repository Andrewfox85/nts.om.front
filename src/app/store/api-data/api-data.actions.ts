/* eslint-disable */
import { createAction, props } from '@ngrx/store';
import { GetByNameResponse } from '../../core/services/catalog-service.service';

export const initializeApiData = createAction('[Api Data] Initialize');

export const getAllSections = createAction('[Api Data] Get All Sections');

export const getAllSectionsSuccess = createAction(
  '[Api Data] Get All Sections Success',
  props<{ data: GetByNameResponse }>()
);

export const getAllSectionsFailure = createAction(
  '[Api Data] Get All Sections Failure',
  props<{ error: unknown }>()
);
