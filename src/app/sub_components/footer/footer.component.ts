/* eslint-disable */
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppConfigService } from '../../app-config.service';
import { AppFacade } from '../../store/app.facade';
import { Observable } from 'rxjs';
import { sectionID } from '../../api.constants';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  public buildNumber: string = '';
  public feedbackStr: string;
  public currentYear: number = new Date().getFullYear();

  public sectionNamesById$: Observable<Record<number, string>>;
  public readonly sectionID = sectionID;

  constructor(
    private readonly config: AppConfigService,
    private readonly facade: AppFacade
  ) {
    this.buildNumber = environment.buildNumber || '';
    this.feedbackStr = `${this.config.ppDomain}Feedback`;
    this.sectionNamesById$ = this.facade.sectionNamesById$;
  }
}
