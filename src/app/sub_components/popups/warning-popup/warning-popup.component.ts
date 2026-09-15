/* eslint-disable */
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ceit-warning-popup',
  templateUrl: './warning-popup.component.html',
  styleUrls: ['./warning-popup.component.scss']
})
export class WarningPopupComponent implements OnInit {
  public isVisible = false;
  @Input() warningMessage: string;
  @Input() warningTitle: string;
  @Output() result = new EventEmitter<boolean>();

  constructor() {
  }

  public ngOnInit(): void {
    this.isVisible = true;
  }

  public onEmitValue(res: boolean): void {
    this.result.emit(res)
    this.isVisible = false;
  }

}
