/* eslint-disable */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccreditedRoleService {
  private _role$ = new BehaviorSubject<string>('');

  get role$(): Observable<string> {
    return this._role$.asObservable();
  }

  setRole(i: string): void {
    this._role$.next(i);
  }

  getRole(): string {
    return this._role$.value;
  }
}
