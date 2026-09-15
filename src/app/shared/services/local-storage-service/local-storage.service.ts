import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  public setItemToLocalStorage<T>(key: string, data: T): void {
    try {
      const serialized: string = JSON.stringify(data);

      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Ошибка при сохранении данных в localStorage по ключу "${key}":`, error);
    }
  }

  public getItemFromLocalStorage<T>(key: string): T | null {
    try {
      const item: string = localStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(`Ошибка при получении данных из localStorage по ключу "${key}":`, error);
      return null;
    }
  }

  public removeItemFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Ошибка при удалении данных из localStorage по ключу "${key}":`, error);
    }
  }

  public cleanLocalStorageFieldsAfterLogOut(): void {
    this.removeItemFromLocalStorage('user');
    this.removeItemFromLocalStorage('auth-token');
    this.removeItemFromLocalStorage('auth-user');
    this.removeItemFromLocalStorage('privileges');
    this.removeItemFromLocalStorage('createOffer');
    this.removeItemFromLocalStorage('sections');
    this.removeItemFromLocalStorage('autoControlChanges');
    this.removeItemFromLocalStorage('viewOffer');
    this.removeItemFromLocalStorage('unrealizedVolumesData');
    this.removeItemFromLocalStorage('returnUrl');
    this.removeItemFromLocalStorage('lang');
    this.removeItemFromLocalStorage('locale');
  }
}
