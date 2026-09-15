/* eslint-disable */
import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorServiceService } from '../services/error-service.service';
import { CookieService } from 'ngx-cookie-service';
import { IServiceError } from '../interfaces/interface';
import { getErrorMessageByCode } from '../helpers';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly cookieService = inject(CookieService);

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        console.error('Caught error:', err); // Логирование ошибки

        if (err.status && !request.url.includes('UnsoldCopyLotWithValidation')) {
          const lang = this.cookieService.get('UasLang');

          const serverMessage = err.error?.title;

          const error: IServiceError = {
            error: true,
            errorStatus: err.status,
            messageError:
              getErrorMessageByCode(err.status, lang) || serverMessage,
          };

          this.errorServiceService.callErrorPopup(error);
        }

        // Составление сообщения об ошибке
        const error =
          err.error || err.error?.message || err.statusText || err.error?.title || 'Неизвестная ошибка';

        // Возвращаем ошибку в виде строки
        return throwError(() => error);
      })
    );
  }
}
