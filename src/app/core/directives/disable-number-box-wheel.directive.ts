/* eslint-disable */
import {
  AfterViewInit,
  Directive,
  ElementRef
} from '@angular/core';
import { off } from 'devextreme/events';

@Directive({
  selector: 'dx-number-box'
})
export class DisableNumberBoxWheelDirective implements AfterViewInit {
  constructor(private el: ElementRef) {
  }

  ngAfterViewInit() {
    const inputElement = this.el.nativeElement.querySelector('.dx-texteditor-input');
    if (inputElement) {
      off(inputElement, 'dxmousewheel');
      inputElement.addEventListener('wheel', (e: WheelEvent) => e.preventDefault(), { passive: false });
    }
  }
}
