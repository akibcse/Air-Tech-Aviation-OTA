import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
            <h1 class="text-4xl md:text-5xl lg:text-[64px] font-black tracking-tight mb-8 leading-[1.1] max-w-4xl">
              Cheap Air Tickets in Bangladesh, <br class="hidden sm:block" />
              Booked Securely in Minutes.
            </h1>

            <p class="max-w-3xl text-base md:text-lg text-white/90 mb-8 font-medium">
              AirTech Aviation helps travelers in Dhaka and across Bangladesh compare fares and complete online air ticket booking for domestic and international flights.
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
}
