/* eslint-disable */
import { Injectable } from '@angular/core';
import { FiltersService } from "../../sub_components/filters/filters.service";
import { GOOD_REF_ID, IdDirection } from "../../api.constants";
import { BehaviorSubject, concatMap, forkJoin, from, Observable } from "rxjs";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { SidebarService } from "./sidebar-service.service";
import { CreateOfferService, IGoods, INomenclaturesWithGroups } from "./create-offer-service.service";
import { IServiceError, RefsDataValues } from "../interfaces/interface";
import { getTranslateResultByCurrentLang } from "../helpers";
import { ErrorServiceService } from "./error-service.service";
import { TranslateService } from "@ngx-translate/core";
import { User } from "../classes/user";
import ClickEvent = DevExpress.ui.dxButton.ClickEvent;
import DevExpress from "devextreme";

export interface ReplaceGood {
  goodName?: string;
  id: number;
  properties: Properties[];
  changedStandardizedFieldsId?: number [];
}

export interface Properties {
  propertyIds: number[];
  propertyName: string;
  propertyValue: string;
  specifyBlockId: number | null;
  specifyBlockName: string | null;
}

export interface GoodCharacteristics {
  id: number;
  name: string;
  values?: Values[];
  isDepend?: number;
  level?: number;
  index?: number;
}

export interface ReferencesGoodCharacteristics {
  references: GoodCharacteristics[];
}

export interface Values {
  id: number;
  idLink: number;
  name: string;
}

export interface IReferencesValueDep {
  references: Values[];
}

export interface FullCharacteristics {
  idReference: number;
  propertyIds: number[];
  propertyName: string;
  propertyValue: string;
  specifyBlockId: number;
  specifyBlockName: string | null;
}

export interface TemporaryDependensItem {
  [dependKey: string]: any;
  index: number;
  isDepend: number;
}

export interface addGoodFromNSI {
  event: ClickEvent;
  NSIlistProperty: number[];
  characteristicsNSI: FormGroup;
}

@Injectable({
  providedIn: 'root'
})
export class AddNsiGoodService {

  private NSIlistPropertySubject = new BehaviorSubject<any[]>([]);
  public NSIlistProperty$ = this.NSIlistPropertySubject.asObservable();

  public allCharacteristicsSubject = new BehaviorSubject<any[]>([]);
  public allCharacteristics$ = this.allCharacteristicsSubject.asObservable();

  private characteristicsNSISubject = new BehaviorSubject<any>({ controls: {} });
  public characteristicsNSI$ = this.characteristicsNSISubject.asObservable();

  public removedInfoWhenReplacedGoodSubject = new BehaviorSubject<boolean>(false);
  public removedInfoWhenReplacedGood$ = this.removedInfoWhenReplacedGoodSubject.asObservable();

  public removedCharacteristicsWhenReplacedGoodSubject = new BehaviorSubject<boolean>(false);
  public removedCharacteristicsWhenReplacedGood$ = this.removedCharacteristicsWhenReplacedGoodSubject.asObservable();

  public newGoodSubject = new BehaviorSubject<ReplaceGood>({ id: 0, properties: [] });
  public newGood$ = this.newGoodSubject.asObservable();

  public addGoodNSIForm: FormGroup = this.formBuilder.group({
    nomenclaturesWithGroups: [],
    goodsGroup: [],
    goods: [],
  });

  public directionSubject = new BehaviorSubject<number>(0);
  public temporaryDependensInfo: TemporaryDependensItem[] = [];

  constructor(
    public filtersService: FiltersService,
    public formBuilder: FormBuilder,
    public sidebarService: SidebarService,
    private createOfferService: CreateOfferService,
    private errorServiceService: ErrorServiceService,
    public translate: TranslateService
  ) {
  }

  public setAllCharacteristics(data: GoodCharacteristics[]): void {
    this.allCharacteristicsSubject.next(data);
  }

  public setCharacteristicsNSI(data: { controls: {} }): void {
    this.characteristicsNSISubject.next(data);
  }

  public setNsiListProperty(data: number[]): void {
    this.NSIlistPropertySubject.next(data);
  }

  public getRefData(
    ref: GoodCharacteristics,
    user: User,
    sectionId: number,
    goodIdLink: number,
    fullData?: FullCharacteristics[]
  ): void {
    let allCharacteristics = this.allCharacteristicsSubject.getValue();
    const characteristicsNSI = this.characteristicsNSISubject.getValue();

    const idLinks: number[] = [];

    if (ref.isDepend) {
      characteristicsNSI.controls[ref.isDepend.toString()].value.forEach((ch) => {
        const characteristics = allCharacteristics
          .find((el) => el.id == ref.isDepend);
        const values = characteristics.values.filter((v) =>
          v.id === ch
        );
        values?.forEach(v => {
          idLinks.push(v.idLink);
        });
      });
    } else {
      idLinks.push(goodIdLink);
    }

    from(idLinks).pipe(
      concatMap(idLink =>
        this.filtersService.GetAvailableRefValuesDep(
          user?.token,
          sectionId,
          ref.id,
          idLink
        )
      )
    ).subscribe({
      next: (res: IReferencesValueDep) => {
        this.prepareGetAvailableRefValuesDep(
          ref,
          res.references,
          fullData
        );
      },
      complete: () => {
        // Все запросы выполнены
        if (this.temporaryDependensInfo?.length > 0) {
          const characteristicsNSI = this.characteristicsNSISubject.getValue();
          const values = this.temporaryDependensInfo.find(obj => obj.hasOwnProperty(ref.id.toString()));
          if (values && values[ref.id]) {
            const refValues = allCharacteristics.find(el => el.id === ref.id)?.values;
            const refValuesIds = new Set(refValues.map(val => val.id));
            values[ref.id] = values[ref.id].filter(value => refValuesIds.has(value));
            characteristicsNSI.controls[ref.id.toString()].patchValue(
              values[ref.id]
            );
            characteristicsNSI.controls['analogs' + ref.id.toString()].patchValue(
              values['analogs' + ref.id.toString()],
            );
          }
          this.characteristicsNSISubject.next(characteristicsNSI);
        }
      }
    });
  }

  public prepareGetAvailableRefValuesDep(
    ref: GoodCharacteristics,
    references: Values[],
    fullData?: FullCharacteristics[]
  ): void {
    const direction = this.directionSubject.getValue();
    let allCharacteristics = this.allCharacteristicsSubject.getValue();
    let characteristicsNSI = this.characteristicsNSISubject.getValue();
    const findIndex = allCharacteristics.findIndex(ch => ch.id === ref.id);
    allCharacteristics[findIndex].values = [...(allCharacteristics[findIndex].values || []), ...references];

    // Отправляем обновленные данные обратно в компонент
    this.allCharacteristicsSubject.next(allCharacteristics);

    if (fullData &&
      !characteristicsNSI.controls[ref.isDepend?.toString()]?.touched &&
      !characteristicsNSI.controls[ref.isDepend?.toString()]?.dirty) {
      this.onPrepareValueEditCharacteristics(ref, fullData, references);
    } else if (direction == IdDirection.sale) {
      //для продажи все поля должны быть заполнены одним значением
      if (ref.values?.length === 1) {
        characteristicsNSI.controls[ref.id.toString()].patchValue([
          ref.values[0].id,
        ]);
        characteristicsNSI.controls[ref.id.toString()].markAsTouched();
        characteristicsNSI.controls[ref.id.toString()].markAsDirty();
        this.characteristicsNSISubject.next(characteristicsNSI);
      }
    }
  }

  public onPrepareValueEditCharacteristics(
    ref: GoodCharacteristics,
    fullData: FullCharacteristics[],
    references: Values[]
  ): void {
    const characteristicsNSI = this.characteristicsNSISubject.getValue();
    const valueId = fullData.find(el => el.idReference === ref.id)?.propertyIds;
    const isValue = references.find((el) => el.id == valueId?.[0]);
    if (valueId && isValue) {
      characteristicsNSI.controls[ref.id.toString()].patchValue(
        valueId
      );
    } else if (valueId || isValue) {
      this.removedInfoWhenReplacedGoodSubject.next(true);
    }
    this.characteristicsNSISubject.next(characteristicsNSI);
  }

  public getListProperty(goodIdValue: number): number[] {
    const characteristicsNSI = this.characteristicsNSISubject.getValue();
    let listProperty: number[] = [];

    Object.keys(characteristicsNSI.controls).forEach(key => {
      const controlValue = characteristicsNSI.controls[key].value;

      if (Array.isArray(controlValue) && controlValue.length > 0) {
        controlValue.forEach((el) => listProperty.push(el));
      }
    });

    const index: number = listProperty.findIndex(el => el === goodIdValue);
    if (index !== -1) {
      listProperty.splice(index, 1);
    }
    return listProperty;
  }

  public onChangedValueWithAnalogues(ref: GoodCharacteristics, goodIdValue: number): void {
    const characteristicsNSI = this.characteristicsNSISubject.getValue();
    let NSIlistProperty: number[];
    if (characteristicsNSI.controls[ref.id.toString()]?.value?.length >= 0) {
      characteristicsNSI.controls['analogs' + ref.id.toString()]
        .patchValue(false);
    }

    this.characteristicsNSISubject.next(characteristicsNSI);
    NSIlistProperty = this.getListProperty(goodIdValue);
    this.NSIlistPropertySubject.next(NSIlistProperty);
  }

  public listPropertyNSI(
    ref: GoodCharacteristics,
    isAnalogSession: boolean,
    user: User,
    sectionId: number,
    goodIdValue: number
  ): void {
    let allCharacteristics = this.allCharacteristicsSubject.getValue();
    const characteristicsNSI = this.characteristicsNSISubject.getValue();
    const direction = this.directionSubject.getValue();
    let NSIlistProperty = this.NSIlistPropertySubject.getValue();
    const controlRefId = characteristicsNSI.controls[ref.id.toString()];
    if (
      direction == IdDirection.sale ||
      (direction == IdDirection.buy && !isAnalogSession)
    ) {
      //для продажи должно быть только одно значение в выпадающем списке, а так как это dx-tag-box оставляем только последнее значение
      if (controlRefId.value?.length > 1) {
        controlRefId.setValue(
          controlRefId.value.splice(1, 1)
        );
        return;
      }
    }

    const idsToRemove = this.removeDependencies(allCharacteristics, ref.id);
    allCharacteristics
      .filter(item => idsToRemove.has(item.id))
      .forEach(item => {
        if (isAnalogSession) {
          const idKey = item.id.toString();
          const analogKey = `analogs${idKey}`;
          const nextValue = {
            [item.id]: characteristicsNSI.controls[item.id].value,
            [analogKey]: characteristicsNSI.controls[analogKey].value,
            index: item.index,
            isDepend: item.isDepend,
          };

          const existingIndex = this.temporaryDependensInfo?.findIndex(obj =>
            Object.prototype.hasOwnProperty.call(obj, idKey)
          ) ?? -1;
          if (existingIndex >= 0) {
            this.temporaryDependensInfo = this.temporaryDependensInfo.map((obj, index) =>
              index === existingIndex
                ? {
                  ...obj,
                  ...nextValue,
                }
                : obj
            );
          } else {
            this.temporaryDependensInfo = [...this.temporaryDependensInfo, nextValue];
          }
        }
        characteristicsNSI.removeControl(item.id);
        characteristicsNSI.removeControl('analogs' + item.id.toString());
      });
    this.characteristicsNSISubject.next(characteristicsNSI);
    allCharacteristics = allCharacteristics
      .filter(item => !idsToRemove.has(item.id));
    const idLinks: number[] = [];
    controlRefId?.value?.forEach((controlRef) => {
      //ищем зависимые характеристики
      const valueRefArray = ref.values?.filter((el) =>
        el.id === Number(controlRef)
      );
      if (
        controlRefId?.value?.length > 0 &&
        valueRefArray?.length > 0
      ) {
        valueRefArray.forEach(valueRef => {
            idLinks.push(valueRef.idLink);
          }
        );
      }
    });
    from(idLinks).pipe(
      concatMap(idLink =>
        this.filtersService
          .GetAvailableReferencesDep(
            user?.token,
            sectionId,
            idLink
          )
      )
    ).subscribe({
      next: (res: IReferencesValueDep) => {
        // Обрабатываем каждый результат по мере получения
        if (res.references?.length > 0) {
          let allCharacteristics = this.allCharacteristicsSubject.getValue();
          const characteristicsNSI = this.characteristicsNSISubject.getValue();
          const reversedFind = [...allCharacteristics].reverse().findIndex(el => el.isDepend === ref.id);
          const indexToInsert = reversedFind !== -1 ?
            allCharacteristics.length - 1 - reversedFind :
            allCharacteristics.findIndex(
              (el) => el.id == ref.id
            );
          res.references.forEach((el: GoodCharacteristics) => {
            let indexRef = allCharacteristics.findIndex(
              (c) => c.id == el.id
            );

            if (indexRef === -1) {
              el.isDepend = ref.id; //параметр от какого справочника зависит значение
              el.level = (ref?.level || 0) + 1;
              el.index = this.temporaryDependensInfo
                  .find(obj => obj.hasOwnProperty(el.id.toString()))?.index ||
                indexToInsert + 1;
              allCharacteristics.splice(indexToInsert + 1, 0, el);
              characteristicsNSI.addControl(
                el.id.toString(),
                this.formBuilder.control(null)
              );
              let name: any = 'analogs' + el.id;
              characteristicsNSI.addControl(
                name,
                this.formBuilder.control(false)
              );

              allCharacteristics.sort((a, b) => a?.index - b?.index);
              this.allCharacteristicsSubject.next(allCharacteristics);
              this.characteristicsNSISubject.next(characteristicsNSI);
            }
          });
        }
      },
      complete: () => {
        // Все запросы выполнены
        if (this.temporaryDependensInfo?.length > 0) {
          const existingIds = new Set(allCharacteristics.map(char => char.id));
          this.temporaryDependensInfo = this.temporaryDependensInfo.filter(item => {
            if (item.isDepend !== ref.id)
              return true;
            const idKey = Object.keys(item).find(key => !isNaN(parseInt(key)) && key !== 'index');
            if (!idKey) return false;

            const id = parseInt(idKey);
            return existingIds.has(id) && item.isDepend === ref.id;
          });
        }
      }
    });

    this.allCharacteristicsSubject.next(allCharacteristics);
    NSIlistProperty = this.getListProperty(goodIdValue);
    this.NSIlistPropertySubject.next(NSIlistProperty);
  }

  public removeDependencies(allCharacteristics: GoodCharacteristics[], refId: number): Set<number> {
    const idsToRemove = new Set<number>([refId]);
    allCharacteristics.forEach(item => {
      if (item.isDepend && idsToRemove.has(item.isDepend)) {
        idsToRemove.add(item.id);
      }
    });
    idsToRemove.delete(refId);
    return idsToRemove;
  }

  public getGoodCharacteristics(
    user: User,
    sectionId: number,
    goodValue,
    isAllowAnalogues: boolean,
    editGoodCharacteristicInfo?
  ): void {
    let allCharacteristics = this.allCharacteristicsSubject.getValue();
    let characteristicsNSI = this.formBuilder.group({});
    let NSIlistProperty = this.NSIlistPropertySubject.getValue();

    allCharacteristics.forEach((item) => {
      characteristicsNSI.removeControl(item.id.toString());
    });
    allCharacteristics = [];
    NSIlistProperty = [];
    this.setAllCharacteristics(allCharacteristics);
    this.setCharacteristicsNSI(characteristicsNSI);
    this.setNsiListProperty(NSIlistProperty);

    this.getAvailableReferences(
      user,
      sectionId,
      goodValue,
      isAllowAnalogues
    )
      .subscribe((res: ReferencesGoodCharacteristics) => {
        const characteristicsNSI = this.characteristicsNSISubject.getValue();
        allCharacteristics = res.references;
        this.setAllCharacteristics(allCharacteristics);

        if (editGoodCharacteristicInfo) {
          if (allCharacteristics?.length === 0) {
            this.onShowErrorPopup();
          } else {
            this.onOpenSidebar(editGoodCharacteristicInfo);
          }
        }

        allCharacteristics.forEach((item) => {
          characteristicsNSI.addControl(
            item.id,
            this.formBuilder.control(null)
          );

          let name: any = 'analogs' + item.id;
          characteristicsNSI.addControl(
            name,
            this.formBuilder.control(false)
          );
        });
        characteristicsNSI.addControl(
          GOOD_REF_ID.toString(),
          this.formBuilder.control(
            [goodValue.idValue],
            Validators.required
          )
        );
        characteristicsNSI.addControl(
          'analogs' + GOOD_REF_ID,
          this.formBuilder.control(false)
        );

        characteristicsNSI.controls[GOOD_REF_ID].patchValue([
          goodValue.idValue,
        ]);
        characteristicsNSI.controls[
        'analogs' + GOOD_REF_ID
          ].patchValue(false);

        this.setCharacteristicsNSI(characteristicsNSI);

        if (isAllowAnalogues) {
          this.getAvailableReferencesValues(user, sectionId, goodValue);
        }
      });
  }

  public getAvailableReferences(
    user: User,
    sectionId: number,
    goodValue,
    isAllowAnalogues: boolean
  ): Observable<ReferencesGoodCharacteristics> {
    if (isAllowAnalogues) {
      return this.filtersService
        .GetAvailableReferences(
          user?.token,
          sectionId,
          goodValue.idLink,
          goodValue.idValue
        );
    }
    return this.filtersService
      .GetAvailableReferencesDep(
        user?.token,
        sectionId,
        goodValue.idLink
      );
  }

  public getAvailableReferencesValues(
    user: User,
    sectionId: number,
    goodValue
  ): void {
    let allCharacteristics = this.allCharacteristicsSubject.getValue();

    allCharacteristics.forEach(item => {
      this.filtersService.GetAvailableRefValues(
        user?.token,
        sectionId,
        goodValue.idLink,
        goodValue.idValue,
        item.id
      ).subscribe((res: RefsDataValues) => {
        item.values = res.values;
      });
    });
  }

  public clearAddGoodNSI(goodIdValue: number): void {
    const allCharacteristics = this.allCharacteristicsSubject.getValue();
    const characteristicsNSI = this.characteristicsNSISubject.getValue();

    allCharacteristics.forEach((item) => {
      characteristicsNSI.controls[item.id.toString()]?.reset([]);
      characteristicsNSI.controls['analogs' + item.id.toString()]?.reset(
        false
      );
    });

    characteristicsNSI.controls[GOOD_REF_ID].patchValue([
      goodIdValue,
    ]);
    characteristicsNSI.controls['analogs' + GOOD_REF_ID].reset(false);

    this.allCharacteristicsSubject.next(allCharacteristics);
    this.characteristicsNSISubject.next(characteristicsNSI);
  }

  public onEditGoodCharacteristic(user: User, goodInfo): void {
    this.createOfferService
      .GetNomenclaturesWithGroups(
        user?.token,
        goodInfo.sectionId,
        goodInfo.modelId
      )
      .subscribe((res: INomenclaturesWithGroups) => {
        let nomenclaturesWithGroups = [];
        nomenclaturesWithGroups = res.nomenclaturesWithGroups;
        if (nomenclaturesWithGroups.find(el => el.idValue === goodInfo.idNomenclatureGroup)) {
          this.addGoodNSIForm.controls['nomenclaturesWithGroups'].setValue(
            goodInfo.idNomenclatureGroup
          );
          let goodsGroup = nomenclaturesWithGroups?.find(
            (el) =>
              el.idValue ==
              this.addGoodNSIForm.controls['nomenclaturesWithGroups']?.value
          )?.groups;

          if (goodsGroup.find(el => el.idValue === goodInfo.idGoodGroup)) {
            this.addGoodNSIForm.controls['goodsGroup'].setValue(
              goodInfo.idGoodGroup
            );

            let goodsGroupIdLink = goodsGroup?.find(
              (el) => el.idValue == this.addGoodNSIForm.controls['goodsGroup'].value
            )?.idLink;
            this.createOfferService
              .GetGoodsListSubmission(
                user?.token,
                goodInfo.sectionId,
                goodInfo.modelId,
                goodsGroupIdLink
              )
              .then((res: IGoods) => {
                let goodsValue = res.goods;
                let good = goodsValue.find(el => el.idValue === goodInfo.idGoodName);
                if (good) {
                  this.addGoodNSIForm.controls['goods'].setValue(
                    good
                  );
                  this.getGoodCharacteristics(
                    user,
                    goodInfo.sectionId,
                    this.addGoodNSIForm.get('goods')?.value,
                    false,
                    goodInfo);
                } else
                  this.onShowErrorPopup();
              });
          } else
            this.onShowErrorPopup();
        } else
          this.onShowErrorPopup();
      });
  }

  public onShowErrorPopup(): void {
    const error: IServiceError = {
      error: true,
      errorStatus: 500,
      messageError: getTranslateResultByCurrentLang(
        this.translate.store.currentLang,
        'createOffer.good.errorWhenReplacingProduct'
      ),
    };
    this.errorServiceService.callErrorPopup(error);
  }

  //todo добавить типизацию
  public onOpenSidebar(goodInfo): void {
    document.getElementById('mySidebar').style.right = '0';
    document.getElementById('mySidebar').style.opacity = '1';
    document.getElementById('dark').className = 'dark_opened';

    const dataForReq = {
      ...goodInfo,
      addGoodNSIForm: this.addGoodNSIForm
    };
    this.sidebarService.dataForReqSubject.next(dataForReq);
    this.sidebarService.typeSubject.next('changedGoodProperty');
  }

}
