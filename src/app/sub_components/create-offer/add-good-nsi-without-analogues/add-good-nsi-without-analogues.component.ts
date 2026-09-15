/* eslint-disable */
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from "@angular/forms";
import { CommonService } from "../../../core/services/common-service.service";
import {
  addGoodFromNSI,
  AddNsiGoodService,
  FullCharacteristics,
  GoodCharacteristics
} from "../../../core/services/add-nsi-good.service";
import { Subject, takeUntil } from "rxjs";
import { COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES, getComparisons } from "../../../api.constants";
import DevExpress from "devextreme";
import ClickEvent = DevExpress.ui.dxButton.ClickEvent;
import { ACTION } from "../../../core/enums";
import { User } from "../../../core/classes/user";
import { AppConfigService } from "../../../app-config.service";

@Component({
  selector: 'ceit-add-good-nsi-without-analogues',
  templateUrl: './add-good-nsi-without-analogues.component.html',
  styleUrls: ['./add-good-nsi-without-analogues.component.scss']
})
export class AddGoodNsiWithoutAnaloguesComponent implements OnInit, OnDestroy {
  @Input() allCharacteristics: GoodCharacteristics[];
  @Input() NSIlistProperty: number[];
  @Input() user: User;
  @Input() sectionId: number;
  @Input() direction: number;
  @Input() isAnalogSession: boolean;
  @Input() isDisabledFields?: boolean;
  @Input() addGoodNSIForm: FormGroup;
  @Input() fullData: FullCharacteristics[];
  @Input() isAddGoodFromNSI: boolean;
  @Input() isCollectionByCharacteristics: boolean;
  @Output() addGoodFromNSI: EventEmitter<addGoodFromNSI> = new EventEmitter<addGoodFromNSI>();
  @Output() changedStandardizedFieldsId: EventEmitter<{ idField: number, action: string }> = new EventEmitter<{
    idField: number,
    action: string
  }>();

  characteristicsNSI: FormGroup = this.formBuilder.group({});
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    public commonService: CommonService,
    public addNsiGoodService: AddNsiGoodService,
    private conf: AppConfigService,
  ) {
  }

  public onAddGoodFromNSI(e: ClickEvent): void {
    this.addGoodFromNSI.emit(
      {
        event: e,
        NSIlistProperty: this.NSIlistProperty,
        characteristicsNSI: this.characteristicsNSI
      });
  }

  public ngOnInit(): void {
    this.addNsiGoodService.temporaryDependensInfo = [];
    this.addNsiGoodService.directionSubject.next(this.direction);

    this.addNsiGoodService.allCharacteristics$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: []) => {
        this.allCharacteristics = data;
        if (this.fullData?.length > 0) {
          const allIds = this.allCharacteristics.map(item => item.id);
          const dataIds = this.fullData.map(item => item.idReference);
          const isHasAllIds = dataIds.every(id => allIds.includes(id));
          this.addNsiGoodService.removedCharacteristicsWhenReplacedGoodSubject.next(!isHasAllIds);
        }
      });

    this.addNsiGoodService.characteristicsNSI$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FormGroup) => {
        this.characteristicsNSI = data;
      });

    this.addNsiGoodService.NSIlistProperty$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: number[]) => {
        this.NSIlistProperty = data;
      });
  }

  public isDisabledActualFields(refId: number): boolean {
    return this.isDisabledFields &&
      Object.values(this.conf.refIdActualDimensions).includes(refId);
  }

  public isDisabledTheSameVariety(refId: number): boolean {
    return (
      (this.isAddGoodFromNSI && this.fullData?.length > 0)
        || (!this.isAddGoodFromNSI && this.isCollectionByCharacteristics)
      ) && refId !== Number(COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES);
  }

  public onChangedStandardizedProps(refId: number): void {
    if (!this.fullData || this.fullData?.length == 0) {
      return;
    } else {
      const actualDimensionIds = Object.values(this.conf.refIdActualDimensions);
      const changeStandardizedProp = actualDimensionIds.includes(refId);
      const COMPARISONS = getComparisons(this.conf.refIdActualDimensions);
      if (changeStandardizedProp) {
        let idField = COMPARISONS.find((el) => el.refId == refId)?.idField;
        const fullDataValue = this.fullData.find(el => el.idReference === refId)?.propertyIds[0];
        if (fullDataValue != this.characteristicsNSI.controls[refId.toString()]?.value?.[0]) {
          this.changedStandardizedFieldsId.emit({ idField: idField, action: ACTION.ADD });
        } else {
          this.changedStandardizedFieldsId.emit({ idField: idField, action: ACTION.REMOVE });
        }
      }
    }
  }

  public onResetData(): void {
    if (this.fullData?.length > 0) {
      this.characteristicsNSI.controls[COMPLEX_LOT_PRODUCT_TYPE_WITH_SAME_GRADES]?.reset([]);
    } else {
      this.addNsiGoodService.clearAddGoodNSI(this.addGoodNSIForm.get('goods')?.value?.idValue);
    }
  }

  public trackByFn(index: number, item: GoodCharacteristics) {
    return item.id;
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
