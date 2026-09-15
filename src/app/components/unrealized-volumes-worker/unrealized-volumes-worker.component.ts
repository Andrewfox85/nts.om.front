/* eslint-disable */
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { numberEntriesPage, sectionID, sessionStage, FileTypes } from "../../api.constants";
import { FormBuilder, Validators } from "@angular/forms";
import { CommonService } from "../../core/services/common-service.service";
import { TranslateService } from "@ngx-translate/core";
import { User } from "../../core/classes/user";
import { DatePipe } from "@angular/common";
import { CatalogService } from "../../core/services/catalog-service.service";
import { OfferManagementService } from "../../core/services/offer-management-service.service";
import { Router } from "@angular/router";
import { CreateOfferService } from "../../core/services/create-offer-service.service";
import { DxDataGridComponent } from "devextreme-angular";
import { TabStateService } from 'src/app/core/services/tab-state.service';
import { takeUntil, Subject } from 'rxjs';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { FilterOption } from "../../shared/interfaces";
import { ExportService } from './../../core/services/export-service.service';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { LocalStorageService } from 'src/app/shared/services/local-storage-service/local-storage.service';

const UNREALIZED_VOLUMES_HIDE_LOT_ITEMS_KEY: string = 'unrealizedVolumesHideLotItems';

@Component({
  selector: 'app-unrealized-volumes-worker',
  templateUrl: './unrealized-volumes-worker.component.html',
  styleUrls: ['./unrealized-volumes-worker.component.scss']
})
export class UnrealizedVolumesWorkerComponent implements OnInit, OnDestroy {

  @ViewChild('dataGridRefNotVisible', { static: false }) dataGridNotVisible!: DxDataGridComponent;

  user: User;
  sectionId: number;
  sessionInfo: any ;
  filterData = this.formBuilder.group({
    section: [null as number | null, Validators.required],
    session: [null as number | null, Validators.required],
  })

  sectionsList = [];
  sessionList = []              //сессия с которой хотят перенести
  sessionsListToTransfer = []          //сессия на которую хотят перенести
  offers = [];
  unsoldOffer = [];
  displayOffers = [];       //массив данных, который отображается
  tabs: string[] = [
    getTranslateResultByCurrentLang(this.translate.store.currentLang, 'unrealizedVolumes.forTransfer'),
    getTranslateResultByCurrentLang(this.translate.store.currentLang, 'unrealizedVolumes.transferred')
  ];

  loadingVisible: boolean = false;         //лодер
  isHiddenLot: boolean =  true     //Скрыть товары лотов

  disableUpdate = false;       //задизейблить кнопку обновления
  currentTimeDate: Date;
  selectedRows=[];        //выделенные строки
  tabIndex = 0;       //индекс вкладки

  transferLotsPopup= false;         //попап окно для переноса заявок
  isCancel = false;     //Доступность отмены заявок вне регламента
  sessionToTransfer: any;        //сессию, на которую необходимо перенести лоты
  numberCheckOffer = 0;       //счетчик проверки заявки
  isVisibleProgressBar = false;
  failedRes=[]      //неуспешный результат переноса
  successfulRes=[]     //успешный результат переноса

  checkedOffers: any;         //массив заявок на перенос

  // колонки которые нужно разделять на строки (прописываем тут именно dataField)
  public multilineFields: string[] = [
    'goodName',
    'goodDescription',
    'goodVolume',
    'goodUnitName',
    'priceWithoutVat',
    'totalAmount',
    'vatAmount',
    'goods[0].lotSummary.totalAmount',
    'goods[0].lotSummary.volume'
  ];

  protected readonly sessionStage = sessionStage;

  private destroy$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    private formBuilder: FormBuilder,
    public commonService: CommonService,
    public catalogService: CatalogService,
    public router: Router,
    public offerManagementService: OfferManagementService,
    private createOfferService: CreateOfferService,
    private readonly tabState: TabStateService,
    private pageMeta: PageMetaService,
    private exportService: ExportService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.orderHeaderFilterName = this.orderHeaderFilterName.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterDesc = this.orderHeaderFilterDesc.bind(this);
    this.orderHeaderFilterVol = this.orderHeaderFilterVol.bind(this);
    this.orderHeaderFilterUnits = this.orderHeaderFilterUnits.bind(this);
    this.orderHeaderFilterPrice = this.orderHeaderFilterPrice.bind(this);
    this.orderHeaderFilterTotalAmount = this.orderHeaderFilterTotalAmount.bind(this);
    this.orderHeaderFilterAmendment = this.orderHeaderFilterAmendment.bind(this);
    this.orderHeaderFilterQuotation = this.orderHeaderFilterQuotation.bind(this);
    this.orderHeaderFilterContractType = this.orderHeaderFilterContractType.bind(this)
  }

  ngOnInit(): void {
    this.restoreHideLotItemsState();

    this.tabIndex = this.tabState.getIndex('unsold_volumes');

    this.tabState
      .getIndex$('unsold_volumes')
      .pipe(takeUntil(this.destroy$))
      .subscribe((index) => {
        this.tabIndex = index;
       if(this.filterData.controls.session?.value) {
          this.getData();
       }
      });


    this.currentTimeDate = new Date();
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.commonService.getSections(this.user?.token).subscribe((res) => {
      this.sectionsList = res.sections;
      this.sectionsList = this.sectionsList.concat();
      this.sectionsList.splice(0, 1);
      if(this.sectionsList.some(el=> el.id== sectionID.forestProducts)){
        this.filterData.controls.section?.patchValue(2)
      }
      if(this.sectionsList?.length == 1){
        this.filterData.controls.section.patchValue(this.sectionsList[0].id)
      }
      this.onChangedSection()
    });

    let infoSession = JSON.parse(sessionStorage.getItem('UNSOLD_VOLUMES')) || {};
    if(infoSession){
      this.filterData.controls.section.patchValue(infoSession?.sectionId)
      if(infoSession?.sessionId) {
        this.filterData.controls.session.patchValue(infoSession?.sessionId)
        this.onChangedSession()
      }
    }

    const R_UNREALIZED_VOLUMES: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'header.top_line.menu.unrealizedVolumes'
    );
    const faviconUrl = 'assets/img/icons/offer-managment.svg';
    this.pageMeta.setPageMeta(
      null,
      R_UNREALIZED_VOLUMES,
      faviconUrl
    );
  }

  public onChangedSectionValue(): void {
    this.filterData.controls.session.reset(null);
    this.sessionInfo = null;
    this.offers = [];
    this.onChangedSection()
  }

  public onChangedSection(): void {
    if (this.filterData.controls.section?.value) {
      this.commonService.unsoldGetListSessArch(this.user?.token, this.filterData.controls.section?.value).subscribe((res) => {
        this.sessionList = res.listSessionArchive;
        if(this.filterData.controls.session?.value){
          this.sessionInfo = this.sessionList.find(el => el.idSession == this.filterData.controls.session.value)
        }
      })
    }

    sessionStorage.setItem('UNSOLD_VOLUMES', JSON.stringify({sectionId: this.filterData.controls.section?.value, sessionId: this.filterData.controls.session?.value}));
  }

  onChangedSession(){
    if(this.filterData.controls.session.value)
    {
      this.sessionInfo = this.sessionList.find(el => el.idSession == this.filterData.controls.session.value)
      this.getData()
    }
    sessionStorage.setItem('UNSOLD_VOLUMES', JSON.stringify({sectionId: this.filterData.controls.section?.value, sessionId: this.filterData.controls.session?.value}));
  }

  public sessionTemplateSelectBox(data){
    const datepipe: DatePipe = new DatePipe('en-US')            //задает формат даты
    const date = datepipe.transform(((data?.datetimeBegin - 25569) * 24 * 3600 * 1000) +1 , 'dd.MM.yyyy')
    return data && data?.idSession + ' ' + date + ' ' + data?.sessionName
  }

  getData(){
    this.commonService.UnsoldGetListMasterWithDetails(this.user?.token, this.filterData.controls.section.value, this.filterData.controls.session.value).then((res: any) =>{
      this.offers = res.unsoldOffers

      this.unsoldOffer = []
      this.transformOfferData(res.unsoldOffers)

      this.offers.forEach((item, index) => {
        let goodName = item.goods.map(x => x.goodInfo.goodName); //создаю массив имен и добавляю в объект для фильтрации
        item['goodName'] = goodName.toString();

        let goodDescription = item.goods.map(x => x.goodInfo.goodDescription);
        item['goodDescription'] = goodDescription.toString();

        let goodVolume = item.goods.map(x => x.goodInfo.goodVolume);
        item['goodVolume'] = goodVolume;

        let goodUnitName = item.goods.map(x => x.goodInfo.goodUnitName);
        item['goodUnitName'] = goodUnitName;

        let priceWithoutVat = item.goods.map(x => x.priceParams.priceWithoutVat);
        item['priceWithoutVat'] = priceWithoutVat;

        let vatAmount = item.goods.map(x => x.priceParams.vatAmount);
        item['vatAmount'] = vatAmount;

        let totalAmount = item.goods.map(x => x.priceParams.totalAmount);
        item['totalAmount'] = totalAmount;

        item['mainName'] = this.getMainName(item.goods)
      })

      this.displayOffers = this.offers.filter(el => this.tabIndex === 0 ? (!el.transferLotNumber && !el.transferSession) : (el.transferLotNumber && el.transferSession));
    })
  }

  getMainName(item){
    let mainName;
    if (item?.length > 1) {
      for (let i = 0; i < item.length; i++) {
        const sameName = item.every((g, _, arr) => g.goodInfo.goodName === arr[0].goodInfo.goodName)
        const sameDesc = item.every((g, _, arr) => g.goodInfo.goodDescription === arr[0].goodInfo.goodDescription)
        const sameGroup = item.every((g, _, arr) => g.goodInfo.goodGroupId === arr[0].goodInfo.goodGroupId)
        //если наименование одинаковое,но разные характеристики - выводить наименование товара
        if (sameName && !sameDesc) {
          mainName =  item[i]?.goodInfo.goodName
        }
        //разное наименование товара и одинаковая ТГ  - наименование товарной группы
        if (!sameName && sameGroup) {
          mainName = item[i]?.goodInfo.goodGroupName;
        }
        //разная товарная группа - наименование номенклатурной группы
        if (!sameName && !sameGroup) {
          mainName = item[i]?.goodInfo.nomenclatureGroupName
        }
      }
    } else {
      mainName = item[0]?.goodInfo.goodName;
    }

    return mainName
  }


  transformOfferData(originalDataArray: any): void {
    originalDataArray.forEach(originalData => {
      const transformedData = [];

      if (!originalData?.goods) {
        return transformedData;
      }

      // Копируем общую информацию из основного объекта
      const commonInfo = {
        idOffer: originalData.idOffer,
        lotNumber: originalData.lotNumber,
        currencyName: originalData.currencyName,
        currencyPrecision: originalData.currencyPrecision,
        vatPercent: originalData.vatPercent,
        isPriceAdjusted: originalData.isPriceAdjusted,
        concatedDeliveryPeriod: originalData.concatedDeliveryPeriod,
        concatedPaymentConditions: originalData.concatedPaymentConditions,
        concatedDeliveryConditions: originalData.concatedDeliveryConditions,
        isComposite: originalData.isComposite,
        isMultibasis: originalData.isMultibasis,
        concatedFirmName: originalData.concatedFirmName,
        clientContractTypeName: originalData.clientContractTypeName,
        concatedClientName: originalData.concatedClientName,
        branchName: originalData.branchName,
        traderName: originalData.traderName,
        transferLotNumber: originalData.transferLotNumber,
        transferSession: originalData.transferSession,
        lotSummary: originalData.goods[0]?.lotSummary // Берем summary из первого товара (предполагается, что у всех одинаковый)
      };

      // Для каждого товара создаем новый объект с общей информацией
      originalData.goods.forEach((good: any) => {
        const transformedGood = {
          ...commonInfo,
          goodInfo: good.goodInfo,
          mainName: this.getMainName(originalData.goods),
          priceParams: good.priceParams,
          idOfferGood: good.idOfferGood
        };

        transformedData.push(transformedGood);
      });

      this.unsoldOffer = this.unsoldOffer.concat(transformedData)
      //originalData = transformedData;
    })
  }


  onCellPrepared(e) {
    if (e.rowType === "data") {
      if (e.column.command === 'select') {
        e.cellElement.classList.add("myCellFixShadowLeft");
      }

      if (e.column.dataField === "numberRegistrationBuy") {
        e.cellElement.classList.add("myCellFixShadowRight");
      }

      if (e.column.dataField === "sessionId") {
        e.cellElement.classList.add("date-roboto-mono")
      }
    }

    if (e.rowType === "header") {
      if (e.column.command === 'select') {
        e.cellElement.classList.add("myCellFixShadowLeft");
      }
      if (e.column.dataField === "numberRegistrationBuy") {
        e.cellElement.classList.add("myCellFixShadowRight");
      }
    }
  }
  onSelectionChanged(data: any) {
    this.selectedRows = data.selectedRowsData;
   /* if (this.selectedRows.length == 1) {
      this.idOffer = this.selectedRows[0].idDemandOffer
      this.offerData = this.selectedRows[0]
    }
    this.chooseOffers = this.selectedRows;*/
  }

  pagingChange() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  public hideCompositeLot(e: { value?: boolean }): void {
    this.loadingVisible = true;
    this.isHiddenLot = Boolean(e?.value);
    this.persistHideLotItemsState();
  }

  private restoreHideLotItemsState(): void {
    this.isHiddenLot =
      this.localStorageService.getItemFromLocalStorage<boolean>(
        UNREALIZED_VOLUMES_HIDE_LOT_ITEMS_KEY
      ) ?? true;
  }

  private persistHideLotItemsState(): void {
    this.localStorageService.setItemToLocalStorage(
      UNREALIZED_VOLUMES_HIDE_LOT_ITEMS_KEY,
      this.isHiddenLot
    );
  }

  onShown() {
    setTimeout(() => {
      this.loadingVisible = false;
    }, 2000);
  }

  onContentReady(e) {
    const unsortedHeaders = e.element.getElementsByClassName("dx-column-indicators");
    // we loop thru each column headers
    for (let i = 0; i < unsortedHeaders.length; i++) {
      const element = unsortedHeaders[i];
      const children = element.childNodes;
      //we create an element for the icon
      const sortableIcon = document.createElement("i");
      sortableIcon.classList.add("dx-icon", "dx-sort-icon");

      let isSortable = false;
      let hasIcon = false;
      let existingSortableIcon = "";


      //since we are going to add a custom icon, we must make sure we only add it once and when column is not sorted
      for (let i = 0; i < children.length; i++) {
        //check if column already has the icon so we don't infinitely add it
        if (element.querySelector(".dx-sort").getElementsByTagName("i").length > 0) {
          hasIcon = true;
          existingSortableIcon = children[i];
        }

        // check if column isn't sorted
        if (children[i].classList.contains("dx-sort-none")) isSortable = true;
      }

      //if can add icon
      if (isSortable && !hasIcon) {
        const sortSpan = element.querySelector(".dx-sort")
        element.querySelector(".dx-sort-none").style.display = 'inline-block';
        sortSpan.appendChild(sortableIcon);
        hasIcon = true;
      }

      //if column is sorted and we added an icon earlier, we remove it
      // you can also remove all the icons when one column is sorted, it depends on your preference
      if (!isSortable && hasIcon) element.removeChild(existingSortableIcon);
    }
  }
  onContextMenuPreparing(e: any) {
    if (e.row.rowType != "header") {
      let chooseLot=[];
      if (!e.items) e.items = [];
      if (this.selectedRows.length > 0) {
        chooseLot = this.selectedRows;
      } else {
        chooseLot.push(e.row.data)
      }
      e.items.push(
        {
          icon: './assets/img/icons/sessionOffer.svg',
          text: getTranslateResultByCurrentLang(
            this.translate.store.currentLang,
            'catalogs.viewApplication'
          ),
          disabled: chooseLot.length > 1,
          onItemClick: () => {
            this.createOfferService.sectionId =  this.filterData.controls.section.value;
            this.createOfferService.sessionId =  this.filterData.controls.session.value;
            this.createOfferService.idOffer = e.row.data.idOffer;
            this.createOfferService.isArchive = true;
            this.createOfferService.unsold = true;
            this.router.navigateByUrl('/view-offer')
          }
        })

    }
  }

  getNumber(value){
    return Number(value)
  }

  onChangeTab(e: any) {
    const newIndex =
    e.itemIndex !== undefined
      ? e.itemIndex
      : e.component.option('selectedIndex');

    if (newIndex !== undefined && newIndex !== this.tabIndex) {
      this.tabState.setIndex(newIndex, 'unsold_volumes');
    }
  }

  protected readonly numberEntriesPage = numberEntriesPage;

  onTransfer(){
    this.transferLotsPopup = true;
    this.commonService.UnsoldGetListSessTrade(this.user?.token, this.filterData.controls.section.value, this.filterData.controls.session.value).then((res: any)=>{
      this.sessionsListToTransfer = res.listSessionTrade
    })
  }

  async onStartTransfer() {
    this.failedRes = []
    this.successfulRes = []
    const body = {
      idSection: this.filterData.controls.section.value,
      idSession: this.sessionToTransfer,
      listOffers: this.selectedRows.map(x => x.idOffer)
    }
    await this.commonService.UnsoldCheckOffers(this.user?.token, body).then((res: any) => {
      this.checkedOffers = res.checkedOffers.filter(offer=> !offer.failReason)
      this.failedRes= res.checkedOffers.filter(offer=> offer.failReason)
      this.numberCheckOffer = 0;
      if (this.numberCheckOffer != this.checkedOffers.length)
        this.isVisibleProgressBar = true;
      this.onCopyLot()
    })
  }

  async onCopyLot() {
    for (let offer of this.checkedOffers) {
      try {
        const copyBody = {
          idSection: this.filterData.controls.section.value,
          idNewSession: this.sessionToTransfer,
          idOldSession: this.filterData.controls.session.value,
          idOffer: offer.idOffer,
          idModel: offer.idModel,
          isCanCancelOutRegulation: this.isCancel
        }
        const res = await this.commonService.UnsoldCopyLot(this.user?.token, copyBody);
        this.numberCheckOffer = this.numberCheckOffer + 1
        this.successfulRes.push({idOffer: offer.idOffer})

      } catch (err) {
        this.numberCheckOffer = this.numberCheckOffer + 1
        this.failedRes.push({idOffer: offer.idOffer, failReason: err.title})
      }

    if (this.numberCheckOffer == this.checkedOffers.length) {
      this.isVisibleProgressBar = false;
     }
    }
  }

  onClosePopup(){
    this.transferLotsPopup = false;
    this.numberCheckOffer = 0;
    this.checkedOffers = null;
    this.successfulRes = [];
    this.failedRes = [];
    this.sessionToTransfer = null;
    this.isCancel = false;

    this.getData()
  }

  onViewDetails(){
    let outputArray = [];
    this.selectedRows.forEach(offer => {
      this.failedRes.forEach(failOffer => {
        if(offer.idOffer == failOffer.idOffer) {
          outputArray.push(Object.assign({
            lotNumber: offer.lotNumber,
            idOffer: offer.idOffer,
            concatedFirmName: offer.concatedFirmName,
            clientContractTypeName: offer.clientContractTypeName,
            concatedClientName: offer.concatedClientName,
            branchName: offer.branchName,
            traderName: offer.traderName,
            description: failOffer.failReason,
          }, {}))
        }
      })
    })
    //так как могут быть слишком большие данные, то передаем их через localStorage
    localStorage.setItem('unrealizedVolumesData', JSON.stringify(outputArray));
    let sessionsParam = Object.assign(this.sessionInfo,
      {idSection: this.filterData.controls.section.value, sectionName: this.sectionsList.find(el=> el.id == this.filterData.controls.section.value).name})

    let title = this.translate.instant('unrealizedVolumes.resultOfTransfer');

    const url = this.router.serializeUrl(this.router.createUrlTree([`/ordermanagement/detailUnrealizedVolumesInfo`], {queryParams: {  session: JSON.stringify(sessionsParam), title: title}}));
    window.open(url, '_blank');
  }

  public exportGrid(e: ExportingEvent): void {
    const sectionName: string = this.commonService.choosenSection(
      this.filterData.controls.section?.value,
      this.translate.store.currentLang
    );

    const unrealizedVolumes: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'report-types.unconsumedAmounts'
    );

    const fileName: string = `${unrealizedVolumes}, ${sectionName}, № ${this.filterData.controls.session?.value}`;

    this.exportService.onExportingReports(
      e,
      fileName,
      FileTypes.UNREALIZED_VOLUMES,
      this.multilineFields,
    );
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    localStorage.removeItem('unrealizedVolumesData')
  }

  //-------------------------для фильтрации в таблице-------------------

  orderHeaderFilterName(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.offers.forEach(item => {
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
        this.offers
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
      this.offers.forEach(item => {
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
      this.offers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.goodInfo.goodUnitName],
            "value": el.goodInfo.goodUnitName,
            "text": el.goodInfo.goodUnitName
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
      this.offers.forEach(item => {
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

  orderHeaderFilterTotalAmount(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.offers.forEach(item => {
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

  orderHeaderFilterAmendment(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.offers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.priceAdjustment],
            "value": el.priceAdjustment,
            "text": el.priceAdjustment
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterQuotation(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.offers.forEach(item => {
        item.goods.forEach(el => {
          results.push({
            "key": [el.quotationValue],
            "value": el.quotationValue,
            "text": el.quotationValue
          });
        })
      })
      //уникальные значения в массиве results
      let uniqueResult = [...new Map(results.map(item =>
        [item['value'], item])).values()]
      return uniqueResult;
    };
  }

  orderHeaderFilterContractType(data) {
    data.dataSource.postProcess = (results) => {
      results.length = 0
      this.offers.forEach(item => {
        let contType = item.clientContractTypeName == 21 ? this.translate.instant('general.agencyAgreement') : item.clientContractTypeName == 20 ? this.translate.instant('general.commissionAgreement') : '(Пустое)'
        results.push({
          "key": [contType],
          "value": contType,
          "text": contType
        });
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
    if (target === 'headerFilter'||target === 'filterBuilder'||target === 'search') {
      return [column.dataField, 'contains', value]
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  //для фильтрации по договору
  calculateFilterExpressionContract(value, selectedFilterOperations, target) {
    const column = this as any;
    const mappedValue = value === 'Договор комиссии' ? 20 : value === 'Договор поручения' ? 21 : value === '(Пустое)' ? null : null;
    if (target === 'headerFilter'|| target === 'filterBuilder'|| target === 'search') {
      return [column.dataField, 'contains', mappedValue]
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

}
