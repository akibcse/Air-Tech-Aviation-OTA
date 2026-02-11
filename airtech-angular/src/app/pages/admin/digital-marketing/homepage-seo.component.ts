import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-homepage-seo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-5 text-gray-900">
      <div>
        <p class="text-xs uppercase tracking-widest text-gray-500 font-bold">Digital Marketing</p>
        <h1 class="text-2xl md:text-3xl font-black">Homepage SEO</h1>
        <p class="text-sm text-gray-600 mt-2">Manage homepage metadata, canonical settings, and social sharing tags.</p>
      </div>

      @if (!authService.isAdmin() && !authService.isLoading()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
          <p class="text-red-700 text-sm">Only ADMIN users can manage homepage SEO settings.</p>
        </div>
      } @else {
        @if (loading()) {
          <div class="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 font-semibold">Loading homepage SEO settings...</div>
        } @else {
          <div class="grid lg:grid-cols-2 gap-5">
            <section class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 class="text-lg font-black">Meta Tags</h2>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-sm font-bold text-gray-700">Meta Title</label>
                  <span class="text-xs" [class]="counterClass(metaTitleCount(), 60, 70)">{{ metaTitleCount() }}/70</span>
                </div>
                <input [(ngModel)]="seo.metaTitle" maxlength="70" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-sm font-bold text-gray-700">Meta Description</label>
                  <span class="text-xs" [class]="counterClass(metaDescriptionCount(), 150, 160)">{{ metaDescriptionCount() }}/160</span>
                </div>
                <textarea [(ngModel)]="seo.metaDescription" maxlength="160" rows="4" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Meta Keywords</label>
                <textarea [(ngModel)]="seo.metaKeywords" maxlength="400" rows="3" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Meta Robots</label>
                <div class="grid grid-cols-2 gap-2">
                  <select [(ngModel)]="robotsIndex" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="index">index</option>
                    <option value="noindex">noindex</option>
                  </select>
                  <select [(ngModel)]="robotsFollow" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="follow">follow</option>
                    <option value="nofollow">nofollow</option>
                  </select>
                </div>
              </div>
            </section>

            <section class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 class="text-lg font-black">Canonical & Domain</h2>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Canonical Mode</label>
                <select [(ngModel)]="seo.canonicalMode" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="auto">Auto (recommended)</option>
                  <option value="manual">Manual URL override</option>
                </select>
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Primary Domain</label>
                <input [(ngModel)]="seo.primaryDomain" placeholder="https://www.airtechaviation.click" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Canonical Path</label>
                <input [(ngModel)]="seo.canonicalPath" placeholder="/" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              @if (seo.canonicalMode === 'manual') {
                <div>
                  <label class="text-sm font-bold text-gray-700 mb-1 block">Manual Canonical URL</label>
                  <input [(ngModel)]="seo.canonicalUrl" placeholder="https://www.airtechaviation.click/" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              }

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Alternate Domains (one per line)</label>
                <textarea [(ngModel)]="alternateDomainsText" rows="3" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
                <p class="mt-1 text-xs text-gray-500">Include canonical and fallback domains: www.airtechaviation.click, airtech-aviation-ota.vercel.app, airtech-angular.vercel.app</p>
              </div>
            </section>

            <section class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 class="text-lg font-black">Open Graph</h2>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">OG Title</label>
                <input [(ngModel)]="seo.ogTitle" maxlength="95" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">OG Description</label>
                <textarea [(ngModel)]="seo.ogDescription" maxlength="220" rows="3" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">OG Image URL</label>
                <input [(ngModel)]="seo.ogImageUrl" placeholder="https://example.com/og-image.jpg" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">OG Type</label>
                <input [(ngModel)]="seo.ogType" placeholder="website" maxlength="30" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </section>

            <section class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <h2 class="text-lg font-black">Twitter Card</h2>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Twitter Title</label>
                <input [(ngModel)]="seo.twitterTitle" maxlength="70" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Twitter Description</label>
                <textarea [(ngModel)]="seo.twitterDescription" maxlength="200" rows="3" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Twitter Image URL</label>
                <input [(ngModel)]="seo.twitterImage" placeholder="https://example.com/twitter-image.jpg" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div>
                <label class="text-sm font-bold text-gray-700 mb-1 block">Twitter Card Type</label>
                <select [(ngModel)]="seo.twitterCardType" class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary</option>
                </select>
              </div>
            </section>
          </div>

          <section class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 class="text-lg font-black">SERP Preview</h2>
            <div class="rounded-lg border border-gray-200 p-4">
              <p class="text-xs text-green-700">{{ computedCanonicalPreview() }}</p>
              <p class="text-xl text-[#1a0dab] leading-snug mt-1">{{ seo.metaTitle || defaultSeo.metaTitle }}</p>
              <p class="text-sm text-gray-700 mt-1">{{ seo.metaDescription || defaultSeo.metaDescription }}</p>
            </div>
          </section>

          <div class="flex flex-wrap items-center gap-3">
            <button
              (click)="saveAndPublish()"
              [disabled]="saving()"
              class="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100 transition-all"
            >
              {{ saving() ? 'Publishing...' : 'Save & Publish' }}
            </button>
            @if (lastSavedAt()) {
              <span class="text-xs text-gray-500">Last saved: {{ lastSavedAt() }}</span>
            }
          </div>
        }
      }
    </div>
  `
})
export class AdminHomepageSeoComponent {
  private adminService = inject(AdminService);
  authService = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  lastSavedAt = signal('');

  defaultSeo = {
    metaTitle: 'Cheap Air Tickets Bangladesh | Secure Booking | AirTech',
    metaDescription: 'Book cheap air tickets in Bangladesh with AirTech Aviation. Secure, instant online flight booking from Dhaka for domestic and international routes.',
    metaKeywords: 'cheap air tickets bangladesh, flight booking bangladesh, online air ticket booking, cheapest flight tickets, international flight booking from bangladesh, air ticket dhaka, airline ticket booking website bangladesh',
    metaRobots: 'index,follow',
    canonicalMode: 'auto',
    canonicalPath: '/',
    canonicalUrl: '',
    primaryDomain: 'https://www.airtechaviation.click',
    alternateDomains: ['https://www.airtechaviation.click', 'https://airtech-aviation-ota.vercel.app', 'https://airtech-angular.vercel.app'],
    ogTitle: '',
    ogDescription: '',
    ogImageUrl: '',
    ogType: 'website',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCardType: 'summary_large_image'
  };

  seo: any = { ...this.defaultSeo };
  alternateDomainsText = this.defaultSeo.alternateDomains.join('\n');
  robotsIndex: 'index' | 'noindex' = 'index';
  robotsFollow: 'follow' | 'nofollow' = 'follow';

  metaTitleCount = computed(() => String(this.seo.metaTitle || '').length);
  metaDescriptionCount = computed(() => String(this.seo.metaDescription || '').length);

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadSeo();
      } else if (!this.authService.isLoading()) {
        this.loading.set(false);
      }
    });
  }

  loadSeo() {
    this.loading.set(true);
    this.adminService.getHomeSeo().subscribe({
      next: (data: any) => {
        this.seo = { ...this.defaultSeo, ...(data || {}) };
        this.applyRobotsToSelectors(this.seo.metaRobots);
        this.alternateDomainsText = Array.isArray(this.seo.alternateDomains)
          ? this.seo.alternateDomains.join('\n')
          : this.defaultSeo.alternateDomains.join('\n');
        this.lastSavedAt.set(this.seo.updatedAt || '');
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load home SEO settings', err);
        this.loading.set(false);
      }
    });
  }

  saveAndPublish() {
    if (!this.authService.isAdmin()) {
      alert('Only ADMIN can update homepage SEO.');
      return;
    }

    this.seo.metaRobots = `${this.robotsIndex},${this.robotsFollow}`;
    this.seo.alternateDomains = this.alternateDomainsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    this.saving.set(true);
    this.adminService.updateHomeSeo(this.seo).subscribe({
      next: () => {
        alert('Homepage SEO saved and published successfully.');
        this.saving.set(false);
        this.loadSeo();
      },
      error: (err: any) => {
        console.error('Homepage SEO update failed', err);
        alert(`Failed to save homepage SEO: ${err.error?.details || err.message || 'Unknown error'}`);
        this.saving.set(false);
      }
    });
  }

  counterClass(value: number, warnFrom: number, max: number) {
    if (value >= max) return 'text-red-600 font-bold';
    if (value >= warnFrom) return 'text-amber-600 font-semibold';
    return 'text-gray-500';
  }

  computedCanonicalPreview() {
    const path = String(this.seo.canonicalPath || '/');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (this.seo.canonicalMode === 'manual' && this.seo.canonicalUrl) {
      return this.seo.canonicalUrl;
    }
    return `${this.seo.primaryDomain || this.defaultSeo.primaryDomain}${normalizedPath}`;
  }

  private applyRobotsToSelectors(robots: string) {
    const lower = String(robots || '').toLowerCase();
    this.robotsIndex = lower.includes('noindex') ? 'noindex' : 'index';
    this.robotsFollow = lower.includes('nofollow') ? 'nofollow' : 'follow';
  }
}
