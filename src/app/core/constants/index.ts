/* eslint-disable */
import RU from '../../../assets/i18n/RU.json';
import EN from '../../../assets/i18n/EN.json';

// TODO move this to another file if necessary
export const UNAUTHORIZED_ERROR_CODE = 401;
export const FORBIDDEN_ERROR_CODE = 403;
export const SERVER_ERROR_CODE = 500;
export const NO_INTERNET_CONNECTION_CODE = 0;

export const UNAUTHORIZED_AND_FORBIDDEN_CODES = [
  UNAUTHORIZED_ERROR_CODE,
  FORBIDDEN_ERROR_CODE,
];

export const ERROR_MESSAGES = {
  [NO_INTERNET_CONNECTION_CODE]: {
    RU: RU.errors.noInterNetConnection,
    EN: EN.errors.noInterNetConnection,
  },
  [UNAUTHORIZED_ERROR_CODE]: {
    RU: RU.errors.unauthorized,
    EN: EN.errors.unauthorized,
  },
};

export const  LANGUAGE = [
  { name: 'РУС', value: 'RU' },
  { name: 'EN', value: 'EN' },
];

export const RU_LANG: string = 'ru';
export const EN_LANG: string = 'en';
