/* eslint-disable */
import {Component, OnInit, Input} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/core/classes/user';
import { pricingType } from 'src/app/api.constants';

@Component({
  selector: 'app-restore-offer',
  templateUrl: './restore-offer.component.html',
  styleUrls: ['./restore-offer.component.scss']
})
export class RestoreOfferComponent implements OnInit {
  user: User;
  @Input() infoForRestore;  

  pricingType = pricingType;

  constructor(
    public translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  getNumber(value) {
    return Number(value)
  }

}
