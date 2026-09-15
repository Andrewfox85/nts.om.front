import { FieldOptionsApiModel, FieldsModel, GridOptionsApiModel } from '../../../core/interfaces/api';
import { User } from '../../../core/classes/user';
import { SectionType, StaticColumnFieldNames } from '../../../core/enums';
import { ColumnsVisibilityModel, DynamicTableDataModel } from '../../../core/interfaces';
import { SessionInfo } from '../../../core/interfaces/interface';
import {
  isDynamicVisibleByDefaultForAllUsers,
  isQuotationRelated,
  isVisibleForTrader,
  isVisibleForWorker
} from '../../../core/helpers';
import {
  isAbandonedOffersTabActive,
  isGoodAnalogVisible,
  isWorker,
} from './grid-common.helper';

export function generateVisibilityForGridColumns(
  userGridSettings: GridOptionsApiModel,
  dynamicFields: FieldsModel[],
  user: User,
  sessionInfo: SessionInfo,
): ColumnsVisibilityModel {
  const convertToObject = (settings: GridOptionsApiModel): ColumnsVisibilityModel => {
    const columnVisibilitySettingsByFieldId: ColumnsVisibilityModel = {};
    settings.fieldOptions.forEach((option: FieldOptionsApiModel) => {
      columnVisibilitySettingsByFieldId[option.idField] = Boolean(option.isColumnVisible);
    });
    return columnVisibilitySettingsByFieldId;
  };

  const columnVisibilitySettings: ColumnsVisibilityModel = convertToObject(userGridSettings);
  const dynamicFieldVisibility: ColumnsVisibilityModel = {};
  if (dynamicFields) {
    dynamicFields.forEach((dynamicField: FieldsModel) => {
      if (
        dynamicField.fieldName.startsWith('REF_') ||
        isQuotationRelated(dynamicField.fieldName) ||
        isDynamicVisibleByDefaultForAllUsers(dynamicField.fieldName, sessionInfo.tradeTypeId, sessionInfo.tradeSectionId)
      ) {
        dynamicFieldVisibility[dynamicField.fieldName] = columnVisibilitySettings[dynamicField.fieldName] ?? true;
      } else {
        dynamicFieldVisibility[dynamicField.fieldName] = columnVisibilitySettings[dynamicField.fieldName] ?? false;
      }
    });
  }

  return {
    ...dynamicFieldVisibility,
    [StaticColumnFieldNames.LOT]: true,
    [StaticColumnFieldNames.STATUS_NAME]: columnVisibilitySettings[StaticColumnFieldNames.STATUS_NAME] ?? false,
    [StaticColumnFieldNames.REJECTION_DATE]: isAbandonedOffersTabActive(userGridSettings.idInterfaceGrid)
      ? columnVisibilitySettings[StaticColumnFieldNames.REJECTION_DATE]
      : isAbandonedOffersTabActive(userGridSettings.idInterfaceGrid),
    [StaticColumnFieldNames.REJECTION_REASON]: isAbandonedOffersTabActive(userGridSettings.idInterfaceGrid)
      ? columnVisibilitySettings[StaticColumnFieldNames.REJECTION_REASON]
      : isAbandonedOffersTabActive(userGridSettings.idInterfaceGrid),
    [StaticColumnFieldNames.DIRECTION_NAME]: columnVisibilitySettings[StaticColumnFieldNames.DIRECTION_NAME] ?? true,
    [StaticColumnFieldNames.DEMOFF_MARKET_TYPES]: columnVisibilitySettings[StaticColumnFieldNames.DEMOFF_MARKET_TYPES] ?? false,
    [StaticColumnFieldNames.OFFER_NAME]: columnVisibilitySettings[StaticColumnFieldNames.OFFER_NAME] ?? true,
    [StaticColumnFieldNames.DESCRIPTION]: columnVisibilitySettings[StaticColumnFieldNames.DESCRIPTION] ?? true,
    [StaticColumnFieldNames.GOOD_ANALOG]: isGoodAnalogVisible(sessionInfo)
      ? Boolean(columnVisibilitySettings[StaticColumnFieldNames.GOOD_ANALOG] ?? true)
      : isGoodAnalogVisible(sessionInfo),
    [StaticColumnFieldNames.CREATE_OFFER_DATE]: columnVisibilitySettings[StaticColumnFieldNames.CREATE_OFFER_DATE] ?? false,
    [StaticColumnFieldNames.CONCATED_FIRM_NAME]: columnVisibilitySettings[StaticColumnFieldNames.CONCATED_FIRM_NAME] ?? false,
    [StaticColumnFieldNames.CONTRACT_TYPE]: columnVisibilitySettings[StaticColumnFieldNames.CONTRACT_TYPE] ?? false,
    [StaticColumnFieldNames.CLIENT]: columnVisibilitySettings[StaticColumnFieldNames.CLIENT] ?? false,
    [StaticColumnFieldNames.BRANCH]: columnVisibilitySettings[StaticColumnFieldNames.BRANCH] ?? false,
    [StaticColumnFieldNames.TRADER]: columnVisibilitySettings[StaticColumnFieldNames.TRADER] ?? false,
    [StaticColumnFieldNames.VOLUME]: columnVisibilitySettings[StaticColumnFieldNames.VOLUME] ?? true,
    [StaticColumnFieldNames.LOT_SUMMARY_VOLUME]: columnVisibilitySettings[StaticColumnFieldNames.LOT_SUMMARY_VOLUME] ?? false,
    [StaticColumnFieldNames.UNIT]: columnVisibilitySettings[StaticColumnFieldNames.UNIT] ?? true,
    [StaticColumnFieldNames.CURRENCY]: columnVisibilitySettings[StaticColumnFieldNames.CURRENCY] ?? true,
    [StaticColumnFieldNames.PRICE]: columnVisibilitySettings[StaticColumnFieldNames.PRICE] ?? true,
    [StaticColumnFieldNames.VAT_PERCENT]: columnVisibilitySettings[StaticColumnFieldNames.VAT_PERCENT] ?? false,
    [StaticColumnFieldNames.AMOUNT_VAT]: columnVisibilitySettings[StaticColumnFieldNames.AMOUNT_VAT] ?? false,
    [StaticColumnFieldNames.LOT_SUMMARY_VAT_AMOUNT]: columnVisibilitySettings[StaticColumnFieldNames.LOT_SUMMARY_VAT_AMOUNT] ?? false,
    [StaticColumnFieldNames.TOTAL_AMOUNT]: columnVisibilitySettings[StaticColumnFieldNames.TOTAL_AMOUNT] ?? true,
    [StaticColumnFieldNames.LOT_SUMMARY_TOTAL_AMOUNT]: columnVisibilitySettings[StaticColumnFieldNames.LOT_SUMMARY_TOTAL_AMOUNT] ?? false,
    [StaticColumnFieldNames.SESSION_NUMBER]: !isWorker(user) ? Boolean(columnVisibilitySettings[StaticColumnFieldNames.SESSION_NUMBER] ?? true) : !isWorker(user),
    [StaticColumnFieldNames.SESSION_NAME]: !isWorker(user) ? Boolean(columnVisibilitySettings[StaticColumnFieldNames.SESSION_NAME] ?? true) : !isWorker(user),
    [StaticColumnFieldNames.SESSION_DATE_AND_TIME]: !isWorker(user) ? Boolean(columnVisibilitySettings[StaticColumnFieldNames.SESSION_DATE_AND_TIME] ?? true) : !isWorker(user),
    [StaticColumnFieldNames.SESSION_STAGE]: !isWorker(user) ? Boolean(columnVisibilitySettings[StaticColumnFieldNames.SESSION_STAGE] ?? true) : !isWorker(user),
    [StaticColumnFieldNames.DELIVERY_CONDITIONS]: columnVisibilitySettings[StaticColumnFieldNames.DELIVERY_CONDITIONS] ?? true,
    [StaticColumnFieldNames.DELIVERY_CONDITIONS_PERIOD]: columnVisibilitySettings[StaticColumnFieldNames.DELIVERY_CONDITIONS_PERIOD] ?? true,
    [StaticColumnFieldNames.DELIVERY_SCHEDULE]: columnVisibilitySettings[StaticColumnFieldNames.DELIVERY_SCHEDULE] ?? false,
    [StaticColumnFieldNames.PAYMENT_CONDITIONS]: columnVisibilitySettings[StaticColumnFieldNames.PAYMENT_CONDITIONS] ?? true,
    [StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS]: columnVisibilitySettings[StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS] ?? false,
    [StaticColumnFieldNames.EXPORT_DETAILS]: columnVisibilitySettings[StaticColumnFieldNames.EXPORT_DETAILS] ?? false,
    [StaticColumnFieldNames.ATTACHED_FILES]: columnVisibilitySettings[StaticColumnFieldNames.ATTACHED_FILES] ?? false,
    [StaticColumnFieldNames.PRIVATE_FILES]: columnVisibilitySettings[StaticColumnFieldNames.PRIVATE_FILES] ?? columnVisibilitySettings[StaticColumnFieldNames.ATTACHED_FILES] ?? false,
    [StaticColumnFieldNames.PUBLIC_FILES]: columnVisibilitySettings[StaticColumnFieldNames.PUBLIC_FILES] ?? columnVisibilitySettings[StaticColumnFieldNames.ATTACHED_FILES] ?? false,
  };
}

export function generateInitialVisibilityForGridColumns(
  dynamicFields: DynamicTableDataModel,
  user: User,
  sessionInfo: SessionInfo,
  gridId: number,
  sectionId: SectionType
): ColumnsVisibilityModel {
  const dynamicFieldVisibility: ColumnsVisibilityModel = {};
  if (dynamicFields) {
    dynamicFields.refFields.forEach((dynamicField: FieldsModel) => {
      dynamicFieldVisibility[dynamicField.fieldName] = true;
    });
    dynamicFields.generalFields.forEach((dynamicField: FieldsModel) => {
      dynamicFieldVisibility[dynamicField.fieldName] = isDynamicVisibleByDefaultForAllUsers(
        dynamicField.fieldName,
        sessionInfo.tradeTypeId,
        sectionId
      );
    });
    dynamicFields.quotationRelatedFields.forEach((dynamicField: FieldsModel) => {
      if (
        isVisibleForWorker(user?.IsWorker, dynamicField.fieldName)
        || isVisibleForTrader(user?.IsWorker, dynamicField.fieldName)
      ) {
        dynamicFieldVisibility[dynamicField.fieldName] = true;
        return;
      }
      dynamicFieldVisibility[dynamicField.fieldName] = false;
    });
  }

  return {
    ...dynamicFieldVisibility,
    [StaticColumnFieldNames.LOT]: true,
    [StaticColumnFieldNames.STATUS_NAME]: false,
    [StaticColumnFieldNames.REJECTION_DATE]: isAbandonedOffersTabActive(gridId),
    [StaticColumnFieldNames.REJECTION_REASON]: isAbandonedOffersTabActive(gridId),
    [StaticColumnFieldNames.DIRECTION_NAME]: true,
    [StaticColumnFieldNames.DEMOFF_MARKET_TYPES]: false,
    [StaticColumnFieldNames.OFFER_NAME]: true,
    [StaticColumnFieldNames.DESCRIPTION]: true,
    [StaticColumnFieldNames.GOOD_ANALOG]: isGoodAnalogVisible(sessionInfo),
    [StaticColumnFieldNames.CREATE_OFFER_DATE]: false,
    [StaticColumnFieldNames.CONCATED_FIRM_NAME]: false,
    [StaticColumnFieldNames.CONTRACT_TYPE]: false,
    [StaticColumnFieldNames.CLIENT]: false,
    [StaticColumnFieldNames.BRANCH]: false,
    [StaticColumnFieldNames.TRADER]: false,
    [StaticColumnFieldNames.VOLUME]: true,
    [StaticColumnFieldNames.LOT_SUMMARY_VOLUME]: false,
    [StaticColumnFieldNames.UNIT]: true,
    [StaticColumnFieldNames.PRICE]: true,
    [StaticColumnFieldNames.CURRENCY]: true,
    [StaticColumnFieldNames.VAT_PERCENT]: false,
    [StaticColumnFieldNames.AMOUNT_VAT]: false,
    [StaticColumnFieldNames.LOT_SUMMARY_VAT_AMOUNT]: false,
    [StaticColumnFieldNames.TOTAL_AMOUNT]: true,
    [StaticColumnFieldNames.LOT_SUMMARY_TOTAL_AMOUNT]: false,
    [StaticColumnFieldNames.SESSION_NUMBER]: !isWorker(user),
    [StaticColumnFieldNames.SESSION_NAME]: !isWorker(user),
    [StaticColumnFieldNames.SESSION_DATE_AND_TIME]: !isWorker(user),
    [StaticColumnFieldNames.SESSION_STAGE]: !isWorker(user),
    [StaticColumnFieldNames.DELIVERY_CONDITIONS]: true,
    [StaticColumnFieldNames.DELIVERY_CONDITIONS_PERIOD]: true,
    [StaticColumnFieldNames.DELIVERY_SCHEDULE]: false,
    [StaticColumnFieldNames.PAYMENT_CONDITIONS]: true,
    [StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS]: false,
    [StaticColumnFieldNames.EXPORT_DETAILS]: false,
    [StaticColumnFieldNames.ATTACHED_FILES]: false,
    [StaticColumnFieldNames.PRIVATE_FILES]: false,
    [StaticColumnFieldNames.PUBLIC_FILES]: false,
  };
}
