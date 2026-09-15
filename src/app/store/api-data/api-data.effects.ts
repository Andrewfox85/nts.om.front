/* eslint-disable */
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { CommonService } from '../../core/services/common-service.service';
import { catchError, map, of, switchMap } from 'rxjs';
import {
  getAllSections,
  getAllSectionsFailure,
  getAllSectionsSuccess,
  initializeApiData,
} from './api-data.actions';
import { GetByNameResponse } from '../../core/services/catalog-service.service';

@Injectable()
export class ApiDataEffects {
  public initialize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(initializeApiData),
      map(() => getAllSections())
    )
  );

  public getAllSections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(getAllSections),
      switchMap(() =>
        this.commonService.getAllSections().pipe(
          map((data: GetByNameResponse) => getAllSectionsSuccess({ data })),
          catchError((error: unknown) => of(getAllSectionsFailure({ error })))
        )
      )
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly commonService: CommonService
  ) {}
}
