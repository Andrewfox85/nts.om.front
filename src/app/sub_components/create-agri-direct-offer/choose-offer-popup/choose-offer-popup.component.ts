/* eslint-disable */
import { numberEntriesPage, IdDirection } from 'src/app/api.constants';
import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import {Router} from "@angular/router";
import {User} from "../../../core/classes/user";
import { FilterOption } from "../../../shared/interfaces";

@Component({
  selector: 'app-choose-offer-popup',
  templateUrl: './choose-offer-popup.component.html',
  styleUrls: ['./choose-offer-popup.component.scss']
})
export class ChooseOfferPopupComponent implements OnInit {
  @Input() chooseOfferPopup;
  @Input() sessionInfo;
  @Input() archiveOffers;
  @Output() close = new EventEmitter<any>();

  numberEntriesPage = numberEntriesPage;
  user: User;
  chooseOffer: any;

  constructor(
    public offerManagementService: OfferManagementService,
    private createOfferService: CreateOfferService,
    public router: Router,

  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterAmountVAT = this.orderHeaderFilterAmountVAT.bind(this);
    this.orderHeaderFilterTotalAmount = this.orderHeaderFilterTotalAmount.bind(this);
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e){

  }

  getNumber(value){
    return Number(value)
  }


  onSelectionChanged(data: any) {
    this.chooseOffer = data.selectedRowsData
  }

  public goToCreation(): void {
    this.createOfferService.TargetedCheckOfferState(this.user?.token, {idOffer: this.chooseOffer[0].idOffer}).then((res: any) => {
      this.createOfferService.idOffer = this.chooseOffer[0].idOffer;
      this.createOfferService.sessionName = this.sessionInfo[0].sessionName;
      this.createOfferService.sessionId = this.sessionInfo[0].sessionId;
      this.createOfferService.sessionDateTime = this.sessionInfo[0].sessionDateTime;
      this.createOfferService.sectionId = this.sessionInfo[0].sectionId;
      this.createOfferService.sectionName = this.sessionInfo[0].sectionName;
      this.createOfferService.direction = IdDirection.sale;
      this.router.navigate([`/createAgriDirectOffer`]);
    })
  }

  viewOffer(idOffer){
    this.createOfferService.direction = IdDirection.sale;
    this.createOfferService.sectionId =  this.sessionInfo[0].sectionId;
    this.createOfferService.sessionId =  this.sessionInfo[0].sessionId;
    this.createOfferService.idOffer = idOffer;
    this.createOfferService.isArchive = true;
    this.createOfferService.unsold = false;
    this.router.navigateByUrl('/view-offer')
  }

  closePopup(){
    this.close.emit(false)
  }

  //-------------------------для фильтрации в таблице-------------------

  orderHeaderFilterName(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.goodInfo.goodName],
            "value": el.goodInfo.goodName,
            "text": el.goodInfo.goodName
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterDesc(data) {
    let searchQuery = '';
    data.dataSource.load = function (options) {
      if (options && options?.filter) {
        let filterValue;
        if (options?.filter?.length == 1) {
          filterValue = options?.filter?.find(el =>
            Array.isArray(el) && !el.find(a => a.columnIndex)
          )?.[2]
        } else {
          filterValue = options?.filter?.find(el =>
            Array.isArray(el) && Array.isArray(el[0]) && !el[0].find(a => a.columnIndex)
          )?.[0]?.[2]
        }
        searchQuery = filterValue || '';
      } else {
        searchQuery = '';
      }
    };

    data.dataSource.postProcess = (results) => {
      results.length = 0
      const currentData = data.dataSource.filter?.length > 0 ?
        data.component.getDataSource().items() :
        this.archiveOffers

      currentData.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.goodInfo.goodDescription],
            "value": el.goodInfo.goodDescription,
            "text": el.goodInfo.goodDescription
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      if (searchQuery) {
        uniqueResult = uniqueResult.filter(
          (item: FilterOption) =>
            (item.value as string)?.toLowerCase().includes(searchQuery?.toLowerCase())
        );
      }
      return uniqueResult;
    };
  }

  orderHeaderFilterVol(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.goodInfo.goodVolume],
            "value": el.goodInfo.goodVolume,
            "text": el.goodInfo.goodVolume
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterUnits(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.goodUnitName],
            "value": el.goodUnitName,
            "text": el.goodUnitName
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterPrice(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.priceParams.priceWithoutVat],
            "value": el.priceParams.priceWithoutVat,
            "text": el.priceParams.priceWithoutVat
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterAmountVAT(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.priceParams.vatAmount],
            "value": el.priceParams.vatAmount,
            "text": el.priceParams.vatAmount
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterTotalAmount(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.priceParams.totalAmount],
            "value": el.priceParams.totalAmount,
            "text": el.priceParams.totalAmount
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

//для фильтрации в таблице
  calculateFilterExpression(value, selectedFilterOperations, target) {
    const column = this as any;
    if (target === 'headerFilter') {
      return [column.dataField, 'contains', value]
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }
}
