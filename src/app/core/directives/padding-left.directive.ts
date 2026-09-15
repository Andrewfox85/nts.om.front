import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2
} from '@angular/core';

@Directive({
  selector: '[paddingLeft]'
})
export class PaddingLeftDirective implements OnInit {
  @Input() ref: any;
  private baseLevel: number = 25;
  private defaultPadding: string = '0';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {
  }

  ngOnInit() {
    this.updatePadding();
  }

  private updatePadding() {
    let paddingValue: string;
    if (this.ref?.isDepend) {
      const level = this.ref?.level || 0;
      const paddingPx = level * this.baseLevel;
      paddingValue = `${paddingPx}px`;
    } else {
      paddingValue = this.defaultPadding;
    }

    this.renderer.setStyle(this.el.nativeElement, 'padding-left', paddingValue);
  }
}
