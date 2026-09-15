import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { AppService } from './app.service';
import { Store } from '@ngrx/store';
import { initializeApiData } from './store/api-data/api-data.actions';

@Component({
  selector: 'ceit-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [AppService]
})
export class AppComponent implements OnInit, OnDestroy {
  public title: string = 'NTSApp';

  public cookieService: CookieService = inject(CookieService);
  public message: string;

  constructor(private connect: AppService, private readonly store: Store) {
    if (this.cookieService.get('UasMessage')) {
      this.message = this.cookieService.get('UasMessage');
    }

    this.connect.subscribeOnLanguageChange();
  }

  public ngOnInit(): void {
    this.store.dispatch(initializeApiData());
  }

  public ngOnDestroy(): void {
    this.connect.unsubscribeOnDestroy();
  }
}
