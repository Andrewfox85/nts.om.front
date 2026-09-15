/* eslint-disable */
import { IPopupDimensionsOptions, poopupDimensionsType } from '../interfaces';
import { popupDeminsionsEnum } from '../enums';

export const SIMILAR_CATALOG_OPTIONS: IPopupDimensionsOptions = {
  width: '1112px',
  height: '826px',
  minHeight: '732px',
};

export const POPUP_DIMENSIONS: Record<
  poopupDimensionsType,
  IPopupDimensionsOptions
> = {
  [popupDeminsionsEnum.CHOOSE_ADD_GOOD]: {
    width: '515px',
    height: 'auto',
    minHeight: 'auto',
  },
  [popupDeminsionsEnum.ADD_FROM_CATALOG]: SIMILAR_CATALOG_OPTIONS,
  [popupDeminsionsEnum.ADD_GOOD_NSI]: SIMILAR_CATALOG_OPTIONS,
};
