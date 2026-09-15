/* eslint-disable */
import {Directive, HostListener} from '@angular/core';
import {DxNumberBoxComponent} from "devextreme-angular";

@Directive({
  selector: 'dx-number-box[dxNumberBoxClear]'
})
export class DxNumberBoxClearDirective {

  constructor(private numberBox: DxNumberBoxComponent) {
  }

  @HostListener('onValueChanged', ['$event'])
  onValueChanged(e: any) {
    //при очистке значения поле сбрасывается на пустоту
    if (e.event?.type === 'clear' || e.value === '') {
      this.numberBox.value = null;
      this.numberBox.instance.option('value', null);
    }
  }
}
