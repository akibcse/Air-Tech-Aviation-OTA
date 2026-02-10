import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';
import { LucideAngularModule, Globe, Hotel, Car, ChevronLeft, ChevronRight } from 'lucide-angular';
import { PublicService } from '../../services/public.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, LucideAngularModule],
  template: `
    <main class="min-h-screen bg-gray-100">
      <!-- Hero -->
      <app-hero></app-hero>

      <!-- Secondary Navigation / Quick Links -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 py-4 flex gap-4 overflow-x-auto scrollbar-hide">
          <button class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="hotelIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Hotels
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="carIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Car Hire
          </button>
          <button class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="globeIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Explore everywhere
          </button>
        </div>
      </div>

      <!-- Dynamic Banner Carousel -->
      @if (banners().length > 0) {
        <div class="relative bg-white border-b border-gray-200 overflow-hidden">
          <div class="max-w-7xl mx-auto">
            <div class="relative h-64 md:h-96">
              @for (banner of banners(); track $index) {
                @if ($index === currentBannerIndex()) {
                  <div class="absolute inset-0 transition-opacity duration-500">
                    <img 
                      [src]="banner.imageUrl" 
                      [alt]="banner.title || 'Banner'"
                      class="w-full h-full object-cover"
                    />
                    @if (banner.title || banner.subtitle) {
                      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div class="p-8 text-white">
                          @if (banner.title) {
                            <h2 class="text-3xl font-bold mb-2">{{ banner.title }}</h2>
                          }
                          @if (banner.subtitle) {
                            <p class="text-lg">{{ banner.subtitle }}</p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              }
              
              <!-- Navigation Arrows -->
              @if (banners().length > 1) {
                <button 
                  (click)="previousBanner()"
                  class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                >
                  <lucide-icon [name]="chevronLeftIcon" class="w-5 h-5 text-gray-900"></lucide-icon>
                </button>
                <button 
                  (click)="nextBanner()"
                  class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                >
                  <lucide-icon [name]="chevronRightIcon" class="w-5 h-5 text-gray-900"></lucide-icon>
                </button>

                <!-- Dots Indicator -->
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  @for (banner of banners(); track $index) {
                    <button 
                      (click)="currentBannerIndex.set($index)"
                      [class]="'w-2 h-2 rounded-full transition-all ' + ($index === currentBannerIndex() ? 'bg-white w-6' : 'bg-white/50')"
                    ></button>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div class="bg-white p-8 md:p-12 rounded-xl text-center shadow-sm border border-gray-100">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Ready to fly?</h2>
          <p class="text-gray-600">Start your search above to find the best deals on flights worldwide.</p>
        </div>

        <section id="hotels" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between gap-4 mb-3">
            <h3 class="text-lg font-bold text-gray-900">Hotels</h3>
            <span class="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          <p class="text-sm text-gray-600">Plan complete trips with stays near airports and city centers. Hotel search will be available shortly.</p>
        </section>

        <section id="cars" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div class="flex items-center justify-between gap-4 mb-3">
            <h3 class="text-lg font-bold text-gray-900">Car Hire</h3>
            <span class="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Coming Soon</span>
          </div>
          <p class="text-sm text-gray-600">Pick up and drop off rentals from major airports. Car hire integration is in progress.</p>
        </section>
      </div>
    </main>
  `
})
export class HomeComponent implements OnInit {
  private publicService = inject(PublicService);

  hotelIcon = Hotel;
  carIcon = Car;
  globeIcon = Globe;
  chevronLeftIcon = ChevronLeft;
  chevronRightIcon = ChevronRight;

  banners = signal<any[]>([]);
  currentBannerIndex = signal(0);
  private bannerInterval: any;

  ngOnInit() {
    this.publicService.getBanners().subscribe({
      next: (data) => {
        this.banners.set(data);
        if (data.length > 1) {
          this.startAutoRotate();
        }
      },
      error: (err) => console.error('Failed to load banners', err)
    });
  }

  ngOnDestroy() {
    if (this.bannerInterval) {
      clearInterval(this.bannerInterval);
    }
  }

  startAutoRotate() {
    this.bannerInterval = setInterval(() => {
      this.nextBanner();
    }, 5000);
  }

  nextBanner() {
    const next = (this.currentBannerIndex() + 1) % this.banners().length;
    this.currentBannerIndex.set(next);
  }

  previousBanner() {
    const prev = (this.currentBannerIndex() - 1 + this.banners().length) % this.banners().length;
    this.currentBannerIndex.set(prev);
  }
}
