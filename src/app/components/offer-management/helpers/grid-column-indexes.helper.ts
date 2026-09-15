import { FieldsModel } from '../../../core/interfaces/api';
import { StaticColumnFieldNames } from '../../../core/enums';
import { ColumnState, DynamicTableDataModel, GridState } from '../../../core/interfaces';
import { DefaultVisibleFieldsForWorker } from '../../../core/enums/offer-management/dynamic-column-field-names';

export function recalculateTableVisibleIndexes(
  currentState: GridState,
  dynamicFields: DynamicTableDataModel,
): ColumnState[] {
  if (!currentState.columns?.length) {
    return [];
  }

  // собираем уникальные dynamic columns
  const dynamicFieldNames: Set<string> = new Set<string>();
  dynamicFields.refFields?.forEach((ref: FieldsModel) =>
    dynamicFieldNames.add(ref.fieldName),
  );
  dynamicFields.generalFields?.forEach((gen: FieldsModel) =>
    dynamicFieldNames.add(gen.fieldName),
  );
  dynamicFields.quotationRelatedFields?.forEach((gen: FieldsModel) =>
    dynamicFieldNames.add(gen.fieldName),
  );

  // если вдруг нету индекса - колонка станет в конце таблицы
  const visibilityIndexOf = (column: ColumnState): number => column.visibleIndex ?? Number.MAX_SAFE_INTEGER;

  // сортируем колонки на два массива: статические и динамические колонки
  // статические колонки сортируются в порядке возростания visibleIndex
  const staticColumns: ColumnState[] = currentState.columns.filter(
    (column: ColumnState) => !dynamicFieldNames.has(column.dataField),
  ).sort(
    (a: ColumnState, b: ColumnState) => visibilityIndexOf(a) - visibilityIndexOf(b),
  );
  // динамические колонки сортируются в порядке убывания visibleIndex
  const dynamicColumns: ColumnState[] = currentState.columns
    .filter((column: ColumnState) => dynamicFieldNames.has(column.dataField))
    .sort(
      (a: ColumnState, b: ColumnState) =>
        visibilityIndexOf(b) - visibilityIndexOf(a),
    );

  // за основу берем статические колонки, они всегда присутствуют в таблице
  const mergedColumns: ColumnState[] = [...staticColumns];

  // если не удается найти место для вставки опираясь на статическую левую и правую правую колонку из api
  // то динамическая колонка будет вставлена по общим условиям (как initial state)
  // Общие условия:
  // динамика с REF - вставляется после Краткого описания
  // динамика Котировка, Валюта котировки, Поправка, Тип поправки - вставляется после Единицы измерения
  // вся остальная динамика вставляется после ФИО трейдера
  const insertDynamicColumnWithDefaultAnchor = (dynamicColumn: ColumnState): void => {
    let beforeField: string;
    if (dynamicColumn.dataField?.startsWith('REF')) {
      beforeField = StaticColumnFieldNames.DESCRIPTION;
    } else if (Object.values(DefaultVisibleFieldsForWorker).includes(dynamicColumn.dataField)) {
      beforeField = StaticColumnFieldNames.UNIT;
    } else {
      beforeField = StaticColumnFieldNames.TRADER;
    }
    const anchorIndex: number = mergedColumns.findIndex(
      (col: ColumnState) => col.dataField === beforeField,
    );
    if (anchorIndex === -1) {
      mergedColumns.push(dynamicColumn);
    } else {
      mergedColumns.splice(anchorIndex + 1, 0, dynamicColumn);
    }
  };

  // основной алгоритм вставки динамических колонок
  dynamicColumns.forEach((dynamicColumn: ColumnState) => {
    // ищем статическую колонку которая была слева
    const leftField: string = dynamicColumn.staticColumnLeft;
    if (leftField != null) {
      const insertAfterIndex: number = mergedColumns.findIndex(
        (col: ColumnState) => col.dataField === leftField,
      );
      // если такой индекс есть, вставляем колонку
      if (insertAfterIndex !== -1) {
        mergedColumns.splice(insertAfterIndex + 1, 0, dynamicColumn);
        return;
      }
    }

    // ищем статическую колонку которая была справа
    const anchorField: string = dynamicColumn.staticColumnRight;
    if (anchorField != null) {
      const insertBeforeIndex: number = mergedColumns.findIndex(
        (col: ColumnState) => col.dataField === anchorField,
      );
      // если такой индекс есть, вставляем колонку
      if (insertBeforeIndex !== -1) {
        mergedColumns.splice(insertBeforeIndex, 0, dynamicColumn);
        return;
      }
    }

    // если нет данных ни слева, ни справа - вставляем по общим условиям
    insertDynamicColumnWithDefaultAnchor(dynamicColumn);
  });

  mergedColumns.forEach((column: ColumnState, index: number) => {
    column.visibleIndex = index;
  });

  return mergedColumns;
}
