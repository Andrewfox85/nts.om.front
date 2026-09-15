/* eslint-disable */
import {inject, Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";
import {CookieService} from "ngx-cookie-service";

@Injectable()
export class LanguageInterceptor implements HttpInterceptor {
  cookieService = inject(CookieService)

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
/*/!*    const user = JSON.parse(localStorage.getItem('user') || '{}');;
    const isLoggedIn = user && user.token;*!/
    // const isApiUrl = request.url.startsWith(environment.backendINV);&& isApiUrl
/!*    if (isLoggedIn ) {*!/
      request = request.clone({
        setHeaders: {
          UasLang: `${JSON.parse(localStorage.getItem('lang'))}`
        }
      });
    // }

    return next.handle(request);*/
    return next.handle(request.clone({
      headers: request.headers.append('UasLang', this.cookieService.get('UasLang'))
    }));
  }
}
