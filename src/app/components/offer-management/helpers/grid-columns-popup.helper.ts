import { FieldsModel } from '../../../core/interfaces/api';
import { User } from '../../../core/classes/user';
import {
  ColumnFieldType,
  ColumnType,
  GridType,
  STATIC_COLUMN_CAPTION_NAMES,
  StaticColumnFieldNames,
} from '../../../core/enums';
import {
  ColumnInterface,
  ColumnsDataModel,
  ColumnsVisibilityModel,
  DynamicColumnsDataModel,
  DynamicTableDataModel,
} from '../../../core/interfaces';
import { SessionInfo } from '../../../core/interfaces/interface';
import { isQuotationRelated, isVisibleForTrader, isVisibleForWorker } from '../../../core/helpers';
import {
  domesticCondition,
  foreignCondition,
  isAbandonedOffersTabActive,
  isDeliveryScheduleVisible,
  isExportDetailsVisible,
  isGoodAnalogVisible,
  isImportDomesticDetailsVisible,
  isWorker,
} from './grid-common.helper';

function generateDynamicColumnData(
  gridColumns: { [key: string]: boolean },
  dynamicFields: DynamicTableDataModel,
  isWorkerUser: boolean,
): DynamicColumnsDataModel {
  const dynamicModel: DynamicColumnsDataModel = {
    [ColumnFieldType.GOOD]: [],
    [ColumnFieldType.ADDITIONAL_FIELD]: [],
  };

  if (!dynamicFields) {
    return dynamicModel;
  }

  dynamicFields.refFields.forEach((item: FieldsModel) => {
    dynamicModel[ColumnFieldType.GOOD].push(addDynamicColumn(item, gridColumns[item.fieldName]));
  });

  dynamicFields.generalFields.forEach((item: FieldsModel) => {
    if (!isQuotationRelated(item.fieldName)) {
      dynamicModel[ColumnFieldType.ADDITIONAL_FIELD].push(addDynamicColumn(item, gridColumns[item.fieldName]));
      return;
    }
  });

  dynamicFields.quotationRelatedFields.forEach((item: FieldsModel) => {
    if (isVisibleForWorker(isWorkerUser, item.fieldName) || isVisibleForTrader(isWorkerUser, item.fieldName)) {
      dynamicModel[ColumnFieldType.ADDITIONAL_FIELD].push(addDynamicColumn(item, gridColumns[item.fieldName]));
      return;
    }
  });

  return dynamicModel;
}

function addDynamicColumn(field: FieldsModel, isVisible: boolean = false): ColumnInterface {
  return {
    columnId: field.fieldName,
    isChecked: isVisible,
    caption: field.showName,
  };
}

function addStaticColumn(options: {
  columnsVisibilitySettings: ColumnsVisibilityModel,
  columnId: string,
  caption?: string,
}): ColumnInterface {
  return {
    columnId: options.columnId,
    isChecked: options.columnsVisibilitySettings[options.columnId],
    caption: options.caption ? options.caption : STATIC_COLUMN_CAPTION_NAMES[options.columnId] as string,
  };
}

function addAttachedFilesColumn(options: { columnsVisibilitySettings: ColumnsVisibilityModel }): ColumnInterface {
  return {
    columnId: StaticColumnFieldNames.ATTACHED_FILES,
    isChecked: options.columnsVisibilitySettings[StaticColumnFieldNames.ATTACHED_FILES] || false,
    caption: STATIC_COLUMN_CAPTION_NAMES[StaticColumnFieldNames.ATTACHED_FILES],
  };
}

export function generateColumnsForPopUpDisplay(
  gridCategory: GridType,
  columnsVisibilitySettings: ColumnsVisibilityModel,
  dynamicFields: DynamicTableDataModel,
  sessionInfo: SessionInfo,
  sectionId: number,
  user: User,
): ColumnsDataModel {
  const importDetailsCaption: string = foreignCondition(sessionInfo)
    ? STATIC_COLUMN_CAPTION_NAMES[StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS]
    : STATIC_COLUMN_CAPTION_NAMES[StaticColumnFieldNames.COMMON_DETAILS];
  const exportDetailsCaption: string = domesticCondition(sessionInfo)
    ? STATIC_COLUMN_CAPTION_NAMES[StaticColumnFieldNames.EXPORT_DETAILS]
    : STATIC_COLUMN_CAPTION_NAMES[StaticColumnFieldNames.COMMON_DETAILS];

  const dynamicColumnsData: DynamicColumnsDataModel = generateDynamicColumnData(
    columnsVisibilitySettings,
    dynamicFields,
    user?.IsWorker,
  );

  const dataModel: ColumnsDataModel = {
    gridType: gridCategory,
    sectionId,
    [ColumnFieldType.ABOUT_OFFER]: {
      columnNamePath: 'tableSettings.aboutOffer',
      [ColumnType.STATIC]: [
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.CREATE_OFFER_DATE }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.CLIENT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DIRECTION_NAME }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.STATUS_NAME }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.BRANCH }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.CONTRACT_TYPE }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DEMOFF_MARKET_TYPES }),
      ],
    },
    [ColumnFieldType.GOOD]: {
      columnNamePath: 'tableSettings.good',
      [ColumnType.STATIC]: [
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DESCRIPTION }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.OFFER_NAME }),
      ],
      [ColumnType.DYNAMIC]: dynamicColumnsData[ColumnFieldType.GOOD],
    },
    [ColumnFieldType.ADDITIONAL_FIELD]: {
      columnNamePath: 'tableSettings.additionalFields',
      [ColumnType.DYNAMIC]: dynamicColumnsData[ColumnFieldType.ADDITIONAL_FIELD],
      [ColumnType.STATIC]: [],
    },
    [ColumnFieldType.GENERAL_FIELD]: {
      columnNamePath: 'tableSettings.generalFields',
      [ColumnType.STATIC]: [
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.CURRENCY }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.UNIT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.VOLUME }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.LOT_SUMMARY_VOLUME }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.PRICE }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.VAT_PERCENT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.AMOUNT_VAT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.LOT_SUMMARY_VAT_AMOUNT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.TOTAL_AMOUNT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.LOT_SUMMARY_TOTAL_AMOUNT }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DELIVERY_CONDITIONS }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DELIVERY_CONDITIONS_PERIOD }),
        addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.PAYMENT_CONDITIONS }),
        {
          ...addAttachedFilesColumn({ columnsVisibilitySettings }),
          children: [
            addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.PRIVATE_FILES }),
            addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.PUBLIC_FILES }),
          ],
        },
      ],
    },
  };

  if (isAbandonedOffersTabActive(gridCategory)) {
    dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC] = [
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.REJECTION_DATE }),
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.REJECTION_REASON }),
      ...dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC],
    ];
  }

  if (isWorker(user)) {
    dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC],
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.CONCATED_FIRM_NAME }),
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.TRADER }),
    ];
  }

  if (!isWorker(user)) {
    dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.ABOUT_OFFER][ColumnType.STATIC],
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.SESSION_NUMBER }),
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.SESSION_NAME }),
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.SESSION_DATE_AND_TIME }),
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.SESSION_STAGE }),
    ];
  }

  if (isGoodAnalogVisible(sessionInfo)) {
    dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC],
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.GOOD_ANALOG }),
    ];
  }

  if (isDeliveryScheduleVisible(user, sessionInfo)) {
    dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC],
      addStaticColumn({ columnsVisibilitySettings, columnId: StaticColumnFieldNames.DELIVERY_SCHEDULE }),
    ];
  }

  if (isImportDomesticDetailsVisible(user, sessionInfo)) {
    dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC],
      addStaticColumn({
        columnsVisibilitySettings,
        columnId: StaticColumnFieldNames.IMPORT_DOMESTIC_DETAILS,
        caption: importDetailsCaption,
      }),
    ];
  }

  if (isExportDetailsVisible(user, sessionInfo)) {
    dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC] = [
      ...dataModel[ColumnFieldType.GENERAL_FIELD][ColumnType.STATIC],
      addStaticColumn({
        columnsVisibilitySettings,
        columnId: StaticColumnFieldNames.EXPORT_DETAILS,
        caption: exportDetailsCaption,
      }),
    ];
  }

  return dataModel;
}
