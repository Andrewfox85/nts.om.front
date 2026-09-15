/* eslint-disable */
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { User } from 'src/app/core/classes/user';
import { pricingType, NO_BASIS } from 'src/app/api.constants';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { TranslateService } from '@ngx-translate/core';
import { ID_INTERFACE_FIELD } from './../../shared/enums/index';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { ValueChangedEvent } from 'devextreme/ui/number_box';
import { ShowingEvent } from 'devextreme/ui/popup';
import { GoodsSpecification } from './../../core/services/create-offer-service.service';
import { OfferData } from './../../core/interfaces/interface';
import { DxValidationGroupComponent } from 'devextreme-angular';
import { PRICE_ADJUSTMENT_TYPE } from './../../core/enums/offer-management/price-adjustment-type';

@Component({
  selector: 'app-edit-price-step',
  templateUrl: './edit-price-step.component.html',
  styleUrls: ['./edit-price-step.component.scss'],
})
export class EditPriceStepComponent implements OnInit {
  @Input() editPriceStepPopup: boolean;
  @Input() data: OfferData;
  @Output() close = new EventEmitter<boolean>();

  public user: User;
  public dataForDisplay: OfferData;

  public pricingType = pricingType;

  public stepForm: FormGroup = this.formBuilder.group({});
  public isVisibleToast: boolean = false;
  public type: string = 'success';
  public message: string = ' ';

  @ViewChild('stepFormValid', { static: false })
  public validationGroup: DxValidationGroupComponent;

  public readonly PRICE_ADJUSTMENT_TYPE = PRICE_ADJUSTMENT_TYPE;
  public readonly NO_BASIS = NO_BASIS;

  constructor(
    public translate: TranslateService,
    public offerManagementService: OfferManagementService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  public onShowing(e: ShowingEvent): void {
    this.dataForDisplay = this.data;
    //формируем форму для поля шага цены
    this.dataForDisplay.offerGoods.forEach((good) => {
      good.goodsSpecifications.forEach((field) => {
        if (field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_STEP) {
          this.stepForm.addControl(
            good.idGood ? good.idGood.toString() : '',
            this.formBuilder.control(null, Validators.required)
          );
          this.stepForm.controls[
            good.idGood ? good.idGood.toString() : ''
          ].patchValue(
            this.getValueNumber(
              good.goodsSpecifications,
              field.idInterfaceField
            )
          );
        }
      });
    });
  }

  public getNumber(value: string): number {
    return Number(value);
  }

  public getValue(
    goodsSpecifications: GoodsSpecification[],
    idInterfaceField: number
  ): number | string {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  public getValueNumber(
    goodsSpecifications: GoodsSpecification[],
    idInterfaceField: number
  ): number {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValueNumber;
  }

  public zeroComparison = () => 0;

  public setReadForm(e: ValueChangedEvent, goodId: number): void {
    if (e.event) {
      this.stepForm.controls[goodId ? goodId.toString() : ''].patchValue(
        e.value
      );
    }
  }

  public editPriceStep(): void {
    const listGoods: number[] = this.dataForDisplay.offerGoods
      .sort((a, b) => a.idGood - b.idGood)
      .flatMap((item) => {
        const id = item.goodsSpecifications[0]?.idDemandOfferGood;
        return id !== undefined ? [id] : [];
      });
    const listPrices: number[] = Object.values(this.stepForm.value);
    const body = {
      idSection: this.dataForDisplay.idSection,
      idSession: this.dataForDisplay.idSession,
      idDirection: this.dataForDisplay.idDirection,
      idDemandOffer: this.dataForDisplay.idDemandOffer,
      listGoods: listGoods,
      listPrices: listPrices,
    };

    this.offerManagementService
      .bucePriceSteps(body)
      .subscribe(() => {
        this.isVisibleToast = true;
        this.message = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'offer-management.priceStepMess'
        );
        this.closePopup();
      });
  }

  public closePopup(): void {
    this.dataForDisplay.offerGoods.forEach((good) => {
      good.goodsSpecifications.forEach((field) => {
        if (field.idInterfaceField === ID_INTERFACE_FIELD.PRICE_STEP) {
          this.stepForm.removeControl(
            good.idGood ? good.idGood.toString() : ''
          );
        }
      });
    });

    this.close.emit(false);
  }
}
