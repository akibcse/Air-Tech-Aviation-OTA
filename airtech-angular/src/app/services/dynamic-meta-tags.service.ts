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

  private readonly PRIMARY_DOMAIN = 'https://airtech-aviation-ota.vercel.app';

  applyForUrl(url: string) {
    const path = this.normalizePath(url);
    this.loadTags().then((tags) => {
      this.injectTags(tags, path);
      this.updateCanonical(path);
    });
  }

  private updateCanonical(path: string) {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    const cleanPath = path === '/' ? '' : path;
    link.setAttribute('href', `${this.PRIMARY_DOMAIN}${cleanPath}`);
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
      const signature = `${tag?.id || tag?.keyType || ''}|${tag?.key || ''}|${tag?.content || ''}`;
      deduped.set(signature, tag);
    });

    deduped.forEach((tag) => this.upsertTag(tag));

    // Force canonical meta tags (og:url) if they exist
    this.updateAbsoluteMetaTags(path);
  }

  private updateAbsoluteMetaTags(path: string) {
    const absoluteUrl = `${this.PRIMARY_DOMAIN}${path === '/' ? '' : path}`;

    // Update og:url
    let ogUrl = this.document.querySelector("meta[property='og:url']") as HTMLMetaElement;
    if (ogUrl) ogUrl.setAttribute('content', absoluteUrl);

    // Update twitter:url if exists
    let twitterUrl = this.document.querySelector("meta[name='twitter:url']") as HTMLMetaElement;
    if (twitterUrl) twitterUrl.setAttribute('content', absoluteUrl);
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
        : tag?.content && key === 'google-site-verification'
          ? `meta[${this.escapeSelectorValue(keyType)}='${this.escapeSelectorValue(key)}'][content='${this.escapeSelectorValue(String(tag.content))}']`
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
      // Force primary domain for known absolute URL tags if content is a URL
      let content = String(tag.content);
      if (key === 'og:url' || key === 'twitter:url' || (keyType === 'link' && key === 'canonical')) {
        const path = this.normalizePath(this.document.location.pathname);
        content = `${this.PRIMARY_DOMAIN}${path === '/' ? '' : path}`;
      }
      element.setAttribute('content', content);
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
