import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowRight, ArrowLeftRight, Loader2, Plus, Minus, Search, CalendarDays, Users, Globe2, MapPin } from 'lucide-angular';

import { PassengerSelectorComponent } from '../passenger-selector/passenger-selector.component';
import { AirportAutocompleteComponent } from '../airport-autocomplete/airport-autocomplete.component';
import { SearchStateService } from '../../services/search-state.service';
import { UiService } from '../../services/ui.service';
import { MobileDatePickerComponent } from '../mobile-date-picker/mobile-date-picker.component';

@Component({
  selector: 'app-flight-search-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PassengerSelectorComponent,
    AirportAutocompleteComponent,
    MobileDatePickerComponent
  ],
  template: `
    <div class="transition-all duration-300 ease-in-out font-sans">
      @if (isCollapsed) {
        <div (click)="toggleCollapse()" class="bg-white p-4 rounded-xl shadow-md border border-slate-200 cursor-pointer hover:shadow-lg flex justify-between items-center group transition-shadow">
          <div class="flex items-center gap-4">
             <div class="bg-white border border-slate-200 p-2.5 rounded-full shadow-sm">
                <lucide-icon [name]="searchIcon" class="w-5 h-5 text-slate-700"></lucide-icon>
             </div>
             <div>
                <p class="font-bold text-slate-800 text-sm">
                   {{ state().segments[0].origin.display.split('(')[0] || 'Origin' }} 
                   <span class="text-slate-400 mx-1">→</span> 
                   {{ state().segments[0].destination.display.split('(')[0] || 'Destination' }}
                   @if (state().tripType === 'multi-city') { <span class="text-xs text-slate-500 font-medium ml-1">(+{{ state().segments.length - 1 }} legs)</span> }
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                   {{ state().segments[0].date | date:'MMM d' }}
                   @if (state().tripType === 'return' && state().returnDate) { - {{ state().returnDate | date:'MMM d' }} } • 
                   {{ state().travellers.adults + state().travellers.childrenCount }} Passenger(s) • 
                   {{ state().travellers.cabin }}
                </p>
             </div>
          </div>
          <button class="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">Edit</button>
        </div>
      } @else {
      <div class="relative bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-slate-200 p-4 pt-5 pb-10 max-w-5xl mx-auto">
        
        <!-- Top Selectors Row -->
        <div class="flex flex-wrap items-center gap-4 mb-4 overflow-visible">
          <!-- Trip Type Selector -->
          <div class="relative group dropdown-container">
            <select
              [ngModel]="state().tripType"
              (ngModelChange)="updateTripType($event)"
              class="appearance-none bg-transparent hover:bg-slate-50 pl-3 pr-8 py-2 rounded-md text-sm font-medium text-slate-700 border-none focus:ring-0 cursor-pointer transition-colors"
            >
              @for (tab of tripTabs; track tab.id) {
                <option [value]="tab.id">{{ tab.label }}</option>
              }
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-500">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <!-- Passenger Selector -->
          <div class="relative z-[2100]">
            <app-passenger-selector
              [adults]="state().travellers.adults"
              [childrenCount]="state().travellers.childrenCount"
              [cabin]="state().travellers.cabin"
              (onChange)="updateTravellers($event)"
              [showCabin]="true"
            ></app-passenger-selector>
          </div>
        </div>

        <!-- Input Row -->
        <div class="space-y-4">
          @if (state().tripType !== 'multi-city') {
            <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center relative">
              
<!-- Location Inputs Wrapper (Rounded border for group) -->
              <div class="flex flex-col md:flex-row items-center border border-slate-300 rounded-xl relative group focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white shadow-sm hover:shadow transition-shadow p-3 pt-4 relative">
                <!-- Swap button - repositioned to not overlap inputs -->
                <button
                  type="button"
                  (click)="swapLocations(0)"
                  class="absolute left-1/2 -translate-x-1/2 top-3 md:top-4 z-20 w-8 h-8 rounded-full border border-slate-200 bg-white shadow-md text-slate-500 hover:text-blue-600 hover:bg-slate-50 inline-flex items-center justify-center transition-all hover:scale-105"
                  aria-label="Swap origin and destination"
                >
                  <lucide-icon [name]="swapIcon" class="w-4 h-4"></lucide-icon>
                </button>
                
                <div class="w-full md:w-1/2 pr-2 md:pr-8">
                   <app-airport-autocomplete
                      label="Origin"
                      placeholder="Origin"
                      [value]="state().segments[0].origin.display"
                      (selected)="onLocationSelected(0, 'origin', $event)"
                      [required]="true"
                      variant="minimal"
                      class="block w-full"
                    ></app-airport-autocomplete>
                </div>

                <div class="w-full md:w-1/2 pl-2 md:pl-8 pt-2 md:pt-0">
                  <app-airport-autocomplete
                    label="Destination"
                    placeholder="Destination"
                    [value]="state().segments[0].destination.display"
                    (selected)="onLocationSelected(0, 'destination', $event)"
                    [required]="true"
                    variant="minimal"
                    class="block w-full"
                  ></app-airport-autocomplete>
                </div>
              </div>

              <div class="hidden lg:block w-0.5"></div>

              <!-- Date Picker Group -->
              <div class="flex flex-col md:flex-row items-center border border-slate-300 rounded-xl relative group focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white shadow-sm hover:shadow transition-shadow">
                <div class="w-full relative px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors rounded-l-xl" (click)="openDatePicker($event, 'departure', 0)">
                  <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Departure</label>
                  <div class="w-full bg-transparent text-slate-900 border-none p-0 font-medium cursor-pointer">
                    {{ state().segments[0].date ? (state().segments[0].date | date:'EEE, MMM d, yyyy') : 'Add date' }}
                  </div>
                </div>
                
                @if (state().tripType !== 'multi-city') {
                  <div class="w-full relative px-4 py-2 border-t border-slate-200 md:border-t-0 md:border-l cursor-pointer hover:bg-slate-50 transition-colors rounded-r-xl group-focus-within:border-l-blue-500" 
                       (click)="state().tripType === 'one-way' ? updateTripType('return') : openDatePicker($event, 'return', 0)">
                    <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Return</label>
                    <div class="w-full bg-transparent text-slate-900 border-none p-0 font-medium cursor-pointer" [class.text-slate-400]="!state().returnDate || state().tripType === 'one-way'">
                      {{ state().tripType === 'one-way' ? 'Add return' : (state().returnDate ? (state().returnDate | date:'EEE, MMM d, yyyy') : 'Add date') }}
                    </div>
                  </div>
                }
              </div>

            </div>
          } @else {
            <div class="space-y-4">
              @for (segment of state().segments; track $index; let i = $index) {
                <div class="flex flex-col md:flex-row gap-2 relative">
                  <div class="flex-1 flex flex-col md:flex-row border border-slate-300 rounded-xl bg-white shadow-sm hover:shadow focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all relative">
                    <div class="w-full relative">
                      <app-airport-autocomplete
                        label="Origin"
                        placeholder="Origin"
                        [value]="segment.origin.display"
                        (selected)="onLocationSelected(i, 'origin', $event)"
                        [required]="true"
                        variant="minimal"
                        class="block w-full"
                      ></app-airport-autocomplete>
                    </div>
                    <div class="w-full relative border-t border-slate-200 md:border-t-0 md:border-l md:pl-0 pt-2 md:pt-0">
                      <app-airport-autocomplete
                        label="Destination"
                        placeholder="Destination"
                        [value]="segment.destination.display"
                        (selected)="onLocationSelected(i, 'destination', $event)"
                        [required]="true"
                        variant="minimal"
                        class="block w-full"
                      ></app-airport-autocomplete>
                    </div>
                  </div>
                  
                  <div class="flex-1 md:flex-none md:w-56 border border-slate-300 rounded-xl bg-white shadow-sm hover:shadow focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 px-4 py-2 transition-all cursor-pointer" (click)="openDatePicker($event, 'departure', i)">
                     <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Departure</label>
                      <div class="w-full bg-transparent text-slate-900 border-none p-0 font-medium h-6 cursor-pointer">
                        {{ segment.date ? (segment.date | date:'EEE, MMM d, yyyy') : 'Add date' }}
                      </div>
                  </div>
                  
                  <div class="flex items-center gap-1 justify-end">
                    <button type="button" (click)="removeSegment(i)" [disabled]="state().segments.length <= 1" class="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"><lucide-icon [name]="xIcon" class="w-5 h-5"></lucide-icon></button>
                  </div>
                </div>
              }
              <div class="px-2">
                 <button (click)="addSegment()" [disabled]="state().segments.length >= 5" class="text-blue-600 font-bold text-sm flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-full transition-colors">
                    <lucide-icon [name]="plusIcon" class="w-4 h-4"></lucide-icon> Add flight
                 </button>
              </div>
            </div>
          }
        </div>

        <!-- Absolute Centered Search Button -->
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 z-[40]">
          <button
            (click)="handleSearch()"
            [disabled]="loading || hasIncompleteSegments()"
            class="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none min-w-[140px]"
          >
            @if (loading) {
              <lucide-icon [name]="loaderIcon" class="w-5 h-5 animate-spin"></lucide-icon>
            } @else {
              <lucide-icon [name]="searchIcon" class="w-4 h-4"></lucide-icon> Search
            }
          </button>
        </div>
      </div>
      
      <!-- Quick Suggestions & Extras -->
      @if (!isCollapsed && !loading) {
      <div class="mt-14 px-2 max-w-5xl mx-auto animate-fade-in relative z-0">
        <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
           <lucide-icon [name]="globeIcon" class="w-5 h-5 text-blue-500"></lucide-icon>
           Popular Flights from Bangladesh
        </h3>
        <div class="flex flex-wrap gap-3">
          @for (dest of popularDestinations; track dest.city) {
            <button (click)="presetDestination(dest)" class="flex items-center truncate w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33%-0.5rem)] rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-400 hover:shadow shadow-sm transition-all group overflow-hidden">
               <div class="flex items-center gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                     <lucide-icon [name]="pinIcon" class="w-5 h-5 text-slate-500 group-hover:text-blue-600"></lucide-icon>
                  </div>
                  <div class="text-left w-full truncate space-y-0.5">
                     <p class="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{{ dest.city }}</p>
                     <p class="text-xs font-semibold text-slate-500">{{ dest.iata }}</p>
                  </div>
               </div>
            </button>
          }
        </div>
        
        <div class="mt-8 rounded-2xl overflow-hidden relative min-h-[140px] flex items-center bg-gradient-to-r from-blue-900 to-indigo-800 shadow-lg shadow-indigo-500/10 border border-indigo-200">
           <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 hidden md:block"></div>
           <div class="relative z-10 p-6 sm:p-8 flex items-center w-full justify-between">
              <div>
                 <h4 class="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Explore destinations</h4>
                 <p class="text-blue-100 text-sm max-w-md font-medium leading-relaxed">Find the perfect flight matching your schedule and budget without leaving the grid.</p>
              </div>
              <button class="hidden sm:block shrink-0 bg-white text-blue-900 px-6 py-3 rounded-full font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors">See Deals</button>
           </div>
        </div>
      </div>
      }
      }
    </div>
    
    <!-- Render the calendar popover / modal here -->
    <app-mobile-date-picker></app-mobile-date-picker>
  `
})
export class FlightSearchFormComponent implements OnInit {
  private router = inject(Router);
  public searchState = inject(SearchStateService);
  public ui = inject(UiService);

  state = this.searchState.state;
  loading = false;
  isCollapsed = false;

  tripTabs = [
    { id: 'return' as const, label: 'Round trip' },
    { id: 'one-way' as const, label: 'One way' },
    { id: 'multi-city' as const, label: 'Multi-city' }
  ];

  popularDestinations = [
    { iata: 'DXB', city: 'Dubai' },
    { iata: 'CXB', city: "Cox's Bazar" },
    { iata: 'KUL', city: 'Kuala Lumpur' },
    { iata: 'JED', city: 'Jeddah' },
    { iata: 'SIN', city: 'Singapore' },
    { iata: 'DOH', city: 'Doha' }
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
  globeIcon = Globe2;
  pinIcon = MapPin;
  xIcon = Minus; 

  ngOnInit() { }

  presetDestination(dest: any) {
    const segments = [...this.state().segments];
    segments[0].destination = { iata: dest.iata, display: `${dest.city} (${dest.iata})` };
    this.searchState.setSegments(segments);
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
      currentSegments.splice(1);
    }
    this.searchState.updateState({ tripType: type, segments: currentSegments });
  }

  updateTravellers(travellers: any) {
    this.searchState.updateState({ travellers });
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

  openDatePicker(event: any, type: 'departure' | 'return', index: number = 0) {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    this.ui.openDatePicker(type, rect, index);
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

    this.router.navigate(['/search'], { queryParams: params }).then(() => {
      this.loading = false;
    });
  }
}
