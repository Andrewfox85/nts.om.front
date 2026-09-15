import { GoodsSpecification } from "../services/create-offer-service.service";
import { DataSourceOption } from "../interfaces/interface";
import { ID_INTERFACE_FIELD } from "../../shared/enums";

const buildAllowedValues = (field: GoodsSpecification): DataSourceOption[] | null => {
  if (field.controlFieldType !== 'dxSelectBox') {
    return null;
  }
  return [{ id: field.fieldValueNumber.toString(), name: field.fieldValue }];
};

const resolveSelectedValues = (field): string | number | number[] | string[] => {
  if (field.idInterfaceField === ID_INTERFACE_FIELD.PRODUCT_LOCATION) {
    return field.fieldValueString;
  }
  if (field.selectedValues != null) {
    return field.selectedValues;
  }
  if (field.fieldValueNumber != null) {
    return field.fieldValueNumber;
  }
  return field.fieldValueString;
};

export const buildField = (field: GoodsSpecification) => {
  return {
    interfaceField: {
      blockId: field.blockId,
      fieldId: field.idInterfaceField,
      fieldName: field.fieldName,
      fieldPrecision: field.fieldPrecision,
      allowedValues: buildAllowedValues(field),
      controlFieldType: field.controlFieldType,
    },
    selectedValues: resolveSelectedValues(field),
    ...(field.idInterfaceField ===
      ID_INTERFACE_FIELD.PRODUCT_LOCATION && {
        idSelectedValues: field.fieldValueNumber,
      }),
  };
};
