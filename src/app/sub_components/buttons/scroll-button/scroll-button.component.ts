/* eslint-disable */
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ceit-scroll-button',
  templateUrl: './scroll-button.component.html',
  styleUrls: ['./scroll-button.component.scss']
})
export class ScrollButtonComponent {
  public isViewScrollButton(): boolean {
    return document.body.offsetHeight > window.innerHeight;
  }

  public scrollDown(): void {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

  public scrollUp(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  public endOfDocument(): boolean {
    return Math.ceil(window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 5;
  }

}
