import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 max-w-2xl text-gray-900">
      <h2 class="text-2xl font-bold mb-6">System Configuration</h2>

      @if (loading()) {
        <div class="p-6 text-gray-500 font-bold">Loading settings...</div>
      } @else {
        <!-- Aviation Provider Section -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 class="text-lg font-semibold mb-4">Aviation Data Provider</h3>
          <p class="text-sm text-gray-500 mb-6 font-medium">
            Select the active API provider for all search and booking operations.
          </p>

          <div class="space-y-4">
            <div 
              (click)="provider.set('AMADEUS')"
              [class]="'flex items-center space-x-3 p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-all ' + 
                       (provider() === 'AMADEUS' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200')"
            >
              <input type="radio" [checked]="provider() === 'AMADEUS'" class="h-5 w-5 text-blue-600" />
              <div>
                <span class="font-bold block">Amadeus API</span>
                <span class="text-xs text-gray-500">Real-time GDS data, standardized offers</span>
              </div>
            </div>

            <div 
              (click)="provider.set('AVIATIONSTACK')"
              [class]="'flex items-center space-x-3 p-4 border rounded-md hover:bg-gray-50 cursor-pointer transition-all ' + 
                       (provider() === 'AVIATIONSTACK' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-gray-200')"
            >
              <input type="radio" [checked]="provider() === 'AVIATIONSTACK'" class="h-5 w-5 text-blue-600" />
              <div>
                <span class="font-bold block">Aviationstack API</span>
                <span class="text-xs text-gray-500">Global coverage, estimated pricing logic</span>
              </div>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-gray-100">
            <button
              (click)="saveProvider()"
              [disabled]="saving()"
              class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
            >
              {{ saving() ? 'Saving Configuration...' : 'Switch Provider' }}
            </button>
          </div>
        </div>

        <!-- Markup Section -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 class="text-lg font-semibold mb-4">Pricing Markup</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Markup Type</label>
              <select [(ngModel)]="markup.type" class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (BDT)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Value</label>
              <input type="number" [(ngModel)]="markup.value" class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="mt-8 pt-6 border-t border-gray-100">
            <button
              (click)="savePricing()"
              [disabled]="saving()"
              class="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-100 transition-all font-bold"
            >
              Update Pricing Policy
            </button>
          </div>
        </div>

        <!-- Banner Management Section -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
          <h3 class="text-lg font-semibold mb-4">Homepage Banners</h3>
          <p class="text-sm text-gray-500 mb-6 font-medium">
            Manage banner slides displayed on the homepage. Banners are displayed in order.
          </p>

          <div class="space-y-4 mb-6">
            @for (banner of banners(); track $index) {
              <div class="border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                <div class="flex-1 space-y-2">
                  <input 
                    type="text" 
                    [(ngModel)]="banner.imageUrl" 
                    placeholder="Image URL"
                    class="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <div class="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      [(ngModel)]="banner.title" 
                      placeholder="Title (optional)"
                      class="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input 
                      type="text" 
                      [(ngModel)]="banner.link" 
                      placeholder="Link URL (optional)"
                      class="p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" [(ngModel)]="banner.active" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    Active
                  </label>
                  <button 
                    (click)="removeBanner($index)"
                    class="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            }
          </div>

          <button
            (click)="addBanner()"
            class="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-bold hover:border-blue-500 hover:text-blue-600 transition-all mb-4"
          >
            + Add Banner
          </button>

          <div class="pt-6 border-t border-gray-100">
            <button
              (click)="saveBanners()"
              [disabled]="saving()"
              class="px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-100 transition-all"
            >
              {{ saving() ? 'Saving Banners...' : 'Update Banners' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminSystemSettingsComponent implements OnInit {
  private adminService = inject(AdminService);

  provider = signal<'AMADEUS' | 'AVIATIONSTACK'>('AMADEUS');
  markup = { type: 'percentage', value: 0 };
  banners = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);

  ngOnInit() {
    this.adminService.getSettings().subscribe({
      next: (data) => {
        if (data.aviation_provider) this.provider.set(data.aviation_provider.active);
        if (data.pricing) this.markup = data.pricing;
        if (data.banners && Array.isArray(data.banners)) {
          this.banners.set(data.banners.map((b: any, i: number) => ({ ...b, order: i })));
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });
  }

  addBanner() {
    const newBanner = {
      imageUrl: '',
      title: '',
      subtitle: '',
      link: '',
      active: true,
      order: this.banners().length
    };
    this.banners.set([...this.banners(), newBanner]);
  }

  removeBanner(index: number) {
    const updated = this.banners().filter((_, i) => i !== index);
    this.banners.set(updated.map((b, i) => ({ ...b, order: i })));
  }

  saveBanners() {
    this.saving.set(true);
    this.adminService.updateBanners(this.banners()).subscribe({
      next: () => {
        alert('Banners updated successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        alert('Failed to update banners.');
        this.saving.set(false);
      }
    });
  }

  saveProvider() {
    this.saving.set(true);
    this.adminService.updateAviationProvider({ active: this.provider() }).subscribe({
      next: () => {
        alert("Provider updated successfully!");
        this.saving.set(false);
      },
      error: (err) => {
        alert("Failed to update provider.");
        this.saving.set(false);
      }
    });
  }

  savePricing() {
    this.saving.set(true);
    this.adminService.updatePricing(this.markup).subscribe({
      next: () => {
        alert("Pricing policy updated successfully!");
        this.saving.set(false);
      },
      error: (err) => {
        alert("Failed to update pricing.");
        this.saving.set(false);
      }
    });
  }
}
