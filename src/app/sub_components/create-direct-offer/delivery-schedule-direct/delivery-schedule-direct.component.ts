/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {strict} from "assert";
import {kStringMaxLength} from "buffer";
import { TranslateService } from '@ngx-translate/core';
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { DeliveryView } from '../../../api.constants';
import { DeliveryPeriodService } from '../../../shared/services/delivery-schedule-service/delivery-schedule.service';
import moment from "moment/moment";
import {GoodsItemModel} from "../../../core/interfaces/goods";

const momentRange = extendMoment(Moment);

@Component({
  selector: 'delivery-schedule-direct',
  templateUrl: './delivery-schedule-direct.component.html',
  styleUrls: ['./delivery-schedule-direct.component.scss']
})
export class DeliveryScheduleDirectComponent implements OnInit {
  @Input() goodsList = [];
  @Input() deliverySchedule;
  @Input() schedule;
  @Input() deliveryTermSchedule;
  @Input() typeDeliverySchedule;
  @Input() deliveryStartDate;
  @Input() deliveryPeriodInDays;
  @Output() save= new EventEmitter<any>();
  @Input() isDifferentPeriod!: (
  ) => boolean;


  isVisible: boolean = false;
  message: string = this.translate.store.currentLang == 'RU' ? RU["createOffer"].paymentDeliveryTerms.errorMessageSchedule : EN["createOffer"].paymentDeliveryTerms.errorMessageSchedule;
  type = 'error';
  position = 'top center'
  isVisibleRecreateNotification = false;

  scheduleData = [];

  typePeriod = this.formBuilder.group({
    term: ['', Validators.required]
  });

  sumVolumeGoodTerm = [];
  goodsArray: GoodsItemModel[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    private deliveryPeriodService: DeliveryPeriodService
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
    })

    //this.sumVolumeGoodTerm.every(el=> el.sumValue = 0)

  }

  onCreateSchedule() {
    if(this.typePeriod.valid) {

      const termValue = Number(this.typePeriod.controls.term?.value);
      const deliveryViewMap: Record<number, DeliveryView> = {
        2: DeliveryView.Week,
        3: DeliveryView.Month,
        4: DeliveryView.Quarter
      };
      const deliveryView = deliveryViewMap[termValue];
      const deliverySchedule = Number(this.typeDeliverySchedule);

      this.scheduleData = this.getDeliveryScheduleData(
        this.goodsArray,
        deliveryView,
        deliverySchedule,
        momentRange.unix(this.deliveryStartDate / 1000).format("DD-MM-YYYY"),
        this.typeDeliverySchedule == 3
          ? momentRange.unix(this.deliveryPeriodInDays / 1000).format("DD-MM-YYYY")
          : this.deliveryPeriodInDays)

      this.goodsList.forEach(item => {
        this.sumVolumeGoodTerm.find(el => el.id == item.id).sumValue = item.volume;
      })
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

    return result;
  }

  onSave(){
    if(this.typePeriod.controls.term?.value){
      let error= false;
      this.goodsList.forEach(good=>{
        if(good.volume != this.sumVolumeGoodTerm.find(el => el.id == good.id).sumValue){
          error = true;
        }
      })
      if(!error) {
        this.save.emit(Object.assign({}, {'schedule': this.scheduleData, 'term': this.typePeriod.controls.term?.value, 'sumVolumeGoodTerm': this.sumVolumeGoodTerm}))
      } else{
        this.isVisible = true
      }
    }
  }
}
