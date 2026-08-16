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

        <!-- Hero Background Configuration -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
          <h3 class="text-lg font-semibold mb-4">Hero Background Image</h3>
          <p class="text-sm text-gray-500 mb-6 font-medium">
            Set the background image for the homepage hero section.
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Background Image URL</label>
              <input 
                type="text" 
                [(ngModel)]="heroBackgroundUrl" 
                placeholder="https://example.com/hero-background.jpg"
                class="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            
            @if (heroBackgroundUrl) {
              <div class="border border-gray-200 rounded-lg overflow-hidden">
                <img 
                  [src]="heroBackgroundUrl" 
                  alt="Hero Background Preview"
                  class="w-full h-48 object-cover"
                />
                <p class="text-xs text-gray-500 p-2 bg-gray-50">Preview</p>
              </div>
            }
          </div>

          <div class="pt-6 border-t border-gray-100 mt-6">
            <button
              (click)="saveHeroBackground()"
              [disabled]="saving()"
              class="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
            >
              {{ saving() ? 'Saving...' : 'Update Hero Background' }}
            </button>
          </div>
        </div>

        <!-- Course Pop-up & Details Management Section -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold">Course Pop-Up & Details</h3>
              <p class="text-sm text-gray-500 font-medium">
                Manage the modal popup banner and course details shown to visitors.
              </p>
            </div>
            <label class="flex items-center gap-2 text-sm font-bold cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <input type="checkbox" [(ngModel)]="courseModal().enabled" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span>{{ courseModal().enabled ? 'Pop-up Active' : 'Pop-up Disabled' }}</span>
            </label>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Badge Text</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().badgeText" 
                  placeholder="e.g. Aviation Career Opportunity"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Display Delay (ms)</label>
                <input 
                  type="number" 
                  [(ngModel)]="courseModal().delayMs" 
                  placeholder="600"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Modal Title</label>
              <input 
                type="text" 
                [(ngModel)]="courseModal().title" 
                placeholder="e.g. Master GDS & Launch Your Aviation Career"
                class="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                rows="2"
                [(ngModel)]="courseModal().description" 
                placeholder="Course summary description..."
                class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Training Link URL</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().enrollUrl" 
                  placeholder="https://gds-training.vercel.app"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Primary CTA Button</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().primaryBtnText" 
                  placeholder="Enroll Now"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Secondary CTA Button</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().secondaryBtnText" 
                  placeholder="Learn GDS"
                  class="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Feature Highlights Cards -->
            <div class="mt-6 border-t border-gray-100 pt-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-bold text-gray-800">Feature Highlight Badges</h4>
                <button 
                  (click)="addCourseFeature()" 
                  class="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + Add Feature Badge
                </button>
              </div>
              <div class="space-y-3">
                @for (feature of courseModal().features; track $index) {
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg items-center">
                    <div class="sm:col-span-2">
                      <input 
                        type="text" 
                        [(ngModel)]="feature.icon" 
                        placeholder="Icon (e.g. ✈️)"
                        class="w-full p-2 text-center border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <input 
                        type="text" 
                        [(ngModel)]="feature.title" 
                        placeholder="Feature Title"
                        class="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div class="sm:col-span-4">
                      <input 
                        type="text" 
                        [(ngModel)]="feature.subtitle" 
                        placeholder="Subtitle"
                        class="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div class="sm:col-span-1 text-right">
                      <button 
                        (click)="removeCourseFeature($index)"
                        class="text-xs font-bold text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Detailed Course Information -->
            <div class="mt-6 border-t border-gray-100 pt-4">
              <h4 class="text-sm font-bold text-gray-800 mb-3">Course Full Details & Syllabus</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.duration" 
                    placeholder="e.g. 4 Weeks (Live Classes)"
                    class="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Fee & Discount Info</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.fee" 
                    placeholder="e.g. BDT 12,500 (20% Off)"
                    class="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Schedule</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.schedule" 
                    placeholder="e.g. Sat & Tue (8 PM - 10 PM)"
                    class="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Certification</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.certification" 
                    placeholder="e.g. Certified GDS Specialist"
                    class="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-semibold text-gray-600">Modules / Curriculum Points</label>
                  <button 
                    (click)="addCourseModule()" 
                    class="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    + Add Module
                  </button>
                </div>
                <div class="space-y-2">
                  @for (mod of courseModal().details.modules; track $index) {
                    <div class="flex gap-2 items-center">
                      <input 
                        type="text" 
                        [(ngModel)]="courseModal().details.modules[$index]" 
                        placeholder="Module details..."
                        class="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                      />
                      <button 
                        (click)="removeCourseModule($index)"
                        class="text-xs font-bold text-red-500 hover:text-red-700 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="pt-6 border-t border-gray-100 mt-6">
            <button
              (click)="saveCourseModal()"
              [disabled]="saving()"
              class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100 transition-all"
            >
              {{ saving() ? 'Saving Course Details...' : 'Update Course Configuration' }}
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
  heroBackgroundUrl = '';

  courseModal = signal<{
    enabled: boolean;
    badgeText: string;
    title: string;
    description: string;
    enrollUrl: string;
    primaryBtnText: string;
    secondaryBtnText: string;
    delayMs: number;
    features: Array<{ icon: string; title: string; subtitle: string }>;
    details: {
      duration: string;
      fee: string;
      schedule: string;
      certification: string;
      modules: string[];
    };
  }>({
    enabled: true,
    badgeText: 'Aviation Career Opportunity',
    title: 'Master GDS & Launch Your Aviation Career',
    description: 'Learn Sabre, Amadeus & Galileo Global Distribution Systems from industry experts. Become a certified GDS Ticketing & Reservation Specialist!',
    enrollUrl: 'https://gds-training.vercel.app',
    primaryBtnText: 'Enroll Now',
    secondaryBtnText: 'Learn GDS',
    delayMs: 600,
    features: [
      { icon: '✈️', title: 'Sabre & Amadeus', subtitle: 'Live Training' },
      { icon: '📜', title: 'Certification', subtitle: 'Industry Approved' },
      { icon: '💼', title: 'Job Placement', subtitle: 'OTA Support' }
    ],
    details: {
      duration: '4 Weeks (Live Online + Hands-on Practice)',
      fee: 'BDT 12,500 (Early Bird Discount)',
      schedule: 'Saturday & Tuesday (8:00 PM - 10:00 PM)',
      certification: 'Certified GDS Ticketing Specialist',
      modules: [
        'Sabre Red 360 Commands & PNR Creation',
        'Amadeus Selling Platform Connect & Fare Quote',
        'Ticket Issuance, Reissuance & Refund Procedures',
        'OTA System Integration & Real-time Booking Engine'
      ]
    }
  });

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
        if (data.heroBackground) this.heroBackgroundUrl = data.heroBackground;
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
      }
    });

    this.adminService.getCourseModalSettings().subscribe({
      next: (data) => {
        if (data && Object.keys(data).length > 0) {
          this.courseModal.set({
            enabled: data.enabled ?? true,
            badgeText: data.badgeText || 'Aviation Career Opportunity',
            title: data.title || 'Master GDS & Launch Your Aviation Career',
            description: data.description || 'Learn Sabre, Amadeus & Galileo Global Distribution Systems from industry experts. Become a certified GDS Ticketing & Reservation Specialist!',
            enrollUrl: data.enrollUrl || 'https://gds-training.vercel.app',
            primaryBtnText: data.primaryBtnText || 'Enroll Now',
            secondaryBtnText: data.secondaryBtnText || 'Learn GDS',
            delayMs: data.delayMs ?? 600,
            features: data.features || [
              { icon: '✈️', title: 'Sabre & Amadeus', subtitle: 'Live Training' },
              { icon: '📜', title: 'Certification', subtitle: 'Industry Approved' },
              { icon: '💼', title: 'Job Placement', subtitle: 'OTA Support' }
            ],
            details: data.details || {
              duration: '4 Weeks (Live Online + Hands-on Practice)',
              fee: 'BDT 12,500 (Early Bird Discount)',
              schedule: 'Saturday & Tuesday (8:00 PM - 10:00 PM)',
              certification: 'Certified GDS Ticketing Specialist',
              modules: [
                'Sabre Red 360 Commands & PNR Creation',
                'Amadeus Selling Platform Connect & Fare Quote',
                'Ticket Issuance, Reissuance & Refund Procedures',
                'OTA System Integration & Real-time Booking Engine'
              ]
            }
          });
        }
      },
      error: (err) => console.error('Error fetching course modal settings:', err)
    });
  }

  addCourseFeature() {
    const current = this.courseModal();
    current.features.push({ icon: '🎓', title: 'New Feature', subtitle: 'Details' });
    this.courseModal.set({ ...current });
  }

  removeCourseFeature(index: number) {
    const current = this.courseModal();
    current.features.splice(index, 1);
    this.courseModal.set({ ...current });
  }

  addCourseModule() {
    const current = this.courseModal();
    current.details.modules.push('New Course Module');
    this.courseModal.set({ ...current });
  }

  removeCourseModule(index: number) {
    const current = this.courseModal();
    current.details.modules.splice(index, 1);
    this.courseModal.set({ ...current });
  }

  saveCourseModal() {
    console.log('🎓 Saving course modal settings:', this.courseModal());
    this.saving.set(true);
    this.adminService.updateCourseModalSettings(this.courseModal()).subscribe({
      next: () => {
        alert('Course Pop-up & Details updated successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Failed to save course modal settings:', err);
        alert(`Failed to update course modal: ${err.error?.details || err.message || 'Unknown error'}`);
        this.saving.set(false);
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
    console.log('📸 Saving banners:', this.banners());
    this.saving.set(true);
    this.adminService.updateBanners(this.banners()).subscribe({
      next: (response) => {
        console.log('✅ Banner update response:', response);
        alert('Banners updated successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        console.error('❌ Banner update error:', err);
        console.error('Error details:', err.error);
        alert(`Failed to update banners: ${err.error?.details || err.message || 'Unknown error'}`);
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

  saveHeroBackground() {
    console.log('🖼️ Saving hero background:', this.heroBackgroundUrl);
    this.saving.set(true);
    this.adminService.updateHeroBackground(this.heroBackgroundUrl).subscribe({
      next: (response) => {
        console.log('✅ Hero background update response:', response);
        alert('Hero background updated successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        console.error('❌ Hero background update error:', err);
        alert(`Failed to update hero background: ${err.error?.details || err.message || 'Unknown error'}`);
        this.saving.set(false);
      }
    });
  }
}

