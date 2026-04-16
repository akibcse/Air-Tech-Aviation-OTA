import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArrowRight, CheckCircle, Clock3, LucideAngularModule, Plane, Star, ChevronDown, ChevronUp, Leaf } from 'lucide-angular';
import { BookingService } from '../../services/booking.service';
import { AirlineLogoComponent } from '../airline-logo/airline-logo.component';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AirlineLogoComponent],
  template: `
    <div class="space-y-4">
      @if (loading) {
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 transition-opacity duration-200 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold text-slate-700">Searching hundreds of flights...</p>
            <p class="font-black text-blue-700">{{ progress }}%</p>
          </div>
          <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out" [style.width.%]="progress"></div>
          </div>
        </div>

        <div class="space-y-4">
          @for (_ of [1,2,3,4,5]; track $index) {
            <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse flex items-center justify-between">
               <div class="flex items-center gap-4 w-1/2">
                  <div class="w-8 h-8 rounded-full bg-slate-100"></div>
                  <div class="flex-1 space-y-2">
                     <div class="h-3 bg-slate-100 rounded w-full"></div>
                     <div class="h-3 bg-slate-100 rounded w-2/3"></div>
                  </div>
               </div>
               <div class="h-6 bg-slate-100 rounded w-16"></div>
            </div>
          }
        </div>
      } @else if (error) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm font-semibold text-red-700 mb-2">Search interrupted</p>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      } @else if (flights.length === 0) {
        <div class="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <h3 class="text-xl font-bold text-slate-900 mb-2">No flights found</h3>
          <p class="text-sm text-slate-500">Try adjusting your filters or dates to see more options.</p>
        </div>
      } @else {
        @for (flight of flights; track flight.id || $index; let i = $index) {
          <article class="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 hover:shadow-md transition-shadow overflow-hidden group">
            
            <!-- Summary Row Grid -->
            <div 
               (click)="toggleDetails(flight.id || i.toString())"
               class="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              @for (itinerary of itineraries(flight); track $index; let itineraryIndex = $index) {
                <div class="flex-1 flex flex-wrap md:flex-nowrap items-center justify-between md:justify-start gap-4 md:gap-8">
                  
                  <!-- Airline & Times -->
                  <div class="flex items-start gap-4 min-w-[200px]">
                     <app-airline-logo [code]="itineraryAirlineCode(itinerary)" [showName]="false" class="mt-1"></app-airline-logo>
                     <div class="flex flex-col">
                        <span class="text-[15px] font-medium text-slate-900">
                           {{ itineraryDepartureTime(itinerary) }} <span class="text-slate-400 mx-1">–</span> {{ itineraryArrivalTime(itinerary) }}
                           @if (hasDayChange(itinerary)) {<sup class="text-[9px] text-blue-600 font-bold ml-0.5">+1</sup>}
                        </span>
                        <span class="text-xs text-slate-500 truncate max-w-[120px]">{{ itineraryAirlineNameFallback(itinerary) }}</span>
                     </div>
                  </div>

                  <!-- Duration & Routing -->
                  <div class="flex flex-col text-left md:text-center min-w-[70px]">
                     <span class="text-[15px] text-slate-900">{{ itineraryDurationLabel(itinerary) }}</span>
                     <span class="text-xs text-slate-500">{{ itineraryDepartureAirport(itinerary) }}–{{ itineraryArrivalAirport(itinerary) }}</span>
                  </div>

                  <!-- Stops -->
                  <div class="flex flex-col text-left md:text-center min-w-[90px]">
                     <span class="text-[15px] font-medium" [class]="itineraryStops(itinerary) === 0 ? 'text-slate-900' : 'text-slate-900'">
                        {{ itineraryStops(itinerary) === 0 ? 'Nonstop' : itineraryStops(itinerary) + ' stop' + (itineraryStops(itinerary) > 1 ? 's' : '') }}
                     </span>
                     <span class="text-[11px] text-slate-500 truncate max-w-[100px]">
                        @if (itineraryStops(itinerary) > 0) {
                           {{ briefLayovers(itinerary) }}
                        }
                     </span>
                  </div>

                  <!-- Emissions (Static mock to match Google flights spec) -->
                  <div class="hidden lg:flex flex-col text-left min-w-[100px]">
                     <span class="text-[15px] text-slate-900">2{{ priceValue(flight).toString().slice(0, 2) }} kg CO2e</span>
                     <span class="text-[11px] text-emerald-600 flex items-center gap-0.5"><lucide-icon [name]="leafIcon" class="w-3 h-3"></lucide-icon> -14% emissions</span>
                  </div>
                </div>
              }

              <!-- Pricing Row (Right Aligned) -->
              <div class="flex items-center justify-between md:justify-end gap-6 md:w-auto md:min-w-[140px] pl-0 md:pl-4 md:border-l md:border-slate-200">
                 <div class="flex flex-col md:items-end">
                    <span class="text-lg font-bold text-slate-900 whitespace-nowrap">BDT {{ priceValue(flight) | number }}</span>
                    <span class="text-[11px] text-slate-500">Round trip</span>
                 </div>
                 <button class="text-slate-400 group-hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-200">
                    <lucide-icon [name]="expandedFlightId === (flight.id || i.toString()) ? chevronUpIcon : chevronDownIcon" class="w-5 h-5"></lucide-icon>
                 </button>
              </div>
            </div>

            <!-- Expanded Section -->
            @if (expandedFlightId === (flight.id || i.toString())) {
              <div class="border-t border-slate-200 bg-white p-0 animate-in slide-in-from-top-2 duration-200">
                <div class="flex flex-col md:flex-row">
                  
                  <!-- Left side: Itinerary Segments -->
                  <div class="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                    <div class="space-y-8">
                       @for (itinerary of itineraries(flight); track $index; let itineraryIndex = $index) {
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 mb-4">{{ itineraryIndex === 0 ? 'Departure' : 'Return' }} • {{ itinerarySegments(itinerary)[0].departure.at | date:'EEE, MMM d' }}</h4>
                             
                             <div class="space-y-0 relative">
                               <div class="absolute top-2 bottom-2 left-2 w-0.5 bg-slate-200 rounded-full z-0"></div>
                               @for (segment of itinerarySegments(itinerary); track segment.id || $index; let segIndex = $index) {
                                 
                                 <!-- Departure Location -->
                                 <div class="relative z-10 pl-8 pb-4">
                                    <div class="absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 border border-white"></div>
                                    <div class="flex items-center gap-3">
                                       <span class="text-[15px] font-bold text-slate-900 w-12">{{ formatTime(segment.departure.at) }}</span>
                                       <span class="text-[15px] text-slate-900">{{ airportDisplay(segment.departure) }}</span>
                                    </div>
                                 </div>
                                 
                                 <!-- Flight Metdata Row -->
                                 <div class="relative z-10 pl-8 pb-4">
                                     <div class="flex items-start gap-4">
                                       <app-airline-logo [code]="segment.carrierCode" [showName]="false" class="w-5 h-5 mt-0.5"></app-airline-logo>
                                       <div class="text-[13px] text-slate-600 space-y-0.5">
                                          <p>Travel time: {{ formatDuration(segment.duration) }}</p>
                                          <p>{{ segment.carrierCode }} {{ segment.number }} • {{ segment.aircraft?.code || 'Aircraft' }} • Economy</p>
                                          <div class="flex items-center gap-3 mt-1.5 text-slate-500">
                                            <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg> Below average legroom (29 in)</span>
                                            <span class="flex items-center gap-1"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.906 14.142 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg> Wi-Fi (fee)</span>
                                          </div>
                                       </div>
                                     </div>
                                 </div>
                                 
                                 <!-- Arrival Location -->
                                 <div class="relative z-10 pl-8 pb-4">
                                    <div class="absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 border border-white"></div>
                                    <div class="flex items-center gap-3">
                                       <span class="text-[15px] font-bold text-slate-900 w-12">{{ formatTime(segment.arrival.at) }}</span>
                                       <span class="text-[15px] text-slate-900">{{ airportDisplay(segment.arrival) }}</span>
                                    </div>
                                 </div>

                                 <!-- Layover -->
                                 @if (segIndex < itinerarySegments(itinerary).length - 1) {
                                   <div class="relative z-10 pl-8 pb-4 pt-2 -ml-[2px]">
                                     <div class="py-2 border-y border-slate-200 border-dashed text-slate-600 text-[13px]">
                                       {{ calculateLayoverDuration(segment.arrival.at, itinerarySegments(itinerary)[segIndex + 1].departure.at) }} layover · {{ airportDisplay(segment.arrival) }}
                                     </div>
                                   </div>
                                 }
                               }
                             </div>
                          </div>
                       }
                    </div>
                  </div>

                  <!-- Right Side: Booking Area -->
                  <div class="w-full md:w-72 bg-slate-50/50 p-6 flex flex-col justify-between">
                     <div>
                        <div class="flex items-center gap-2 text-[13px] text-slate-600 bg-white px-3 py-2 border border-slate-200 rounded-lg shadow-sm mb-4">
                          <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                          Included: personal item, cabin bag
                        </div>
                     </div>
                     <div class="mt-8 text-right">
                        <button
                          type="button"
                          (click)="handleSelect(flight)"
                          class="w-full py-2.5 px-4 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 hover:shadow shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          Select flight <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                        </button>
                     </div>
                  </div>
                  
                </div>
              </div>
            }
          </article>
        }
      }
    </div>
  `
})
export class FlightResultsComponent {
  @Input() loading = false;
  @Input() flights: any[] = [];
  @Input() error: string | null = null;
  @Input() progress = 0;
  @Output() onSelect = new EventEmitter<any>();

  private bookingService = inject(BookingService);
  private router = inject(Router);

  expandedFlightId: string | null = null;

  arrowRightIcon = ArrowRight;
  clockIcon = Clock3;
  planeIcon = Plane;
  checkIcon = CheckCircle;
  starIcon = Star;
  chevronDownIcon = ChevronDown;
  chevronUpIcon = ChevronUp;
  leafIcon = Leaf;


  toggleDetails(id: string) {
    this.expandedFlightId = this.expandedFlightId === id ? null : id;
  }

  handleSelect(flight: any) {
    this.bookingService.setSelectedFlight(flight);
    this.onSelect.emit(flight);
    this.router.navigate(['/book/details']);
  }

  itineraries(flight: any): any[] {
    return flight?.itineraries || [];
  }

  itinerarySegments(itinerary: any): any[] {
    return itinerary?.segments || [];
  }

  itineraryAirlineCode(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    return segments.length ? segments[0]?.carrierCode || '---' : '---';
  }

  itineraryAirlineNameFallback(itinerary: any): string {
    return this.itineraryAirlineCode(itinerary); // Logo service handles real names
  }

  itineraryFlightNumber(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    return segments.length ? segments[0]?.number || '---' : '---';
  }

  itineraryDepartureTime(itinerary: any): string {
    const date = this.itinerarySegments(itinerary)?.[0]?.departure?.at;
    return date ? this.formatTime(date) : '--:--';
  }

  itineraryArrivalTime(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    const date = segments.length ? segments[segments.length - 1]?.arrival?.at : null;
    return date ? this.formatTime(date) : '--:--';
  }

  hasDayChange(itinerary: any): boolean {
     const depDateStr = this.itinerarySegments(itinerary)?.[0]?.departure?.at;
     const arrDateStr = this.itinerarySegments(itinerary)?.[this.itinerarySegments(itinerary).length - 1]?.arrival?.at;
     if (!depDateStr || !arrDateStr) return false;
     
     const dep = new Date(depDateStr);
     const arr = new Date(arrDateStr);
     return arr.getDate() !== dep.getDate() || arr.getMonth() !== dep.getMonth();
  }

  itineraryDepartureAirport(itinerary: any): string {
    return this.itinerarySegments(itinerary)?.[0]?.departure?.iataCode || '---';
  }

  itineraryArrivalAirport(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    return segments.length ? segments[segments.length - 1]?.arrival?.iataCode || '---' : '---';
  }

  itineraryDurationLabel(itinerary: any): string {
    if (itinerary?.duration) {
      return this.formatDuration(itinerary.duration);
    }
    const totalMinutes = this.itinerarySegments(itinerary)
      .map((segment: any) => this.parseDurationToMinutes(segment?.duration || ''))
      .reduce((sum: number, value: number) => sum + value, 0);

    if (!totalMinutes) {
      return '-';
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hr ${minutes} min`;
  }

  itineraryStops(itinerary: any): number {
    return Math.max(0, this.itinerarySegments(itinerary).length - 1);
  }

  briefLayovers(itinerary: any): string {
     const segments = this.itinerarySegments(itinerary);
     if (segments.length <= 1) return '';
     
     const durations = [];
     for (let i = 0; i < segments.length - 1; i++) {
        durations.push(`${this.calculateLayoverDuration(segments[i].arrival.at, segments[i+1].departure.at)} ${segments[i].arrival.iataCode}`);
     }
     return durations.join(', ');
  }

  airportDisplay(location: any): string {
    const code = location?.iataCode || '---';
    const fullName = location?.cityName || location?.airportName;
    return fullName ? `${fullName} (${code})` : code;
  }

  priceValue(flight: any): number {
    return Number(flight?.price?.total || 0);
  }

  formatDuration(duration: string): string {
    if (!duration) {
      return '-';
    }
    return duration.replace('PT', '').replace('H', ' hr ').replace('M', ' min').toLowerCase();
  }

  private parseDurationToMinutes(duration: string): number {
    if (!duration || !duration.startsWith('PT')) {
      return 0;
    }
    const hours = Number(duration.match(/(\d+)H/)?.[1] || 0);
    const minutes = Number(duration.match(/(\d+)M/)?.[1] || 0);
    return hours * 60 + minutes;
  }

  public calculateLayoverDuration(arrivalAt: string, departureAt: string): string {
    if (!arrivalAt || !departureAt) {
      return 'N/A';
    }
    const start = new Date(arrivalAt).getTime();
    const end = new Date(departureAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return 'N/A';
    }
    const totalMinutes = Math.floor((end - start) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours === 0) return `${minutes} min`;
    return `${hours} hr ${minutes} min`;
  }

  public formatTime(dateString: string): string {
    const date = new Date(dateString);
    let hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; 
    return `${hour}:${minute} ${ampm}`;
  }
}
