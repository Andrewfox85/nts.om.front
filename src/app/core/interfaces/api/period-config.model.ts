import { Moment } from 'moment/moment';

export interface PeriodConfigItem {
  unit: string;
  startOf: string;
  endOf: string;
  add: { value: number; unit: string };
  number: (date: Moment) => number;
}

export interface PeriodConfig {
  [key: number]: PeriodConfigItem;
}
