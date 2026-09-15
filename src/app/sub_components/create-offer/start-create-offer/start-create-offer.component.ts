/* eslint-disable */
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import { User } from 'src/app/core/classes/user';
import { applicationForm } from 'src/app/api.constants';
import RU from '../../../../assets/i18n/RU.json';
import EN from '../../../../assets/i18n/EN.json';
import { TranslateService } from '@ngx-translate/core';
import { ValueChangedEvent } from 'devextreme/ui/select_box';

@Component({
  selector: 'app-start-create-offer',
  templateUrl: './start-create-offer.component.html',
  styleUrls: ['./start-create-offer.component.scss'],
})
export class StartCreateOfferComponent implements OnInit {
  @Input() chooseTheWay;
  @Input() sessionInfo;

  user: User;

  firstStepForm: FormGroup = this.formBuilder.group({
    submitWay: [1, Validators.required],
    marketTypeId: [null, Validators.required],
  });

  direction: any;
  marketTypesResult: any = [];
  marketTypes: any = [];

  modelsIdResult: any = [];
  modelsId: any = [];

  modelsResult: any = [];

  sectionId: number;
  sessionId: number;

  description: any = [];

  error = false;
  messageError: string;
  disabledBtn: boolean = false;
  errorType: string; //чтобы при закрытии окна возвращаться в расписание сессии

  todayDate: Date = new Date();

  chooseArchiveOfferPopup: boolean = false;

  loadingVisible; //! = true; //панель загрузки
  @Output() close = new EventEmitter<any>();

  constructor(
    public router: Router,
    private formBuilder: FormBuilder,
    public createOfferService: CreateOfferService,
    public translate: TranslateService
  ) {
    /*   this.route.queryParams.subscribe(i=>{
      this.direction = i['direction'];
    }) */
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    //!
    /*  this.sectionId = this.createOfferService.sectionId;
    this.sessionId = this.createOfferService.sessionId;
    this.direction = this.createOfferService.direction;
    this.GetModels()

    this.firstStepForm = this.formBuilder.group({
      marketTypeId: [null, Validators.required],
    }); */
  }

  onShowing(e) {
    this.sectionId = this.createOfferService.sectionId;
    this.sessionId = this.createOfferService.sessionId;
    this.direction = this.createOfferService.direction;
    this.GetModels();
  }

  GetModels() {
    this.createOfferService
      .GetModels(this.user?.token, this.sectionId, this.sessionId)
      .then((res: any) => {
        this.modelsIdResult = res.data;

        /*   this.modelsIdResult.forEach(item => {  //проверка на актуальность модели
        if(item.endDate){
          const endDateStr = Date.parse(item.endDate);
          this.modelsIdResult = this.modelsIdResult.filter(i => {
            return endDateStr >= this.todayDate.getTime()
          });
        }
      }); */

        this.modelsIdResult.forEach((item) => {
          //проверка на актуальность модели
          if (!item.isExpired && item.isDeletedAutomatically) {
            item.onlyActive = false;
          } else {
            item.onlyActive = true;
          }
        });

        this.modelsIdResult.forEach((i) => {
          this.modelsId.push(i.id);
        });

        this.GetMarketTypes();

        /*  if(this.modelsId.length > 0){
         this.GetMarketTypes();
      } else {
        this.error = true;
        this.messageError = 'МОДЕЛИ ПРОСРОЧЕНЫ';
        this.errorType = 'returnBack'
      } */
      });
  }

  GetMarketTypes() {
    this.createOfferService
      .GetMarketsTypes(
        this.user?.token,
        this.modelsId,
        this.sectionId,
        this.direction
      )
      .then((res: any) => {
        this.marketTypesResult = res.marketsTypes;

        this.marketTypesResult.forEach((item) => {
          if (item.notes) {
            this.description.push(item.notes);
          }
        });

        //в случае, если тип рынка 1 - не выбираем, а сразу переходим на подачу
        if (this.marketTypesResult.length == 1) {
          this.firstStepForm
            .get('marketTypeId')
            ?.patchValue(this.marketTypesResult[0].modelId);

          this.createOfferService.choosenMarketType =
            this.marketTypesResult[0].marketsTypes;
          this.createOfferService.modelId = this.marketTypesResult[0].modelId;

          this.modelsIdResult = this.modelsIdResult.filter((i) => {
            return i.id == this.marketTypesResult[0].modelId;
          });

          this.GetByModelId(this.modelsIdResult[0]?.onlyActive);

          //  this.router.navigate([`/createOffer`]);
        } else {
          this.loadingVisible = false;
        }
      });
  }

  //получение данных о сессии по id модели
  public GetByModelId(onlyActive: boolean): void {
    this.createOfferService
      .GetByModelId(
        this.user?.token,
        this.sectionId,
        this.firstStepForm.value.marketTypeId,
        onlyActive
      )
      .subscribe((res: any) => {
        if (res.data.length > 0) {
          this.modelsResult = [];
          res.data.forEach((item) => {
            if (item.id == this.sessionId) this.modelsResult = item;
          });

          this.createOfferService.modelResult = this.modelsResult;

          //проверка на возможность подачи заявки на покупку
          if (
            this.direction == '1' &&
            this.modelsResult.applicationFormBuyerId ==
              applicationForm.registrationSession &&
            this.modelsResult.applicationFormSellerId ==
              applicationForm.filingApplication
          ) {
            this.error = true;
            this.messageError =
              'Проверка на возможность подачи заявки на покупку';
            this.errorType = 'stay';
            this.disabledBtn = true;
          }

          if (this.error == false && this.marketTypesResult.length == 1) {
            // this.getDemandsModal()
            //!  this.router.navigate([`/createOffer`]);
            this.loadingVisible = false;
          }
        } else {
          this.error = true;
          this.messageError =
            this.translate.store.currentLang == 'RU'
              ? RU['errors'].loadingApplicationData
              : EN['errors'].loadingApplicationData;
          this.messageError = this.messageError.replace(/\n\r?/g, '<br />');
          this.errorType = 'stay';
          this.disabledBtn = true;
        }
      })
  }

  public onChangeSelectBox(e: ValueChangedEvent): void {
    if (e.value) {
      this.firstStepForm.get('marketTypeId')?.patchValue(e.value);
      this.createOfferService.choosenMarketType = e.component.option('text');
      let choosenModelInfo = this.modelsIdResult.filter((i) => {
        return i.id === e.value;
      });

      this.GetByModelId(choosenModelInfo[0].onlyActive);
    }
  }

  public goToLink(): void {
    if (this.firstStepForm.get('submitWay')?.value == 1) {
      this.createOfferService.isArchiveSubmit = false;
      this.createOfferService.modelId = this.firstStepForm.value.marketTypeId;

      if (window.location.href.includes('/createOffer')) {
        const createOffer = JSON.parse(sessionStorage.getItem('createOffer'));

        let createOfferObject = {
          idOffer: null,
          sessionName: createOffer['sessionName'],
          sectionName: this.createOfferService.sectionName,
          sessionDateTime: createOffer['sessionDateTime'],
          sessionId: this.sessionId,
          sectionId: this.sectionId,
          sessionIdArchive: 0,
          modelId: this.firstStepForm.value.marketTypeId,
          direction: this.direction,
          modelsResult: this.modelsResult,
          isMine: false,
          isCreateCopy: false,
          isArchiveSubmit: false,
          choosenMarketType: this.marketTypesResult[0].marketsTypes,
        };
        sessionStorage.setItem('createOffer', JSON.stringify(createOfferObject));
        window.location.reload();
      } else this.router.navigate([`/createOffer`]);
    }

    if (this.firstStepForm.get('submitWay')?.value == 2) {
      this.createOfferService.modelId = this.firstStepForm.value.marketTypeId;
      this.chooseTheWay = false;
      this.chooseArchiveOfferPopup = true;
    }
  }

  public cancelForm(): void {
    this.close.emit(false);

    if (!window.location.href.includes('/createOffer')) {
      location.reload();
    }
  }

  public closeChooseOfferPopup(event): void {
    this.chooseArchiveOfferPopup = event;
    this.close.emit(false);
  }

  public onClose(type: string): void {
    this.disabledBtn = false;
    this.close.emit(false);

    if (type == 'returnBack') {
      this.router.navigate([`/sessions-schedule`]);
    }
  }

  public onCloseChoosing(): void {
    this.marketTypesResult = [];
    this.marketTypes = [];
    this.modelsIdResult = [];
    this.modelsId = [];
    this.modelsResult = [];
    this.firstStepForm.get('marketTypeId')?.patchValue(null);
    if (
      !(
        window.location.href.includes('/createOffer') &&
        this.chooseArchiveOfferPopup
      )
    ) {
      this.close.emit(false);
    }
  }
}
