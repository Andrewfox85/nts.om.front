/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {pricingType, maxLengthTextArea, role, IdDirection} from "../../../api.constants";
import {log} from "util";
import {SidebarService} from "../../../core/services/sidebar-service.service";
import {User} from "../../../core/classes/user";
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';

@Component({
  selector: 'agri-direct-preview',
  templateUrl: './agri-direct-preview.component.html',
  styleUrls: ['./agri-direct-preview.component.scss']
})
export class AgriDirectPreviewComponent implements OnInit {
  @Input() goodsList; //товары
  @Input() deliveryBasis; //условия поставки(базисы)
  @Input() isPriceRangeWarning; //ценовой коридор в базисах
  @Input() paymentTermConcated; //срок поставки
  @Input() deliveryTermConcated; //срок оплаты
  @Input() commonParameters; //общие параметры
  @Input() modelsResult;
  @Input() commonFiles;
  @Input() hiddenFiles;
  @Input() demandsModal;
  @Input() choosenMarketType;
  @Input() sectionName;
  @Input() direction;
  @Input() currentStageDateEnd;
  @Input() participant;
  @Input() contractType;
  @Input() brokerClientChoose;
  @Input() listBranchChoose;
  @Input() schedule;
  @Input() deliveryTermSchedule;
  @Input() delivScope;
  @Input() isNotSpecified;
  @Input() currencyPrecision;
  @Input() quoteCurrencyPrecision;
  @Input() volumePrecision;
  @Input() firmName;
  @Input() sessionInfo;
  @Input() paymentTypeId;
  @Input() idArchiveOffer;
  @Output() activeStep=new EventEmitter<any>();

  pricingType = pricingType;
  maxLengthTextArea = maxLengthTextArea;
  role = role;
  directionConst =IdDirection;
  user: User;

  constructor(
    private sidebarService: SidebarService,
    private createOfferService: CreateOfferService
  ) {}

  ngOnInit(): void {
    this.goodsList = JSON.parse(JSON.stringify(this.goodsList));
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.goodsList.forEach(good=>{
      let fieldsArray = [];
      good.fields.forEach(item=>{
        fieldsArray = fieldsArray.concat(item[1])
      })
      good.fields = fieldsArray;
    })
    if(this.goodsList){
      this.checkPrice()
    }
  }

  public isShowByPricingTypeField(field: any): boolean {
    return this.createOfferService.isShowByPricingTypeField(field, this.demandsModal?.pricingTypeId)
  }

  public isShowByPricingTypeSpecialField(field: any): boolean {
    return this.createOfferService.isShowByPricingTypeSpecialField(field, this.demandsModal?.pricingTypeId)
  }

  priceError(){
    return this.goodsList.some(item => item.priceError)
  }

 priceLimitationName: string;
 priceAgriStatistics: number;

//снова запрашиваем данные по цене, тк она могла изменится за время заполнения заявки
 async checkPrice(){

    for (const good of this.goodsList) {

      // запрашиваем минимальную цену
      let IdCnfea = good.fields.find(el => el.interfaceField?.fieldId == 63)?.selectedValues
      let IdDestination = good.fields.find(el => el.interfaceField?.fieldId == 62)?.selectedValues || null

      await this.createOfferService.GetArchiveStatisticsPriceLimit(this.user?.token, this.demandsModal.sectionId, this.sessionInfo.sessionId, this.idArchiveOffer ? this.idArchiveOffer : this.sessionInfo.offerId,
        this.paymentTypeId, this.goodsList[0].currency.id, good.id, this.goodsList[0].units.id, this.deliveryBasis[0].idBasisValue, this.deliveryBasis[0]?.idPlaceLink, IdCnfea, IdDestination).then((res: any) => {
          good.priceAgriStatistics = res.priceWithoutVat
          good.priceLimitationName = res.priceLimitationName

          if(good.priceAgriStatistics !=null){  //если цена пришла смотрим и сравниваем с нашими

              let block4 = good.fields.find(el => el[0] == 4)
              if(block4){
               block4[1]?.forEach(i => {
                 if (i.interfaceField.fieldId == 3) {
                  good.priceError = good.priceAgriStatistics > i.selectedValues ? true : false;
                 }
               })
              }
          }
        })
  }

  this.deliveryBasis[0].goods.forEach(good => {
      const match = this.goodsList.find(item => item.id === good.id);
      if (match) {
        good.priceError = match.priceError;
      }
    });
 }

  downloadFile(file){
    let url;
    if(file?.idDemandOffer){
      let type = file.filename.split('.').reverse()[0]
      url = "data:application/" + type + ";base64," + file.content;
    }
    else
      url = file.content;

    let a = document.createElement('a');
    document.body.appendChild(a);
    a.setAttribute('style', 'display: none');
    a.href = url;
    a.download = file.filename;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  niceBytes(x){
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let l = 0, n = parseInt(x, 10) || 0;
    while(n >= 1024 && ++l){
      n = n/1024;
    }
    return(n.toFixed(n < 10 && l > 0 ? 2 : 0) + ' ' + units[l]);
  }

  domesticCondition(){
    return this.demandsModal.marketTypeIds.some(el=>  ["DOMESTIC", "IMPORT"].includes(el))
  }

  foreignCondition(){
    return this.demandsModal.marketTypeIds.some(el=>  ["FOREIGN", "EXPORT"].includes(el))
  }

  accordionItemClicked(event) {
    event.event.stopPropagation();
  }

  onSameUnits(){
    let count = 0;
    this.goodsList.forEach(item =>{
      if(item.units.id == this.goodsList[0].units.id){
        count = count+1;
      }
    })
    return count == this.goodsList.length;
  }

  countScope(goods){
    let sum =0;
    goods.forEach(g=>{
      sum = sum +g.volume;
    })
    return sum;
  }

  getNumber(value){
    return Number(value)
  }

  openSidebar(i: any) {
    document.getElementById("mySidebar").style.right = "0";
    document.getElementById("mySidebar").style.opacity = "1";
    document.getElementById("dark").className = "dark_opened";
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
  }

  valueSelectBox(field): string {
    let string = '';
    if (field.selectedValues) {
      if (!field.interfaceField.isAvailableMultiSelection) {
        if ((field.interfaceField.referenceId || field.interfaceField.referenceAlias) && field.interfaceField.isAvailableFreeInput) {
          string = field.selectedValues
        } else {
          if (field.interfaceField.allowedValues) {
            string = field.interfaceField.allowedValues.find(item => item.id == field.selectedValues)?.name
          } else {
            string = field.dataSource.find(item => item.id == field.selectedValues)?.name
          }
        }
      } else {
        field.selectedValues.forEach(function (id, idx) {
          if (field.interfaceField.allowedValues) {
            string = string + field.interfaceField.allowedValues.find(item => item.id == id)?.name + (idx == (field.selectedValues.length - 1) ? '' : '; ')
          } else {
            string = string + field.dataSource.find(item => item.id == id)?.name + (idx == (field.selectedValues.length - 1) ? '' : '; ')
          }
        })
      }
    } else {
      string = '-';
    }
    return string;
  }

  ucFirst(str) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
  }

  editButton(i){
    this.activeStep.emit(i)
  }
}
