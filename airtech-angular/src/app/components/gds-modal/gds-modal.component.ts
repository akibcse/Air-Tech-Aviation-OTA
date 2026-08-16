import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VisitorTrackerService } from '../../services/visitor-tracker.service';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-gds-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && modalConfig.enabled && isHomepage()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
        <!-- Backdrop click listener -->
        <div class="fixed inset-0" (click)="closeModal()"></div>

        <!-- Modal Container (Mobile bottom sheet / Desktop centered dialog) -->
        <div class="relative w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transform transition-all duration-300 scale-100 animate-scale-up overflow-hidden z-10">
          
          <!-- Gradient Header -->
          <div class="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-5 py-5 sm:px-7 sm:py-6 text-white shrink-0">
            <!-- Background Orbs -->
            <div class="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl pointer-events-none"></div>
            <div class="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none"></div>
            
            <!-- Close Button with 44px+ tap target -->
            <button 
              type="button"
              (click)="closeModal()"
              class="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 rounded-full p-2.5 text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none touch-manipulation"
              aria-label="Close modal">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Badge -->
            <div class="inline-flex items-center gap-1.5 rounded-full bg-blue-500/25 border border-blue-400/30 px-3 py-1 text-[11px] sm:text-xs font-semibold text-blue-200 backdrop-blur-sm mb-2 sm:mb-3">
              <span class="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              {{ modalConfig.badgeText || 'Aviation Career Opportunity' }}
            </div>

            <!-- Modal Heading -->
            <h2 class="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight pr-6">
              {{ modalConfig.title || 'Master GDS & Launch Your Aviation Career' }}
            </h2>
            <p class="mt-1.5 sm:mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              {{ modalConfig.description || 'Learn Sabre, Amadeus & Galileo Global Distribution Systems from industry experts.' }}
            </p>
          </div>

          <!-- Modal Body with Smooth Touch Scrolling -->
          <div class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 bg-slate-50/70 scrollbar-thin">
            
            <!-- Feature Highlights Badges Grid -->
            @if (modalConfig.features && modalConfig.features.length > 0) {
              <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                @for (feat of modalConfig.features; track $index) {
                  <div class="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs text-center transition-all hover:border-blue-200">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-1">
                      {{ feat.icon || '✈️' }}
                    </div>
                    <span class="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight line-clamp-1">{{ feat.title }}</span>
                    <span class="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{{ feat.subtitle }}</span>
                  </div>
                }
              </div>
            }

            <!-- Expandable Detailed Course Info Accordion -->
            <div class="mb-4 sm:mb-5 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <button 
                type="button"
                (click)="toggleDetails()"
                class="w-full px-4 py-3 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <span class="flex items-center gap-2">
                  <span class="text-blue-600">📘</span>
                  Course Syllabus & Full Details
                </span>
                <span class="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  {{ showDetails ? 'Hide' : 'View Syllabus' }}
                  <svg [class.rotate-180]="showDetails" class="w-4 h-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              @if (showDetails && modalConfig.details) {
                <div class="p-4 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs text-slate-700 animate-fade-in">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div class="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Duration</span>
                      <span class="font-semibold text-slate-800">{{ modalConfig.details.duration }}</span>
                    </div>
                    <div class="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Course Fee</span>
                      <span class="font-semibold text-emerald-700">{{ modalConfig.details.fee }}</span>
                    </div>
                    <div class="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Schedule</span>
                      <span class="font-semibold text-slate-800">{{ modalConfig.details.schedule }}</span>
                    </div>
                    <div class="bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span class="block text-[10px] uppercase font-bold text-slate-400">Certification</span>
                      <span class="font-semibold text-indigo-700">{{ modalConfig.details.certification }}</span>
                    </div>
                  </div>

                  @if (modalConfig.details.modules && modalConfig.details.modules.length > 0) {
                    <div class="bg-white p-3 rounded-lg border border-slate-200/60">
                      <span class="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Key Curriculum Modules</span>
                      <ul class="space-y-1">
                        @for (module of modalConfig.details.modules; track $index) {
                          <li class="flex items-start gap-2 text-xs text-slate-700">
                            <span class="text-blue-500 font-bold">•</span>
                            <span>{{ module }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Email Capture Input -->
            <div class="mb-4 sm:mb-5 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">
                Get Syllabus PDF & Discount Offers
              </label>
              <input 
                type="email" 
                [(ngModel)]="userEmail"
                placeholder="Enter your email address" 
                class="w-full px-3 py-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white"
              />
            </div>

            <!-- Action CTAs (Stacked on Mobile, Row on Desktop) -->
            <div class="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <a 
                [href]="modalConfig.enrollUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                (click)="onEnrollClick()"
                class="flex-1 inline-flex items-center justify-center px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all transform active:scale-98 touch-manipulation">
                <span>{{ modalConfig.primaryBtnText || 'Enroll Now' }}</span>
                <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a 
                [href]="modalConfig.enrollUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                (click)="onLearnMoreClick()"
                class="inline-flex items-center justify-center px-5 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors touch-manipulation">
                {{ modalConfig.secondaryBtnText || 'Learn GDS' }}
              </a>
            </div>

            <p class="mt-3 sm:mt-4 text-center text-[10px] sm:text-[11px] text-slate-400">
              Visit <a [href]="modalConfig.enrollUrl" target="_blank" class="underline hover:text-slate-600 font-medium">gds-training.vercel.app</a> for schedules & registration.
            </p>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .overscroll-contain {
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
    }
    .touch-manipulation {
      touch-action: manipulation;
    }
  `]
})
export class GdsModalComponent implements OnInit {
  isOpen = false;
  showDetails = false;
  userEmail = '';

  modalConfig = {
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
  };

  private visitorTracker = inject(VisitorTrackerService);
  private publicService = inject(PublicService);
  private router = inject(Router);

  isHomepage(): boolean {
    const rawUrl = this.router.url || '';
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    return cleanUrl === '/' || cleanUrl === '';
  }

  ngOnInit(): void {
    if (!this.isHomepage()) {
      return;
    }

    this.publicService.getCourseModalSettings().subscribe({
      next: (data) => {
        if (data && Object.keys(data).length > 0) {
          this.modalConfig = {
            enabled: data.enabled ?? true,
            badgeText: data.badgeText || this.modalConfig.badgeText,
            title: data.title || this.modalConfig.title,
            description: data.description || this.modalConfig.description,
            enrollUrl: data.enrollUrl || this.modalConfig.enrollUrl,
            primaryBtnText: data.primaryBtnText || this.modalConfig.primaryBtnText,
            secondaryBtnText: data.secondaryBtnText || this.modalConfig.secondaryBtnText,
            delayMs: data.delayMs ?? this.modalConfig.delayMs,
            features: data.features || this.modalConfig.features,
            details: data.details || this.modalConfig.details
          };
        }

        if (this.modalConfig.enabled && this.isHomepage()) {
          setTimeout(() => {
            if (this.isHomepage()) {
              this.isOpen = true;
              this.visitorTracker.trackVisitor('gds_modal_impression');
            }
          }, this.modalConfig.delayMs || 600);
        }
      },
      error: (err) => {
        console.warn('Using default course modal settings:', err);
        if (this.modalConfig.enabled && this.isHomepage()) {
          setTimeout(() => {
            if (this.isHomepage()) {
              this.isOpen = true;
              this.visitorTracker.trackVisitor('gds_modal_impression');
            }
          }, 600);
        }
      }
    });
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  closeModal(): void {
    this.isOpen = false;
    if (this.userEmail) {
      this.visitorTracker.trackVisitor('gds_modal_close_with_email', this.userEmail);
    }
  }

  onEnrollClick(): void {
    if (this.userEmail) {
      localStorage.setItem('user_email', this.userEmail);
    }
    this.visitorTracker.trackVisitor('gds_modal_click_enroll', this.userEmail);
    this.closeModal();
  }

  onLearnMoreClick(): void {
    if (this.userEmail) {
      localStorage.setItem('user_email', this.userEmail);
    }
    this.visitorTracker.trackVisitor('gds_modal_click_learn', this.userEmail);
    this.closeModal();
  }
}

