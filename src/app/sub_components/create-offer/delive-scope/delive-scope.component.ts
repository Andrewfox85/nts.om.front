/* eslint-disable */
import { Component, EventEmitter, inject, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { BLOCK_ID_FIELDS, ErrorStates, IdDirection, role } from "../../../api.constants";
import { ID_INTERFACE_FIELD } from "../../../shared/enums";
import { FieldData } from "../../../core/interfaces/interface";
import { ValueChangedEvent } from "devextreme/ui/number_box";
import { SumVolumePipe } from "../../../shared/pipes/sumVolume/sum-volume.pipe";
import { DelivScope } from "../../../core/services/create-offer-service.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: 'delive-scope',
  templateUrl: './delive-scope.component.html',
  styleUrls: ['./delive-scope.component.scss']
})
export class DeliveScopeComponent implements OnInit, OnDestroy {

  @Input() consignees; //id выбранных клиентов
  @Input() brokerClient; //список клиентов
  @Input() goodsList; //товары
  @Input() direction; //направление заявки: покупка/продажа
  @Input() userRole;        //роль пользователя
  @Input() isSameGradesInSaleOffer: boolean = false;
  @Output() save = new EventEmitter<any>();

  @Input() delivScope: DelivScope[];
  sumVolumeGood = [];

  isVisible: boolean = false;
  message: string;
  type = 'error';

  directionConst = IdDirection;
  public delivScopeTemp: DelivScope[] = [];
  public quantityPrecision: number | null;
  public errorState: number;
  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);
  private destroy$: Subject<void> = new Subject<void>();
  private updateTotalTableSubject: Subject<DelivScope[]> = new Subject<DelivScope[]>();

  constructor(
    public translate: TranslateService,
    ) {
  }

  ngOnInit(): void {
    this.quantityPrecision = this.getQuantityFieldPrecision();
    let brokers = [];
    if (this.userRole != role.worker) {
      this.consignees.forEach(item => {
        brokers.push(this.brokerClient.find(el => el.firmClient == item));
      });
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
          goods: goods,
          volume: null
        })
      })
    } else {

      if (this.userRole != role.worker) {             //если пользователь работник, то ему недоступно удаление/добавление товара, удаление/добавление клиента брокера
        this.delivScope.forEach(scope => {
          scope.goods = scope.goods.filter(scGood =>
            this.goodsList.some(good => scGood.goodId === good.id)
          );
        });

        if (this.delivScope.length !== this.consignees.length) {        //если удалили клиента брокера
          let delivScopeProt = JSON.parse(JSON.stringify(this.delivScope));
          let indexArray = [];
          delivScopeProt.forEach(scope => {
            if (!brokers.find(c => Number(c.firmClient) === Number(scope.idBroker))) {
              indexArray.push(delivScopeProt.findIndex(el => Number(el.idBroker) === Number(scope.idBroker)));
            }
          });
          indexArray.reverse().forEach(i => delivScopeProt.splice(i, 1));
          this.delivScope = delivScopeProt;
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
          sumGoodVolume = sumGoodVolume + Number(scope.goods?.find(g => g.goodId == item.id)?.volume) || 0;
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

          if (scope.goods.find(el => el.goodId == item.id)) {              //если в товаре отредактировали unit - заменить unit на новый  (137 баг)
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
                  goods: goods,
                  volume: null
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
                goods: goods,
                volume: null
              })
            }
          })
        }
      }
    }
    this.delivScopeTemp = JSON.parse(JSON.stringify(this.delivScope));

    this.updateTotalTableSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((array: DelivScope[]) => {
        this.delivScopeTemp = [...array];
      });
  }

  private getQuantityFieldPrecision(): number {
    const goodfields = this.goodsList[0]?.fields;
    if (!goodfields) return null;
    const fields = goodfields.find(
      block => block[0] === BLOCK_ID_FIELDS.QUANTITY_BLOCK
    );
    const isTwoPartBlockStructure = fields && fields?.length === 2 && typeof fields[0] === 'string' && Array.isArray(fields[1]);
    if (isTwoPartBlockStructure) {
      const quantityField = fields[1].find(
        (field: FieldData) => field.interfaceField?.fieldId === ID_INTERFACE_FIELD.QUANTITY
      );
      if (quantityField) {
        return quantityField.interfaceField.fieldPrecision;
      }
    } else {
      const quantityField = goodfields.find(
        (field: FieldData) => field.interfaceField?.fieldId === ID_INTERFACE_FIELD.QUANTITY
      );
      return quantityField?.interfaceField?.fieldPrecision;
    }
    return 0;
  }

  public clearConsignees(): void {
    this.delivScope.forEach(scope => {
      scope.goods.forEach(good => {
        good.volume = 0;
        const event: Partial<ValueChangedEvent> = {
          value: good.volume
        };
        this.onChangeDelivery('clear', event as ValueChangedEvent, scope.idBroker, good.goodId);
      });
    });
  }

  public onChangeDelivery(type: string, e: ValueChangedEvent, idBroker: number, id: number): void {   //добавлен type в рамках бага 128, для очищения поля по кнопке Очистить, чтоб в кач-ве event отправлять только value
    if (type === 'set') {
      let value = this.sumVolumeGood.find(el => el.id == e.element.id.split('_')[1]);
      value.sumValue = parseFloat((Number(value.sumValue) - Number(e.previousValue) + Number(e.value)).toFixed(this.quantityPrecision));
      this.delivScopeTemp.find(el => el.idBroker === idBroker).goods.find(g => g.goodId === id).volume = e.value;
    }
    if (type === 'clear') {
      this.delivScopeTemp.find(el => el.idBroker === idBroker).goods.find(g => g.goodId === id).volume = e.value;
    }
  }

  public onChangeTotalScopeValue(event: ValueChangedEvent, idBroker: number): void {
    const delivScope: DelivScope = this.delivScopeTemp.find(el => el.idBroker === idBroker);
    if (!delivScope) {
      return;
    }
    delivScope.volume = Number(event.value) || 0;
    this.updateTotalTableSubject.next(this.delivScopeTemp);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTotalTableSubject.complete();
  }

  public onSave(): void {
    this.delivScope = [...this.delivScopeTemp];
    let error: boolean = false;
    if (!this.isSameGradesInSaleOffer) {
      this.delivScope.forEach(item => {
        let sum: number = this.sumVolumePipe.transform(item.goods, 'volume');
        if (sum === 0) {
          error = true;
          this.errorState = ErrorStates.warning;
        }
      });

      this.goodsList.forEach(good => {
        if (good.volume !== this.sumVolumeGood.find(el => el.id == good.id).sumValue) {
          error = true;
          this.errorState = ErrorStates.error;
        }
      });
    } else {
      //предупреждение, если по грузоотправителю будет 0
      if (this.delivScope.some(el => el.volume === 0 || !el.volume)) {
        error = true;
        this.errorState = ErrorStates.warning;
      }
      if (
        this.sumVolumePipe.transform(this.goodsList, 'volume') !==
        this.sumVolumePipe.transform(this.delivScope, 'volume')
      ) {
        error = true;
        this.errorState = ErrorStates.error;
      }
    }

    if (!error) {
      this.save.emit(this.delivScope);
    } else {
      this.isVisible = true;
    }
  }
}
