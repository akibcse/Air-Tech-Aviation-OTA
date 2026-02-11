import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-meta-tags',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-5 text-gray-900">
      <div>
        <p class="text-xs uppercase tracking-widest text-gray-500 font-bold">Digital Marketing</p>
        <h1 class="text-2xl md:text-3xl font-black">Meta Tags</h1>
        <p class="text-sm text-gray-600 mt-2">Manage Google Search Console and custom meta tags dynamically without redeploy.</p>
      </div>

      @if (!authService.isAdmin() && !authService.isLoading()) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
          <p class="text-red-700 text-sm">Only ADMIN users can manage meta tags.</p>
        </div>
      } @else {
        @if (loading()) {
          <div class="rounded-xl border border-gray-200 bg-white p-6 text-gray-500 font-semibold">Loading meta tags...</div>
        } @else {
          <div class="flex items-center gap-3">
            <button (click)="addTag()" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">+ Add New Meta Tag</button>
            <span class="text-xs text-gray-500">Total tags: {{ tags().length }}</span>
          </div>

          @if (duplicateWarnings().length) {
            <div class="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p class="text-sm font-bold text-amber-800">Duplicate key warnings:</p>
              <p class="text-xs text-amber-700 mt-1">{{ duplicateWarnings().join(' | ') }}</p>
            </div>
          }

          <div class="space-y-4">
            @for (tag of tags(); track tag.id; let i = $index) {
              <section class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div class="grid md:grid-cols-5 gap-3">
                  <div>
                    <label class="text-xs font-bold text-gray-600 uppercase">Type</label>
                    <select [(ngModel)]="tag.keyType" class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option value="name">name</option>
                      <option value="property">property</option>
                      <option value="http-equiv">http-equiv</option>
                      <option value="charset">charset</option>
                      <option value="custom">custom</option>
                    </select>
                  </div>

                  <div>
                    <label class="text-xs font-bold text-gray-600 uppercase">Key</label>
                    <input [(ngModel)]="tag.key" placeholder="google-site-verification" class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm" [disabled]="tag.keyType === 'charset'" />
                  </div>

                  <div class="md:col-span-2">
                    <label class="text-xs font-bold text-gray-600 uppercase">Content</label>
                    <input [(ngModel)]="tag.content" placeholder="Meta content value" class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>

                  <div class="flex items-end gap-2">
                    <label class="inline-flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" [(ngModel)]="tag.active" class="rounded border-gray-300" />
                      Enabled
                    </label>
                    <button (click)="removeTag(i)" class="ml-auto px-3 py-2 text-xs rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100">Remove</button>
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-3">
                  <div>
                    <label class="text-xs font-bold text-gray-600 uppercase">Pages</label>
                    <select [(ngModel)]="tag.pageScope" class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm">
                      <option value="/">Homepage only</option>
                      <option value="*">All pages</option>
                      <option value="custom">Custom path list</option>
                    </select>
                  </div>

                  <div>
                    <label class="text-xs font-bold text-gray-600 uppercase">Custom Attributes (JSON)</label>
                    <input [(ngModel)]="tag.attributesRaw" placeholder='{"data-custom":"x"}' class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>

                @if (tag.pageScope === 'custom') {
                  <div>
                    <label class="text-xs font-bold text-gray-600 uppercase">Paths (comma separated)</label>
                    <input [(ngModel)]="tag.customPagesRaw" placeholder="/, /search, /support" class="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                }

                @if (isEssentialConflict(tag)) {
                  <p class="text-xs text-amber-700 font-semibold">Warning: This tag may override an essential SEO tag.</p>
                }
              </section>
            }
          </div>

          <div class="flex items-center gap-3">
            <button (click)="saveAndPublish()" [disabled]="saving()" class="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
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
export class AdminMetaTagsComponent {
  private adminService = inject(AdminService);
  authService = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  lastSavedAt = signal('');
  tags = signal<any[]>([]);

  duplicateWarnings = computed(() => {
    const warnings: string[] = [];
    const seen = new Set<string>();
    this.tags().forEach((tag) => {
      if (tag.active === false) return;
      const signature = `${tag.keyType}|${(tag.key || '').toLowerCase()}`;
      if (seen.has(signature)) warnings.push(signature);
      seen.add(signature);
    });
    return warnings;
  });

  private readonly essentialKeys = new Set([
    'name:description',
    'name:keywords',
    'name:robots',
    'property:og:title',
    'property:og:description',
    'property:og:url',
    'name:twitter:title',
    'name:twitter:description',
    'name:twitter:card'
  ]);

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadTags();
      } else if (!this.authService.isLoading()) {
        this.loading.set(false);
      }
    });
  }

  addTag() {
    const id = `meta-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.tags.set([
      ...this.tags(),
      {
        id,
        keyType: 'name',
        key: '',
        content: '',
        pages: ['/'],
        pageScope: '/',
        customPagesRaw: '/',
        attributesRaw: '',
        active: true
      }
    ]);
  }

  removeTag(index: number) {
    this.tags.set(this.tags().filter((_, i) => i !== index));
  }

  loadTags() {
    this.loading.set(true);
    this.adminService.getMetaTags().subscribe({
      next: (data: any[]) => {
        this.tags.set((Array.isArray(data) ? data : []).map((tag) => this.toEditable(tag)));
        const latest = (Array.isArray(data) ? data : []).find((item: any) => item?.updatedAt)?.updatedAt || '';
        this.lastSavedAt.set(latest);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Failed to load meta tags', err);
        this.loading.set(false);
      }
    });
  }

  saveAndPublish() {
    if (!this.authService.isAdmin()) {
      alert('Only ADMIN can update meta tags.');
      return;
    }

    if (this.duplicateWarnings().length > 0) {
      alert('Please resolve duplicate active keys before publishing.');
      return;
    }

    const payload = this.tags().map((tag) => this.fromEditable(tag));

    this.saving.set(true);
    this.adminService.updateMetaTags(payload).subscribe({
      next: () => {
        alert('Meta tags saved and published successfully.');
        this.saving.set(false);
        this.loadTags();
      },
      error: (err: any) => {
        console.error('Meta tags update failed', err);
        alert(`Failed to save meta tags: ${err.error?.details || err.message || 'Unknown error'}`);
        this.saving.set(false);
      }
    });
  }

  isEssentialConflict(tag: any) {
    const key = `${String(tag?.keyType || '').toLowerCase()}:${String(tag?.key || '').toLowerCase()}`;
    return tag?.active !== false && this.essentialKeys.has(key);
  }

  private toEditable(tag: any) {
    const pages = Array.isArray(tag?.pages) ? tag.pages : ['/'];
    const isAll = pages.includes('*');
    const isHome = pages.length === 1 && pages[0] === '/';
    return {
      ...tag,
      pageScope: isAll ? '*' : isHome ? '/' : 'custom',
      customPagesRaw: pages.join(', '),
      attributesRaw: tag?.attributes ? JSON.stringify(tag.attributes) : ''
    };
  }

  private fromEditable(tag: any) {
    let pages: string[] = ['/'];
    if (tag.pageScope === '*') {
      pages = ['*'];
    } else if (tag.pageScope === 'custom') {
      pages = String(tag.customPagesRaw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (pages.length === 0) pages = ['/'];
    }

    let attributes = {};
    if (tag.attributesRaw) {
      try {
        const parsed = JSON.parse(tag.attributesRaw);
        attributes = typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        attributes = {};
      }
    }

    return {
      id: tag.id,
      keyType: tag.keyType,
      key: tag.key,
      content: tag.content,
      pages,
      active: tag.active !== false,
      attributes
    };
  }
}
