/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import RU from "../../../../assets/i18n/RU.json";
import EN from "../../../../assets/i18n/EN.json";
import {TranslateService} from "@ngx-translate/core";
import {log} from "util";
import {IdDirection, role} from "../../../api.constants";

@Component({
  selector: 'direct-delivery-scope',
  templateUrl: './direct-delivery-scope.component.html',
  styleUrls: ['./direct-delivery-scope.component.scss']
})
export class DirectDeliveryScopeComponent implements OnInit {
  @Input() consignees; //id выбранных клиентов
  @Input() brokerClient; //список клиентов
  @Input() goodsList; //товары
  @Input() direction; //направление заявки: покупка/продажа
  @Input() userRole;        //роль пользователя
  @Output() save = new EventEmitter<any>();

  @Input() delivScope
  sumVolumeGood = [];

  isVisible: boolean = false;
  message: string;
  type = 'error';

  directionConst = IdDirection;
  delivScopeTemp = [];

  constructor(public translate: TranslateService) {
  }

  ngOnInit(): void {
    let brokers = []
    if(this.userRole != role.worker) {
      this.consignees.forEach(item => {
        brokers.push(this.brokerClient.find(el => el.firmClient == item))
      })
    }
    if (this.delivScope.length == 0) {                  //если зашли первый раз и массив грузоотправителей пустой

      let goods = [] // массив товаров для таблицы
      this.goodsList.forEach(good => {
        goods.push({
          goodId: good.id,
          goodName: good.name,
          goodUnits: good.units.name,
          volume: 0,
          properties: good.properties
        })

        this.sumVolumeGood.push({
          id: good.id,
          sumValue: 0
        })
      })

      brokers.forEach(broker => {
        this.delivScope.push({
          idBroker: broker.firmClient,
          nameBroker: broker.regNumberWithNameShort,
          goods: goods
        })
      })
    } else {

      if (this.userRole != role.worker) {             //если пользователь работник, то ему недоступно удаление/добавление товара, удаление/добавление клиента брокера
        if (this.delivScope[0].goods.length != this.goodsList.length) {         //если удалили товар
          this.delivScope.forEach(scope => {
            scope.goods.forEach(scGood => {
              if (!this.goodsList.find(good => scGood.goodId == good.id) || this.goodsList.find(good => scGood.goodId == good.id) == undefined) {
                scope.goods.splice(scope.goods.findIndex(g => g.goodId == scGood.goodId), 1)
              }
            })
          })
        }
        else{
          this.delivScope.forEach(scope => {
            scope.goods.forEach(scGood => {
              if (!this.goodsList.find(good => scGood.goodId == good.id) || this.goodsList.find(good => scGood.goodId == good.id) == undefined) {
                scope.goods.splice(scope.goods.findIndex(g => g.goodId == scGood.goodId), 1)
              }
            })
          })
          /*          this.goodsList.forEach(good => {

                      if(!this.delivScope[0].goods.find(el=> el.goodId == good.id) || this.delivScope[0].goods.find(el=> el.goodId == good.id)== undefined ){
                        this.delivScope.forEach(scope=>{

                        })
                      }
                      scope.goods.forEach(scGood => {
                        if (!this.goodsList.find(good => scGood.goodId == good.id) || this.goodsList.find(good => scGood.goodId == good.id) == undefined) {
                          scope.goods.splice(scope.goods.findIndex(g => g.goodId == scGood.goodId), 1)
                        }
                      })
                    })*/

        }

        if (this.delivScope.length != this.consignees.length)        //если удалили клиента брокера
        {
          let delivScopeProt = JSON.parse(JSON.stringify(this.delivScope));
          let indexArray = []
          delivScopeProt.forEach(scope => {
            if (!brokers.find(c => c.firmClient == scope.idBroker)) {
              indexArray.push(delivScopeProt.findIndex(el => el.idBroker == scope.idBroker))
            }
          })
          indexArray.reverse().forEach(i => delivScopeProt.splice(i, 1))
          this.delivScope = delivScopeProt
        }
        else {
          this.delivScope.forEach(scope => {
            if (!brokers.find(el => el.firmClient == scope.idBroker)) {
              this.delivScope.splice(this.delivScope.findIndex(el => el.idBroker == scope.idBroker), 1)
            }
          })
        }
      }


      let goods = [];
      this.goodsList.forEach(item => {
        let sumGoodVolume = 0;
        this.delivScope.forEach(scope => {
          sumGoodVolume = sumGoodVolume + scope.goods?.find(g => g.goodId == item.id)?.volume || 0;
        })
        this.sumVolumeGood.push({
          id: item.id,
          sumValue: sumGoodVolume
        })
        this.delivScope.forEach(scope => {
          if (!scope.goods.find(el => el.goodId == item.id)) {              //если в массив товаров добавлен товар
            scope.goods.push(JSON.parse(JSON.stringify({
              goodId: item.id,
              goodName: item.name,
              goodUnits: item.units.name,
              volume: 0,
              properties: item.properties
            })))
            this.sumVolumeGood.find(el => el.id == item.id).sumValue = 0;
          }

          if (scope.goods.find(el => el.goodId == item.id)) {              //если в товаре отредактировади unit - заменить unit на новый  (137 баг)
            scope.goods.find(el => el.goodId == item.id)['goodUnits'] = item.units.name
          }
        })
        goods.push({
          goodId: item.id,
          goodName: item.name,
          goodUnits: item.units.name,
          volume: 0,
          properties: item.properties
        })
      })


      if (this.userRole != role.worker) {
        if (this.delivScope.length != this.consignees.length)        //если добавили клиента брокера
        {
          if (this.delivScope.length < this.consignees.length) {
            brokers.forEach(con => {
              if (!this.delivScope.find(scope => scope.idBroker == con.firmClient)) {
                this.delivScope.push({
                  idBroker: con.firmClient,
                  nameBroker: con.regNumberWithNameShort,
                  goods: goods
                })
              }
            })
          }
        } else {                                                    //осталось одинаковое количество при этом удалили одного и добавили другого
          brokers.forEach(b => {
            if (!this.delivScope.find(el => el.idBroker == b.firmClient)) {
              this.delivScope.push({
                idBroker: b.firmClient,
                nameBroker: b.regNumberWithNameShort,
                goods: goods
              })
            }
          })
        }
      }
    }
    this.delivScopeTemp = JSON.parse(JSON.stringify(this.delivScope))
  }

  clearConsignees() {
    this.delivScope.forEach(scope => {
      scope.goods.forEach(good => {
        good.volume = 0;
        this.onChangeDelivery('clear', {value: good.volume}, scope.idBroker, good.goodId)
      })
    })
  }

  onChangeDelivery(type, e, idBroker, id) {   //добавлен type в рамках бага 128, для очищения поля по кнопке Очистить, чтоб в кач-ве event отправлять только value
    if(type == 'set'){
      let sumValue = this.sumVolumeGood.find(el => el.id == e.element.id.split('_')[1]).sumValue
      this.sumVolumeGood.find(el => el.id == e.element.id.split('_')[1]).sumValue = sumValue - e.previousValue + e.value;
      this.delivScopeTemp.find(el => el.idBroker === idBroker).goods.find(g => g.goodId === id).volume = e.value;
    }
    if(type == 'clear'){
      this.delivScopeTemp.find(el => el.idBroker === idBroker).goods.find(g => g.goodId === id).volume = e.value;
    }
  }


  errorState: number;

  onSave() {
    this.delivScope = this.delivScopeTemp;
    let error = false;
    this.delivScope.forEach(item=>{
      let sum = 0;
      item.goods.forEach(g => {
        sum = sum + g.volume
      })
      if(sum == 0)
      {
        error = true;
        this.errorState = 2;
      }
    })

    this.goodsList.forEach(good => {
      if (good.volume != this.sumVolumeGood.find(el => el.id == good.id).sumValue) {
        error = true;
        this.errorState = 1;
      }
    })

    if (!error) {
      this.save.emit(this.delivScope)
    } else {
      this.isVisible = true;
    }
  }
}
