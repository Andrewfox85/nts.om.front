/* eslint-disable */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sessionStage } from '../../../api.constants';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/core/classes/user';
import { CommonService } from 'src/app/core/services/common-service.service';
import { take } from "rxjs/operators";

@Component({
  selector: 'app-detail-rejection-info',
  templateUrl: './detail-rejection-info.component.html',
  styleUrls: ['./detail-rejection-info.component.scss'],
})
export class DetailRejectionInfoComponent implements OnInit {
  outputArray: any;
  session: any;
  nameSessionStage: string;
  sessionStage = sessionStage;
  user: User;
  title: string;

  constructor(
    private route: ActivatedRoute,
    public translate: TranslateService,
    public router: Router,
    private commonService: CommonService
  ) {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.route.queryParams
      .pipe(take(1))
      .subscribe(params => {
        const key: string = params['key'];
        if (key) {
          const dataStr: string = sessionStorage.getItem(key);
          if (dataStr) {
            try {
              const data: Object = JSON.parse(dataStr);
              this.outputArray = data['json'];
              this.session = data['session'];
              this.title = data['title'];
              this.nameSessionStage = this.commonService.choosenSessionStage(Number(this.session?.stageId), this.user?.IsWorker, this.translate.store.currentLang);
              sessionStorage.removeItem(key);
            } catch (e) {
              console.error('Error parsing data:', e);
            }
          }
        }
      });
  }

  ngOnInit(): void {
  }

  openViewOffer(idOffer: number, direction: number): void {
    localStorage.setItem(
      'viewOffer',
      JSON.stringify({ idOffer, direction })
    );
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`/ordermanagement/view-offer`])
    );
    window.open(url, '_blank');
  }
}
