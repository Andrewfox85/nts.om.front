/* eslint-disable */
import { FieldsModel } from "../api";

export interface DynamicTableDataModel {
  refFields: Array<FieldsModel>
  generalFields: Array<FieldsModel>
  quotationRelatedFields: Array<FieldsModel>
}
