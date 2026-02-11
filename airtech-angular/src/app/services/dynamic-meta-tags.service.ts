import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PublicService } from './public.service';

@Injectable({
  providedIn: 'root'
})
export class DynamicMetaTagsService {
  private document = inject(DOCUMENT);
  private publicService = inject(PublicService);

  private cache: any[] = [];
  private lastFetchedAt = 0;
  private readonly cacheTtlMs = 15000;

  applyForUrl(url: string) {
    const path = this.normalizePath(url);
    this.loadTags().then((tags) => this.injectTags(tags, path));
  }

  private async loadTags(): Promise<any[]> {
    const now = Date.now();
    if (this.cache.length && now - this.lastFetchedAt < this.cacheTtlMs) {
      return this.cache;
    }

    try {
      const tags = await firstValueFrom(this.publicService.getMetaTags());
      this.cache = Array.isArray(tags) ? tags : [];
      this.lastFetchedAt = now;
      return this.cache;
    } catch (error) {
      console.error('Failed to load dynamic meta tags', error);
      return this.cache;
    }
  }

  private injectTags(tags: any[], path: string) {
    this.restoreManagedTags();

    const applicable = (Array.isArray(tags) ? tags : [])
      .filter((tag) => tag?.active !== false)
      .filter((tag) => this.matchesPath(path, tag?.pages));

    const deduped = new Map<string, any>();
    applicable.forEach((tag) => {
      const signature = `${tag?.keyType || ''}|${tag?.key || ''}`;
      deduped.set(signature, tag);
    });

    deduped.forEach((tag) => this.upsertTag(tag));
  }

  private upsertTag(tag: any) {
    const keyType = (tag?.keyType || '').toLowerCase();
    const key = String(tag?.key || '').toLowerCase();

    if (keyType === 'charset') {
      const selector = 'meta[charset]';
      const existing = this.document.querySelector(selector) as HTMLMetaElement | null;
      const element = existing || this.document.createElement('meta');
      this.markManaged(element);
      element.setAttribute('charset', String(tag?.content || 'utf-8'));
      this.applyAdditionalAttributes(element, tag?.attributes);
      if (!existing) this.document.head.appendChild(element);
      return;
    }

    const selector = keyType === 'custom'
      ? `meta[data-custom-meta-key='${this.escapeSelectorValue(String(tag?.id || key || 'custom'))}']`
      : keyType === 'http-equiv'
        ? `meta[http-equiv='${this.escapeSelectorValue(key)}']`
        : `meta[${this.escapeSelectorValue(keyType)}='${this.escapeSelectorValue(key)}']`;

    const existing = this.document.querySelector(selector) as HTMLMetaElement | null;
    const element = existing || this.document.createElement('meta');

    this.markManaged(element);

    if (keyType === 'http-equiv') {
      element.setAttribute('http-equiv', key);
    } else if (keyType === 'custom') {
      element.setAttribute('data-custom-meta-key', String(tag?.id || key || 'custom'));
      const attributes = tag?.attributes || {};
      Object.entries(attributes).forEach(([attr, value]) => {
        element.setAttribute(attr, String(value));
      });
    } else {
      element.setAttribute(keyType, key);
    }

    if (tag?.content) {
      element.setAttribute('content', String(tag.content));
    } else {
      element.removeAttribute('content');
    }

    this.applyAdditionalAttributes(element, tag?.attributes);

    if (!existing) {
      this.document.head.appendChild(element);
    }
  }

  private applyAdditionalAttributes(element: HTMLMetaElement, attrs: any) {
    if (!attrs || typeof attrs !== 'object') return;
    Object.entries(attrs).forEach(([key, value]) => {
      if (!key) return;
      element.setAttribute(String(key), String(value));
    });
  }

  private markManaged(element: HTMLMetaElement) {
    if (element.getAttribute('data-custom-meta-managed') === 'true') return;

    const originalAttributes: Record<string, string> = {};
    Array.from(element.attributes).forEach((attr) => {
      originalAttributes[attr.name] = attr.value;
    });

    element.setAttribute('data-custom-meta-managed', 'true');
    element.setAttribute('data-custom-meta-original', JSON.stringify(originalAttributes));
  }

  private restoreManagedTags() {
    const managed = this.document.querySelectorAll("meta[data-custom-meta-managed='true']");
    managed.forEach((node) => {
      const element = node as HTMLMetaElement;
      const originalRaw = element.getAttribute('data-custom-meta-original');
      if (!originalRaw) {
        element.remove();
        return;
      }

      let original: Record<string, string> = {};
      try {
        original = JSON.parse(originalRaw) || {};
      } catch {
        element.remove();
        return;
      }

      Array.from(element.attributes).forEach((attr) => {
        if (!['data-custom-meta-managed', 'data-custom-meta-original'].includes(attr.name) && !(attr.name in original)) {
          element.removeAttribute(attr.name);
        }
      });

      Object.entries(original).forEach(([name, value]) => {
        element.setAttribute(name, value);
      });

      element.removeAttribute('data-custom-meta-managed');
      element.removeAttribute('data-custom-meta-original');
    });
  }

  private normalizePath(url: string) {
    const clean = String(url || '').split('?')[0].split('#')[0];
    if (!clean) return '/';
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  private matchesPath(path: string, pages: string[]) {
    const targets = Array.isArray(pages) ? pages : ['/'];
    return targets.some((target) => {
      if (target === '*') return true;
      if (!target) return false;
      if (target.endsWith('/*')) {
        const prefix = target.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === target;
    });
  }

  private escapeSelectorValue(value: string) {
    return String(value || '').replace(/'/g, "\\'");
  }
}
