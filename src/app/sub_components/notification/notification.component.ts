/* eslint-disable */
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import {
  NotificationService,
  NotificationItem
} from './notification.service';

@Component({
  selector: 'ceit-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  public readonly notifications$: Observable<NotificationItem[]> =
    this.notificationService.notifications$;

  constructor(private readonly notificationService: NotificationService) {}
}
