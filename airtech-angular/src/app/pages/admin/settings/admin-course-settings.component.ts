import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-course-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-8 max-w-4xl text-gray-900">
      <div class="mb-6">
        <h2 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Course Pop-Up & Details Management</h2>
        <p class="text-sm text-gray-500 font-medium mt-1">
          Manage the popup banner modal, training link, and full course syllabus shown to homepage visitors.
        </p>
      </div>

      @if (loading()) {
        <div class="p-8 text-center text-gray-500 font-bold bg-white rounded-2xl shadow-sm border border-gray-200">
          Loading course configuration...
        </div>
      } @else {
        <div class="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          
          <!-- Header Bar with Toggle Switch -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h3 class="text-base font-bold text-slate-900">Modal Pop-Up Status</h3>
              <p class="text-xs text-slate-500">Enable or disable the course modal from opening on the homepage.</p>
            </div>
            <label class="inline-flex items-center gap-3 cursor-pointer select-none">
              <span class="text-xs font-bold" [class.text-emerald-600]="courseModal().enabled" [class.text-slate-400]="!courseModal().enabled">
                {{ courseModal().enabled ? 'Pop-up Active' : 'Pop-up Disabled' }}
              </span>
              <input 
                type="checkbox" 
                [(ngModel)]="courseModal().enabled" 
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
              />
            </label>
          </div>

          <!-- Basic Info Fields -->
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Badge Text</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().badgeText" 
                  placeholder="e.g. Aviation Career Opportunity"
                  class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Display Delay (ms)</label>
                <input 
                  type="number" 
                  [(ngModel)]="courseModal().delayMs" 
                  placeholder="600"
                  class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Modal Title</label>
              <input 
                type="text" 
                [(ngModel)]="courseModal().title" 
                placeholder="e.g. Master GDS & Launch Your Aviation Career"
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                rows="2"
                [(ngModel)]="courseModal().description" 
                placeholder="Course summary description..."
                class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Training Link URL</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().enrollUrl" 
                  placeholder="https://gds-training.vercel.app"
                  class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Primary CTA Button</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().primaryBtnText" 
                  placeholder="Enroll Now"
                  class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">Secondary CTA Button</label>
                <input 
                  type="text" 
                  [(ngModel)]="courseModal().secondaryBtnText" 
                  placeholder="Learn GDS"
                  class="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <!-- Feature Highlight Badges -->
            <div class="mt-6 border-t border-gray-100 pt-6">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <h4 class="text-sm font-bold text-slate-900">Feature Highlight Badges</h4>
                  <p class="text-xs text-gray-500">Key feature highlights displayed in the modal card grid.</p>
                </div>
                <button 
                  (click)="addCourseFeature()" 
                  class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  + Add Feature
                </button>
              </div>

              <div class="space-y-3">
                @for (feature of courseModal().features; track $index) {
                  <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl items-center">
                    <div class="sm:col-span-2">
                      <label class="block sm:hidden text-[10px] font-bold text-gray-500 mb-0.5">Icon</label>
                      <input 
                        type="text" 
                        [(ngModel)]="feature.icon" 
                        placeholder="Icon (✈️)"
                        class="w-full p-2 text-center border border-gray-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div class="sm:col-span-5">
                      <label class="block sm:hidden text-[10px] font-bold text-gray-500 mb-0.5">Title</label>
                      <input 
                        type="text" 
                        [(ngModel)]="feature.title" 
                        placeholder="Feature Title"
                        class="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div class="sm:col-span-4">
                      <label class="block sm:hidden text-[10px] font-bold text-gray-500 mb-0.5">Subtitle</label>
                      <input 
                        type="text" 
                        [(ngModel)]="feature.subtitle" 
                        placeholder="Subtitle"
                        class="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div class="sm:col-span-1 text-right">
                      <button 
                        (click)="removeCourseFeature($index)"
                        class="p-2 text-xs font-bold text-red-500 hover:text-red-700"
                        title="Remove feature"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Detailed Course Syllabus -->
            <div class="mt-6 border-t border-gray-100 pt-6">
              <h4 class="text-sm font-bold text-slate-900 mb-1">Course Full Details & Syllabus</h4>
              <p class="text-xs text-gray-500 mb-4">Detailed course information rendered inside the expandable syllabus accordion.</p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.duration" 
                    placeholder="e.g. 4 Weeks (Live Classes)"
                    class="w-full p-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Fee & Discount Info</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.fee" 
                    placeholder="e.g. BDT 12,500 (20% Off)"
                    class="w-full p-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Schedule</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.schedule" 
                    placeholder="e.g. Sat & Tue (8 PM - 10 PM)"
                    class="w-full p-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Certification</label>
                  <input 
                    type="text" 
                    [(ngModel)]="courseModal().details.certification" 
                    placeholder="e.g. Certified GDS Specialist"
                    class="w-full p-2.5 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-xs font-bold text-slate-800">Modules / Curriculum Points</label>
                  <button 
                    (click)="addCourseModule()" 
                    class="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100"
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
                        class="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm"
                      />
                      <button 
                        (click)="removeCourseModule($index)"
                        class="p-2 text-xs font-bold text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="pt-6 border-t border-gray-100">
            <button
              (click)="saveCourseModal()"
              [disabled]="saving()"
              class="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all text-sm"
            >
              {{ saving() ? 'Saving Course Details...' : 'Save & Publish Course Pop-Up' }}
            </button>
          </div>

        </div>
      }
    </div>
  `
})
export class AdminCourseSettingsComponent implements OnInit {
  private adminService = inject(AdminService);

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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching course modal settings:', err);
        this.loading.set(false);
      }
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
        alert('Course Pop-Up & Details updated successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Failed to save course modal settings:', err);
        alert(`Failed to update course modal: ${err.error?.details || err.message || 'Unknown error'}`);
        this.saving.set(false);
      }
    });
  }
}
