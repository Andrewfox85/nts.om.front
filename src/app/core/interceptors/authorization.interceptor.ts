/* eslint-disable */
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
  intercept<T>(
    request: HttpRequest<T>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    let sessionKey: string | null = null;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      sessionKey = user?.token ?? null;
    } catch {
      sessionKey = null;
    }

    if (!sessionKey) {
      return next.handle(request);
    }

    return next.handle(
      request.clone({
        setHeaders: { Authorization: sessionKey },
      }),
    );
  }
}

