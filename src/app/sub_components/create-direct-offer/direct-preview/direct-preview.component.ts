/* eslint-disable */
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {
  pricingType,
  maxLengthTextArea,
  role,
  IdDirection,
  ACTUAL_SIZE_READINESS_FIELDS,
  ACTUAL_SIZE_FIELDS
} from "../../../api.constants";
import {log} from "util";
import {SidebarService} from "../../../core/services/sidebar-service.service";
import {User} from "../../../core/classes/user";
import {CommonService} from "../../../core/services/common-service.service";
import {ID_INTERFACE_FIELD} from "../../../shared/enums";
import {CreateOfferService} from "../../../core/services/create-offer-service.service";
@Component({
  selector: 'direct-preview',
  templateUrl: './direct-preview.component.html',
  styleUrls: ['./direct-preview.component.scss']
})
export class DirectPreviewComponent implements OnInit {
  @Input() goodsList; //товары
  @Input() deliveryBasis ; //условия поставки(базисы)
  @Input() isPriceRangeWarning ; //ценовой коридор в базисах
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
  @Input() UserRole;
  @Input() brokerClient;
  @Input() consignees;
  @Output() activeStep=new EventEmitter<any>();
  @Output() delivScopeResult = new EventEmitter<any>();


  pricingType = pricingType;
  maxLengthTextArea = maxLengthTextArea;
  role = role;
  directionConst =IdDirection;
  user: User;
  delivScopePopup = false;

  public readonly ACTUAL_SIZE_READINESS_FIELDS = ACTUAL_SIZE_READINESS_FIELDS;
  public readonly ACTUAL_SIZE_FIELDS = ACTUAL_SIZE_FIELDS;

  constructor(
    private sidebarService: SidebarService,
    public commonService: CommonService,
    public createOfferService: CreateOfferService,
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
  }
  public isShowByPricingTypeField(field: any): boolean {
    return this.createOfferService.isShowByPricingTypeField(field, this.modelsResult?.pricingTypeId)
  }

  public isShowByPricingTypeSpecialField(field: any): boolean {
    return this.createOfferService.isShowByPricingTypeSpecialField(field, this.modelsResult?.pricingTypeId)
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

  public countScope(goods): number {
    let sum = 0;
    goods.forEach(g => {
      sum = sum + Number(g.volume);
    })
    return sum;
  }

  getNumber(value){
    return Number(value)
  }

  public onSaveDeliveryScope(e): void {
    if (e) {
      this.delivScope = e;
      this.delivScopeResult.emit(this.delivScope)
    }
    this.delivScopePopup = false;
  }

  openSidebar(i: any) {
    document.getElementById("mySidebar").style.right = "0";
    document.getElementById("mySidebar").style.opacity = "1";
    document.getElementById("dark").className = "dark_opened";
    this.sidebarService.dataForReqSubject.next(i);
    this.sidebarService.typeSubject.next('good');
  }

  valueSelectBox(field) : string {
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
      string = '-'
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
