import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchTabsComponent } from '../search-tabs/search-tabs.component';
import { FlightSearchFormComponent } from '../flight-search-form/flight-search-form.component';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, SearchTabsComponent, FlightSearchFormComponent],
  template: `
    <div class="relative bg-[#000000] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
      <!-- Dynamic Background Image -->
      <div
        class="absolute inset-0 z-0 opacity-50 bg-cover bg-center"
        [style.background-image]="'url(' + backgroundUrl() + ')'"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20 z-0"></div>

      <div class="relative z-10 max-w-[1248px] mx-auto">
        @if (!introBelowSearch()) {
          <div class="transition-all duration-500 ease-out" [class.opacity-0]="!introVisible()" [class.-translate-y-2]="!introVisible()">
            <!-- Branding Badge -->
            <div class="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 px-3 py-1.5 rounded-full mb-6">
              <span class="flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span class="text-xs md:text-sm font-bold text-blue-100 tracking-wide uppercase">
                Bangladesh's First AI Flight Booking App
              </span>
            </div>

            <h1 class="text-4xl md:text-5xl lg:text-[64px] font-black tracking-tight mb-8 leading-[1.1] max-w-4xl">
              Cheap Air Tickets in Bangladesh, <br class="hidden sm:block" />
              Booked Securely in Minutes.
            </h1>

            <p class="max-w-3xl text-base md:text-lg text-white/90 mb-8 font-medium">
              AirTech Aviation brings you <strong>Bangladesh's First AI Flight Booking App</strong>, made by <strong>Md. Akib Hasan</strong>, an Aviation Trainer and GDS Expert. Compare fares and complete online air ticket booking for domestic and international flights in minutes.
            </p>
          </div>
        }

        <!-- Search Container -->
        <div id="flight-search-section" class="bg-white/10 backdrop-blur-md p-2 rounded-t-xl inline-block">
          <app-search-tabs [activeTab]="activeTab()" (onChange)="activeTab.set($event)"></app-search-tabs>
        </div>

        <div class="bg-white rounded-b-xl rounded-tr-xl p-6 shadow-2xl">
          @if (activeTab() === 'flights') {
            <app-flight-search-form></app-flight-search-form>
          }
          @if (activeTab() === 'hotels') {
            <div class="text-gray-800 p-8 text-center font-medium">Hotel search coming soon!</div>
          }
          @if (activeTab() === 'cars') {
            <div class="text-gray-800 p-8 text-center font-medium">Car Hire search coming soon!</div>
          }
        </div>

        <!-- AI Assistant CTA (Hidden on mobile to keep original layout, users have bottom nav) -->
        <div class="hidden md:flex mt-6 items-center justify-center gap-3">
          <div class="h-px w-16 bg-white/20"></div>
          <button
            (click)="openAiChat()"
            id="open-ai-chat-btn"
            class="group inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 hover:border-white/50 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 shadow-sm text-white text-xs group-hover:scale-110 transition-transform">
              ✦
            </span>
            Book with AI — just describe your trip
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
              class="opacity-60 group-hover:translate-x-0.5 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          <div class="h-px w-16 bg-white/20"></div>
        </div>

        @if (introBelowSearch()) {
          <div class="mt-8 transition-all duration-500 ease-out" [class.opacity-0]="!introVisible()" [class.translate-y-2]="!introVisible()">
            <h1 class="text-4xl md:text-5xl lg:text-[64px] font-black tracking-tight mb-8 leading-[1.1] max-w-4xl">
              Cheap Air Tickets in Bangladesh, <br class="hidden sm:block" />
              Booked Securely in Minutes.
            </h1>

            <p class="max-w-3xl text-base md:text-lg text-white/90 mb-8 font-medium">
              AirTech Aviation helps travelers in Dhaka and across Bangladesh compare fares and complete online air ticket booking for domestic and international flights.
            </p>
          </div>
        }

      </div>
    </div>
  `
})
export class HeroComponent implements OnInit, OnDestroy {
  private publicService = inject(PublicService);
  private router = inject(Router);
  private moveIntroTimerId: ReturnType<typeof setTimeout> | null = null;
  private placeIntroBelowTimerId: ReturnType<typeof setTimeout> | null = null;
  private showIntroTimerId: ReturnType<typeof setTimeout> | null = null;

  activeTab = signal<'flights' | 'hotels' | 'cars'>('flights');
  backgroundUrl = signal('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop');
  introBelowSearch = signal(false);
  introVisible = signal(true);

  ngOnInit() {
    this.publicService.getHeroBackground().subscribe({
      next: (url) => {
        if (url) this.backgroundUrl.set(url);
      },
      error: (err) => console.error('Failed to load hero background', err)
    });

    this.moveIntroTimerId = setTimeout(() => {
      this.introVisible.set(false);

      this.placeIntroBelowTimerId = setTimeout(() => {
        this.introBelowSearch.set(true);

        this.showIntroTimerId = setTimeout(() => {
          this.introVisible.set(true);
        }, 50);
      }, 500);
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.moveIntroTimerId) {
      clearTimeout(this.moveIntroTimerId);
      this.moveIntroTimerId = null;
    }

    if (this.placeIntroBelowTimerId) {
      clearTimeout(this.placeIntroBelowTimerId);
      this.placeIntroBelowTimerId = null;
    }

    if (this.showIntroTimerId) {
      clearTimeout(this.showIntroTimerId);
      this.showIntroTimerId = null;
    }
  }

  openAiChat() {
    this.router.navigate(['/chat']);
  }
}
