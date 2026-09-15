import { Properties as ButtonProperties } from 'devextreme/ui/button';
import DevExpress from 'devextreme';
import ClickEvent = DevExpress.ui.dxButton.ClickEvent;
import { User } from '../../../core/classes/user';
import { AUCTION_TYPE } from '../../../api.constants';
import { GridType } from '../../../core/enums';
import { SessionInfo } from '../../../core/interfaces/interface';

export function getActiveGridCategoryBySelectedTabIndex(selectedIndex: number): GridType {
  switch (selectedIndex) {
    case 0:
      return GridType.ACTIVE;
    case 1:
      return GridType.ABANDONED;
    default:
      return GridType.ACTIVE;
  }
}

export function generateCloseButtonOptions(onCloseCallback: (e: ClickEvent) => void): ButtonProperties {
  return {
    icon: 'close',
    stylingMode: 'text',
    onClick: onCloseCallback,
    elementAttr: {
      style: 'position: absolute; right: 0; top: 8px',
    },
  };
}

export function isAbandonedOffersTabActive(idInterfaceGrid: number): boolean {
  return Boolean(idInterfaceGrid === GridType.ABANDONED);
}

export function isWorker(user: User): boolean {
  return user?.IsWorker;
}

export function domesticCondition(sessionInfo: SessionInfo): boolean {
  return sessionInfo?.marketTypeIds.some((el: string) =>
    ['DOMESTIC', 'IMPORT'].includes(el),
  );
}

export function foreignCondition(sessionInfo: SessionInfo): boolean {
  return sessionInfo?.marketTypeIds.some((el: string) =>
    ['FOREIGN', 'EXPORT'].includes(el),
  );
}

export function isGoodAnalogVisible(sessionInfo: SessionInfo): boolean {
  return Number(sessionInfo?.tradeTypeId) === AUCTION_TYPE.SIMPLE_BUYER_AUCTION;
}

export function isDeliveryScheduleVisible(user: User, sessionInfo: SessionInfo): boolean {
  return isWorker(user) && Number(sessionInfo?.tradeTypeId) === AUCTION_TYPE.SIMPLE_SELLER_AUCTION;
}

export function isImportDomesticDetailsVisible(user: User, sessionInfo: SessionInfo): boolean {
  return domesticCondition(sessionInfo) && isWorker(user);
}

export function isExportDetailsVisible(user: User, sessionInfo: SessionInfo): boolean {
  return foreignCondition(sessionInfo) && isWorker(user);
}
