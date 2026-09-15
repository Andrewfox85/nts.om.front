/* eslint-disable */
import { FieldsModel } from "../../interfaces/api";
import { DynamicTableDataModel } from "../../interfaces";
import {
  DefaultVisibleFieldsForTrader,
  DefaultVisibleFieldsForWorker,
} from '../../enums/offer-management/dynamic-column-field-names';
import { ID_INTERFACE_FIELD } from '../../../shared/enums';
import { AuctionType } from '../../../api.constants';
import { SectionType } from '../../enums';

export function generateDynamicData(fields: FieldsModel[], isWorker: boolean): DynamicTableDataModel {
  const dynamicData: DynamicTableDataModel = {
    refFields: [],
    generalFields: [],
    quotationRelatedFields: [],
  };

  if (!fields || fields.length === 0) {
    return dynamicData;
  }

  fields.forEach((field: FieldsModel) => {
    if (field.fieldName.startsWith('REF_')) {
      dynamicData.refFields.push(field);
      return;
    }

    if (isVisibleForWorker(isWorker, field.fieldName) || isVisibleForTrader(isWorker, field.fieldName)) {
      dynamicData.quotationRelatedFields.push(field);
      return;
    }

    dynamicData.generalFields.push(field);
  });

  return dynamicData;
}

export function isVisibleForWorker(isWorker: boolean, fieldName: string): boolean {
  const defaultVisibleFieldsForWorker: string[] = Object.values(
    DefaultVisibleFieldsForWorker,
  ).map(String);
  return isWorker && defaultVisibleFieldsForWorker.includes(fieldName);
}

export function isVisibleForTrader(isWorker: boolean, fieldName: string): boolean {
  const defaultVisibleFieldsForTrader: string[] = Object.values(
    DefaultVisibleFieldsForTrader,
  ).map(String);
  return !isWorker && defaultVisibleFieldsForTrader.includes(fieldName);
}

export function isQuotationRelated(fieldName: string): boolean {
  const defaultVisibleFieldsForWorker: string[] = Object.values(
    DefaultVisibleFieldsForWorker,
  ).map(String);
  return defaultVisibleFieldsForWorker.includes(fieldName);
}

export function isDynamicVisibleByDefaultForAllUsers(
  fieldName: string,
  tradeTypeId: string | number,
  sectionId: string | number
): boolean {
  const isDestinationAvailable = (): boolean => {
    const isFieldExists: boolean = Number(fieldName) === ID_INTERFACE_FIELD.DESTINATION;
    const isAgriSection: boolean = Number(tradeTypeId) === AuctionType.englishUpgrading &&
      Number(sectionId) === SectionType.AGRICULTURE_GOOD;
    const isProspectiveSection: boolean = Number(sectionId) === SectionType.PROSPECTIVE_GOOD;
    return isFieldExists && (isAgriSection || isProspectiveSection);
  };
  return isDestinationAvailable();
}
