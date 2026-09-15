/* eslint-disable */
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ValueChangedEvent } from "devextreme/ui/select_box";
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, takeUntil } from "rxjs";
import { DxScrollViewComponent } from "devextreme-angular";
import { UserTableOptionsService } from "../user-table-options.service";
import { ColumnInterface, ColumnsDataModel } from "../../../core/interfaces";
import { ColumnFieldType, ColumnType, StaticColumnFieldNames } from "../../../core/enums";

@Component({
  selector: 'ceit-custom-column-chooser',
  templateUrl: './custom-column-chooser.component.html',
  styleUrls: ['./custom-column-chooser.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CustomColumnChooserComponent implements OnInit, OnChanges, OnDestroy {
  @Input() columnsData: ColumnsDataModel;
  @Output() applyColumnChanges: EventEmitter<ColumnsDataModel> = new EventEmitter<ColumnsDataModel>();
  @Output() closeDialog: EventEmitter<void> = new EventEmitter<void>();
  @Output() resetTable: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('scrollViewRef', {static: false}) public scrollViewRef: DxScrollViewComponent;

  public CATEGORY_TYPE: typeof ColumnFieldType = ColumnFieldType;
  public COLUMN_TYPE: typeof ColumnType = ColumnType;
  public isResetActive$: Observable<boolean>;

  public sortedAboutOfferStatic: ColumnInterface[] = [];
  public sortedGoodStatic: ColumnInterface[] = [];
  public sortedGoodDynamic: ColumnInterface[] = [];
  public sortedAdditionalFieldDynamic: ColumnInterface[] = [];
  public sortedAdditionalFieldStatic: ColumnInterface[] = [];
  public sortedGeneralFieldStatic: ColumnInterface[] = [];

  private generalFieldSortedChildrenByParentId: Map<string, ColumnInterface[]> = new Map();

  private readonly emptyGeneralFieldChildren: ColumnInterface[] = [];

  private destroy$: Subject<void> = new Subject<void>();

  constructor(
    private readonly userTableOptionsService: UserTableOptionsService,
    private readonly translate: TranslateService,
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['columnsData']) {
      this.recomputeSortedColumns();
    }
  }

  public ngOnInit(): void {
    this.userTableOptionsService.scrollCustomColumnsView$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.scrollViewRef?.instance.scrollTo(0));

    this.isResetActive$ = this.userTableOptionsService.isResetActive$;
  }

  public sortedGeneralFieldChildren(parent: ColumnInterface): ColumnInterface[] {
    return (
      this.generalFieldSortedChildrenByParentId.get(parent.columnId) ??
      this.emptyGeneralFieldChildren
    );
  }

  private recomputeSortedColumns(): void {
    if (!this.columnsData) {
      this.sortedAboutOfferStatic = [];
      this.sortedGoodStatic = [];
      this.sortedGoodDynamic = [];
      this.sortedAdditionalFieldDynamic = [];
      this.sortedAdditionalFieldStatic = [];
      this.sortedGeneralFieldStatic = [];
      this.generalFieldSortedChildrenByParentId.clear();
      return;
    }

    this.sortedAboutOfferStatic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.ABOUT_OFFER]?.[ColumnType.STATIC],
    );
    this.sortedGoodStatic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.GOOD]?.[ColumnType.STATIC],
    );
    this.sortedGoodDynamic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.GOOD]?.[ColumnType.DYNAMIC],
    );
    this.sortedAdditionalFieldDynamic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.ADDITIONAL_FIELD]?.[ColumnType.DYNAMIC],
    );
    this.sortedAdditionalFieldStatic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.ADDITIONAL_FIELD]?.[ColumnType.STATIC],
    );
    this.sortedGeneralFieldStatic = this.sortByTranslatedCaption(
      this.columnsData[ColumnFieldType.GENERAL_FIELD]?.[ColumnType.STATIC],
    );

    this.generalFieldSortedChildrenByParentId.clear();
    for (const parent of this.sortedGeneralFieldStatic) {
      if (parent.children?.length) {
        this.generalFieldSortedChildrenByParentId.set(
          parent.columnId,
          this.sortByTranslatedCaption(parent.children),
        );
      }
    }
  }

  private sortByTranslatedCaption(items: ColumnInterface[]): ColumnInterface[] {
    if (!items?.length) {
      return [];
    }
    const locale: string = this.translate.currentLang || this.translate.getDefaultLang();
    const collator: Intl.Collator = new Intl.Collator(locale);
    return [...items].sort((a: ColumnInterface, b: ColumnInterface) => {
      const captionA: string = this.translate.instant(a.caption || '');
      const captionB: string = this.translate.instant(b.caption || '');
      return collator.compare(captionA, captionB);
    });
  }

  public selectAllFiles(event: ValueChangedEvent, item: ColumnInterface): void {
    const isUserChange: boolean = Boolean(event.event);
    if (isUserChange && item.columnId === StaticColumnFieldNames.ATTACHED_FILES) {
      item.children?.forEach((column: ColumnInterface) => column.isChecked = event.value);
    }
  }

  public selectSpecificFiles(event: ValueChangedEvent, item: ColumnInterface): void {
    const isUserChange: boolean = Boolean(event.event);
    if (isUserChange && item.columnId === StaticColumnFieldNames.ATTACHED_FILES) {
      const areAllFileTypesHidden: boolean = !event.value && item.children?.every((column: ColumnInterface) => !column.isChecked);
      item.isChecked = !areAllFileTypesHidden;
    }
  }

  public toggleAllForGroups(event: ValueChangedEvent, groups: ColumnInterface[][]): void {
    const isUserChange: boolean = Boolean(event.event);
    if (!isUserChange) {
      return;
    }

    groups.forEach((group: ColumnInterface[]) => {
      group?.forEach((column: ColumnInterface) => {
        column.isChecked = event.value;
      });
    });
  }

  public areAllCheckedForGroups(groups: ColumnInterface[][]): boolean {
    const flat: ColumnInterface[] = groups
      .filter((group: ColumnInterface[]): group is ColumnInterface[] => Array.isArray(group))
      .flat();

    return flat.length > 0 && flat.every((column: ColumnInterface) => column.isChecked);
  }

  public toggleAllGeneralFields(event: ValueChangedEvent): void {
    const isUserChange: boolean = Boolean(event.event);
    if (!isUserChange || !this.columnsData) {
      return;
    }

    const items: ColumnInterface[] =
      this.columnsData[ColumnFieldType.GENERAL_FIELD]?.[ColumnType.STATIC] || [];

    items.forEach((parent: ColumnInterface) => {
      parent.isChecked = event.value;
      parent.children?.forEach((child: ColumnInterface) => (child.isChecked = event.value));
    });
  }

  public areAllGeneralFieldsChecked(): boolean {
    if (!this.columnsData) {
      return false;
    }

    const items: ColumnInterface[] =
      this.columnsData[ColumnFieldType.GENERAL_FIELD]?.[ColumnType.STATIC] || [];

    if (items.length === 0) {
      return false;
    }

    return items.every((parent: ColumnInterface) => {
      const children: ColumnInterface[] = parent.children || [];
      const allChildrenChecked: boolean =
        children.length === 0 || children.every((child: ColumnInterface) => child.isChecked);

      return parent.isChecked && allChildrenChecked;
    });
  }

  public trackByColumnId(_: number, column: ColumnInterface): string {
    return column.columnId;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
