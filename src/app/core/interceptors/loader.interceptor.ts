/* eslint-disable */
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpResponse
} from '@angular/common/http';
import {delay, finalize, Observable, tap} from 'rxjs';
import {LoaderPanelService} from "./loader-panel/loader-panel.service";
import {ok} from "assert";
import {AppConfigService} from "../../app-config.service";

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  private requestsArray: HttpRequest<unknown>[] = [];

  constructor(
    private loaderPanelService: LoaderPanelService,
  ) {}

  removeRequest(req: HttpRequest<unknown>) {
    const i = this.requestsArray.indexOf(req);
    if (i >= 0) {
      this.requestsArray.splice(i, 1);
    }
    if(this.requestsArray.length == 0){
      if(this.timer){
        clearTimeout(this.timer);
      }
      this.loaderPanelService.startLoader(false);
    }
  }

  timer: NodeJS.Timeout;

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if(this.timer){
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.loaderPanelService.startLoader(true), 200);
    this.requestsArray.push(request); // добавляем в массив

    // this.loaderPanelService.startLoader(true);    //запускается лодер
    return next.handle(request)
      .pipe(
        tap({
          // Операция не удалась;
          error: (_error) => {                    //если ошибка, очищаем массив запросов
            this.requestsArray.length = 0;
            this.loaderPanelService.startLoader(false)
          }
        }),
        // Регистрируем, когда наблюдаемый ответ либо завершается, либо возникает ошибка
        finalize(() => {
          this.removeRequest(request);
        })
      );
  }
}
