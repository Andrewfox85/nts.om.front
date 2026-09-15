/* eslint-disable */
import { Component, inject, OnInit } from '@angular/core';
import { ErrorServiceService } from '../../services/error-service.service';
import { User } from '../../classes/user';
import { CookieService } from 'ngx-cookie-service';
import { AppConfigService } from '../../../app-config.service';
import { SessionStorageService } from '../../../shared/services/session-storage-service/session-storage.service';
import { LocalStorageService } from '../../../shared/services/local-storage-service/local-storage.service';
import { UNAUTHORIZED_ERROR_CODE } from "../../constants";
import { ErrorStates } from "../../../api.constants";

@Component({
  selector: 'error-popup',
  templateUrl: './error-popup.component.html',
  styleUrls: ['./error-popup.component.scss'],
})
export class ErrorPopupComponent implements OnInit {
  private readonly config = inject(AppConfigService);
  private readonly errorServiceService = inject(ErrorServiceService);
  private readonly cookieService = inject(CookieService);
  private readonly sessionStorageService = inject(SessionStorageService);
  private readonly localStorageService = inject(LocalStorageService);
  protected readonly ErrorStates = ErrorStates;

  public error: boolean = false;
  public messageError: string;
  public status: number;
  public user: User;
  public errorState: number = ErrorStates.error;

  public ngOnInit(): void {
    this.errorServiceService.componentMethodCalled$.subscribe((res) => {
      this.error = res.error;
      this.status = res.errorStatus;
      this.messageError = res.messageError.replace(/\n\r?/g, '<br />');
      this.errorState = res.errorState ?? ErrorStates.error
    });
  }

  public logOut(): void {
    if ([UNAUTHORIZED_ERROR_CODE].includes(this.status)) {
      this.cookieService.delete('UasToken', '/');
      this.cookieService.delete('UasMessage', '/');
      this.cookieService.delete('UasLang', '/');
      this.sessionStorageService.clearSessionStorage();
      this.localStorageService.cleanLocalStorageFieldsAfterLogOut();

      window.location.href = `${this.config.domain}/landingpage`;
    }
  }
}
