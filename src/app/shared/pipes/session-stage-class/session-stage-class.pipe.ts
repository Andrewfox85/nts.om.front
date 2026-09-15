import { Pipe, PipeTransform } from '@angular/core';
import { sessionStage } from 'src/app/api.constants';

@Pipe({
  name: 'stageColor'
})
export class StageColorPipe implements PipeTransform {
  public transform(stageId: number): string {
    if (!stageId) {
      return '';
    }

    const redStages: Array<string | number> = [
      sessionStage.applicationsClosed,
      sessionStage.completedProcessingApplications,
      sessionStage.transferAuctionCompleted,
      sessionStage.sessionEnded,
      sessionStage.completedDataTransferArchive
    ];

    const blueStages: Array<string | number> = [
      sessionStage.applicationsOpen,
      sessionStage.purchaseOrdersOpen,
      sessionStage.applicationsSaleOpen
    ];

    if (redStages.includes(Number(stageId))) {
      return 'redStage';
    }
    if (Number(stageId) === sessionStage.new) {
      return 'greenStage';
    }
    if (blueStages.includes(Number(stageId))) {
      return 'blueStage';
    }

    return '';
  }
}
