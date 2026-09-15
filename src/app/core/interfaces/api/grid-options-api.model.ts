/* eslint-disable */
export interface GridOptionsApiModel {
  idInterfaceGrid: number;
  fieldOptions: Array<FieldOptionsApiModel>;
}

export interface FieldOptionsApiModel {
  idField: string;
  isColumnVisible: boolean;
  columnSettings: string;
}

export interface GridVisibilityOptionsApiModel {
  idInterfaceGrid: number;
  fieldOptionsVisibility: Array<Partial<FieldOptionsApiModel>>;
}
