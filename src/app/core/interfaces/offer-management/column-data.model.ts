/* eslint-disable */
import { ColumnFieldType, ColumnType, GridType } from "../../enums";
import { GridState } from "./grid-state.model";
import { SessionInfo } from '../interface';
import { FilterOption } from "../../../shared/interfaces";
import { DynamicTableDataModel } from './dynamic-table-data.model';

export interface ColumnInterface {
  columnId: string;
  isChecked: boolean;
  children?: ColumnInterface[];
  caption?: string;
}

export type ColumnsDataByFieldTypeModel = {
  [key in ColumnFieldType]: {
    columnNamePath: string;
    [ColumnType.STATIC]?: ColumnInterface[];
    [ColumnType.DYNAMIC]?: ColumnInterface[];
  };
}

export interface ColumnsDataModel extends ColumnsDataByFieldTypeModel {
  gridType: GridType;
  sectionId: number;
}

export interface DynamicColumnsDataModel {
  [ColumnFieldType.GOOD]: ColumnInterface[];
  [ColumnFieldType.ADDITIONAL_FIELD]: ColumnInterface[];
}

export interface ColumnsVisibilityModel {
  [key: string]: boolean;
}

export interface ColumnSettingsWithStateDataModel {
  staticColumnLeft?: string | null;
  staticColumnRight?: string | null;
}

export interface PreSavedColumnSettingsModel {
  sectionId: number;
  gridId: number;
  state: GridState;
  sessionInfo: SessionInfo;
  dynamicFields?: DynamicTableDataModel;
}

export interface TableFiltersData {
  results: FilterOption[];
  hasNonEmptyValues: boolean;
  hasNoValue: boolean;
  hasYesValue: boolean;
}
