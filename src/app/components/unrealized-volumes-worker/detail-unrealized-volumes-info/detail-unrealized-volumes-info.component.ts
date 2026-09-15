/* eslint-disable */
import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {User} from "../../../core/classes/user";
import {sessionStage} from "../../../api.constants";
import {ActivatedRoute, Router} from "@angular/router";
import {TranslateService} from "@ngx-translate/core";
import {CreateOfferService} from "../../../core/services/create-offer-service.service";
import {CommonService} from "../../../core/services/common-service.service";

@Component({
  selector: 'app-detail-unrealized-volumes-info',
  templateUrl: './detail-unrealized-volumes-info.component.html',
  styleUrls: ['./detail-unrealized-volumes-info.component.scss']
})
export class DetailUnrealizedVolumesInfoComponent implements OnInit {
  outputArray : any;
  sessionInfo : any;
  sessionStage = sessionStage;
  title: string;

  constructor(
    private route: ActivatedRoute,
    public translate: TranslateService,
    public router: Router,
    private createOfferService: CreateOfferService,
    public commonService: CommonService,
   ) {
    this.outputArray = JSON.parse(localStorage.getItem('unrealizedVolumesData'))

    this.route.queryParams.subscribe(i=>{
      //this.outputArray = JSON.parse(i['json']);
      this.sessionInfo = JSON.parse(i['session']);
      this.title =  i['title'];
    })
  }

  onViewOffer(idOffer){
/*  /!*  this.createOfferService.sectionId =  this.sessionInfo.idSection;
    this.createOfferService.sessionId =  this.sessionInfo.idSession;
    this.createOfferService.idOffer = idOffer;
   "isArchive":true,"unsold":true,;*!/
    this.createOfferService.isArchive = true;
    this.createOfferService.unsold = true
    localStorage.setItem('viewOffer', JSON.stringify({"idOffer":42099,"idSection":this.sessionInfo.idSection,"idSession":this.sessionInfo.idSession}));
  //  this.router.navigateByUrl('/view-offer')
    const url = this.router.serializeUrl(this.router.createUrlTree([`/ordermanagement/view-offer`]));
    window.open(url, '_blank');*/
  }

  ngOnInit(): void {
 }

}
