/* eslint-disable */
import { ColumnSettingsWithStateDataModel } from "./column-data.model";

export interface GridState {
  columns?: ColumnState[];
  paging?: {
    pageIndex?: number;
    pageSize?: number;
  };
  filterPanel?: {
    filterEnabled?: boolean;
  };
  searchText?: string;
  selectedRowKeys?: string[];
  focusedRowKey?: any;
  selectionFilter?: any[];
  filterValue?: any;
  allowedPageSizes?: number[];
}

export interface ColumnState extends ColumnSettingsWithStateDataModel {
  dataField?: string;
  name?: string;
  visible?: boolean;
  visibleIndex?: number;
  width?: number | string;
  sortIndex?: number;
  sortOrder?: 'asc' | 'desc';
  groupIndex?: number;
  filterValue?: any;
  filterValues?: any[];
  filterType?: 'exclude' | 'include';
  sort?: {
    sortIndex?: number;
    sortOrder?: 'asc' | 'desc';
  };
}
