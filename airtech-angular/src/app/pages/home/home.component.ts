import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';
import { LucideAngularModule, Globe, Hotel, Car, ChevronLeft, ChevronRight, Sparkles, Info, ChevronUp, ChevronDown, CalendarDays, TrendingUp, Bell } from 'lucide-angular';
import { PublicService } from '../../services/public.service';
import { RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent, LucideAngularModule, RouterLink],
  template: `
    <main class="min-h-screen bg-white">
      <!-- Hero -->
      <app-hero></app-hero>

      <!-- Secondary Navigation / Quick Links -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-[1000px] mx-auto px-4 py-4 flex flex-wrap gap-4 overflow-x-auto scrollbar-hide">
          <a routerLink="/search" class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors border border-gray-300">
            <lucide-icon [name]="hotelIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Flight Search
          </a>
          <a routerLink="/" fragment="popular-routes" class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors border border-gray-300">
            <lucide-icon [name]="carIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Popular Routes
          </a>
          <a routerLink="/support" class="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-full text-sm font-medium text-gray-700 whitespace-nowrap transition-colors border border-gray-300">
            <lucide-icon [name]="globeIcon" class="w-4 h-4 text-blue-600"></lucide-icon>
            Support Team
          </a>
        </div>
      </div>

      <!-- Dynamic Banner Carousel -->
      @if (banners().length > 0) {
        <div class="relative bg-white overflow-hidden max-w-[1000px] mx-auto mt-4 px-4 sm:px-6 md:px-0">
          <div class="relative h-48 md:h-64 rounded-2xl overflow-hidden">
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
                    <div class="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div class="p-8 text-white max-w-[60%]">
                        @if (banner.title) {
                          <h2 class="text-2xl md:text-3xl font-bold mb-2">{{ banner.title }}</h2>
                        }
                        @if (banner.subtitle) {
                          <p class="text-sm md:text-base hidden sm:block">{{ banner.subtitle }}</p>
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
                class="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
              >
                <lucide-icon [name]="chevronLeftIcon" class="w-4 h-4 text-gray-900"></lucide-icon>
              </button>
              <button 
                (click)="nextBanner()"
                class="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
              >
                <lucide-icon [name]="chevronRightIcon" class="w-4 h-4 text-gray-900"></lucide-icon>
              </button>
            }
          </div>
        </div>
      }

      <div class="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-0 py-8 space-y-12">
        <!-- AI Explore Banner -->
        <section class="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
          <div class="px-6 py-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div class="flex-shrink-0">
               <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
                 <lucide-icon [name]="sparklesIcon" class="w-8 h-8 text-white"></lucide-icon>
               </div>
            </div>
            <div class="flex-grow">
              <h2 class="text-[1.375rem] font-medium text-gray-900 mb-1">Flexible? Discover the best flight deals with AI</h2>
              <p class="text-gray-600 mb-5 max-w-[600px] text-[0.95rem]">Describe your ideal trip, and let Google Flights find the best deals for you</p>
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-medium inline-flex items-center gap-2 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                 <lucide-icon [name]="sparklesIcon" class="w-4 h-4"></lucide-icon>
                 Explore deals
              </button>
            </div>
          </div>
        </section>

        <!-- Cheap Flights to Anywhere -->
        <section>
          <div class="text-center mb-8">
             <h1 class="text-3xl md:text-[2.5rem] font-[400] text-gray-900 font-sans tracking-tight mb-10">Find and book cheap flights worldwide and track prices</h1>
             <h2 class="text-xl font-medium text-gray-900 flex items-center justify-center gap-2">
                Find cheap flights from Bangladesh to anywhere
                <button class="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title="Learn more about this section">
                   <lucide-icon [name]="infoIcon" class="w-4 h-4"></lucide-icon>
                </button>
             </h2>
          </div>

          <!-- Tabs -->
          <div class="flex items-center justify-start md:justify-center overflow-x-auto scrollbar-hide border-b border-gray-200 mb-8 -mx-4 px-4 md:mx-0 md:px-0 gap-2">
             <button (click)="activeCityTab.set('Dhaka')" [class]="'px-4 py-3 whitespace-nowrap text-sm font-medium border-b-[3px] transition-colors rounded-t-lg ' + (activeCityTab() === 'Dhaka' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50')">Dhaka</button>
             <button (click)="activeCityTab.set('Chattogram')" [class]="'px-4 py-3 whitespace-nowrap text-sm font-medium border-b-[3px] transition-colors rounded-t-lg ' + (activeCityTab() === 'Chattogram' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50')">Chattogram</button>
             <button (click)="activeCityTab.set('Sylhet')" [class]="'px-4 py-3 whitespace-nowrap text-sm font-medium border-b-[3px] transition-colors rounded-t-lg ' + (activeCityTab() === 'Sylhet' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50')">Sylhet</button>
             <button (click)="activeCityTab.set('Coxs Bazar')" [class]="'px-4 py-3 whitespace-nowrap text-sm font-medium border-b-[3px] transition-colors rounded-t-lg ' + (activeCityTab() === 'Coxs Bazar' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50')">Cox's Bazar</button>
          </div>

          <!-- Tab Content (Mock Flights) -->
          <div class="grid md:grid-cols-2 gap-3 max-w-[800px] mx-auto">
             @for (deal of getActiveDeals(); track deal.id) {
               <a routerLink="/search" [queryParams]="{origin: deal.originCode, destination: deal.destCode, tripType: 'one-way'}" class="block group w-full">
                 <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent shadow-sm hover:shadow-md hover:border-gray-200 bg-white border border-gray-100/80">
                   <div class="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                      <div class="flex items-center gap-2 text-gray-900 font-medium whitespace-nowrap">
                         {{ deal.origin }} 
                         <lucide-icon [name]="chevronRightIcon" class="w-4 h-4 text-gray-400"></lucide-icon>
                         {{ deal.dest }}
                      </div>
                   </div>
                   <div class="flex items-center justify-between w-full sm:w-auto sm:gap-6">
                      <div class="flex items-center gap-3">
                         <img [src]="deal.airlineLogo" class="w-7 h-7 object-contain rounded-full border border-gray-100" [alt]="deal.airline">
                         <div>
                            <div class="text-[0.8rem] text-gray-800">{{ deal.dates }}</div>
                            <div class="text-[0.75rem] text-gray-500">{{ deal.stops }}</div>
                         </div>
                      </div>
                      <div class="text-right flex flex-col justify-end">
                         @if(deal.price !== 'Find flights') {
                            <div class="text-[0.7rem] text-gray-500 uppercase tracking-wide">from</div>
                            <div class="font-medium text-[#1A73E8]">BDT {{ deal.price | number }}</div>
                         } @else {
                            <div class="font-medium text-[#1A73E8]">Find flights</div>
                         }
                      </div>
                   </div>
                 </div>
               </a>
             }
          </div>
          <div class="mt-8 flex justify-center">
            <button class="border border-gray-300 hover:bg-blue-50 hover:text-blue-700 text-blue-600 font-medium px-5 py-2.5 rounded-full text-sm inline-flex items-center gap-2 transition-colors">
               Explore destinations
            </button>
          </div>
        </section>

        <!-- Useful Tools -->
        <section class="pt-8">
           <h2 class="text-xl font-medium text-gray-900 mb-6">Useful tools to help you find the best airline tickets</h2>
           <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div class="p-[18px] rounded-2xl bg-white border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                 <div class="mb-4">
                    <lucide-icon [name]="calendarIcon" class="w-8 h-8 text-blue-600"></lucide-icon>
                 </div>
                 <h3 class="font-medium text-gray-900 mb-2 leading-tight">Find the cheapest days to fly</h3>
                 <p class="text-sm text-gray-600 leading-relaxed">The Date grid and Price graph make it easy to find the best flight deals</p>
              </div>
              <div class="p-[18px] rounded-2xl bg-white border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                 <div class="mb-4">
                    <lucide-icon [name]="trendingUpIcon" class="w-8 h-8 text-blue-600"></lucide-icon>
                 </div>
                 <h3 class="font-medium text-gray-900 mb-2 leading-tight">Know when to book with price insights</h3>
                 <p class="text-sm text-gray-600 leading-relaxed">Price history and trend data show you the best time to book your airline ticket</p>
              </div>
              <div class="p-[18px] rounded-2xl bg-white border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                 <div class="mb-4">
                    <lucide-icon [name]="bellIcon" class="w-8 h-8 text-blue-600"></lucide-icon>
                 </div>
                 <h3 class="font-medium text-gray-900 mb-2 leading-tight">Track flight prices for a trip</h3>
                 <p class="text-sm text-gray-600 leading-relaxed">Not ready to book yet? Observe price changes for a route and get notified when prices drop.</p>
              </div>
              <div class="p-[18px] rounded-2xl bg-white border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
                 <div class="mb-4">
                    <lucide-icon [name]="sparklesIcon" class="w-8 h-8 text-blue-600"></lucide-icon>
                 </div>
                 <h3 class="font-medium text-gray-900 mb-2 leading-tight">Explore the best flight deals with AI</h3>
                 <p class="text-sm text-gray-600 leading-relaxed">Describe your ideal trip and let Google Flights find you the best deals</p>
              </div>
           </div>
        </section>

        <!-- Tool Content Summary Section -->
        <section class="max-w-[700px] mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
            <div class="pt-4">
                <div class="font-medium text-gray-900 mb-3 text-base">Insightful tools help you choose your trip dates</div>
                <div class="text-[0.85rem] text-gray-600 leading-relaxed">If your travel plans are flexible, use the form above to start searching for a specific trip. Then, play around with the <b>Date grid</b> and <b>Price graph</b> options on the Search page to find the cheapest days to fly and book your tickets.</div>
            </div>
            <div class="pt-4">
                <div class="font-medium text-gray-900 mb-3 text-base">Get smart insights about flight prices</div>
                <div class="text-[0.85rem] text-gray-600 leading-relaxed">Real-time insights can tell you if a ticket price is lower or higher than usual, and if the fare you’re seeing is a good price. So, you don’t have to worry about paying too much for a flight or missing out on the cheapest time to book. On some routes, you might also see historical data that helps you better understand how flight prices vary over time.</div>
            </div>
            <div class="pt-4">
                <div class="font-medium text-gray-900 mb-3 text-base">Monitor flight prices and make sure you never miss a price change</div>
                <div class="text-[0.85rem] text-gray-600 leading-relaxed">Effortlessly track prices for specific travel dates or for any dates, if your plans are flexible, to uncover the best deals. You can easily set up tracking for multiple routes while searching for flights and opt-in to receive email updates when the price changes. Once that's done, you can come back to your <a href="#" class="text-blue-600 hover:underline">Tracked Flights page</a> to monitor prices whenever you like, or relax knowing you’ll never miss a flight deal.</div>
            </div>
            <div class="pt-4">
                <div class="font-medium text-gray-900 mb-3 text-base">Explore flight deals and find cheap flight tickets for your next getaway</div>
                <div class="text-[0.85rem] text-gray-600 leading-relaxed">Find flight deals for your ideal trip effortlessly. Simply describe trip length, time of year, airline preferences, or even vacation style. Whether you need a cheap family flight or a luxury business class flight, you can discover <a href="#" class="text-blue-600 hover:underline">the best deals on Google Flights</a>.</div>
            </div>
        </section>

        <!-- Popular Destinations -->
        <section class="pt-10">
           <h2 class="text-xl font-medium text-gray-900 mb-6">Popular flight destinations from Bangladesh</h2>
           <div class="flex gap-4 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
             @for (dest of popularDestinations; track dest.name) {
                <a routerLink="/search" [queryParams]="{origin: 'DAC', destination: dest.code, tripType: 'one-way'}" class="flex-shrink-0 group">
                  <div class="w-[140px] h-[105px] rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm border border-gray-100 relative">
                    <img [src]="dest.img" [alt]="dest.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <!-- Subtle overlay to make text readable if superimposed -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent hover:from-black/10 transition-colors"></div>
                  </div>
                  <div class="mt-2 text-[0.95rem] font-medium text-gray-900">{{ dest.name }}</div>
                </a>
             }
           </div>
        </section>

        <!-- FAQ -->
        <section class="pt-6 pb-16">
           <h2 class="text-[1.375rem] font-medium text-gray-900 mb-6">Frequently asked questions</h2>
           <div class="divide-y divide-gray-200 border-t border-gray-200 w-full max-w-[800px] mx-auto">
              @for (faq of faqs; track faq.q; let i = $index) {
                 <div>
                   <button 
                     (click)="expandedFaqIndex.set(expandedFaqIndex() === i ? -1 : i)"
                     class="w-full text-left py-5 flex items-center justify-between focus:outline-none hover:bg-gray-50/50 transition-colors px-2 rounded-lg"
                   >
                     <span class="text-[1rem] text-gray-900 font-medium">{{ faq.q }}</span>
                     <lucide-icon [name]="expandedFaqIndex() === i ? chevronUpIcon : chevronDownIcon" class="w-5 h-5 text-gray-500 flex-shrink-0 ml-4 transition-transform"></lucide-icon>
                   </button>
                   @if (expandedFaqIndex() === i) {
                     <div class="pb-6 pt-2 px-2 text-gray-600 text-[0.95rem] leading-relaxed animate-in fade-in slide-in-from-top-1" [innerHTML]="faq.a"></div>
                   }
                 </div>
              }
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

  // Google flights UI icons
  sparklesIcon = Sparkles;
  infoIcon = Info;
  chevronUpIcon = ChevronUp;
  chevronDownIcon = ChevronDown;
  calendarIcon = CalendarDays;
  trendingUpIcon = TrendingUp;
  bellIcon = Bell;

  banners = signal<any[]>([]);
  currentBannerIndex = signal(0);
  private bannerInterval: any;

  // New states for Google Flights UI widgets
  activeCityTab = signal('Dhaka');
  expandedFaqIndex = signal(0); // Start with first FAQ open

  dealsData: any = {
    'Dhaka': [
       { id: 1, origin: 'Dhaka', dest: "Cox's Bazar", originCode: 'DAC', destCode: 'CXB', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 23 — Apr 29', stops: 'Nonstop', price: 12297 },
       { id: 2, origin: 'Dhaka', dest: 'Chattogram', originCode: 'DAC', destCode: 'CGP', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 23 — Apr 29', stops: 'Nonstop', price: 11697 },
       { id: 3, origin: 'Dhaka', dest: 'Sylhet', originCode: 'DAC', destCode: 'ZYL', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 23 — Apr 29', stops: 'Nonstop', price: 11697 },
    ],
    'Chattogram': [
       { id: 4, origin: 'Chattogram', dest: 'Dhaka', originCode: 'CGP', destCode: 'DAC', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 24 — Apr 30', stops: 'Nonstop', price: 11697 },
       { id: 5, origin: 'Chattogram', dest: 'Doha', originCode: 'CGP', destCode: 'DOH', airline: 'Air Arabia', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/G9.png', dates: 'Jul 13 — Jul 20', stops: '1 stop', price: 63217 },
       { id: 6, origin: 'Chattogram', dest: 'Muscat', originCode: 'CGP', destCode: 'MCT', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'May 28 — Jun 3', stops: '1 stop', price: 58902 },
    ],
    'Sylhet': [
       { id: 7, origin: 'Sylhet', dest: 'Dhaka', originCode: 'ZYL', destCode: 'DAC', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 23 — Apr 29', stops: 'Nonstop', price: 11697 },
       { id: 8, origin: 'Sylhet', dest: "Cox's Bazar", originCode: 'ZYL', destCode: 'CXB', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 18 — Apr 24', stops: '1 stop', price: 'Find flights' },
    ],
    'Coxs Bazar': [
       { id: 9, origin: "Cox's Bazar", dest: 'Dhaka', originCode: 'CXB', destCode: 'DAC', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 23 — Apr 29', stops: 'Nonstop', price: 12297 },
       { id: 10, origin: "Cox's Bazar", dest: 'Saidpur', originCode: 'CXB', destCode: 'SPD', airline: 'US-Bangla', airlineLogo: 'https://www.gstatic.com/flights/airline_logos/70px/BS.png', dates: 'Apr 18 — Apr 24', stops: '1 stop', price: 'Find flights' },
    ]
  };

  popularDestinations = [
    { name: 'London', code: 'LHR', img: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSAExWJ5EPerubHT1mQuLT9oD-81_tk_XEi5TxkAPSrqq1lyn3hRhZ2B_fSLWsb1j1m56-mfrfKDiV5W8b7NEjgN8NS1DhS1ACUz657lFc' },
    { name: 'Jeddah', code: 'JED', img: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRz0g5gVwPeYzhxmKoRXLfYy5fhROnBKRy4Vbl39hI91cNOlSyqzuTLojZ-zFD4-jQ5Cz7cLoOasLqZxWZZ-f2VD6KJxT-cZF_O8Lf7PA' },
    { name: 'Dubai', code: 'DXB', img: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQY2fy_JS2iGmbN10ikQ0ufPBAn_cRcf7pGbn2RENmflCPM8QqR6WiLBkeK-vUukAMGf4n8i0nFumLxX-1HNl-XZs-8vQPbXAoUylpOuQ' },
    { name: 'Riyadh', code: 'RUH', img: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcR--IYDnisCXiS58qMrbc1Aut75k1ltNQMNkNyx2uyJnL_1pBBpx6etQkxlyNY7oHPHqed2a4sDlg5jMb558aaSFr1N01m9hH90ZydiVw' },
    { name: 'Istanbul', code: 'IST', img: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQg4MYNbmaonVOzl9RKy1L535kvBCGuOztbjNydGZIp8HdZtcfO1TaKHmzOt6I-k2lxglcMGi8_XZgqOgfVN-5W6A7HIWDD5ufJn3XKXAQ' },
    { name: 'Dammam', code: 'DMM', img: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcT8RvprbARdk89wiFlbqmRxgM_yN0z_PG5WjXTvQ4oCh5yoDL36v-GUE63LbvvZ3cDN1JDvqNlQDp_9XScitGloxcjSLPL313d-G7AJqQ' },
    { name: 'Muscat', code: 'MCT', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVvI3UutwCkXQeW31dxWzaulhvTlYjDRBUoOFmwQSN_EPbMiZCW9IFV9rqRghkryTsAEfPhF7I6yxKUWGeaBVDwIoQc8TuJSx_jObqJA' },
    { name: 'Doha', code: 'DOH', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9Q0Yfq6fxVjXyi7R6lOeP6iMS6rXuNzKLvf3t-_ywoTWgmAgAPLwG3n8WHTWpZvJBAsB-1gIbvEpX957Vq3J81wN5M7ooMyrmv7f4bQ' },
    { name: 'Kuwait City', code: 'KWI', img: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQYD97s6DNoZwpE9lb8cUSIVHPbMA4Uf6Jbw8vCEym6vMhrBm1jMrlLgJhwem-nfCKYxphIy_8MLCN6Uq0pPxCRvLuM6ywbUxwgnBIxRg' },
    { name: 'Cairo', code: 'CAI', img: 'https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcSe0nYB3tBC2TNxXTHu5G-Yh0A8Oo1GcVp4ArdYUV8it8unl5O9hPp2yNVmQu4gQZWtA7JlOEznzHzrO3rw7aQe08AB-dwRlQtF1M1ZUQ' }
  ];

  faqs = [
    { q: 'What are some good flight destinations from Bangladesh?', a: 'Some popular flight destinations from Dhaka are London, Jeddah, Dubai, Riyadh, Istanbul and Dammam.<br><br>You can currently find cheap options like round-trip flights from Dhaka to Cox\'s Bazar starting at BDT 12,297, or cheap flights from Sylhet to Dhaka starting at BDT 11,697.' },
    { q: 'How can I find last-minute flight deals?', a: 'Finding last-minute flights is easy. Select your departure and destination cities in the form on the top of the page, and use the calendar to pick travel dates and find the cheapest flights available. To find the cheapest tickets, it’s usually best to book at least a few weeks in advance for domestic flights and a few months in advance for cheap international flights.' },
    { q: 'How can I find cheap flights for a weekend getaway?', a: 'It’s easy to find deals on weekend getaways or even weeklong trips. Just enter your departure and destination cities near the top of the page. Then, open the date selector and choose a trip length to see how the round-trip ticket prices changes on different days. The cheapest available flights are highlighted and easy to spot.' },
    { q: 'How can I find flight deals if my travel plans are flexible?', a: 'It’s easy to search for flights, even if your plans are up in the air.<br>1. Tap Explore near the top of the page<br>2. Then, tap the calendar icon<br>3. Toggle to <b>Flexible dates</b> and a select a time frame or trip length<br>Trip options will appear on the map, with the cheapest available flights highlighted.' },
    { q: 'How can I get flight alerts for my trip?', a: 'You can track flight prices for specific dates or, if your plans are flexible, any dates. To get flight alerts for a specific round trip, choose your dates and flights and select <b>Search</b>. Then, you can turn on price tracking.' }
  ];

  getActiveDeals() {
    return this.dealsData[this.activeCityTab()] || [];
  }

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
