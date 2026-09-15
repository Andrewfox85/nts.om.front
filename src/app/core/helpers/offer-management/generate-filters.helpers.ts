/* eslint-disable */
import { PageCache } from "../../classes/PageCache";

export namespace GenerateFiltersHelpers {
  export function getFiltersForWorker(sectionId: number, filterTab: number, cache: PageCache): any {
    return {
      idSection: sectionId,
      filterSessionId: cache?.filters?.session,
      filterTabManage: filterTab, // 1-активные, 2-откл
      listPropertiesStr: cache?.filters?.refsStr || [],
      listPropertiesInt: cache?.filters?.refsInt || [],
      filterIsMultibasis: cache?.filters?.multibasisLot, // true/false
      filterIsAdjustedPrice: cache?.filters?.adjustablePrice, // true/false
      filterIsCompositeLot: cache?.filters?.assembledLot, // true/false
      filterIsModified: cache?.filters?.changes, // true/false
      filterIsNotTransferred: cache?.filters?.transferredToBids, // true/false,
      filterIsOutPriceCorridor: cache?.filters?.outOfPriceRange,
      filterIsIndivPriceStep: cache?.filters?.indivPriceStep,
      filterIsContainDeleted: cache?.filters?.goodDeleted,
      filterIsUnsynchronized: cache?.filters?.syncError,
    };
  }

  export function getFiltersForTrader(sectionId: number, filterTab: number, cache: PageCache): any {
    return {
      idSection: sectionId,
      filterSessionId: cache?.filters?.session || null,
      filterSessionDateFrom: cache?.filters?.dateFrom || null,
      filterSessionDateTo: cache?.filters?.dateTo || null,
      filterTabManage: filterTab, // 1-активные, 2-откл
      listPropertiesStr: cache?.filters?.refsStr || [],
      listPropertiesInt: cache?.filters?.refsInt || [],
      filterIsMultibasis: cache?.filters?.multibasisLot, // true/false
      filterIsAdjustedPrice: cache?.filters?.adjustablePrice,
      filterIsCompositeLot: cache?.filters?.assembledLot,
      filterIsTransferred: cache?.filters?.transferred,
      filterIsOutPriceCorridor: cache?.filters?.outOfPriceRange,
    };
  }
}
