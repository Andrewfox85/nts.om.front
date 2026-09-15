/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { AppConfigService } from "../../app-config.service";
import { GridOptionsApiModel, GridVisibilityOptionsApiModel } from "../interfaces/api";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UserOptionsService {

  constructor(private http: HttpClient, private conf: AppConfigService) {}

  public getGridOptions(sectionId: number, gridId: number): Observable<GridOptionsApiModel> {
    return this.http
      .get<GridOptionsApiModel>(
        `${this.conf.backendINV}${this.conf.DemandsManagement}/Options/GetGridOptions?section_id=${sectionId}&interface_grid_id=${gridId}`,
      );
  }

  public setGridOptionsVisibility(sectionId: number, gridId: number, options: GridVisibilityOptionsApiModel): void {
    this.http
      .post(`${this.conf.backendINV}${this.conf.DemandsManagement}/Options/SetGridOptionVisibility?section_id=${sectionId}&interface_grid_id=${gridId}`,
      options).subscribe();
  }

  public setGridOptionsCustomize(sectionId: number, gridId: number, options: GridOptionsApiModel): Observable<void> {
    return this.http
      .post<void>(`${this.conf.backendINV}${this.conf.DemandsManagement}/Options/setGridOptionCustomize?section_id=${sectionId}&interface_grid_id=${gridId}`,
        options);
  }
}

