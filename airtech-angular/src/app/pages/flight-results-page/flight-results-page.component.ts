import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FlightSearchFormComponent } from '../../components/flight-search-form/flight-search-form.component';
import { MobileSearchComponent } from '../../components/mobile-search/mobile-search.component';
import { FlightResultsComponent } from '../../components/flight-results/flight-results.component';
import { SearchStateService } from '../../services/search-state.service';
import { FlightService } from '../../services/flight.service';
import {
  LucideAngularModule,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Pencil,
  SlidersHorizontal,
  X
} from 'lucide-angular';

import { AirportNameComponent } from '../../components/airport-name/airport-name.component';

type SortType = 'cheapest' | 'earliest' | 'fastest';
type TimeBucket = 'early-morning' | 'morning' | 'afternoon' | 'evening';

@Component({
  selector: 'app-flight-results-page',
  standalone: true,
  imports: [CommonModule, FlightSearchFormComponent, MobileSearchComponent, FlightResultsComponent, LucideAngularModule, AirportNameComponent],
  template: `
    <div class="min-h-screen bg-[#eef2f7]">
      <header class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <div class="md:hidden flex items-center justify-between gap-2">
            <button
              (click)="goBack()"
              class="w-10 h-10 rounded-full grid place-content-center text-slate-700 hover:bg-slate-100"
              aria-label="Go back"
            >
              <lucide-icon [name]="backIcon" class="w-5 h-5"></lucide-icon>
            </button>

            <div class="min-w-0 flex-1 text-center">
              <div class="flex items-center justify-center gap-1.5 text-sm font-black text-slate-900">
                <app-airport-name [code]="searchCriteria().origin || ''"></app-airport-name>
                <span class="text-slate-400">→</span>
                <app-airport-name [code]="searchCriteria().destination || ''"></app-airport-name>
              </div>
              <p class="text-[11px] text-slate-500 truncate">{{ dateSummary() }} • {{ passengerSummary() }}</p>
            </div>

            <button
              (click)="toggleSearchPanel()"
              class="w-10 h-10 rounded-full grid place-content-center text-slate-700 hover:bg-slate-100"
              aria-label="Modify search"
            >
              <lucide-icon [name]="modifyIcon" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <div class="hidden md:flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 text-sm font-black text-slate-900">
                <app-airport-name [code]="searchCriteria().origin || ''"></app-airport-name>
                <lucide-icon [name]="modifyIcon" class="w-3.5 h-3.5 text-slate-300 rotate-90"></lucide-icon>
                <app-airport-name [code]="searchCriteria().destination || ''"></app-airport-name>
              </div>
              <p class="text-xs text-slate-500 truncate">
                {{ tripTypeLabel() }} • {{ dateSummary() }} • {{ passengerSummary() }} • {{ cabinSummary() }}
              </p>
            </div>
            <button
              (click)="toggleSearchPanel()"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Modify
              <lucide-icon [name]="showSearchPanel() ? chevronUpIcon : chevronDownIcon" class="w-4 h-4"></lucide-icon>
            </button>
          </div>

          @if (showSearchPanel()) {
            <div class="mt-3 border-t border-slate-100 pt-4 pb-4">
              <div class="hidden md:block">
                <app-flight-search-form></app-flight-search-form>
              </div>
              <div class="block md:hidden -mx-3 sm:-mx-6">
                <app-mobile-search [isModifySearch]="true"></app-mobile-search>
              </div>
            </div>
          }
        </div>
      </header>



      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-6">
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 mb-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-700">
              <span class="font-black text-slate-900">{{ filteredSortedResults().length }}</span> Available Flights
            </p>
            <button
              (click)="showMobileFilters.set(true)"
              class="inline-flex lg:hidden items-center gap-1.5 text-sm font-semibold text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              <lucide-icon [name]="slidersIcon" class="w-4 h-4"></lucide-icon>
              All Filters
            </button>
          </div>
        </div>

        @if (errorMessage()) {
          <div class="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {{ errorMessage() }}
          </div>
        }

        <div class="flex flex-col gap-4 items-stretch overflow-visible">
          <!-- Horizontal Filter Bar -->
          <div class="relative z-40 hidden lg:flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
            <!-- Stops Filter -->
            <div class="relative filter-dropdown">
              <button (click)="toggleDesktopFilter('stops')" class="px-3 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                Stops <lucide-icon [name]="chevronDownIcon" class="w-3 h-3"></lucide-icon>
              </button>
              @if (activeFilter === 'stops') {
                <div class="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                  <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Stops</h4>
                  @for (stop of stopOptions; track stop.label) {
                    <label class="flex items-center justify-between py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded px-1 cursor-pointer">
                      <span>{{ stop.label }}</span>
                      <input type="checkbox" [checked]="selectedStops().has(stop.value)" (change)="toggleStop(stop.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Airlines Filter -->
            <div class="relative filter-dropdown">
              <button (click)="toggleDesktopFilter('airlines')" class="px-3 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                Airlines <lucide-icon [name]="chevronDownIcon" class="w-3 h-3"></lucide-icon>
              </button>
              @if (activeFilter === 'airlines') {
                <div class="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto custom-scrollbar bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                  <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Airlines</h4>
                  @for (airline of availableAirlines(); track airline) {
                    <label class="flex items-center justify-between py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded px-1 cursor-pointer">
                      <span class="inline-flex items-center gap-2 min-w-0">
                        <img [src]="'https://pics.avs.io/90/90/' + airline + '.png'" [alt]="airline" class="w-4 h-4 rounded object-contain bg-slate-50" (error)="handleLogoError($event, airline)" />
                        <span class="truncate">{{ airline }}</span>
                      </span>
                      <input type="checkbox" [checked]="selectedAirlines().has(airline)" (change)="toggleAirline(airline, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Price Filter -->
            <div class="relative filter-dropdown">
              <button (click)="toggleDesktopFilter('price')" class="px-3 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                Price <lucide-icon [name]="chevronDownIcon" class="w-3 h-3"></lucide-icon>
              </button>
              @if (activeFilter === 'price') {
                <div class="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                  <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Maximum Price</h4>
                  <input type="range" [min]="priceMin()" [max]="priceMax()" [value]="maxBudget()" (input)="setMaxBudget(+$any($event.target).value)" class="w-full" />
                  <div class="flex items-center justify-between text-xs text-slate-500 mt-2">
                    <span>BDT {{ priceMin() | number }}</span>
                    <span class="font-bold text-slate-800">BDT {{ maxBudget() | number }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Times Filter -->
            <div class="relative filter-dropdown">
              <button (click)="toggleDesktopFilter('times')" class="px-3 py-1.5 rounded-full border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                Times <lucide-icon [name]="chevronDownIcon" class="w-3 h-3"></lucide-icon>
              </button>
              @if (activeFilter === 'times') {
                <div class="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4">
                  <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Departure Time</h4>
                  <div class="mb-4">
                    @for (option of timeBucketOptions; track option.value) {
                      <label class="flex items-center justify-between py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded px-1 cursor-pointer">
                        <span>{{ option.shortLabel }}</span>
                        <input type="checkbox" [checked]="selectedDepartureBuckets().has(option.value)" (change)="toggleDepartureBucket(option.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </label>
                    }
                  </div>
                  <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Arrival Time</h4>
                  <div>
                    @for (option of timeBucketOptions; track option.value) {
                      <label class="flex items-center justify-between py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded px-1 cursor-pointer">
                        <span>{{ option.shortLabel }}</span>
                        <input type="checkbox" [checked]="selectedArrivalBuckets().has(option.value)" (change)="toggleArrivalBucket(option.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </label>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="ml-auto">
               <button (click)="resetFilters()" class="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">Reset all</button>
            </div>
          </div>

          <!-- Main Results Area -->
          <section class="min-w-0 overflow-visible relative z-0">
            <!-- Tabs Row -->
            <div class="border-b border-slate-200 mb-4 px-2">
              <div class="flex gap-6 relative">
                 <button 
                   (click)="setSort('cheapest')" 
                   [class]="'pb-3 text-sm font-medium transition-colors relative ' + (sortBy() === 'cheapest' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800')"
                 >
                    Cheapest
                    @if (sortBy() === 'cheapest') { <span class="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-lg"></span> }
                 </button>
                 <button 
                   (click)="setSort('earliest')" 
                   [class]="'pb-3 text-sm font-medium transition-colors relative ' + (sortBy() === 'earliest' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800')"
                 >
                    Best
                    @if (sortBy() === 'earliest') { <span class="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-lg"></span> }
                 </button>
                 <button 
                   (click)="setSort('fastest')" 
                   [class]="'pb-3 text-sm font-medium transition-colors relative ' + (sortBy() === 'fastest' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800')"
                 >
                    Fastest
                    @if (sortBy() === 'fastest') { <span class="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-lg"></span> }
                 </button>
              </div>
            </div>

            <div class="min-w-0 overflow-x-hidden">
              <app-flight-results [flights]="filteredSortedResults()" [loading]="loading()" [progress]="loadingProgress()"></app-flight-results>
            </div>
          </section>
        </div>
      </div>

      @if (showMobileFilters()) {
        <div class="fixed inset-0 z-50 bg-white">
          <div class="h-full overflow-auto pb-[max(20px,env(safe-area-inset-bottom))]">
            <div class="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <h3 class="text-base font-black text-slate-900">All Filters</h3>
              <button (click)="showMobileFilters.set(false)" aria-label="Close filters">
                <lucide-icon [name]="xIcon" class="w-5 h-5"></lucide-icon>
              </button>
            </div>

            <div class="p-4 space-y-5">
              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Sort</h4>
                <div class="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  @for (tab of sortOptions; track tab.value) {
                    <button (click)="setSort(tab.value)" [class]="'rounded-lg px-2 py-2 text-[11px] font-bold transition-colors ' + (sortBy() === tab.value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600')">{{ tab.label }}</button>
                  }
                </div>
              </section>

              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Price Range</h4>
                <input type="range" [min]="priceMin()" [max]="priceMax()" [value]="maxBudget()" (input)="setMaxBudget(+$any($event.target).value)" class="w-full" />
                <div class="text-xs text-slate-500">Up to BDT {{ maxBudget() | number }}</div>
              </section>

              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Airlines</h4>
                @for (airline of availableAirlines(); track airline) {
                  <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span class="inline-flex items-center gap-2">
                      <img [src]="'https://pics.avs.io/90/90/' + airline + '.png'" [alt]="airline" class="w-5 h-5 object-contain" (error)="handleLogoError($event, airline)" />
                      <span>{{ airline }}</span>
                    </span>
                    <input type="checkbox" [checked]="selectedAirlines().has(airline)" (change)="toggleAirline(airline, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600" />
                  </label>
                }
              </section>

              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Stops</h4>
                @for (stop of stopOptions; track stop.label) {
                  <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{{ stop.label }}</span>
                    <input type="checkbox" [checked]="selectedStops().has(stop.value)" (change)="toggleStop(stop.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600" />
                  </label>
                }
              </section>

              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Departure Time</h4>
                @for (option of timeBucketOptions; track option.value) {
                  <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{{ option.shortLabel }}</span>
                    <input type="checkbox" [checked]="selectedDepartureBuckets().has(option.value)" (change)="toggleDepartureBucket(option.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600" />
                  </label>
                }
              </section>

              <section class="space-y-2">
                <h4 class="text-xs uppercase tracking-wider text-slate-500 font-bold">Arrival Time</h4>
                @for (option of timeBucketOptions; track option.value) {
                  <label class="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{{ option.shortLabel }}</span>
                    <input type="checkbox" [checked]="selectedArrivalBuckets().has(option.value)" (change)="toggleArrivalBucket(option.value, $any($event.target).checked)" class="rounded border-slate-300 text-blue-600" />
                  </label>
                }
              </section>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-slate-200 p-4 grid grid-cols-2 gap-3">
              <button (click)="resetFilters()" class="rounded-xl border border-slate-300 py-3 text-sm font-semibold">Reset</button>
              <button (click)="showMobileFilters.set(false)" class="rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold">Apply</button>
            </div>
          </div>
        </div>
      }

      <!-- Floating Countdown Notification -->
      @if (countdownSeconds() > 0) {
        <div class="fixed bottom-6 right-4 sm:right-8 z-[100] animate-in slide-in-from-right-full fade-in duration-700">
           <div class="group relative bg-white/90 backdrop-blur-md border border-slate-100 p-4 sm:p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 min-w-[200px] hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)] transition-all">
              <!-- Animated Background Glow -->
              <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl opacity-0 group-hover:opacity-10 transition duration-500"></div>
              
              <div class="relative w-12 h-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                 <lucide-icon 
                   [name]="clockIcon" 
                   [class]="'w-6 h-6 ' + (countdownSeconds() < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600')"
                 ></lucide-icon>
                 @if (countdownSeconds() < 300) {
                   <span class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
                 }
              </div>

              <div class="relative flex flex-col">
                 <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session expires</p>
                 <span [class]="'text-2xl font-black tracking-tight leading-none ' + (countdownSeconds() < 300 ? 'text-red-600' : 'text-slate-900')">
                    {{ countdownLabel() }}
                 </span>
              </div>
           </div>
        </div>
      }

    </div>
  `
})
export class FlightResultsPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private searchState = inject(SearchStateService);
  private flightService = inject(FlightService);

  private readonly searchParamKeys = ['tripType', 'origin', 'destination', 'date', 'adults', 'children', 'cabin', 'direct', 'returnDate', 'segments'];

  private lastSearchSignature = '';
  private hasBudgetInUrl = false;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  results = signal<any[]>([]);
  errorMessage = signal('');
  loading = signal(false);
  loadingProgress = signal(0);
  countdownSeconds = signal(25 * 60 + 49);
  showSearchPanel = signal(false);
  showMobileFilters = signal(false);

  sortBy = signal<SortType>('cheapest');
  selectedStops = signal<Set<number>>(new Set());
  selectedAirlines = signal<Set<string>>(new Set());
  selectedDepartureBuckets = signal<Set<TimeBucket>>(new Set());
  selectedArrivalBuckets = signal<Set<TimeBucket>>(new Set());
  maxBudget = signal(0);

  sortOptions: { value: SortType; label: string }[] = [
    { value: 'cheapest', label: 'Cheapest' },
    { value: 'earliest', label: 'Earliest' },
    { value: 'fastest', label: 'Fastest' }
  ];

  stopOptions = [
    { label: 'Non-stop', value: 0 },
    { label: '1 Stop', value: 1 },
    { label: '2+ Stops', value: 2 }
  ];

  timeBucketOptions: { shortLabel: string; value: TimeBucket }[] = [
    { shortLabel: '12 AM - 06 AM', value: 'early-morning' },
    { shortLabel: '06 AM - 12 PM', value: 'morning' },
    { shortLabel: '12 PM - 06 PM', value: 'afternoon' },
    { shortLabel: '06 PM - 12 AM', value: 'evening' }
  ];

  availableAirlines = computed(() => {
    const codes = new Set<string>();
    this.results().forEach(flight => {
      const code = this.getAirlineCode(flight);
      if (code) {
        codes.add(code);
      }
    });
    return Array.from(codes).sort();
  });

  filteredSortedResults = computed(() => {
    const stops = this.selectedStops();
    const airlines = this.selectedAirlines();
    const depBuckets = this.selectedDepartureBuckets();
    const arrBuckets = this.selectedArrivalBuckets();
    const budget = this.maxBudget();

    const filtered = this.results().filter(flight => {
      const price = Number(flight?.price?.total || 0);
      const budgetOk = budget === 0 || price <= budget;

      const stopCount = this.getStops(flight);
      const normalizedStops = stopCount >= 2 ? 2 : stopCount;
      const stopsOk = stops.size === 0 || stops.has(normalizedStops);

      const airline = this.getAirlineCode(flight);
      const airlineOk = airlines.size === 0 || airlines.has(airline);

      const depBucket = this.getDepartureBucket(flight);
      const arrBucket = this.getArrivalBucket(flight);
      const depOk = depBuckets.size === 0 || depBuckets.has(depBucket);
      const arrOk = arrBuckets.size === 0 || arrBuckets.has(arrBucket);

      return budgetOk && stopsOk && airlineOk && depOk && arrOk;
    });

    return [...filtered].sort((a, b) => {
      const priceA = Number(a?.price?.total || 0);
      const priceB = Number(b?.price?.total || 0);
      const durationA = this.getTotalDurationMinutes(a);
      const durationB = this.getTotalDurationMinutes(b);
      const depA = this.getDepartureTimestamp(a);
      const depB = this.getDepartureTimestamp(b);

      switch (this.sortBy()) {
        case 'earliest':
          return depA - depB;
        case 'fastest':
          return durationA - durationB;
        case 'cheapest':
        default:
          return priceA - priceB;
      }
    });
  });

  searchCriteria = computed(() => {
    const state = this.searchState.state();
    return {
      origin: state.segments[0]?.origin?.iata || '',
      destination: state.segments[state.segments.length - 1]?.destination?.iata || '',
    };
  });

  priceMin = computed(() => {
    const prices = this.results().map(item => Number(item?.price?.total || 0)).filter(Boolean);
    return prices.length ? Math.min(...prices) : 0;
  });

  priceMax = computed(() => {
    const prices = this.results().map(item => Number(item?.price?.total || 0)).filter(Boolean);
    return prices.length ? Math.max(...prices) : 0;
  });

  routeSummary = computed(() => {
    const state = this.searchState.state();
    if (!state.segments.length) {
      return 'Route unavailable';
    }
    const first = state.segments[0];
    const last = state.segments[state.segments.length - 1];
    return `${first.origin.iata || '---'} -> ${last.destination.iata || '---'}`;
  });

  tripTypeLabel = computed(() => {
    const type = this.searchState.state().tripType;
    if (type === 'one-way') {
      return 'One Way';
    }
    if (type === 'multi-city') {
      return 'Multi-City';
    }
    return 'Round Trip';
  });

  dateSummary = computed(() => {
    const state = this.searchState.state();
    const firstDate = state.segments[0]?.date || '-';
    if (state.tripType === 'return' && state.returnDate) {
      return `${firstDate} to ${state.returnDate}`;
    }
    if (state.tripType === 'multi-city') {
      return `${state.segments.length} segments`;
    }
    return firstDate;
  });

  passengerSummary = computed(() => {
    const travelers = this.searchState.state().travellers;
    return `${travelers.adults + travelers.childrenCount} Travellers`;
  });

  cabinSummary = computed(() => this.searchState.state().travellers.cabin);

  countdownLabel = computed(() => {
    const total = this.countdownSeconds();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  backIcon = ArrowLeft;
  modifyIcon = Pencil;
  clockIcon = Clock3;
  filterIcon = Filter;
  chevronDownIcon = ChevronDown;
  chevronUpIcon = ChevronUp;
  slidersIcon = SlidersHorizontal;
  xIcon = X;

  activeFilter: string = 'none';

  toggleDesktopFilter(filter: string) {
    if (this.activeFilter === filter) {
      this.activeFilter = 'none';
    } else {
      this.activeFilter = filter;
    }
  }

  ngOnInit() {
    this.startCountdown();

    this.route.queryParams.subscribe(params => {
      this.hydrateState(params);
      this.hydrateUiState(params);

      if (!this.hasCompleteSearchState()) {
        this.lastSearchSignature = '';
        this.results.set([]);
        this.loading.set(false);
        this.stopLoadingProgress();
        this.showSearchPanel.set(true);
        return;
      }

      const searchParams = this.extractSearchParams(params);
      const searchSignature = JSON.stringify(searchParams);
      if (searchSignature !== this.lastSearchSignature) {
        this.lastSearchSignature = searchSignature;
        this.performSearch(searchParams);
        this.showSearchPanel.set(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }
  }

  goBack() {
    this.location.back();
  }

  toggleSearchPanel() {
    this.showSearchPanel.set(!this.showSearchPanel());
  }

  setSort(sort: SortType) {
    this.sortBy.set(sort);
    this.persistUiStateToUrl();
  }

  setMaxBudget(value: number) {
    this.hasBudgetInUrl = true;
    this.maxBudget.set(value);
    this.persistUiStateToUrl();
  }

  toggleStop(value: number, enabled: boolean) {
    const next = new Set(this.selectedStops());
    if (enabled) {
      next.add(value);
    } else {
      next.delete(value);
    }
    this.selectedStops.set(next);
    this.persistUiStateToUrl();
  }

  toggleAirline(code: string, enabled: boolean) {
    const next = new Set(this.selectedAirlines());
    if (enabled) {
      next.add(code);
    } else {
      next.delete(code);
    }
    this.selectedAirlines.set(next);
    this.persistUiStateToUrl();
  }

  toggleDepartureBucket(bucket: TimeBucket, enabled: boolean) {
    const next = new Set(this.selectedDepartureBuckets());
    if (enabled) {
      next.add(bucket);
    } else {
      next.delete(bucket);
    }
    this.selectedDepartureBuckets.set(next);
    this.persistUiStateToUrl();
  }

  toggleArrivalBucket(bucket: TimeBucket, enabled: boolean) {
    const next = new Set(this.selectedArrivalBuckets());
    if (enabled) {
      next.add(bucket);
    } else {
      next.delete(bucket);
    }
    this.selectedArrivalBuckets.set(next);
    this.persistUiStateToUrl();
  }

  resetFilters() {
    this.sortBy.set('cheapest');
    this.selectedStops.set(new Set());
    this.selectedAirlines.set(new Set());
    this.selectedDepartureBuckets.set(new Set());
    this.selectedArrivalBuckets.set(new Set());
    this.hasBudgetInUrl = false;
    this.maxBudget.set(this.priceMax());
    this.persistUiStateToUrl();
  }

  handleLogoError(event: any, code: string) {
    const img = event.target as HTMLImageElement;
    const current = img.src || '';
    const c = (code || 'AIR').toUpperCase();
    if (current.includes('pics.avs.io')) {
      img.src = `https://content.airhex.com/content/logos/airlines_${c}_90_90_s.png`;
    } else {
      img.src = `https://ui-avatars.com/api/?name=${c}&background=EEF2FF&color=4F46E5&bold=true&size=90`;
    }
  }

  private startCountdown() {
    this.countdownTimer = setInterval(() => {
      if (this.countdownSeconds() > 0) {
        this.countdownSeconds.set(this.countdownSeconds() - 1);
      }
    }, 1000);
  }

  private startLoadingProgress() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }
    this.loadingProgress.set(0);

    setTimeout(() => {
      if (this.loading()) {
        this.loadingProgress.set(20);
      }
    }, 120);

    this.progressTimer = setInterval(() => {
      const current = this.loadingProgress();
      if (current < 88) {
        this.loadingProgress.set(Math.min(88, current + Math.floor(Math.random() * 3) + 1));
      }
    }, 350);
  }

  private stopLoadingProgress() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private finishLoadingSuccess() {
    this.stopLoadingProgress();
    this.loadingProgress.set(100);
    setTimeout(() => {
      this.loading.set(false);
    }, 180);
  }

  private finishLoadingError() {
    this.stopLoadingProgress();
    this.loadingProgress.set(0);
    this.loading.set(false);
  }

  private hydrateState(params: any) {
    if (Object.keys(params).length === 0) {
      return;
    }

    const newState: any = {
      tripType: params.tripType || (params.returnDate ? 'return' : 'one-way'),
      travellers: {
        adults: Number(params.adults) || 1,
        childrenCount: Number(params.children) || 0,
        cabin: (params.cabin || 'Economy').charAt(0) + (params.cabin || 'economy').slice(1).toLowerCase()
      },
      directOnly: params.direct === 'true',
      returnDate: params.returnDate || ''
    };

    if (params.tripType === 'multi-city' && params.segments) {
      try {
        const parsed = JSON.parse(params.segments);
        newState.segments = parsed.map((s: any) => ({
          origin: { iata: s.o, display: this.formatAirportDisplay(s.o) },
          destination: { iata: s.d, display: this.formatAirportDisplay(s.d) },
          date: s.t
        }));
      } catch (error) {
        console.error('Failed to parse segments', error);
      }
    } else if (params.origin) {
      newState.segments = [{
        origin: { iata: params.origin, display: this.formatAirportDisplay(params.origin) },
        destination: { iata: params.destination, display: this.formatAirportDisplay(params.destination) },
        date: params.date
      }];
    }

    this.searchState.updateState(newState);
  }

  private hydrateUiState(params: any) {
    const sort = params.sort;
    this.sortBy.set(sort === 'earliest' || sort === 'fastest' || sort === 'cheapest' ? sort : 'cheapest');

    const stops = typeof params.stops === 'string' && params.stops.length
      ? params.stops.split(',').map((v: string) => Number(v)).filter((v: number) => [0, 1, 2].includes(v))
      : [];
    this.selectedStops.set(new Set(stops));

    const airlines = typeof params.airlines === 'string' && params.airlines.length
      ? params.airlines.split(',').filter((value: string) => !!value)
      : [];
    this.selectedAirlines.set(new Set(airlines));

    const departureBuckets = typeof params.depTime === 'string' && params.depTime.length
      ? params.depTime.split(',').filter((value: string) => this.isValidBucket(value)) as TimeBucket[]
      : [];
    this.selectedDepartureBuckets.set(new Set(departureBuckets));

    const arrivalBuckets = typeof params.arrTime === 'string' && params.arrTime.length
      ? params.arrTime.split(',').filter((value: string) => this.isValidBucket(value)) as TimeBucket[]
      : [];
    this.selectedArrivalBuckets.set(new Set(arrivalBuckets));

    const budget = Number(params.maxBudget || 0);
    this.hasBudgetInUrl = Number.isFinite(budget) && budget > 0;
    if (this.hasBudgetInUrl) {
      this.maxBudget.set(budget);
    } else {
      this.maxBudget.set(this.priceMax());
    }
  }

  private persistUiStateToUrl() {
    const queryParams: Params = {
      sort: this.sortBy() === 'cheapest' ? null : this.sortBy(),
      stops: this.selectedStops().size ? Array.from(this.selectedStops()).sort((a, b) => a - b).join(',') : null,
      airlines: this.selectedAirlines().size ? Array.from(this.selectedAirlines()).sort().join(',') : null,
      depTime: this.selectedDepartureBuckets().size ? Array.from(this.selectedDepartureBuckets()).sort().join(',') : null,
      arrTime: this.selectedArrivalBuckets().size ? Array.from(this.selectedArrivalBuckets()).sort().join(',') : null,
      maxBudget: this.hasBudgetInUrl && this.maxBudget() > 0 ? Math.round(this.maxBudget()) : null
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private extractSearchParams(params: any): Record<string, string> {
    const searchParams: Record<string, string> = {};
    this.searchParamKeys.forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') {
        searchParams[key] = String(value);
      }
    });
    return searchParams;
  }

  private performSearch(searchParams: Record<string, string>) {
    if (Object.keys(searchParams).length === 0) {
      return;
    }

    this.loading.set(true);
    this.results.set([]);
    this.errorMessage.set('');
    this.startLoadingProgress();

    // Build a FlightSearchQuery from the URL params
    const query: any = {
      origin: searchParams['origin'],
      destination: searchParams['destination'],
      date: searchParams['date'],
      returnDate: searchParams['returnDate'],
      adults: Number(searchParams['adults']) || 1,
      children: Number(searchParams['children']) || 0,
      cabin: searchParams['cabin'] || 'ECONOMY',
      direct: searchParams['direct'] === 'true',
      tripType: searchParams['tripType'],
      segments: searchParams['segments'],
    };

    this.flightService.searchFlights(query).subscribe({
      next: data => {
        this.loadingProgress.set(Math.max(this.loadingProgress(), 60));
        this.results.set(Array.isArray(data) ? data : []);
        const maxPrice = this.priceMax();
        if (!this.hasBudgetInUrl) {
          this.maxBudget.set(maxPrice);
        } else if (this.maxBudget() > maxPrice) {
          this.maxBudget.set(maxPrice);
          this.persistUiStateToUrl();
        }
        this.finishLoadingSuccess();
      },
      error: err => {
        console.error('Search failed:', err);
        const details = err?.error?.details || err?.error?.error || err?.message || 'Flight search failed. Please try again.';
        this.errorMessage.set(String(details));
        this.finishLoadingError();
      }
    });
  }

  private hasCompleteSearchState(): boolean {
    const state = this.searchState.state();

    if (state.tripType === 'multi-city') {
      return state.segments.length > 0 && state.segments.every(segment => !!segment.origin.iata && !!segment.destination.iata && !!segment.date);
    }

    const first = state.segments[0];
    if (!first?.origin.iata || !first?.destination.iata || !first?.date) {
      return false;
    }

    if (state.tripType === 'return') {
      return !!state.returnDate;
    }

    return true;
  }

  private formatAirportDisplay(iataCode: string): string {
    return String(iataCode || '').toUpperCase();
  }

  private getAirlineCode(flight: any): string {
    return flight?.itineraries?.[0]?.segments?.[0]?.carrierCode || '';
  }

  private getStops(flight: any): number {
    const segments = flight?.itineraries?.[0]?.segments || [];
    return Math.max(0, segments.length - 1);
  }

  private getDepartureTimestamp(flight: any): number {
    const date = flight?.itineraries?.[0]?.segments?.[0]?.departure?.at;
    return date ? new Date(date).getTime() : Number.MAX_SAFE_INTEGER;
  }

  private getDepartureBucket(flight: any): TimeBucket {
    const date = flight?.itineraries?.[0]?.segments?.[0]?.departure?.at;
    return this.getBucketFromDate(date);
  }

  private getArrivalBucket(flight: any): TimeBucket {
    const segments = flight?.itineraries?.[0]?.segments || [];
    const date = segments.length ? segments[segments.length - 1]?.arrival?.at : null;
    return this.getBucketFromDate(date);
  }

  private getBucketFromDate(dateString: string): TimeBucket {
    const date = dateString ? new Date(dateString) : null;
    const hour = date ? date.getHours() : 0;
    if (hour < 6) {
      return 'early-morning';
    }
    if (hour < 12) {
      return 'morning';
    }
    if (hour < 18) {
      return 'afternoon';
    }
    return 'evening';
  }

  private getTotalDurationMinutes(flight: any): number {
    const itineraryDuration = flight?.itineraries?.[0]?.duration;
    if (!itineraryDuration || !itineraryDuration.startsWith('PT')) {
      return 0;
    }
    const hours = Number(itineraryDuration.match(/(\d+)H/)?.[1] || 0);
    const minutes = Number(itineraryDuration.match(/(\d+)M/)?.[1] || 0);
    return hours * 60 + minutes;
  }

  private isValidBucket(value: string): value is TimeBucket {
    return value === 'early-morning' || value === 'morning' || value === 'afternoon' || value === 'evening';
  }
}
