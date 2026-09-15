/* eslint-disable */
import {Component, EventEmitter, OnInit, Output} from '@angular/core';

@Component({
  selector: 'ceit-remove-adjusted-price',
  templateUrl: './remove-adjusted-price.component.html',
  styleUrls: ['./remove-adjusted-price.component.scss']
})
export class RemoveAdjustedPriceComponent implements OnInit {
  isVisible = false;
  @Output() result = new EventEmitter<boolean>();

  constructor() {
  }

  ngOnInit(): void {
    this.isVisible = true;
  }

  public onEmitValue(result: boolean): void {
    this.isVisible = false;
    this.result.emit(result)
  }

}
