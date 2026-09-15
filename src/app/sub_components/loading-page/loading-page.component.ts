import { Component } from '@angular/core';
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { selectIsLoading } from "../../store/settings/settings.selectors";

@Component({
  selector: 'ceit-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss']
})
export class LoadingPageComponent {
  public isLoading$: Observable<boolean>;

  constructor(private store: Store) {
    this.isLoading$ = this.store.select(selectIsLoading);
  }

}
