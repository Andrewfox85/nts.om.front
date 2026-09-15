import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Injectable()
export class AppService {
  private subscriptions: Subscription[] = [];

  constructor(private translate: TranslateService) {}

  public subscribeOnLanguageChange(): void {
    const subscribeOnLanguageChange: Subscription = this.translate
      .stream('filters.gridFiltersText')
      .subscribe((val: string) => {
        document.documentElement.style.setProperty(
          '--grid-filter-text',
          `"${val}"`
        );
      });
    this.subscriptions.push(subscribeOnLanguageChange);
  }

  public unsubscribeOnDestroy(): void {
    this.subscriptions.forEach((subs: Subscription): void => {
      subs.unsubscribe();
    });
  }
}
