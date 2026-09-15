/* eslint-disable */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, take, switchMap, tap } from 'rxjs'; // Добавляем take и switchMap

import { AccreditedRoleService } from '../services/accredited-role.service';

@Injectable()
export class ConditionalHeaderRemovalInterceptor implements HttpInterceptor {
  constructor(private readonly accreditedRoleService: AccreditedRoleService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const headerToRemove = 'authorization';

    return this.accreditedRoleService.role$.pipe(
      take(1),
      switchMap((role: string) => {
        if (role === '0' && request.headers.has(headerToRemove)) {
          const modifiedRequest = request.clone({
            headers: request.headers.delete(headerToRemove),
          });
          return next.handle(modifiedRequest);
        } else {
          return next.handle(request);
        }
      })
    );
  }
}
