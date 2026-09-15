/* eslint-disable */
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from "rxjs";
import { switchMap } from "rxjs/operators";
import { GridOptionsApiModel, ListOffersCatalogueApiModel } from "../../core/interfaces/api";
import { UserTableOptionsService } from "./user-table-options.service";
import { OfferManagementService } from "../../core/services/offer-management-service.service";
import { User } from "../../core/classes/user";

@Injectable()
export class TableDataFacadeService {

  constructor(
    private userTableOptionsService: UserTableOptionsService,
    private offerManagementService: OfferManagementService
  ) {}

  public getTableDataForWorker(user: User, filters: any, sectionId: number, gridId: number): Observable<{
    data: ListOffersCatalogueApiModel;
    userGridSettings: GridOptionsApiModel
  }> {
    return this.userTableOptionsService.savePreviousTableState(user)
      .pipe(
        switchMap(() =>
          forkJoin({
            data: this.offerManagementService.getListOffersCatalogueWorker(filters),
            userGridSettings: this.userTableOptionsService.getTableSettings(sectionId, gridId)
          })
        )
      )
  }

  public getTableDataForTrader(user: User, filters: any, sectionId: number, gridId: number): Observable<{
    data: ListOffersCatalogueApiModel;
    userGridSettings: GridOptionsApiModel
  }> {
    return this.userTableOptionsService.savePreviousTableState(user)
      .pipe(
        switchMap(() =>
          forkJoin({
            data: this.offerManagementService.getListOffersCatalogueTrader(filters),
            userGridSettings: this.userTableOptionsService.getTableSettings(sectionId, gridId)
          })
        )
      )
  }
}
