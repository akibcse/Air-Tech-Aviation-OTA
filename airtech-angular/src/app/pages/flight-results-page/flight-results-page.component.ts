import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FlightSearchFormComponent } from '../../components/flight-search-form/flight-search-form.component';
import { FlightResultsComponent } from '../../components/flight-results/flight-results.component';
import { SearchStateService } from '../../services/search-state.service';
import { FlightService } from '../../services/flight.service';
import { LucideAngularModule, Filter, ArrowUpDown, ChevronDown, ChevronUp, Search } from 'lucide-angular';

@Component({
  selector: 'app-flight-results-page',
  standalone: true,
  imports: [
    CommonModule,
    FlightSearchFormComponent,
    FlightResultsComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50 pb-12">
      <!-- Top Search Bar (Collapsible) -->
      <div class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Toggle Button -->
          <button 
            (click)="toggleSearchPanel()"
            class="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg px-2"
          >
            <div class="flex items-center gap-3">
              <lucide-icon [name]="searchIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
              <div>
                <h3 class="font-bold text-gray-900">Modify Search</h3>
                <p class="text-xs text-gray-500">Click to {{ showSearchPanel() ? 'hide' : 'show' }} search options</p>
              </div>
            </div>
            <lucide-icon 
              [name]="showSearchPanel() ? chevronUpIcon : chevronDownIcon" 
              class="w-5 h-5 text-gray-400"
            ></lucide-icon>
          </button>
          
          <!-- Collapsible Search Form -->
          @if (showSearchPanel()) {
            <div class="py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <app-flight-search-form></app-flight-search-form>
            </div>
          }
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col lg:flex-row gap-6">
          
          <!-- Filters Sidebar (Desktop) -->
          <div class="hidden lg:block w-64 flex-shrink-0 space-y-6">
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-gray-900 flex items-center gap-2">
                  <lucide-icon [name]="filterIcon" class="w-4 h-4"></lucide-icon> Filters
                </h3>
                <button class="text-xs text-blue-600 hover:underline">Reset</button>
              </div>
              
              <!-- Placeholder for filters -->
              <div class="space-y-4">
                <div>
                   <h4 class="text-sm font-semibold text-gray-700 mb-2">Stops</h4>
                   <div class="space-y-2">
                     <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> Direct
                     </label>
                     <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> 1 Stop
                     </label>
                     <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"> 2+ Stops
                     </label>
                   </div>
                </div>

                <div class="border-t border-gray-100 pt-4">
                   <h4 class="text-sm font-semibold text-gray-700 mb-2">Price Range</h4>
                   <input type="range" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                   <div class="flex justify-between text-xs text-gray-500 mt-1">
                     <span>Min</span>
                     <span>Max</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Results Area -->
          <div class="flex-1">
            <!-- Sorting Tabs -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6 flex">
               <button class="flex-1 py-3 px-4 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg flex items-center justify-center gap-2">
                 Cheapest <span class="text-xs font-normal text-gray-500">TODO</span>
               </button>
               <button class="flex-1 py-3 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                 Fastest <span class="text-xs font-normal text-gray-500">TODO</span>
               </button>
               <button class="flex-1 py-3 px-4 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                 Best <span class="text-xs font-normal text-gray-500">TODO</span>
               </button>
            </div>

            <app-flight-results 
              [flights]="results()" 
              [loading]="loading()"
            ></app-flight-results>
          </div>

        </div>
      </div>
    </div>
  `
})
export class FlightResultsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private searchState = inject(SearchStateService);
  private flightService = inject(FlightService);

  results = signal<any[]>([]);
  loading = signal(false);
  showSearchPanel = signal(false); // Hidden by default

  // Icons
  filterIcon = Filter;
  sortIcon = ArrowUpDown;
  searchIcon = Search;
  chevronDownIcon = ChevronDown;
  chevronUpIcon = ChevronUp;

  toggleSearchPanel() {
    this.showSearchPanel.set(!this.showSearchPanel());
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // 1. Hydrate state from URL if needed (optional if state service is singleton, 
      // but good for deep linking/refresh)
      this.hydrateState(params);

      // 2. Trigger search
      this.performSearch(params);
    });
  }

  hydrateState(params: any) {
    // If we have params, we should update the search state so the form reflects the current search
    // accessible via URL.
    if (Object.keys(params).length === 0) return;

    const newState: any = {
      tripType: params.tripType || 'return',
      travellers: {
        adults: Number(params.adults) || 1,
        childrenCount: Number(params.children) || 0,
        cabin: (params.cabin || 'Economy').charAt(0) + (params.cabin || 'economy').slice(1).toLowerCase()
      },
      directOnly: params.direct === 'true',
      returnDate: params.returnDate || ''
    };

    // Parsing segments
    if (params.tripType === 'multi-city' && params.segments) {
      try {
        const parsed = JSON.parse(params.segments);
        newState.segments = parsed.map((s: any) => ({
          origin: { iata: s.o, display: s.o }, // We might need to fetch display names... 
          destination: { iata: s.d, display: s.d },
          date: s.t
        }));
      } catch (e) {
        console.error("Failed to parse segments", e);
      }
    } else if (params.origin) {
      newState.segments = [{
        origin: { iata: params.origin, display: params.origin },
        destination: { iata: params.destination, display: params.destination },
        date: params.date
      }];
    }

    this.searchState.updateState(newState);
  }

  performSearch(params: any) {
    if (Object.keys(params).length === 0) {
      console.warn('⚠️ No search params provided');
      return;
    }

    console.log('🔍 Starting search with params:', params);
    this.loading.set(true);
    this.results.set([]); // Clear previous

    this.flightService.searchFlights(params).subscribe({
      next: (data) => {
        console.log('✅ Search results received:', data.length, 'flights');
        this.results.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ Search failed:', err);
        this.loading.set(false);
      }
    });
  }
}
