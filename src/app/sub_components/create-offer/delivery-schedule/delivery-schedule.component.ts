/* eslint-disable */
import { Component, EventEmitter, inject, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from "@angular/forms";
import { TranslateService } from '@ngx-translate/core';
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { DeliveryView, ID_DELIVERY_TERM_TYPE } from '../../../api.constants';
import { DeliveryPeriodService } from '../../../shared/services/delivery-schedule-service/delivery-schedule.service';
import { GoodsItemModel } from "../../../core/interfaces/goods";
import { SumVolumePipe } from "../../../shared/pipes/sumVolume/sum-volume.pipe";
import { ValueChangedEvent } from "devextreme/ui/number_box";
import { Subject, takeUntil } from "rxjs";
import { DelivScope } from "../../../core/services/create-offer-service.service";

const momentRange = extendMoment(Moment);

@Component({
  selector: 'delivery-schedule',
  templateUrl: './delivery-schedule.component.html',
  styleUrls: ['./delivery-schedule.component.scss']
})
export class DeliverySchedulComponent implements OnInit, OnDestroy {
  @Input() goodsList = [];
  @Input() deliverySchedule;
  @Input() schedule;
  @Input() deliveryTermSchedule;
  @Input() typeDeliverySchedule;
  @Input() deliveryStartDate;
  @Input() deliveryPeriodInDays;
  @Input() isSameGradesInSaleOffer: boolean;
  @Input() isDifferentPeriod!: (
  ) => boolean;

  @Output() save= new EventEmitter<any>();

  isVisible: boolean = false;
  message: string = this.translate.store.currentLang == 'RU' ? RU["createOffer"].paymentDeliveryTerms.errorMessageSchedule : EN["createOffer"].paymentDeliveryTerms.errorMessageSchedule;
  type = 'error';
  position = 'top center'

  scheduleData = [];

  typePeriod = this.formBuilder.group({
    term: ['', Validators.required]
  });

  sumVolumeGoodTerm = [];
  goodsArray: GoodsItemModel[] = [];
  isVisibleRecreateNotification = false;
  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);
  private destroy$: Subject<void> = new Subject<void>();
  private updateTotalTableSubject: Subject<DelivScope[]> = new Subject<DelivScope[]>();

  constructor(
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    private deliveryPeriodService: DeliveryPeriodService,
  ) {  }
  ngOnInit(): void {
    if(this.schedule?.length > 0) {
      this.isVisibleRecreateNotification = this.isDifferentPeriod()
    }
    this.scheduleData = JSON.parse(JSON.stringify(this.schedule))
    if(this.scheduleData.length > 0){

      this.goodsList.forEach(item=>{
        this.sumVolumeGoodTerm.push({
        id: item.id,
        sumValue: 0
      })
        this.goodsArray.push({
          id: item.id,
          name: item.name,
          volume: item.volume,
          units: item.units,
          properties: item.properties
        })

        let sumValueGood = 0;
        this.scheduleData.forEach(sch=> {
          let findGood = sch.goods.find(el => el.id == item.id)
          if (!findGood) {              //если в массив товаров добавлен товар
            sch.goods.push(JSON.parse(JSON.stringify({
              id: item.id,
              name: item.name,
              volume: 0,
              units: item.units,
              properties: item.properties
            })))
            this.sumVolumeGoodTerm.find(el=> el.id == item.id).sumValue = 0;
          }
          else{
            sumValueGood = sumValueGood + Number(findGood.volume);
          }
        })

        this.sumVolumeGoodTerm[this.sumVolumeGoodTerm.length - 1].sumValue = sumValueGood.toFixed(4)
      })

      if(this.scheduleData[0].goods.length != this.goodsList.length){         //если удалили товар
        this.scheduleData.forEach(sch=>{
          sch.goods.forEach(schGood=>{
            if(!this.goodsList.find(good => schGood.id == good.id ))
            {
              sch.goods.splice(sch.goods.findIndex(g=> g.id == schGood.id), 1)
            }
          })
        })
        }

      this.typePeriod.controls.term.setValue(this.deliveryTermSchedule)
    }
    else {
      this.goodsList.forEach(good => {
        this.sumVolumeGoodTerm.push({
          id: good.id,
          sumValue: 0
        })
        this.goodsArray.push({
          id: good.id,
          name: good.name,
          volume: good.volume,
          units: good.units,
          properties: good.properties
        })
      })
    }

    this.updateTotalTableSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((array: DelivScope[]) => {
        this.scheduleData = [...array];
      });
  }

  onChangeVolume(e, index, id){
    let sumValue = this.sumVolumeGoodTerm.find(el => el.id == e.element.id.split('_')[1]).sumValue
    this.sumVolumeGoodTerm.find(el => el.id == e.element.id.split('_')[1]).sumValue = sumValue - e.previousValue + e.value;
    this.scheduleData[index].goods.find(g=> g.id == id).volume = e.value;
  }

  clearSchedule(){
    this.scheduleData.forEach(term=>{
      term.goods.forEach(good=>{
        good.volume = 0;
      })
      term.periodVolume = 0;
    })
  }

  public onTotalVolumeChanged(event: ValueChangedEvent, periodIndex: number): void {
    this.scheduleData[periodIndex].periodVolume = Number(event.value) || 0;
    this.updateTotalTableSubject.next(this.scheduleData);
  }

  public onCreateSchedule(): void {
    if (this.typePeriod.valid) {
      const termValue: number = Number(this.typePeriod.controls.term?.value);
      const deliveryViewMap: Record<number, DeliveryView> = {
        2: DeliveryView.Week,
        3: DeliveryView.Month,
        4: DeliveryView.Quarter
      };
      const deliveryView: DeliveryView = deliveryViewMap[termValue];
      const deliverySchedule: number = Number(this.typeDeliverySchedule);
      this.scheduleData = this.getDeliveryScheduleData(
        this.goodsArray,
        deliveryView,
        deliverySchedule,
        momentRange.unix(this.deliveryStartDate / 1000).format("DD-MM-YYYY"),
        Number(this.typeDeliverySchedule) === ID_DELIVERY_TERM_TYPE.DAYS
          ? momentRange.unix(this.deliveryPeriodInDays / 1000).format("DD-MM-YYYY")
          : this.deliveryPeriodInDays);
      this.sumVolumeGoodTerm = this.sumVolumeGoodTerm.map(el => {
        const match = this.goodsList.find(item => item.id === el.id);
        return match ? { ...el, sumValue: match.volume } : el;
      });
      this.isVisibleRecreateNotification = false;
    }
  }

  getDeliveryScheduleData(
    goodItems: GoodsItemModel[],
    deliveryView: 1 | 2 | 3,
    deliveryTermType: number,
    deliveryStartDate: string,
    deliveryPeriodValue: number | string
  ) {
    const moment = require('moment');

    const endDate = this.deliveryPeriodService.calculateEndDate(
      deliveryStartDate,
      deliveryTermType,
      deliveryPeriodValue
    );

    const periods = this.deliveryPeriodService.buildPeriods(
      deliveryView,
      deliveryStartDate,
      endDate.format('DD-MM-YYYY')
    );

    let result: any[] = [];

    const idPeriod = this.typePeriod.get('term')?.value;

    if (!this.isSameGradesInSaleOffer) {
      periods.forEach((p, index) => {
        result = this.deliveryPeriodService.createObject(
          p.startDate,
          p.endDate,
          p.numberPeriod,
          goodItems,
          result,
          index === periods.length - 1,
          periods.length,
          idPeriod
        );
      });
    } else {
      periods.forEach((p, index) => {
        result.push({
            numberPeriod: p.numberPeriod,
            startDate: p.startDate.format('DD.MM.YYYY'),
            endDate: p.endDate.format('DD.MM.YYYY'),
            goods: goodItems,
            idPeriod,
            periodVolume: this.deliveryPeriodService.getDivideQuantityIntoPeriods(
              this.sumVolumePipe.transform(this.goodsList, 'volume'),
              periods.length,
              index === periods.length - 1
            )
          }
        );
      });
    }

    return result;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTotalTableSubject.complete();
  }

  public onSave(): void {
    if (this.typePeriod.controls.term?.value) {
      let error: boolean = false;
      if (!this.isSameGradesInSaleOffer) {
        this.goodsList.forEach(good => {
          if (good.volume !== Number(this.sumVolumeGoodTerm.find(el => el.id == good.id).sumValue)) {
            error = true;
          }
        });
      } else {
        if (this.sumVolumePipe.transform(this.goodsList, 'volume') !==
          this.sumVolumePipe.transform(this.scheduleData, 'periodVolume')) {
          error = true;
        }
      }
      if (!error) {
        this.save.emit(Object.assign({}, {
          'schedule': this.scheduleData,
          'term': this.typePeriod.controls.term?.value,
          'sumVolumeGoodTerm': this.sumVolumeGoodTerm
        }));
      } else {
        this.isVisible = true;
      }
    }
  }
 }
