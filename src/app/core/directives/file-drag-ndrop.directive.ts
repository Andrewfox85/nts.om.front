/* eslint-disable */
import {Directive, EventEmitter, HostBinding, HostListener, Output} from '@angular/core';

@Directive({
  selector: '[appFileDragNDrop]'
})
export class FileDragNDropDirective {
  @Output() fileDropped = new EventEmitter<any>();
  @HostBinding('style.background') private background = '#ffffff';
  @HostBinding('style.border') private borderStyle = '1px solid #BDBDBD';
  // @HostBinding('style.border-color') private borderColor = 'rgba(68, 68, 68, 0.4)';
  @HostBinding('style.border-radius') private borderRadius = '4px';

  constructor(  ) { }

  @HostListener('dragover', ['$event']) public onDragOver(evt){
    evt.preventDefault();
    evt.stopPropagation();
    // this.background = '';
    // this.borderColor = 'rgba(68, 68, 68, 0.4);';
    this.borderStyle = '1px dashed rgba(68, 68, 68, 0.4)';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt){
    evt.preventDefault();
    evt.stopPropagation();
    // this.background = '#ffffff';
    // this.borderColor = 'rgba(68, 68, 68, 0.4)';
    this.borderStyle = '1px solid #BDBDBD';
  }

  @HostListener('drop', ['$event']) public onDrop(evt){
    evt.preventDefault();
    evt.stopPropagation();
    let files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files);
    }
    this.borderStyle = '1px solid #BDBDBD';
  }
}
