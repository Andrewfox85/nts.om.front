/* eslint-disable */
import { Component } from '@angular/core';
import { numberEntriesPage } from 'src/app/api.constants';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-detail-info',
  templateUrl: './detail-info.component.html',
  styleUrls: ['./detail-info.component.scss']
})
export class DetailInfoComponent {

  numberEntriesPage = numberEntriesPage;
  outputArray : any;
  session : any;
  title: string;

  constructor(
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(i=>{
      this.outputArray = JSON.parse(i['json']);
      this.session = JSON.parse(i['session']);
      this.title =  i['title'];
    })
  }

}
