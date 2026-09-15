import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectSectionNamesById } from './api-data/api-data.selectors';

@Injectable({
  providedIn: 'root',
})
export class AppFacade {
  public readonly sectionNamesById$: Observable<Record<number, string>> =
    this.store.select(selectSectionNamesById);

  constructor(private readonly store: Store) {}
}
