/* eslint-disable */
import { Component, OnInit } from '@angular/core';
import {LoaderPanelService} from './loader-panel.service';

@Component({
  selector: 'loader-panel',
  templateUrl: './loader-panel.component.html',
  styleUrls: ['./loader-panel.component.scss']
})
export class LoaderPanelComponent implements OnInit {
  loadingVisible: boolean = false;

  constructor(
    private loaderPanelService: LoaderPanelService
  ) { }

  ngOnInit(): void {
    this.loaderPanelService.loaderSourceCalled$.subscribe((res) => {
      this.loadingVisible= res
    });
  }

}
