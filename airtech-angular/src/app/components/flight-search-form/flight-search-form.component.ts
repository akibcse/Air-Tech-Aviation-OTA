import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, ArrowRight, ArrowLeftRight, Loader2, Plus, Trash2, Search } from 'lucide-angular';
import { TripTypeSelectorComponent } from '../trip-type-selector/trip-type-selector.component';
import { PassengerSelectorComponent } from '../passenger-selector/passenger-selector.component';
import { AirportAutocompleteComponent } from '../airport-autocomplete/airport-autocomplete.component';
import { SearchStateService, FlightSegment } from '../../services/search-state.service';

@Component({
  selector: 'app-flight-search-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TripTypeSelectorComponent,
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
      <!-- Top Controls: Trip Type & Passengers -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <app-trip-type-selector 
          [value]="state().tripType" 
          (onChange)="updateTripType($event)">
        </app-trip-type-selector>
        <app-passenger-selector
          [adults]="state().travellers.adults"
          [childrenCount]="state().travellers.childrenCount"
          [cabin]="state().travellers.cabin"
          (onChange)="updateTravellers($event)"
        ></app-passenger-selector>
      </div>

      <!-- Main Search Area -->
      <div class="space-y-3">
        @for (segment of state().segments; track $index; let i = $index) {
          <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
            <!-- Origin & Destination -->
            <div class="md:col-span-7 grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2 items-center">
              <div class="relative z-30">
                <app-airport-autocomplete
                  label="From"
                  [value]="segment.origin.display"
                  (selected)="onLocationSelected(i, 'origin', $event)"
                  [required]="true"
                ></app-airport-autocomplete>
              </div>

              <button
                type="button"
                (click)="swapLocations(i)"
                [disabled]="state().tripType === 'multi-city'"
                class="hidden sm:flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-600 transition-colors z-40 -ml-4 -mr-4 border-2 border-white disabled:opacity-0"
              >
                <lucide-icon [name]="swapIcon" class="w-4 h-4"></lucide-icon>
              </button>

              <div class="relative z-20">
                <app-airport-autocomplete
                  label="To"
                  [value]="segment.destination.display"
                  (selected)="onLocationSelected(i, 'destination', $event)"
                  [required]="true"
                ></app-airport-autocomplete>
              </div>
            </div>

            <!-- Date(s) -->
            <div [class]="state().tripType === 'return' && i === 0 ? 'md:col-span-4 grid grid-cols-2 gap-2' : 'md:col-span-3'">
              <div class="relative group">
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-gray-500 group-focus-within:text-blue-600 transition-colors z-10">Depart</label>
                <input
                  type="date"
                  [(ngModel)]="segment.date"
                  (change)="syncState()"
                  required
                  class="w-full h-12 pl-4 pr-4 bg-white border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

                @if (state().tripType === 'return' && i === 0) {
                <div class="relative group">
                  <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-gray-500 group-focus-within:text-blue-600 transition-colors z-10">Return</label>
                  <input
                    type="date"
                    [ngModel]="state().returnDate"
                    (ngModelChange)="searchState.updateState({ returnDate: $event })"
                    class="w-full h-12 pl-4 pr-4 bg-white border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              }
            </div>

            <!-- Multi-city Actions (Add/Remove) -->
            @if (state().tripType === 'multi-city') {
              <div class="md:col-span-2 flex gap-2">
                @if (state().segments.length > 1) {
                  <button (click)="removeSegment(i)" class="h-12 w-12 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors">
                    <lucide-icon [name]="trashIcon" class="w-5 h-5"></lucide-icon>
                  </button>
                }
                @if (i === state().segments.length - 1 && state().segments.length < 5) {
                  <button (click)="addSegment()" type="button" class="h-12 flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold text-sm transition-colors border border-blue-100 flex items-center justify-center gap-2">
                    <lucide-icon [name]="plusIcon" class="w-4 h-4"></lucide-icon> Add Flight
                  </button>
                }
              </div>
            }

            <!-- Search Button (Only for Single Segment or Last Row) -->
            @if (state().tripType !== 'multi-city' || i === state().segments.length - 1) {
              <div [class]="state().tripType === 'multi-city' ? 'md:hidden' : 'md:col-span-1'">
                <!-- Only visible on mobile in multi-city, or as part of grid in single rows -->
              </div>
              @if (state().tripType !== 'multi-city') {
                <div class="md:col-span-1">
                  <button
                    (click)="handleSearch()"
                    [disabled]="loading"
                    class="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-blue-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
                  >
                    @if (loading) {
                      <lucide-icon [name]="loaderIcon" class="w-5 h-5 animate-spin"></lucide-icon>
                    } @else {
                      <lucide-icon [name]="arrowRightIcon" class="w-5 h-5"></lucide-icon>
                    }
                  </button>
                </div>
              }
            }
          </div>
        }
      </div>

      <!-- Multi-city Search Button (Desktop) -->
      @if (state().tripType === 'multi-city') {
        <div class="flex justify-end pt-2">
          <button
            (click)="handleSearch()"
            [disabled]="loading"
            class="px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg shadow-blue-200 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
          >
            @if (loading) {
              <lucide-icon [name]="loaderIcon" class="w-6 h-6 animate-spin"></lucide-icon>
            } @else {
              Search Flights <lucide-icon [name]="arrowRightIcon" class="w-5 h-5"></lucide-icon>
            }
          </button>
        </div>
      }

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
  private activeRoute = inject(ActivatedRoute);
  public searchState = inject(SearchStateService);

  state = this.searchState.state;
  loading = false;
  isCollapsed = false;
  isHovered = false;

  // Icons
  arrowRightIcon = ArrowRight;
  swapIcon = ArrowLeftRight;
  loaderIcon = Loader2;
  plusIcon = Plus;
  trashIcon = Trash2;
  searchIcon = Search;

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
