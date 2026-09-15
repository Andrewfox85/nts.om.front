/* eslint-disable */
import { CatalogService } from './../../core/services/catalog-service.service';
import { CreateOfferService } from './../../core/services/create-offer-service.service';
import { Component, OnInit } from '@angular/core';
import { PageCache } from 'src/app/core/classes/PageCache';
import {
  sessionStage,
  levelProductBlock,
  GOOD_GROUP_REF_ID,
  GOOD_REF_ID,
} from 'src/app/api.constants';
import { TranslateService } from '@ngx-translate/core';
import { User } from 'src/app/core/classes/user';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { OfferManagementService } from './../../core/services/offer-management-service.service';
import CheckBox from 'devextreme/ui/check_box';
import { takeUntil, Subject, tap, forkJoin } from 'rxjs';
import { getCommonFromList, listToTree } from 'src/app/core/helpers';
import { PageMetaService } from '../../shared/services/page-meta/page-meta.service';
import { Observable } from 'rxjs';
import { CommonService } from 'src/app/core/services/common-service.service';
import { getTranslateResultByCurrentLang } from 'src/app/core/helpers';
import { ValueChangedEvent as CheckBoxValueChangedEvent } from 'devextreme/ui/check_box';
import { ValueChangedEvent as NumberBoxValueChangedEvent } from 'devextreme/ui/number_box';
import {
  LimitationsResponse,
  Limitation,
  LimitsParticipantsResponse,
  LimitParticipant,
  LimitationSpecifiesResponse,
  LimitationSpecify,
  SetLimitationResponse,
} from "../../core/interfaces";
import {
  RefbookItem,
  GetByNameResponse,
} from './../../core/services/catalog-service.service';
import { FilterOption } from 'src/app/shared/interfaces';
import { KeyDownEvent } from 'devextreme/ui/number_box';
import { FocusedCellChangingEvent } from 'devextreme/ui/tree_list';
import { CellPreparedEvent, SelectionChangedEvent  } from 'devextreme/ui/data_grid';
import { ReferencesValuesResponce, ReferencesResponce } from './../../core/interfaces/interface';

 interface SelectedTreeRows {
  parentId: number;
  hasChildren: boolean;
  isReadonly: boolean;
  productName: string;
  valueId: number;
  linkId: number;
  level: number;
  children: SelectedTreeRows[] | [];
}

@Component({
  selector: 'app-limitations',
  templateUrl: './limitations.component.html',
  styleUrls: ['./limitations.component.scss'],
})
export class LimitationsComponent implements OnInit {
  public user: User;
  public cache = {} as PageCache;
  public sessionInfo: any;
  public noDataText: string;
  public sessionStage = sessionStage;
  public nameSessionStage: string;
  public currentTimeDate: Date;
  public listOfLimitations: Limitation[] = [];
  public addLimitationPopup: boolean = false;
  public titlePopup: string;
  public btn: string;
  public limitsParticipants: LimitParticipant[] = [];
  public loadingVisible: boolean = false; //лодер
  public selectedTreeRows: SelectedTreeRows[] = [];
  public selectedFirmsRows: LimitParticipant[] = [];
  public treeListData: SelectedTreeRows[] = [];
  public refs: any = [];
  public refsValues: number[] = [];
  public units: RefbookItem[] = [];
  public limitationSpecifiesGroup: any = [];
  public form: FormGroup = this.formBuilder.group({
    id: [null],
    listFirms: [null, Validators.required],
    listClients: [null, Validators.required],
    idValue: [null, Validators.required],
    idLink: [null, Validators.required],
    quantity: [null],
    quantityUnit: [null],
    listValues: [null],
  });

  public selectedRowKeys: number[] = [];
  public selectionMode: string = 'all';

  public listLimits: number[] = [];
  public limitationSpecifies: LimitationSpecify[] = [];
  public firmsIds: number[] = [];
  public clientsIds: number[] = [];

  public deletePopup: boolean = false;
  public idLimatation: number; //для удаления
  public message: string = ' ';
  public isVisibleToast: boolean = false;
  public successPopup: boolean = false; //успешное добавление ограничения
  public warningPopup: boolean = false;

  public readonly levelProductBlock = levelProductBlock;

  private destroy$ = new Subject<void>();

  constructor(
    public translate: TranslateService,
    private offerManagementService: OfferManagementService,
    private createOfferService: CreateOfferService,
    private catalogService: CatalogService,
    private formBuilder: FormBuilder,
    private pageMeta: PageMetaService,
    private commonService: CommonService
  ) {
    this.orderHeaderFilterFirms = this.orderHeaderFilterFirms.bind(this); //для фильтрации таблицы
    this.orderHeaderFilterClients = this.orderHeaderFilterClients.bind(this); //для фильтрации таблицы
  }

  ngOnInit(): void {
    this.cache = JSON.parse(sessionStorage.getItem('OFFER_MANAGEMENT')) || {};
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.sessionInfo = this.cache.filters.choosenSessionForManagement; //информация о сессии

    const LIMITATIONS_TITLE: string = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'limitations.limitations'
    );
    const faviconUrl = 'assets/img/icons/part-limitations.svg';
    this.pageMeta.setPageMeta(
      this.sessionInfo?.id,
      LIMITATIONS_TITLE,
      faviconUrl
    );

    this.nameSessionStage = this.commonService.choosenSessionStage(
      Number(this.sessionInfo?.stageId),
      this.user?.IsWorker,
      this.translate.store.currentLang
    );
    this.noDataText = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'limitations.noTableData'
    );
    this.getData();
  }

  public getData(): void {
    this.loadingVisible = true;
    try {
      this.currentTimeDate = new Date();
      this.offerManagementService
        .getLimitations(
          this.sessionInfo?.tradeSectionId,
          this.sessionInfo?.id
        )
        .subscribe((res: LimitationsResponse) => {
          this.listOfLimitations = res.limitations;
          this.listLimits = this.listOfLimitations.map((item) => item.id); //создаем массив id для передачи в метод получения участников
          this.getParticipants(this.listLimits);
        });
      this.loadingVisible = false;
    } catch (error) {
      this.loadingVisible = false;
    }
  }

  public openLimitPopup(): void {
    this.addLimitationPopup = true;

    this.titlePopup = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'offer-management.addLimitation'
    );

    this.btn = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'offer-management.addLimitation'
    );

    this.getParticipants();

    this.catalogService
      .getByName(this.user?.token, 'units')
      .subscribe((res: GetByNameResponse) => {
        this.units = res.refbooks;
      });
  }

  public onSelectionChanged(data: any, type?: string): void {
    this.selectedTreeRows = data.selectedRowsData;
    //если меняем выбранную ветку на другую
    if (data?.currentDeselectedRowKeys && data?.currentDeselectedRowKeys?.length !== 0) {
      this.form.get('listValues')?.patchValue([]);
      this.refsValues = [];
    }

    if (this.selectedTreeRows[0]) {
      this.createOfferService
        .getNomenclatureRefsSubmission(
          this.user?.token,
          this.sessionInfo?.tradeSectionId,
          [this.selectedTreeRows[0]?.linkId]
        )
        .subscribe((res: ReferencesResponce) => {
          this.refs = res.references;

          //при выборе НГ убираем из отображения ТГ, товар
          if (
            this.selectedTreeRows[0].level ===
            levelProductBlock.nomenclatureGroup
          ) {
            this.refs = this.refs.filter(
              (it) => it.id !== GOOD_GROUP_REF_ID && it.id !== GOOD_REF_ID
            );
          }

          //при выборе ТГ убираем из отображения  товар
          if (
            this.selectedTreeRows[0].level === levelProductBlock.productGroup
          ) {
            this.refs = this.refs.filter((it) => it.id !== GOOD_REF_ID);
          }

          if (this.refs?.length > 0) {
            this.refs.forEach((it) => {
              if (!this.form.contains(it.id)) {
                this.form.addControl(it.id, this.formBuilder.control([]));
              }
              this.createOfferService
                .getFilterRefValuesSubmission(
                  this.user?.token,
                  this.sessionInfo?.tradeSectionId,
                  it.id,
                  [this.selectedTreeRows[0]?.linkId]
                )
                .subscribe((res: ReferencesValuesResponce) => {
                  it.values = res.values;
                  if (type === 'editGood') {
                    this.form.removeControl(it.id);
                  }
                });
            });
          } else {
            this.form.get('listValues')?.patchValue([]);
          }
        });
    }

    this.form.get('idValue').patchValue(this.selectedTreeRows[0]?.valueId);
    this.form.get('idLink').patchValue(this.selectedTreeRows[0]?.linkId);
  }

  public onSelectionFirmsChanged(data: SelectionChangedEvent): void {
    this.selectedFirmsRows = data.selectedRowsData;

    if (data.currentSelectedRowKeys.length > 0) {
      //добавляю
      const newFirmsIds: number[] = data.currentSelectedRowKeys.map((item) => item.firmId);
      const newClientsIds: number[] = data.currentSelectedRowKeys.map((item) => item.clientId);

      this.firmsIds = this.firmsIds.concat(newFirmsIds);
      this.clientsIds = this.clientsIds.concat(newClientsIds);

      this.form.get('listFirms').patchValue(this.firmsIds);
      this.form.get('listClients').patchValue(this.clientsIds);
    }

    if (data.currentDeselectedRowKeys.length > 0) {
      //удаляю
      const idsToRemoveFirms: number[] = data.currentDeselectedRowKeys.map((item) => item.firmId);
      const idsToRemoveClients: number[] = data.currentDeselectedRowKeys.map((item) => item.clientId);

      idsToRemoveFirms.forEach((id) => {
        const index: number = this.firmsIds.indexOf(id);

        if (index !== -1) {
          this.firmsIds.splice(index, 1);
        }
      });

      idsToRemoveClients.forEach((id) => {
        const index: number = this.clientsIds.indexOf(id);
        if (index !== -1) {
          this.clientsIds.splice(index, 1);
        }
      });

      this.form.get('listFirms').patchValue(this.firmsIds);
      this.form.get('listClients').patchValue(this.clientsIds);
    }
  }

  public onCellFirmPrepared(e: CellPreparedEvent): void {
    var editor = CheckBox.getInstance(
      e.cellElement.querySelector('.dx-select-checkbox')
    );

    if (e.data?.isAvailable === false) {
      //дизэблим строку участника
      editor.option('disabled', true);
      e.cellElement.style.pointerEvents = 'none';
    }
  }

  public onFocusedCellChanging(e: FocusedCellChangingEvent): void {
    e.isHighlighted = false;
  }

  public onPopupShown(): void {
    this.getDataTreeList().subscribe();
  }

  public getParticipants(listLimits?: number[], type?: string): void {
    this.offerManagementService
      .getLimitParticipants(
        this.sessionInfo?.tradeSectionId,
        this.sessionInfo?.id,
        listLimits
      )
      .subscribe((res: LimitsParticipantsResponse) => {
        this.limitsParticipants = res.limitsParticipants;

        if (listLimits && !type) {
          //получаем участников для таблицы

          if (this.listOfLimitations?.length == 1) {
            this.listOfLimitations = this.listOfLimitations.map((l) => {
              l.firms = this.limitsParticipants.filter(
                (part) => part.idLimitation == l.id && part.isChecked === true
              );
              return l;
            });
          }

          if (this.listOfLimitations?.length > 1) {
            this.listOfLimitations = this.listOfLimitations.map((l) => {
              l.firms = this.limitsParticipants.filter(
                (part) => part.idLimitation == l.id
              );
              return l;
            });
          }

          this.listOfLimitations.forEach((el) => {
            let firmsNames = el.firms.map((x) => x.firmName); //создаю массив имен и добавляю в объект для фильтрации
            el['firmsNames'] = firmsNames;
            let clientsNames = el.firms.map((x) => x.clientName); //создаю массив имен и добавляю в объект для фильтрации
            el['clientsNames'] = clientsNames;
          });
        }

        if (listLimits && type === 'edit') {
          //участники для редактирования
          this.selectedFirmsRows = this.limitsParticipants.filter(
            (el) => el.isChecked === true && el.isAvailable === true
          );

        }
      });
  }

  public getDataTreeList(): Observable<any> {
    return forkJoin([
      this.offerManagementService.getTreeGroupsBySessionId(
        this.sessionInfo?.tradeSectionId,
        this.sessionInfo?.id
      ),
      this.offerManagementService.getTreeGroups(
        this.sessionInfo?.tradeSectionId
      ),
    ]).pipe(
      tap(([treeGroupsBySessionId, treeGroups]) => {
        const treeProductsArray = treeGroupsBySessionId.data.flatMap(
          (item) => item.treeProducts
        );

        const treeData = listToTree(treeProductsArray);
        const allTreeData = listToTree(treeGroups.data);

        this.treeListData = getCommonFromList(treeData, allTreeData);
      })
    );
  }

  public onValueChanged(e: CheckBoxValueChangedEvent, select: string): void {
    if (!e.value || e.value.length == 0) {
      switch (select) {
        case 'refs': {
          if (this.refsValues.length == 1) {
            this.refsValues = [];
            this.form.get('listValues')?.patchValue(this.refsValues);
          } else {
            let missingElem = e.previousValue.filter(
              (element) => !e.value.includes(element)
            );
            this.refsValues = this.refsValues.filter(
              (el) => el !== missingElem[0]
            );
            this.form.get('listValues')?.patchValue(this.refsValues);
          }
          break;
        }
      }
    } else {
      switch (select) {
        case 'refs': {
          if (e.value.length > e.previousValue.length) {
            //добавление
            this.refsValues = this.refsValues.concat(e.value);
            this.refsValues = this.refsValues.filter(
              (item, index) => this.refsValues.indexOf(item) === index
            );
            this.form.get('listValues')?.patchValue(this.refsValues);
          } else {
            //удаление
            let missingElem = e.previousValue.filter(
              (element) => !e.value.includes(element)
            );
            this.refsValues = this.refsValues.filter(
              (el) => el !== missingElem[0]
            );
            this.form.get('listValues')?.patchValue(this.refsValues);
          }
          break;
        }
      }
    }
  }

  public onChangeQuantity(e: NumberBoxValueChangedEvent): void {
    const unitControl = this.form.get('quantityUnit');
    if (this.form.get('quantity')?.value) {
      unitControl.setValidators([Validators.required]);
    } else {
      unitControl.setValue(null);
      unitControl.clearValidators();
    }
    unitControl.updateValueAndValidity({ emitEvent: false });
  }

  public submitForm(): void {
    if (!this.form.get('quantity')?.value) {
      this.warningPopup = true;
    } else {
      this.setLimitation();
    }
  }

  public setLimitation(): void {
    const body = {
      idSection: this.sessionInfo?.tradeSectionId,
      idSession: this.sessionInfo?.id,
      idLimitation: this.form.get('id')?.value || null,
      listFirms: this.form.get('listFirms')?.value,
      listClients: this.form.get('listClients')?.value,
      idValue: this.form.get('idValue')?.value,
      idLink: this.form.get('idLink')?.value,
      lotQuantityMaximum: this.form.get('quantity')?.value,
      lotQuantityUnit: this.form.get('quantityUnit')?.value,
      listValues: this.form.get('listValues')?.value || [],
    };

    this.offerManagementService
      .setLimitation(body)
      .subscribe((res: SetLimitationResponse) => {
        if (res) {
          this.addLimitationPopup = false;
          this.warningPopup = false;
          this.successPopup = true;
          this.clearForm();
        }
      });
  }

  public editForm(data: Limitation): void {

    this.getParticipants([data?.id], 'edit');

    this.getDataTreeList().subscribe(() => {
      this.selectedRowKeys = [data.treeIdLink];
      this.onSelectionChanged({
        selectedRowsData: [
          {
            valueId: data.treeIdValue,
            linkId: data.treeIdLink,
            level: data.treeLevel,
          },
        ],
      });
    });

    this.loadingVisible = true;
    this.offerManagementService
      .getLimitationSpecify(
        this.sessionInfo?.tradeSectionId,
        this.sessionInfo?.id,
        data?.id
      )
      .subscribe((res: LimitationSpecifiesResponse) => {
        this.limitationSpecifies = res.limitationSpecifies;

        let idsValue = this.limitationSpecifies.map((item) => item.idValue);
        this.refsValues = idsValue;
        this.form.get('listValues').patchValue(idsValue);

        this.limitationSpecifiesGroup = this.limitationSpecifies.reduce(
          function (r, a) {
            //сгруппированы поля по idReference
            r[a.idReference] = r[a.idReference] || [];
            r[a.idReference].push(a);
            return r;
          },
          {}
        );

        this.limitationSpecifiesGroup = Object.entries(
          this.limitationSpecifiesGroup
        ); //возвращает массив объектов

        for (let i = 0; i < this.limitationSpecifiesGroup?.length; i++) {
          //добавление полей в динамическую форму
          let values = this.limitationSpecifiesGroup[i][1].map(
            (item) => item.idValue
          );
          this.form.addControl(
            this.limitationSpecifiesGroup[i][0],
            this.formBuilder.control(values)
          );
        }
        this.loadingVisible = false;
      });

    this.catalogService
      .getByName(this.user?.token, 'units')
      .subscribe((res) => {
        this.units = res.refbooks;
      });

    this.form.get('idValue').patchValue(data?.treeIdValue);
    this.form.get('idLink').patchValue(data?.treeIdLink);
    this.form.get('quantity')?.patchValue(data?.lotQuantityMaximum);
    this.form
      .get('quantityUnit')
      ?.patchValue(data?.lotQuantityUnitId?.toString());
    this.form.get('id').patchValue(data?.id);
    this.addLimitationPopup = true;
    this.titlePopup = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'limitations.editLimitation'
    );
    this.btn = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'btns.save'
    );
  }

  private clearForm(): void {
    this.form.get('id').setValue(null);
    this.form.get('idValue').setValue(null);
    this.form.get('idLink').setValue(null);
    this.form.get('quantity')?.setValue(null);
    this.form.get('quantityUnit').setValue(null);
    this.form.get('listValues')?.setValue([]);
    this.firmsIds = [];
    this.clientsIds = [];
    this.refsValues = [];
    this.refs = [];
    this.selectedTreeRows = [];
    this.selectedRowKeys = [];
    this.selectedFirmsRows = [];
  }

  public closePopup(): void {
    for (let i = 0; i < this.limitationSpecifiesGroup?.length; i++) {
      //удаление полей из динамической формы
      this.form.removeControl(this.limitationSpecifiesGroup[i][0]);
    }
    this.addLimitationPopup = false;
    this.clearForm();
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public openDeletePopup(id: number): void {
    this.deletePopup = true;
    this.idLimatation = id;
  }

  public onDeleteSubmit(): void {
    const body = {
      idSection: this.sessionInfo?.tradeSectionId,
      idSession: this.sessionInfo?.id,
      idLimitation: this.idLimatation,
    };
    this.offerManagementService
      .deleteLimitation(body)
      .subscribe(() => {
        this.message = getTranslateResultByCurrentLang(
          this.translate.store.currentLang,
          'limitations.deleteMessage'
        );
        this.isVisibleToast = true;
        this.getData();
      });
  }

  public orderHeaderFilterFirms(data): void {
    data.dataSource.postProcess = () => {

      if (!this.listOfLimitations?.length) {
        return [];
      }
      const results = this.listOfLimitations.reduce((acc, item) => {
        const firmsItems = item.firms?.map((el) => ({
          key: [el.firmName],
          value: el.firmName,
          text: el.firmName,
        }));
        return [...acc, ...firmsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }


  public orderHeaderFilterClients(data): void {
    data.dataSource.postProcess = () => {

      if (!this.listOfLimitations?.length) {
        return [];
      }
      const results = this.listOfLimitations.reduce((acc, item) => {
        const firmsItems = item.firms?.map((el) => ({
          key: [el.clientName],
          value: el.clientName,
          text: el.clientName,
        }));
        return [...acc, ...firmsItems];
      }, []);

      return this.getUniqueResults(results);
    };
  }

  private getUniqueResults(results: FilterOption[]): FilterOption[] {
    return [...new Map(results.map((item) => [item['value'], item])).values()];
  }

  calculateFilterExpression(value, selectedFilterOperations, target) {
    const column = this as any;
    if (target === 'headerFilter') {
      return [column.dataField, 'contains', value];
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }
}
