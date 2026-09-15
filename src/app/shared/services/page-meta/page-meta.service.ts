import { Injectable, inject, Renderer2, RendererFactory2 } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PageMetaService {
  private readonly title: Title = inject(Title);
  private readonly document: Document = inject(DOCUMENT);

  private renderer: Renderer2;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  /**
   * Установка title страницы
   */
  public setTitle(sessionId: string | number, pageTitle: string): void {
    this.title.setTitle(sessionId ? `${sessionId}: ${pageTitle}` : pageTitle);
  }

  /**
   * Установка favicon
   */
  public setFavicon(iconPath: string, type: string = 'image/svg+xml'): void {
    let link: HTMLLinkElement = this.document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (!link) {
      link = this.renderer.createElement('link') as HTMLLinkElement;
      this.renderer.setAttribute(link, 'rel', 'icon');
      this.renderer.appendChild(this.document.head, link);
    }

    this.renderer.setAttribute(link, 'type', type);
    this.renderer.setAttribute(link, 'href', iconPath);
  }

  /**
   * Универсальный метод (title + favicon)
   */
  public setPageMeta(sessionId: string | number, pageTitle: string, faviconPath?: string): void {
    this.setTitle(sessionId, pageTitle);

    if (faviconPath) {
      this.setFavicon(faviconPath);
    }
  }
}
