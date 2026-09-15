/* eslint-disable */
import { Injectable, inject } from '@angular/core';
import { CanActivate, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AppConfigService } from '../../app-config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  private readonly config = inject(AppConfigService);

  public canActivate():
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user?.token) {
      return true;
    }

    window.location.href = `${this.config.domain}/landingpage`;

    return false;
  }
}
