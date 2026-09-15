/* eslint-disable */
import { numberEntriesPage, IdDirection } from 'src/app/api.constants';
import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { OfferManagementService } from 'src/app/core/services/offer-management-service.service';
import { CreateOfferService } from 'src/app/core/services/create-offer-service.service';
import {Router} from "@angular/router";
import {User} from "../../../core/classes/user";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { TranslateService } from '@ngx-translate/core';
import RU from '../../../../assets/i18n/RU.json';
import EN from '../../../../assets/i18n/EN.json';
import { FilterOption } from "../../../shared/interfaces";

@Component({
  selector: 'app-choose-archive-offer-popup',
  templateUrl: './choose-archive-offer-popup.component.html',
  styleUrls: ['./choose-archive-offer-popup.component.scss']
})
export class ChooseArchiveOfferPopupComponent implements OnInit {
  @Input() chooseArchiveOfferPopup;
  @Input() sessionInfo;
  @Input() direction;
  @Input() modelId;
  @Output() close = new EventEmitter<any>();
  numberEntriesPage = numberEntriesPage;
  user: User;
  archiveOffers: any;
  chooseOffer: any;

  accessForm: FormGroup = this.formBuilder.group({
    access: [1, Validators.required],
  });

  constructor(
    public translate: TranslateService,
    public offerManagementService: OfferManagementService,
    private createOfferService: CreateOfferService,
    public router: Router,
    private formBuilder: FormBuilder
  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterAmountVAT = this.orderHeaderFilterAmountVAT.bind(this);
    this.orderHeaderFilterTotalAmount = this.orderHeaderFilterTotalAmount.bind(this);
    this.orderHeaderFilterAmendment = this.orderHeaderFilterAmendment.bind(this);
    this.orderHeaderFilterQuotation = this.orderHeaderFilterQuotation.bind(this);
  }


  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e){
    this.getData(true)
  }

  getData(isOnlyMy){
    this.createOfferService.ArchiveGetListMasterWithDetails(this.user?.token, this.sessionInfo[0].sectionId, this.sessionInfo[0].sessionId, this.modelId, this.direction, isOnlyMy).then((res: any) => {
              this.archiveOffers = res.demandsOffers;

           /*    this.archiveOffers.sort((a, b) => {
                    return a.lotNumber - b.lotNumber;
              }); */

               this.archiveOffers.forEach(item => {
                   let names = item.goods.map(x => x.goodInfo.goodName); //создаю массив имен и добавляю в объект для фильтрации
                   item['names'] = names;

                   let desc = item.goods.map(x => x.goodInfo.goodDescription);
                   item['desc'] = desc;

                   let vol = item.goods.map(x => x.goodInfo.goodVolume);
                   item['vol'] = vol;

                  let prices = item.goods.map(x => x.priceParams.priceWithoutVat);
                  item['prices'] = prices;

                  let units = item.goods.map(x => x.goodInfo.goodUnitName);
                  item['units'] = units;

                  let amountVAT = item.goods.map(x => x.priceParams.vatAmount);
                  item['amountVAT'] = amountVAT;

                  let totalAmount = item.goods.map(x => x.priceParams.totalAmount);
                  item['totalAmount'] = totalAmount;

                  let amendment = item.goods.map(x => x.priceParams.priceAdjustment);
                  item['amendment'] = amendment;

                  let quotation = item.goods.map(x => x.quotationValue);
                  item['quotation'] = quotation;
             })
         })
   }


   isCombinedMarketTypes(){
    return this.archiveOffers?.some(item => item.isCombinedMarketTypes)
  }

   domesticCondition() {
    return this.archiveOffers?.some(item => item.detailsImportDomestic)
  }

  foreignCondition() {
    return this.archiveOffers?.some(item => item.detailsExportForeign)
  }

  getNumber(value){
    return Number(value)
  }

  onSelectionChanged(data: any) {
    this.chooseOffer = data.selectedRowsData
  }

  goToCreation() {
    this.createOfferService.idOffer = this.chooseOffer[0].idDemandOffer;
    this.createOfferService.sessionName = this.sessionInfo[0].sessionName;
    this.createOfferService.sessionId = this.sessionInfo[0].sessionId;
    this.createOfferService.sessionIdArchive = this.chooseOffer[0].sessionId;
    this.createOfferService.sessionDateTime = this.sessionInfo[0].sessionDateTime;
    this.createOfferService.sectionId = this.sessionInfo[0].sectionId;
    this.createOfferService.sectionName = this.sessionInfo[0].sectionName;
    this.createOfferService.direction = this.direction;
    this.createOfferService.isArchiveSubmit = true;
    this.createOfferService.isMine = this.accessForm.get("access")?.value == 1;

    if (window.location.href.includes("/createOffer")) {
      this.isCreateOffer()
    }
    else
      this.router.navigate([`/createOffer`]);
  }

  isCreateOffer () : void {
    let createOfferObject = {
      idOffer: this.chooseOffer[0].idDemandOffer,
      sessionName: this.sessionInfo[0].sessionName,
      sectionName: this.sessionInfo[0].sectionName,
      sessionDateTime: this.sessionInfo[0].sessionDateTime,
      sessionId: this.sessionInfo[0].sessionId,
      sectionId: this.sessionInfo[0].sectionId,
      sessionIdArchive: this.chooseOffer[0].sessionId,
      direction: this.direction,
      modelId: this.modelId,
      isMine: this.accessForm.get("access")?.value == 1,
      isCreateCopy: false,
      isArchiveSubmit: true,
      choosenMarketType: this.sessionInfo[0].concatedMarketTypes,
      modelsResult: this.createOfferService.modelResult

      /*
      modelsResult: this.createOfferService.modelResult,
      demandsModal: this.createOfferService.demandsModal,*/

    }
    sessionStorage.setItem('createOffer', JSON.stringify(createOfferObject))
    window.location.reload();
  }

  public viewOffer(idOffer: number, idSession: number): void{
    this.createOfferService.sectionId =  this.sessionInfo[0].sectionId;
    this.createOfferService.sessionId =  idSession;
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
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodName],
          value: el.goodInfo.goodName,
          text: el.goodInfo.goodName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
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
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodVolume],
          value: el.goodInfo.goodVolume,
          text: el.goodInfo.goodVolume,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterUnits(data) {
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.goodInfo.goodUnitName],
          value: el.goodInfo.goodUnitName,
          text: el.goodInfo.goodUnitName,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterPrice(data) {
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.priceParams.priceWithoutVat],
          value: el.priceParams.priceWithoutVat,
          text: el.priceParams.priceWithoutVat,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterAmountVAT(data) {
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.priceParams.vatAmount],
          value: el.priceParams.vatAmount,
          text: el.priceParams.vatAmount,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterTotalAmount(data) {
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.priceParams.totalAmount],
          value: el.priceParams.totalAmount,
          text: el.priceParams.totalAmount,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterAmendment(data) {
    data.dataSource.postProcess = () => {

      if (!this.archiveOffers?.length) {
        return [];
      }
      const results = this.archiveOffers.reduce((acc, item) => {
        const goodsItems = item.goods?.map((el) => ({
          key: [el.priceParams.priceAdjustment],
          value: el.priceParams.priceAdjustment,
          text: el.priceParams.priceAdjustment,
        }));
        return [...acc, ...goodsItems];
      }, []);

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
      return uniqueResult;
    };
  }

  orderHeaderFilterQuotation(data) {
    let hasNonEmptyValues = false;
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.archiveOffers.forEach(item => {
        item.goods.forEach(el => {
          if (el.quotationValue) {
            results.push({
              key: [el.quotationValue],
              value: el.quotationValue,
              text: el.quotationValue,
            })
          } else {
            hasNonEmptyValues = true
          }
        })
      })

       // Добавляем отдельную запись для пустых значений
       if (hasNonEmptyValues) {
        results.unshift({
          key: [null],
          value: null,
          text: this.translate.store.currentLang == 'RU'
            ? RU['filters'].empty
            : EN['filters'].empty
        });
      }

      //уникальные значения в массиве results
      let uniqueResult = [
        ...new Map(results.map((item) => [item['value'], item])).values(),
      ];
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
