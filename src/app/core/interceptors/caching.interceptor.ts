/* eslint-disable */
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpContextToken
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

export const CACHING_ENABLED = new HttpContextToken<boolean>(() => false);

const cache = new Map<string, HttpResponse<unknown>>();

@Injectable()
export class CachingInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (request.context.get(CACHING_ENABLED)) {
      const cachedResponse = cache.get(request.urlWithParams);
      if (cachedResponse) {
        return of(cachedResponse.clone());
      }

      return next.handle(request).pipe(
        tap((event) => {
          if (event instanceof HttpResponse) {
            cache.set(request.urlWithParams, event.clone());
          }
        })
      );
    }

    return next.handle(request);
  }
}

export function clearCache(): void {
  cache.clear();
}