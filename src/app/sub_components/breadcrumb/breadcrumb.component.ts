/* eslint-disable */
import {Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import RU from "../../../assets/i18n/RU.json";
import EN from "../../../assets/i18n/EN.json";


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  @Input() namePage: string;
  @Input() router;
  @Input() children;

  str: string = '';
  breadcrumbsPagesData: any = [
    {name: this.translate.store.currentLang == 'RU' ? RU["general"].homePage : EN["general"].homePage, url: '/'},
  ];
  fullRouterBreadcrumbs: any[];

  constructor(
    private activatedRoute: ActivatedRoute,
    public translate: TranslateService
  ) {
    if (this.activatedRoute.snapshot.data['breadcrumbs']) {

      this.translate.get(this.activatedRoute.snapshot.data['breadcrumbs'].name).subscribe((res: string)=>{
        this.activatedRoute.snapshot.data['breadcrumbs'].name = res
      })
      this.breadcrumbsPagesData.push(this.activatedRoute.snapshot.data['breadcrumbs']);
      this.fullRouterBreadcrumbs = this.breadcrumbsPagesData;
    }

  }

  ngOnInit(): void {
    if (this.namePage && this.router) {
      this.breadcrumbsPagesData.push({name: this.namePage, url: this.router})
      this.fullRouterBreadcrumbs = this.breadcrumbsPagesData;
    }
  }

}
