/* eslint-disable */
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { GOOD_REF_ID } from "../../../api.constants";
import { FormBuilder, FormGroup } from "@angular/forms";
import { CommonService } from "../../../core/services/common-service.service";
import { addGoodFromNSI, AddNsiGoodService, GoodCharacteristics } from "../../../core/services/add-nsi-good.service";
import { Subject, takeUntil } from "rxjs";
import DevExpress from "devextreme";
import ClickEvent = DevExpress.ui.dxButton.ClickEvent;
import { User } from "../../../core/classes/user";

@Component({
  selector: 'ceit-add-good-nsi-with-analogues',
  templateUrl: './add-good-nsi-with-analogues.component.html',
  styleUrls: ['./add-good-nsi-with-analogues.component.scss']
})
export class AddGoodNsiWithAnaloguesComponent implements OnInit, OnDestroy {
  @Input() allCharacteristics: GoodCharacteristics[];
  @Input() addGoodNSIForm: FormGroup;
  @Input() NSIlistProperty: number[];
  @Input() user: User;
  @Input() sectionId: number;
  @Input() direction: number;
  @Input() isAnalogSession: boolean;
  @Output() addGoodFromNSI: EventEmitter<addGoodFromNSI> = new EventEmitter<addGoodFromNSI>();

  private destroy$ = new Subject<void>();

  characteristicsNSI = this.formBuilder.group({});
  public readonly goodRefId = GOOD_REF_ID;

  constructor(
    private formBuilder: FormBuilder,
    public commonService: CommonService,
    public addNsiGoodService: AddNsiGoodService
  ) {
  }

  public ngOnInit(): void {
    this.addNsiGoodService.temporaryDependensInfo = [];
    this.addNsiGoodService.directionSubject.next(this.direction);

    // Подписываемся на обновления
    this.addNsiGoodService.allCharacteristics$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: []) => {
        this.allCharacteristics = data;
      });

    this.addNsiGoodService.characteristicsNSI$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: FormGroup) => {
        this.characteristicsNSI = data;
      });

    this.addNsiGoodService.NSIlistProperty$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: []) => {
        this.NSIlistProperty = data;
      });
  }

  public getNameValue(id: number): string {
    let tooltipText = '';
    let values = this.allCharacteristics.find((ref) => ref.id == id).values;

    this.characteristicsNSI.controls[id.toString()].value?.forEach((ch) => {
      tooltipText = tooltipText + values.find((el) => el.id == ch).name + '; ';
    });
    return tooltipText;
  }

  public onAddGoodFromNSI(e: ClickEvent): void {
    this.addGoodFromNSI.emit(
      {
        event: e,
        NSIlistProperty: this.NSIlistProperty,
        characteristicsNSI: this.characteristicsNSI
      });
  }

  public ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
