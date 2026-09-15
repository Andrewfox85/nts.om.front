/* eslint-disable */
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import { User } from 'src/app/core/classes/user';
import {getLocaleTimeFormat, Location} from '@angular/common';
import { applicationForm } from 'src/app/api.constants';
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import {TranslateService} from "@ngx-translate/core";
import {DatePipe} from "@angular/common";
@Component({
  selector: 'app-direct-start-create-offer',
  templateUrl: './direct-start-create-offer.component.html',
  styleUrls: ['./direct-start-create-offer.component.scss']
})
export class DirectStartCreateOfferComponent implements OnInit {
  user: User;

  firstStepForm: FormGroup;
  direction: any;
  marketTypesResult:any = []
  marketTypes:any = []


  modelsIdResult:any = [];
  modelsId: any = []

  modelsResult: any = [];

  sectionId: number;
  sessionId: number;

  description: any = [];

  error = false;
  messageError: string;
  disabledBtn: boolean = false;
  errorType: string; //чтобы при закрытии окна возвращаться в расписание сессии

  todayDate:Date = new Date();

  loadingVisible = true; //панель загрузки
  @Output() close = new EventEmitter<any>();

  constructor(
    public router: Router,
    private formBuilder: FormBuilder,
    private createOfferService: CreateOfferService,
    private location: Location,
    public translate: TranslateService,
  ) {

    /*   this.route.queryParams.subscribe(i=>{
        this.direction = i['direction'];
      }) */
  }



  ngOnInit(): void {

    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.sectionId = this.createOfferService.sectionId;
    this.sessionId = this.createOfferService.sessionId;
    this.direction = this.createOfferService.direction;
    this.GetModels()

    this.firstStepForm = this.formBuilder.group({
      marketTypeId: [null, Validators.required],
    });
  }

  GetModels(){
    this.createOfferService.GetModels(this.user?.token, this.sectionId, this.sessionId).then((res: any) => {
      this.modelsIdResult = res.data;
      this.modelsIdResult.forEach(item => {  //проверка на актуальность модели
        if(!item.isExpired && item.isDeletedAutomatically){
          item.onlyActive = false
        } else {
          item.onlyActive = true
        }
      });

      this.modelsIdResult.forEach(i => {
          this.modelsId.push(i.id)
      })
      this.GetMarketTypes();
    })
  }


  GetMarketTypes(){
    this.createOfferService.GetMarketsTypes(this.user?.token, this.modelsId, this.sectionId, this.direction).then((res: any) => {
      this.marketTypesResult = res.marketsTypes.filter(item => item.isAllowedTargetedTransact);

      this.marketTypesResult.forEach(item => {
        if(item.notes){
          this.description.push(item.notes)
        }
      })

      //в случае, если тип рынка 1 - не выбираем, а сразу переходим на подачу
      if(this.marketTypesResult.length == 1){
        this.firstStepForm.get('marketTypeId')?.patchValue(this.marketTypesResult[0].modelId);

        this.createOfferService.choosenMarketType = this.marketTypesResult[0].marketsTypes;
        this.createOfferService.modelId = this.marketTypesResult[0].modelId;

        this.modelsIdResult = this.modelsIdResult.filter(i => {
          return i.id == this.marketTypesResult[0].modelId
        });

        this.GetByModelId(this.modelsIdResult[0].onlyActive);

        //  this.router.navigate([`/createOffer`]);

      }
      else{
        this.loadingVisible = false;
      }
    })
  }


  //получение данных о сессии по id модели
  GetByModelId(onlyActive: boolean){

    this.createOfferService.GetByModelId(this.user?.token, this.sectionId, this.firstStepForm.value.marketTypeId, onlyActive).subscribe((res: any) => {
      if(res.data.length > 0) {
        res.data.forEach(item => {
          if (item.id == this.sessionId)
            this.modelsResult = item;
        })

        this.createOfferService.modelResult = this.modelsResult;

        //проверка на возможность подачи заявки на покупку
        if (this.direction == '1' && (this.modelsResult.applicationFormBuyerId == applicationForm.registrationSession && this.modelsResult.applicationFormSellerId == applicationForm.filingApplication)) {
          this.error = true;
          this.messageError = 'Проверка на возможность подачи заявки на покупку';
          this.errorType = 'stay'
          this.disabledBtn = true;
        }


        if (this.error == false && this.marketTypesResult.length == 1) {
          // this.getDemandsModal()
          this.router.navigate([`/createDirectOffer`]);
          this.loadingVisible = false;
        }
      }
      else{
        this.error = true;
        this.messageError = this.translate.store.currentLang == 'RU' ? RU["errors"].loadingApplicationData : EN["errors"].loadingApplicationData
        this.messageError = this.messageError.replace(/\n\r?/g, '<br />')
        this.errorType = 'stay'
        this.disabledBtn = true;
      }

    })
  }

  onChangeSelectBox(e: any) {
    this.firstStepForm.get('marketTypeId')?.patchValue(e.value);
    this.createOfferService.choosenMarketType = e.component.option("text");
    // sessionStorage.setItem('createOffer', JSON.stringify({choosenMarketType: e.component.option("text")}))

    let choosenModelInfo = this.modelsIdResult.filter(i => {
      return i.id == e.value
    });

    this.GetByModelId(choosenModelInfo[0].onlyActive)
  }

  goToLink(){
    this.createOfferService.modelId = this.firstStepForm.value.marketTypeId;
    this.router.navigate([`/createDirectOffer`]);
  }

  cancelForm(){
    location.reload()
  }

  onClose(type: string) {
    this.close.emit(false)
    if(type == 'returnBack'){
      this.router.navigate([`/sessions-schedule`]);
    }
  }
}
