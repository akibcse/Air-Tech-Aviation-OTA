import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitorTrackerService } from '../../services/visitor-tracker.service';

@Component({
  selector: 'app-gds-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/75 backdrop-blur-md transition-opacity duration-300 animate-fade-in">
        <!-- Backdrop click listener -->
        <div class="fixed inset-0" (click)="closeModal()"></div>

        <!-- Modal Container -->
        <div class="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transform transition-all duration-300 scale-100 animate-scale-up">
          
          <!-- Gradient Header & Decorative Elements -->
          <div class="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 px-6 pt-8 pb-10 text-white overflow-hidden">
            <!-- Background Orbs -->
            <div class="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl"></div>
            <div class="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-indigo-500/20 blur-xl"></div>
            
            <!-- Close Button -->
            <button 
              type="button"
              (click)="closeModal()"
              class="absolute top-4 right-4 z-10 rounded-full p-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
              aria-label="Close modal">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Badge -->
            <div class="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-sm mb-3">
              <span class="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
              Aviation Career Opportunity
            </div>

            <!-- Modal Heading -->
            <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Master GDS & Launch Your Aviation Career
            </h2>
            <p class="mt-2 text-sm text-blue-100/90 leading-relaxed">
              Learn Sabre, Amadeus & Galileo Global Distribution Systems from industry experts. Become a certified GDS Ticketing & Reservation Specialist!
            </p>
          </div>

          <!-- Modal Body & Content -->
          <div class="p-6 sm:p-8 bg-slate-50/50">
            <!-- Feature Highlights -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div class="flex flex-col items-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs mb-1.5">
                  ✈️
                </div>
                <span class="text-xs font-bold text-slate-800">Sabre & Amadeus</span>
                <span class="text-[10px] text-slate-500">Live Training</span>
              </div>
              <div class="flex flex-col items-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs mb-1.5">
                  📜
                </div>
                <span class="text-xs font-bold text-slate-800">Certification</span>
                <span class="text-[10px] text-slate-500">Industry Approved</span>
              </div>
              <div class="flex flex-col items-center p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs mb-1.5">
                  💼
                </div>
                <span class="text-xs font-bold text-slate-800">Job Placement</span>
                <span class="text-[10px] text-slate-500">OTA Support</span>
              </div>
            </div>

            <!-- Optional Email Capture Form -->
            <div class="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">
                Receive Course Details & Discount Offers
              </label>
              <div class="flex gap-2">
                <input 
                  type="email" 
                  [(ngModel)]="userEmail"
                  placeholder="Enter your email address" 
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                />
              </div>
            </div>

            <!-- Action CTAs -->
            <div class="flex flex-col sm:flex-row gap-3">
              <a 
                [href]="trainingUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                (click)="onEnrollClick()"
                class="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                <span>Enroll Now</span>
                <svg class="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a 
                [href]="trainingUrl" 
                target="_blank" 
                rel="noopener noreferrer"
                (click)="onLearnMoreClick()"
                class="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors">
                Learn GDS
              </a>
            </div>

            <p class="mt-4 text-center text-[11px] text-slate-400">
              Visit <a [href]="trainingUrl" target="_blank" class="underline hover:text-slate-600">gds-training.vercel.app</a> to explore modules & schedule.
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
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class GdsModalComponent implements OnInit {
  isOpen = false;
  trainingUrl = 'https://gds-training.vercel.app';
  userEmail = '';

  private visitorTracker = inject(VisitorTrackerService);

  ngOnInit(): void {
    // Open modal every time page/homepage loads
    setTimeout(() => {
      this.isOpen = true;
      this.visitorTracker.trackVisitor('gds_modal_impression');
    }, 600);
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
