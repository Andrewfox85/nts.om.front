/* eslint-disable */
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'green' | 'blue';
const VISIBLE_MESSAGE_TIME: number = 3000;

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notificationSubject: BehaviorSubject<NotificationItem[]> =
    new BehaviorSubject<NotificationItem[]>([]);

  public readonly notifications$: Observable<NotificationItem[]> =
    this.notificationSubject.asObservable();

  private idCounter: number = 0;

  public show(message: string): void {
    const id: number = ++this.idCounter;
    const newItem: NotificationItem = { id, message, type: 'green' };

    const current: NotificationItem[] = this.notificationSubject.getValue();
    this.notificationSubject.next([...current, newItem]);

    setTimeout(() => {
      this.remove(id);
    }, VISIBLE_MESSAGE_TIME);
  }

  public remove(id: number): void {
    const current: NotificationItem[] = this.notificationSubject.getValue();
    this.notificationSubject.next(current.filter((item: NotificationItem) => item.id !== id));
  }
}

