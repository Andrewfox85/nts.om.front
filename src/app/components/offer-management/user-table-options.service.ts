/* eslint-disable */
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of,
  Subject,
  tap,
} from 'rxjs';
import { UserOptionsService } from '../../core/services/user-options.service';
import {
  FieldOptionsApiModel,
  FieldsModel,
  GridOptionsApiModel,
  GridVisibilityOptionsApiModel,
} from '../../core/interfaces/api';
import {
  ColumnInterface,
  ColumnsDataModel,
  ColumnSettingsWithStateDataModel,
  ColumnState,
  ColumnsVisibilityModel,
  DynamicTableDataModel,
  GridState,
  PreSavedColumnSettingsModel,
} from '../../core/interfaces';
import { ColumnFieldType, ColumnType, StaticColumnFieldNames } from '../../core/enums';
import {
  isDeliveryScheduleVisible,
  isExportDetailsVisible,
  isGoodAnalogVisible,
  isImportDomesticDetailsVisible,
} from './helpers/generate-columns-data.helper';
import { map } from 'rxjs/operators';
import { NotificationService } from '../../sub_components/notification/notification.service';
import { SessionInfo } from '../../core/interfaces/interface';
import { User}  from '../../core/classes/user';

@Injectable()
export class UserTableOptionsService {
  public savedTableSettings: PreSavedColumnSettingsModel = {
    sectionId: null,
    gridId: null,
    state: null,
    sessionInfo: null,
    dynamicFields: null,
  };
  private columnsVisibilityModelSource: Subject<ColumnsVisibilityModel> =
    new Subject();
  public columnsVisibilityModel$: Observable<ColumnsVisibilityModel>;

  private columnDataSource: Subject<ColumnsDataModel> = new Subject();
  public columnsData$: Observable<ColumnsDataModel>;

  public hasUnsavedGridStateChangesSource: Subject<boolean> =
    new BehaviorSubject<boolean>(false);
  public hasUnsavedGridStateChanges$: Observable<boolean>;

  private scrollCustomColumnsViewSource: Subject<void> = new Subject();
  public scrollCustomColumnsView$: Observable<void>;

  private isResetActiveSource: BehaviorSubject<boolean> = new BehaviorSubject(
    false,
  );
  public isResetActive$: Observable<boolean>;

  private apiDataSource: BehaviorSubject<GridOptionsApiModel> =
    new BehaviorSubject(null);
  public apiData$: Observable<GridOptionsApiModel>;

  constructor(
    private userOptionsService: UserOptionsService,
    private notificationService: NotificationService,
  ) {
    this.columnsData$ = this.columnDataSource.asObservable();
    this.scrollCustomColumnsView$ =
      this.scrollCustomColumnsViewSource.asObservable();
    this.columnsVisibilityModel$ =
      this.columnsVisibilityModelSource.asObservable();
    this.hasUnsavedGridStateChanges$ =
      this.hasUnsavedGridStateChangesSource.asObservable();
    this.isResetActive$ = this.isResetActiveSource.asObservable();
    this.apiData$ = this.apiDataSource.asObservable();

    combineLatest([this.hasUnsavedGridStateChanges$, this.apiDataSource])
      .pipe(
        map(([hasUnsavedChanges, apiData]: [boolean, GridOptionsApiModel]) => {
          if (hasUnsavedChanges) {
            return hasUnsavedChanges;
          }
          if (apiData) {
            return apiData.fieldOptions.length > 0;
          }
        }),
        tap((isResetActive: boolean) =>
          this.isResetActiveSource.next(isResetActive),
        ),
      )
      .subscribe();
  }

  public updateCurrentColumnDataSource(
    currentColumnDataSource: ColumnsDataModel,
  ): void {
    this.columnDataSource.next(currentColumnDataSource);
  }

  public scrollToTheTop(): void {
    this.scrollCustomColumnsViewSource.next();
  }

  public getTableSettings(
    sectionId: number,
    gridId: number,
  ): Observable<GridOptionsApiModel> {
    return this.userOptionsService
      .getGridOptions(sectionId, gridId)
      .pipe(
        tap((apiData: GridOptionsApiModel) => this.apiDataSource.next(apiData)),
      );
  }

  public setVisibilityColumnsData(
    sectionId: number,
    apiData: GridVisibilityOptionsApiModel,
  ): void {
    this.userOptionsService.setGridOptionsVisibility(
      sectionId,
      apiData.idInterfaceGrid,
      apiData,
    );
  }

  public saveTableSettings(
    sectionId: number,
    idInterfaceGrid: number,
    currentState: GridState,
    sessionInfo: SessionInfo,
    user: User,
    dynamicFields: DynamicTableDataModel,
  ): void {
    const fieldOptions: FieldOptionsApiModel[] = this.parseExistingColumnsData(
      currentState.columns,
      dynamicFields
    );
    this.saveGridState(
      sectionId,
      idInterfaceGrid,
      fieldOptions,
      sessionInfo,
      user
    ).subscribe();
  }

  public saveInitialTableSettings(
    sectionId: number,
    idInterfaceGrid: number,
    currentState: GridState,
    visibility: ColumnsVisibilityModel,
    sessionInfo: SessionInfo,
    user: User,
    dynamicFields: DynamicTableDataModel,
  ): void {
    const fieldOptions: FieldOptionsApiModel[] =
      this.generateInitialColumnsData(
        currentState.columns,
        visibility,
        dynamicFields
      );
    this.saveGridState(
      sectionId,
      idInterfaceGrid,
      fieldOptions,
      sessionInfo,
      user
  ).subscribe();
  }

  public savePreviousTableState(user: User): Observable<void> {
    if (this.savedTableSettings?.gridId) {
      const dynamicFields: DynamicTableDataModel =
        this.savedTableSettings.dynamicFields ?? {
          refFields: [],
          generalFields: [],
          quotationRelatedFields: []
        };
      const fieldOptions: FieldOptionsApiModel[] =
        this.parseExistingColumnsData(
          this.savedTableSettings.state.columns,
          dynamicFields
        );
      return this.saveGridState(
        this.savedTableSettings.sectionId,
        this.savedTableSettings.gridId,
        fieldOptions,
        this.savedTableSettings.sessionInfo,
        user
      );
    }

    return of(void 0);
  }

  private parseExistingColumnsData(
    columns: ColumnState[],
    dynamicFields: DynamicTableDataModel
  ): FieldOptionsApiModel[] {
    const dynamicFieldNames: Set<string> = this.generateDynamicColumnNames(dynamicFields);

    return columns.map((column: ColumnState) => {
      const staticSiblings: ColumnSettingsWithStateDataModel =
        this.getStaticColumnSiblings(column, columns, dynamicFieldNames);
      return {
        idField: column.dataField,
        columnSettings: JSON.stringify({ ...column, ...staticSiblings }),
        isColumnVisible: column.visible,
      };
    });
  }

  private getStaticColumnSiblings(
    column: ColumnState,
    columns: ColumnState[],
    dynamicFieldNames: Set<string>,
  ): ColumnSettingsWithStateDataModel {
    if (
      column.dataField === StaticColumnFieldNames.PRIVATE_FILES ||
      column.dataField === StaticColumnFieldNames.PUBLIC_FILES
    ) {
      return { staticColumnLeft: null, staticColumnRight: null };
    }
    return this.resolveNearestStaticColumnSiblings(
      column,
      columns,
      dynamicFieldNames,
    );
  }

  private resolveNearestStaticColumnSiblings(
    column: ColumnState,
    columns: ColumnState[],
    dynamicFieldNames: Set<string>,
  ): ColumnSettingsWithStateDataModel {
    if (column.visibleIndex == null || !column.dataField) {
      return { staticColumnLeft: null, staticColumnRight: null };
    }

    let staticColumnLeft: string = null;
    let maxLeftVisibleIndex: number = -Infinity;
    let staticColumnRight: string = null;
    let minRightVisibleIndex: number = Infinity;

    for (const candidate of columns) {
      // пропускам если нету данных для сравнения
      if (candidate.dataField == null || candidate.visibleIndex == null) {
        continue;
      }
      // пропускаем если это внутренние колонки прикрепленных файлов (у них внутри своя индексация 0 и 1)
      if (
        candidate.dataField === StaticColumnFieldNames.PRIVATE_FILES ||
        candidate.dataField === StaticColumnFieldNames.PUBLIC_FILES
      ) {
        continue;
      }
      // пропускаем если это динамические колонки
      if (dynamicFieldNames.has(candidate.dataField)) {
        continue;
      }
      // если нашли ближайшую статическую колонку слева
      if (candidate.visibleIndex < column.visibleIndex && candidate.visibleIndex > maxLeftVisibleIndex) {
        maxLeftVisibleIndex = candidate.visibleIndex;
        staticColumnLeft = candidate.dataField;
      }
      // если нашли ближайшую статическую колонку справа
      if (
        candidate.visibleIndex >= column.visibleIndex &&
        candidate.dataField !== column.dataField &&
        candidate.visibleIndex < minRightVisibleIndex
      ) {
        minRightVisibleIndex = candidate.visibleIndex;
        staticColumnRight = candidate.dataField;
      }
    }

    return { staticColumnLeft, staticColumnRight };
  }

  private generateInitialColumnsData(
    columns: ColumnState[],
    visibility: ColumnsVisibilityModel,
    dynamicFields: DynamicTableDataModel
  ): FieldOptionsApiModel[] {
    const dynamicFieldNames: Set<string> = this.generateDynamicColumnNames(dynamicFields);
    return columns.map((column: ColumnState) => {
      const staticSiblings: ColumnSettingsWithStateDataModel =
        this.getStaticColumnSiblings(column, columns, dynamicFieldNames);
      return {
        idField: column.dataField,
        columnSettings: JSON.stringify({ ...column, ...staticSiblings }),
        isColumnVisible: visibility[column.dataField],
      };
    });
  }

  private generateDynamicColumnNames(dynamicFields: DynamicTableDataModel): Set<string> {
    const dynamicFieldNames: Set<string> = new Set<string>();

    dynamicFields.refFields?.forEach((field: FieldsModel) =>
      dynamicFieldNames.add(field.fieldName),
    );
    dynamicFields.generalFields?.forEach((field: FieldsModel) =>
      dynamicFieldNames.add(field.fieldName),
    );
    dynamicFields.quotationRelatedFields?.forEach((field: FieldsModel) => {
      dynamicFieldNames.add(field.fieldName);
    });

    return dynamicFieldNames;
  }

  public saveGridState(
    sectionId: number,
    idInterfaceGrid: number,
    fieldOptions: FieldOptionsApiModel[],
    sessionInfo: SessionInfo,
    user: User
  ): Observable<void> {
    const fieldOptionsToSave: FieldOptionsApiModel[] = this.filterDataToSaveBySpecificRules(fieldOptions, sessionInfo, user);
    const apiData: GridOptionsApiModel = {
      idInterfaceGrid,
      fieldOptions: fieldOptionsToSave,
    };
    this.apiDataSource.next(apiData);

    return this.userOptionsService
      .setGridOptionsCustomize(sectionId, idInterfaceGrid, apiData)
      .pipe(
        tap(() => this.clearPreSavedData()),
        map(() => void 0),
      );
  }

  private filterDataToSaveBySpecificRules(
    fieldOptions: FieldOptionsApiModel[],
    sessionInfo: SessionInfo,
    user: User
  ): FieldOptionsApiModel[] {
    return fieldOptions.filter(
      (option: FieldOptionsApiModel) => {
        // не сохраняем данные на API по колонкам которые никогда не видны пользователю
        if (
          option.idField === StaticColumnFieldNames.GOOD_ANALOG &&
          !isGoodAnalogVisible(sessionInfo)
        ) {
          return false;
        }
        if (
          option.idField === StaticColumnFieldNames.DELIVERY_SCHEDULE &&
          !isDeliveryScheduleVisible(user, sessionInfo)
        ) {
          return false;
        }
        if (
          option.idField === StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS &&
          !isImportDomesticDetailsVisible(user, sessionInfo)
        ) {
          return false;
        }
        if (
          option.idField === StaticColumnFieldNames.EXPORT_DETAILS &&
          !isExportDetailsVisible(user, sessionInfo)
        ) {
          return false;
        }
        return true;
      },
    );
  }

  public parseColumnsDataToGridVisibilityOptionsApiModel(
    columnsData: ColumnsDataModel,
  ): GridVisibilityOptionsApiModel {
    function parseColumns(
      columns: ColumnInterface[],
    ): Array<Partial<FieldOptionsApiModel>> {
      const parsedData: Array<Partial<FieldOptionsApiModel>> = [];
      columns.forEach((column: ColumnInterface) => {
        if (column.children) {
          column.children.forEach((child: ColumnInterface) => {
            parsedData.push({
              idField: child.columnId,
              isColumnVisible: child.isChecked,
            });
          });
        }
        parsedData.push({
          idField: column.columnId,
          isColumnVisible: column.isChecked,
        });
      });
      return parsedData;
    }

    return {
      idInterfaceGrid: columnsData.gridType,
      fieldOptionsVisibility: [
        ...parseColumns(
          columnsData[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC],
        ),
        ...parseColumns(columnsData[ColumnFieldType.GOOD][ColumnType.STATIC]),
        ...parseColumns(columnsData[ColumnFieldType.GOOD][ColumnType.DYNAMIC]),
        ...parseColumns(
          columnsData[ColumnFieldType.ADDITIONAL_FIELD][ColumnType.DYNAMIC],
        ),
        ...parseColumns(
          columnsData[ColumnFieldType.ADDITIONAL_FIELD][ColumnType.STATIC],
        ),
        ...parseColumns(
          columnsData[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC],
        ),
      ],
    };
  }

  public preSaveTableSettings(
    sectionId: number,
    gridId: number,
    state: GridState,
    sessionInfo: SessionInfo,
    dynamicFields: DynamicTableDataModel,
  ): void {
    this.savedTableSettings = {
      sectionId,
      gridId,
      state,
      sessionInfo,
      dynamicFields,
    };
  }

  public clearPreSavedData(): void {
    this.hasUnsavedGridStateChangesSource.next(false);
    this.savedTableSettings = {
      sectionId: null,
      gridId: null,
      state: null,
      sessionInfo: null,
      dynamicFields: null,
    };
  }

  public handleColumnOptionChange(): void {
    this.hasUnsavedGridStateChangesSource.next(true);
  }
}
