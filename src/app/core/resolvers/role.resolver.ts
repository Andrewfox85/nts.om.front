/* eslint-disable */
import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CreateOfferService } from '../services/create-offer-service.service';
import { EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class roleResolver implements Resolve<any> {
  constructor(
    private createOfferService: CreateOfferService,
    private router: Router
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    const sessionKey = JSON.parse(localStorage.getItem('user') || '{}').token;


    if (!sessionKey) {
      this.router.navigate(['/']);
      return of(null);
    }

    return this.createOfferService.GetRole(sessionKey).pipe(
      map(role => {
        return role;
      }),
      catchError(err => {
       // this.router.navigate(['/error-page']);
        return of(null);
      })
    );
  }
}