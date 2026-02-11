import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';
import { LucideAngularModule, Globe, Hotel, Car, ChevronLeft, ChevronRight } from 'lucide-angular';
import { PublicService } from '../../services/public.service';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, LucideAngularModule, RouterLink],
  template: `
    <main class="min-h-screen bg-gray-100">
      <!-- Hero -->
      <app-hero></app-hero>

      <!-- Secondary Navigation / Quick Links -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 py-4 flex gap-4 overflow-x-auto scrollbar-hide">
          <a routerLink="/search" class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="hotelIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Flight Search
          </a>
          <a routerLink="/" fragment="popular-routes" class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="carIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Popular Routes
          </a>
          <a routerLink="/support" class="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 whitespace-nowrap transition-colors border border-gray-200">
            <lucide-icon [name]="globeIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Support Team
          </a>
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
                      [alt]="banner.title || 'Cheap flight offers from Bangladesh with AirTech Aviation'"
                      loading="lazy"
                      decoding="async"
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
        <section class="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-2xl md:text-3xl font-black text-gray-900 mb-3">Online Air Ticket Booking in Bangladesh</h2>
          <p class="text-gray-700 leading-relaxed">
            AirTech Aviation is an airline ticket booking website in Bangladesh built for fast fare comparison, secure checkout, and responsive support. Travelers in Dhaka and nationwide can book cheap air tickets for business, family, or holiday trips through one reliable platform.
          </p>
        </section>

        <section class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-4">Why Book with AirTech Aviation</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">Secure online payment flow</div>
            <div class="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">Instant booking confirmation</div>
            <div class="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Dedicated refund assistance</div>
            <div class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">Bangladesh-focused traveler support</div>
          </div>
        </section>

        <section id="popular-routes" class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-2">Cheap Flights from Bangladesh</h2>
          <p class="text-sm text-gray-600 mb-5">Popular flight booking searches from Dhaka and major Bangladesh departure points.</p>
          <div class="grid md:grid-cols-2 gap-3">
            <a routerLink="/search" [queryParams]="{ tripType: 'one-way', origin: 'DAC', destination: 'DXB', adults: 1, children: 0, cabin: 'ECONOMY' }" class="rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <h3 class="font-bold text-gray-900">Air ticket Dhaka to Dubai</h3>
              <p class="text-sm text-gray-600">Compare international fares and departure times quickly.</p>
            </a>
            <a routerLink="/search" [queryParams]="{ tripType: 'one-way', origin: 'DAC', destination: 'KUL', adults: 1, children: 0, cabin: 'ECONOMY' }" class="rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <h3 class="font-bold text-gray-900">Dhaka to Kuala Lumpur flights</h3>
              <p class="text-sm text-gray-600">Find affordable tickets for work and family trips.</p>
            </a>
            <a routerLink="/search" [queryParams]="{ tripType: 'one-way', origin: 'DAC', destination: 'CGP', adults: 1, children: 0, cabin: 'ECONOMY' }" class="rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <h3 class="font-bold text-gray-900">Domestic flights in Bangladesh</h3>
              <p class="text-sm text-gray-600">Search domestic routes with transparent pricing.</p>
            </a>
            <a routerLink="/search" [queryParams]="{ tripType: 'one-way', origin: 'DAC', destination: 'JED', adults: 1, children: 0, cabin: 'ECONOMY' }" class="rounded-lg border border-gray-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <h3 class="font-bold text-gray-900">Dhaka to Jeddah international booking</h3>
              <p class="text-sm text-gray-600">Book international flight tickets from Bangladesh online.</p>
            </a>
          </div>
        </section>

        <section class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-2">International & Domestic Airlines</h2>
          <p class="text-sm text-gray-600 mb-4">AirTech Aviation works with leading carriers for international and domestic travel options.</p>
          <div class="flex flex-wrap gap-2">
            @for (airline of partnerAirlines; track airline) {
              <span class="text-xs font-bold uppercase tracking-wide text-gray-700 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">{{ airline }}</span>
            }
          </div>
        </section>

        <section class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-3">Secure Online Flight Booking</h2>
          <p class="text-gray-700 mb-4">From search to payment, our booking flow is designed for speed, security, and confidence.</p>
          <ul class="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
            <li class="rounded-lg border border-gray-200 px-3 py-2">Encrypted checkout and verified payment steps</li>
            <li class="rounded-lg border border-gray-200 px-3 py-2">Clear fare details before payment confirmation</li>
            <li class="rounded-lg border border-gray-200 px-3 py-2">Post-booking support for schedule changes</li>
            <li class="rounded-lg border border-gray-200 px-3 py-2">Assistance for cancellation and refund requests</li>
          </ul>
        </section>

        <section class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-3">Start Your Booking</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <a routerLink="/search" class="rounded-lg border border-gray-200 px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <h3 class="font-bold text-gray-900">Flight Search Page</h3>
              <p class="text-gray-600 mt-1">Find the cheapest flight tickets instantly.</p>
            </a>
            <a routerLink="/" fragment="popular-routes" class="rounded-lg border border-gray-200 px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <h3 class="font-bold text-gray-900">Popular Routes</h3>
              <p class="text-gray-600 mt-1">Explore high-demand routes from Bangladesh.</p>
            </a>
            <a routerLink="/my-bookings" class="rounded-lg border border-gray-200 px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <h3 class="font-bold text-gray-900">Booking History</h3>
              <p class="text-gray-600 mt-1">Review your previous and active bookings.</p>
            </a>
            <a routerLink="/support" class="rounded-lg border border-gray-200 px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <h3 class="font-bold text-gray-900">Support Page</h3>
              <p class="text-gray-600 mt-1">Get help from our customer care team.</p>
            </a>
          </div>
        </section>

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

        <section class="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-xl md:text-2xl font-black text-gray-900 mb-2">AirTech Aviation Bangladesh Contact</h2>
          <p class="text-sm text-gray-600">Serving travelers in Dhaka and across Bangladesh for fast and secure online airline ticket booking support.</p>
          <div class="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
            <a href="mailto:roadyakib@gmail.com" class="font-semibold text-blue-700 hover:text-blue-900">roadyakib&#64;gmail.com</a>
            <a href="tel:01521438546" class="font-semibold text-blue-700 hover:text-blue-900">01521438546</a>
          </div>
        </section>
      </div>
    </main>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  private publicService = inject(PublicService);
  private title = inject(Title);
  private meta = inject(Meta);

  hotelIcon = Hotel;
  carIcon = Car;
  globeIcon = Globe;
  chevronLeftIcon = ChevronLeft;
  chevronRightIcon = ChevronRight;

  banners = signal<any[]>([]);
  currentBannerIndex = signal(0);
  private bannerInterval: any;

  partnerAirlines = ['Biman Bangladesh', 'US-Bangla', 'Emirates', 'Qatar Airways', 'Saudia', 'Turkish Airlines'];

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    this.applyHomepageSeo();

    this.publicService.getHomeSeo().subscribe({
      next: (homeSeo: any) => this.applyHomepageSeo(homeSeo),
      error: (err: unknown) => console.error('Failed to load home SEO settings', err)
    });

    this.publicService.getBanners().subscribe({
      next: (data: any[]) => {
        this.banners.set(data);
        if (data.length > 1) {
          this.startAutoRotate();
        }
      },
      error: (err: unknown) => console.error('Failed to load banners', err)
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

  private applyHomepageSeo(homeSeo: any = {}) {
    const defaults = {
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

    const seo = {
      ...defaults,
      ...homeSeo,
      metaTitle: homeSeo?.metaTitle || homeSeo?.title || defaults.metaTitle,
      metaDescription: homeSeo?.metaDescription || homeSeo?.description || defaults.metaDescription,
      metaKeywords: homeSeo?.metaKeywords || homeSeo?.keywords || defaults.metaKeywords,
      metaRobots: homeSeo?.metaRobots || homeSeo?.robots || defaults.metaRobots
    };

    const title = seo.metaTitle;
    const description = seo.metaDescription;
    const keywords = seo.metaKeywords;
    const robots = seo.metaRobots;
    const canonicalPath = this.normalizeCanonicalPath(seo.canonicalPath || '/');
    const canonicalUrl = this.resolveCanonicalUrl(seo, canonicalPath);
    const currentOrigin = this.document.location?.origin || defaults.primaryDomain;
    const ogTitle = seo.ogTitle || title;
    const ogDescription = seo.ogDescription || description;
    const twitterTitle = seo.twitterTitle || title;
    const twitterDescription = seo.twitterDescription || description;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ property: 'og:type', content: seo.ogType || 'website' });
    this.meta.updateTag({ property: 'og:title', content: ogTitle });
    this.meta.updateTag({ property: 'og:description', content: ogDescription });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:site_name', content: 'AirTech Aviation' });
    this.meta.updateTag({ name: 'twitter:card', content: seo.twitterCardType || 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: twitterTitle });
    this.meta.updateTag({ name: 'twitter:description', content: twitterDescription });

    const ogImage = seo?.ogImageUrl?.trim() || seo?.ogImage?.trim();
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
      this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    } else {
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("name='twitter:image'");
    }

    const twitterImage = seo?.twitterImage?.trim();
    if (twitterImage) {
      this.meta.updateTag({ name: 'twitter:image', content: twitterImage });
    }

    let canonical = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    this.updateAlternateLink(currentOrigin, canonicalPath, seo.alternateDomains || defaults.alternateDomains);

  }

  private resolveCanonicalUrl(seo: any, canonicalPath: string) {
    if (seo?.canonicalMode === 'manual' && seo?.canonicalUrl) {
      try {
        const parsed = new URL(seo.canonicalUrl);
        return parsed.toString();
      } catch {
      }
    }
    const primaryDomain = this.normalizeDomainOrigin(seo?.primaryDomain) || 'https://www.airtechaviation.click';
    return `${primaryDomain}${canonicalPath}`;
  }

  private normalizeDomainOrigin(value: string) {
    if (!value) return '';
    try {
      const parsed = new URL(value);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return '';
    }
  }

  private updateAlternateLink(currentOrigin: string, canonicalPath: string, domains: string[]) {
    this.document.querySelectorAll("link[data-seo-alternate='true']").forEach((node) => node.remove());

    const normalizedDomains = Array.from(new Set((Array.isArray(domains) ? domains : [])
      .map((domain) => this.normalizeDomainOrigin(domain))
      .filter((domain) => !!domain)));

    if (normalizedDomains.length === 0) {
      normalizedDomains.push(currentOrigin);
    }

    normalizedDomains.forEach((domain) => {
      const alternate = this.document.createElement('link');
      alternate.setAttribute('rel', 'alternate');
      alternate.setAttribute('href', `${domain}${canonicalPath}`);
      alternate.setAttribute('data-seo-alternate', 'true');
      this.document.head.appendChild(alternate);
    });
  }

  private normalizeCanonicalPath(path: string) {
    if (!path) return '/';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const parsed = new URL(path);
        return parsed.pathname || '/';
      } catch {
        return '/';
      }
    }
    return path.startsWith('/') ? path : `/${path}`;
  }
}
