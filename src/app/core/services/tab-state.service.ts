/* eslint-disable */
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const STORAGE_KEY = 'tabIndex';
const INITIAL_INDEX = 0;

@Injectable({
  providedIn: 'root',
})
export class TabStateService implements OnDestroy {
  private subjects = new Map<string, BehaviorSubject<number>>();
  private destroy$ = new Subject<void>();

  getIndex$(page: string): Observable<number> {
    if (!this.subjects.has(page)) {
      const saved = sessionStorage.getItem(`${STORAGE_KEY}_${page}`);
      const initial = saved
        ? parseInt(saved, 10) || INITIAL_INDEX
        : INITIAL_INDEX;
      this.subjects.set(page, new BehaviorSubject(initial));
    }
    return this.subjects.get(page)!.asObservable();
  }

  setIndex(i: number, page: string): void {
    if (!this.subjects.has(page)) {
      this.subjects.set(page, new BehaviorSubject(INITIAL_INDEX));
    }
    this.subjects.get(page)!.next(i);
    sessionStorage.setItem(`${STORAGE_KEY}_${page}`, i.toString());
  }

  getIndex(page: string): number {
    return this.subjects.get(page)?.value ?? INITIAL_INDEX;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
