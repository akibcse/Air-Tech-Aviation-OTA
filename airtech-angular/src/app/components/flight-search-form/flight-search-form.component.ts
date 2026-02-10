import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowRight, ArrowLeftRight, Loader2, Plus, Minus, Search, CalendarDays, Users } from 'lucide-angular';
import { PassengerSelectorComponent } from '../passenger-selector/passenger-selector.component';
import { AirportAutocompleteComponent } from '../airport-autocomplete/airport-autocomplete.component';
import { SearchStateService } from '../../services/search-state.service';

@Component({
  selector: 'app-flight-search-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PassengerSelectorComponent,
    AirportAutocompleteComponent
  ],
  template: `
    <div class="space-y-4 text-gray-900 transition-all duration-300 ease-in-out" [class.opacity-50]="isCollapsed && !isHovered" (mouseenter)="isHovered = true" (mouseleave)="isHovered = false">
      <!-- Collapsed View Summary -->
      @if (isCollapsed) {
        <div (click)="toggleCollapse()" class="bg-white p-4 rounded-xl shadow-sm border border-blue-100 cursor-pointer hover:shadow-md flex justify-between items-center group">
          <div class="flex items-center gap-4">
             <div class="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                <lucide-icon [name]="searchIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
             </div>
             <div>
                <p class="font-bold text-gray-900 text-sm">
                   {{ state().segments[0].origin.display.split('(')[0] }} 
                   <span class="text-gray-400 mx-1">→</span> 
                   {{ state().segments[0].destination.display.split('(')[0] }}
                   @if (state().tripType === 'multi-city') { <span class="text-xs text-gray-500 font-medium ml-1">(+{{ state().segments.length - 1 }} legs)</span> }
                </p>
                <p class="text-xs text-gray-500">
                   {{ state().segments[0].date | date:'mediumDate' }} • 
                   {{ state().travellers.adults + state().travellers.childrenCount }} Passenger(s) • 
                   {{ state().travellers.cabin }}
                </p>
             </div>
          </div>
          <button class="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline">Modify Search</button>
        </div>
      } @else {
      <div class="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 md:p-4 shadow-sm overflow-visible">
        <div role="tablist" aria-label="Trip type" class="mb-4 inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-white p-1 gap-1 overflow-x-auto">
          @for (tab of tripTabs; track tab.id) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="state().tripType === tab.id"
              [attr.tabindex]="state().tripType === tab.id ? 0 : -1"
              (click)="updateTripType(tab.id)"
              [class]="'min-h-11 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' + (state().tripType === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100')"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="space-y-4 overflow-visible">
          @if (state().tripType !== 'multi-city') {
            <div class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-end rounded-xl border border-slate-200 bg-white p-3 overflow-visible">
                <div class="min-w-0">
                  <app-airport-autocomplete
                    label="From"
                    [value]="state().segments[0].origin.display"
                    (selected)="onLocationSelected(0, 'origin', $event)"
                    [required]="true"
                  ></app-airport-autocomplete>
                </div>

                <div class="flex items-center justify-center">
                  <button
                    type="button"
                    (click)="swapLocations(0)"
                    class="w-11 h-11 rounded-full border border-slate-300 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 inline-flex items-center justify-center"
                    aria-label="Swap origin and destination"
                  >
                    <lucide-icon [name]="swapIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>

                <div class="min-w-0">
                  <app-airport-autocomplete
                    label="To"
                    [value]="state().segments[0].destination.display"
                    (selected)="onLocationSelected(0, 'destination', $event)"
                    [required]="true"
                  ></app-airport-autocomplete>
                </div>

                <div class="min-w-0 space-y-2">
                  <label class="text-xs font-semibold text-slate-600 inline-flex items-center gap-1">
                    <lucide-icon [name]="calendarIcon" class="w-3.5 h-3.5"></lucide-icon>
                    Journey Date
                  </label>
                  <div [class]="state().tripType === 'return' ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'grid grid-cols-1'">
                    <div class="relative">
                      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <lucide-icon [name]="calendarIcon" class="w-4 h-4"></lucide-icon>
                      </span>
                      <input
                        type="date"
                        [(ngModel)]="state().segments[0].date"
                        (change)="syncState()"
                        required
                        class="w-full h-12 pl-10 pr-4 bg-white border border-slate-300 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>

                    @if (state().tripType === 'return') {
                      <div class="relative">
                        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                          <lucide-icon [name]="calendarIcon" class="w-4 h-4"></lucide-icon>
                        </span>
                        <input
                          type="date"
                          [ngModel]="state().returnDate"
                          (ngModelChange)="searchState.updateState({ returnDate: $event })"
                          class="w-full h-12 pl-10 pr-4 bg-white border border-slate-300 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        />
                      </div>
                    }
                  </div>

                  @if (state().segments[0].date) {
                    <p class="text-[11px] text-slate-500">
                      <span class="hidden sm:inline">{{ state().segments[0].date | date:'EEEE, d MMM y' }}</span>
                      <span class="sm:hidden">{{ state().segments[0].date | date:'EEE, d MMM' }}</span>
                    </p>
                  }
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                <div class="min-w-0 space-y-2">
                  <label class="text-xs font-semibold text-slate-600 inline-flex items-center gap-1">
                    <lucide-icon [name]="usersIcon" class="w-3.5 h-3.5"></lucide-icon>
                    Cabin + Travelers
                  </label>
                  <app-passenger-selector
                    [adults]="state().travellers.adults"
                    [childrenCount]="state().travellers.childrenCount"
                    [cabin]="state().travellers.cabin"
                    (onChange)="updateTravellers($event)"
                  ></app-passenger-selector>
                </div>

                <button
                  (click)="handleSearch()"
                  [disabled]="loading || !state().segments[0].origin.iata || !state().segments[0].destination.iata || !state().segments[0].date"
                  class="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all inline-flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-70"
                >
                  @if (loading) {
                    <lucide-icon [name]="loaderIcon" class="w-5 h-5 animate-spin"></lucide-icon>
                  } @else {
                    Search <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                  }
                </button>
              </div>
            </div>
          } @else {
            <div class="space-y-3">
              @for (segment of state().segments; track $index; let i = $index) {
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 items-end rounded-xl border border-slate-200 bg-white p-3 overflow-visible">
                  <div class="min-w-0">
                    <app-airport-autocomplete
                      label="From"
                      [value]="segment.origin.display"
                      (selected)="onLocationSelected(i, 'origin', $event)"
                      [required]="true"
                    ></app-airport-autocomplete>
                  </div>

                  <div class="min-w-0">
                    <app-airport-autocomplete
                      label="To"
                      [value]="segment.destination.display"
                      (selected)="onLocationSelected(i, 'destination', $event)"
                      [required]="true"
                    ></app-airport-autocomplete>
                  </div>

                  <div class="min-w-0 space-y-1.5">
                    <label class="text-xs font-semibold text-slate-600 inline-flex items-center gap-1">
                      <lucide-icon [name]="calendarIcon" class="w-3.5 h-3.5"></lucide-icon>
                      Journey Date
                    </label>
                    <div class="relative">
                      <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <lucide-icon [name]="calendarIcon" class="w-4 h-4"></lucide-icon>
                      </span>
                      <input
                        type="date"
                        [(ngModel)]="segment.date"
                        (change)="syncState()"
                        required
                        class="w-full h-12 pl-10 pr-4 bg-white border border-slate-300 rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div class="h-12 flex items-center gap-2 justify-start xl:justify-end">
                    <button
                      type="button"
                      (click)="removeSegment(i)"
                      [disabled]="state().segments.length <= 1"
                      class="w-11 h-11 rounded-full border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
                      aria-label="Remove city"
                    >
                      <lucide-icon [name]="minusIcon" class="w-4 h-4"></lucide-icon>
                    </button>
                    <button
                      type="button"
                      (click)="addSegment()"
                      [disabled]="state().segments.length >= 5"
                      class="w-11 h-11 rounded-full border border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center"
                      aria-label="Add city"
                    >
                      <lucide-icon [name]="plusIcon" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
              }

              <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-end">
                <div class="min-w-0 space-y-2">
                  <label class="text-xs font-semibold text-slate-600 inline-flex items-center gap-1">
                    <lucide-icon [name]="usersIcon" class="w-3.5 h-3.5"></lucide-icon>
                    Cabin + Travelers
                  </label>
                  <app-passenger-selector
                    [adults]="state().travellers.adults"
                    [childrenCount]="state().travellers.childrenCount"
                    [cabin]="state().travellers.cabin"
                    (onChange)="updateTravellers($event)"
                  ></app-passenger-selector>
                </div>

                <button
                  (click)="handleSearch()"
                  [disabled]="loading || hasIncompleteSegments()"
                  class="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition-all inline-flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-70"
                >
                  @if (loading) {
                    <lucide-icon [name]="loaderIcon" class="w-5 h-5 animate-spin"></lucide-icon>
                  } @else {
                    Search <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                  }
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-3 md:p-4">
        <div class="flex flex-wrap items-center gap-4">
          <label class="text-sm font-medium text-slate-700 inline-flex items-center gap-2">
            <input
              type="radio"
              [checked]="state().fareType === 'regular'"
              (change)="updateFareType('regular')"
              class="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            Regular Fare
          </label>
          <label class="text-sm font-medium text-slate-700 inline-flex items-center gap-2">
            <input
              type="radio"
              [checked]="state().fareType === 'bg-umrah'"
              (change)="updateFareType('bg-umrah')"
              class="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
            />
            BG Umrah Fare
            <span class="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">New</span>
          </label>
        </div>
      </div>

      <!-- Footer Controls -->
      <div class="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-50 mt-4">
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
          <input type="checkbox" [(ngModel)]="state().addHotel" (change)="syncState()" name="addHotel" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Add a hotel
        </label>
        <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
          <input type="checkbox" [(ngModel)]="state().directOnly" (change)="syncState()" name="directOnly" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Direct flights only
        </label>
      </div>
      }
    </div>
  `
})
export class FlightSearchFormComponent implements OnInit {
  private router = inject(Router);
  public searchState = inject(SearchStateService);

  state = this.searchState.state;
  loading = false;
  isCollapsed = false;
  isHovered = false;

  tripTabs = [
    { id: 'one-way' as const, label: 'One Way' },
    { id: 'return' as const, label: 'Round Way' },
    { id: 'multi-city' as const, label: 'Multi Way' }
  ];

  // Icons
  arrowRightIcon = ArrowRight;
  swapIcon = ArrowLeftRight;
  loaderIcon = Loader2;
  plusIcon = Plus;
  minusIcon = Minus;
  searchIcon = Search;
  calendarIcon = CalendarDays;
  usersIcon = Users;

  ngOnInit() {
    // Return date is now handled via state signal
  }

  syncState() {
    this.searchState.updateState(this.state());
  }

  updateTripType(type: 'return' | 'one-way' | 'multi-city') {
    const currentSegments = [...this.state().segments];
    if (type === 'multi-city') {
      if (currentSegments.length === 1) {
        currentSegments.push({ origin: { iata: '', display: '' }, destination: { iata: '', display: '' }, date: '' });
      }
    } else {
      // Revert to single segment
      currentSegments.splice(1);
    }
    this.searchState.updateState({ tripType: type, segments: currentSegments });
  }

  updateTravellers(travellers: any) {
    this.searchState.updateState({ travellers });
  }

  updateFareType(fareType: 'regular' | 'bg-umrah') {
    this.searchState.updateState({ fareType });
  }

  hasIncompleteSegments() {
    return this.state().segments.some((s) => !s.origin.iata || !s.destination.iata || !s.date);
  }

  onLocationSelected(index: number, type: 'origin' | 'destination', loc: any) {
    const segments = [...this.state().segments];
    segments[index][type] = { iata: loc.iata, display: `${loc.city} (${loc.iata})` };
    this.searchState.setSegments(segments);
  }

  swapLocations(index: number) {
    const segments = [...this.state().segments];
    const temp = segments[index].origin;
    segments[index].origin = segments[index].destination;
    segments[index].destination = temp;
    this.searchState.setSegments(segments);
  }

  addSegment() {
    const segments = [...this.state().segments];
    if (segments.length < 5) {
      segments.push({ origin: { iata: '', display: '' }, destination: { iata: '', display: '' }, date: '' });
      this.searchState.setSegments(segments);
    }
  }

  removeSegment(index: number) {
    const segments = [...this.state().segments];
    segments.splice(index, 1);
    this.searchState.setSegments(segments);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  handleSearch() {
    this.isCollapsed = true;
    const current = this.state();
    if (current.segments.some(s => !s.origin.iata || !s.destination.iata || !s.date)) {
      alert("Please fill in all search fields");
      return;
    }

    this.loading = true;

    const first = current.segments[0];
    const params: any = {
      tripType: current.tripType,
      origin: first.origin.iata,
      destination: first.destination.iata,
      date: first.date,
      adults: current.travellers.adults,
      children: current.travellers.childrenCount,
      cabin: current.travellers.cabin.toUpperCase(),
      direct: current.directOnly ? 'true' : 'false'
    };

    if (current.tripType === 'return') {
      params.returnDate = current.returnDate;
    }

    if (current.tripType === 'multi-city') {
      params.segments = JSON.stringify(current.segments.map(s => ({
        o: s.origin.iata,
        d: s.destination.iata,
        t: s.date
      })));
    }

    console.log("✈️ Performing Search with Params:", params);

    // Navigate to new results page
    this.router.navigate(['/search'], { queryParams: params }).then(() => {
      this.loading = false;
      // Do not collapse here, let the results page handle UI state if needed,
      // or keep it collapsed. The requirement says "Search opens new results page".
    });
  }
}
