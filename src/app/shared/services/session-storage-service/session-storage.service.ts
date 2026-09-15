import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  public setItemToSessionStorage<T>(key: string, data: T): void {
    try {
      const serialized: string = JSON.stringify(data);

      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(
        `Ошибка при сохранении данных в sessionStorage по ключу "${key}":`,
        error
      );
    }
  }

  public getItemFromSessionStorage<T>(key: string): T | null {
    try {
      const item: string = sessionStorage.getItem(key);

      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(
        `Ошибка при получении данных из sessionStorage по ключу "${key}":`,
        error
      );
      return null;
    }
  }

  public removeItemFromSessionStorage(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(
        `Ошибка при удалении данных из sessionStorage по ключу "${key}":`,
        error
      );
    }
  }

  public clearSessionStorage(): void {
    sessionStorage.clear();
  }
}
