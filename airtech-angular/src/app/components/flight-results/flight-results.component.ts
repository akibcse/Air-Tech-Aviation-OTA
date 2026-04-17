import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArrowRight, CheckCircle, Clock3, LucideAngularModule, Plane, Star, ChevronDown, ChevronUp, Leaf } from 'lucide-angular';
import { BookingService } from '../../services/booking.service';
import { AirlineLogoComponent } from '../airline-logo/airline-logo.component';
import { AirportNameComponent } from '../airport-name/airport-name.component';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AirlineLogoComponent, AirportNameComponent],
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
            
            <!-- Summary Row -->
            <div 
               (click)="toggleDetails(flight.id || i.toString())"
               class="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div class="flex-1 flex flex-col gap-6 lg:gap-4">
                @for (itinerary of itineraries(flight); track $index; let itineraryIndex = $index) {
                  <div class="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 md:gap-8">
                    
                    <!-- Airline & Core Info -->
                    <div class="flex items-center gap-4 min-w-[200px] flex-1 md:flex-none">
                       <app-airline-logo [code]="itineraryAirlineCode(itinerary)" [showName]="true" size="lg"></app-airline-logo>
                    </div>

                    <!-- Journey Details Grid -->
                    <div class="flex flex-1 items-center justify-between gap-4 sm:gap-8">
                       <!-- Times -->
                       <div class="flex flex-col min-w-[100px]">
                          <span class="text-[15px] sm:text-[17px] font-bold text-slate-900 leading-none mb-1">
                             {{ itineraryDepartureTime(itinerary) }} <span class="text-slate-400 mx-0.5">–</span> {{ itineraryArrivalTime(itinerary) }}
                             @if (hasDayChange(itinerary)) {<sup class="text-[10px] text-blue-600 font-black ml-0.5">+1</sup>}
                          </span>
                          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{{ itineraryIndex === 0 ? 'Departure' : 'Return' }}</span>
                       </div>
    
                       <!-- Duration & Routing -->
                       <div class="flex flex-col text-right sm:text-center min-w-[70px]">
                          <span class="text-[15px] text-slate-900 font-medium">{{ itineraryDurationLabel(itinerary) }}</span>
                          <span class="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase flex items-center justify-end sm:justify-center gap-1">
                             <app-airport-name [code]="itineraryDepartureAirport(itinerary)"></app-airport-name> 
                             <span class="text-slate-300 mx-0.5">–</span> 
                             <app-airport-name [code]="itineraryArrivalAirport(itinerary)"></app-airport-name>
                          </span>
                       </div>
    
                       <!-- Stops -->
                       <div class="flex flex-col text-right min-w-[90px]">
                          <span class="text-[15px] font-bold text-slate-900">
                             {{ itineraryStops(itinerary) === 0 ? 'Nonstop' : itineraryStops(itinerary) + ' stop' + (itineraryStops(itinerary) > 1 ? 's' : '') }}
                          </span>
                          <div class="flex flex-wrap justify-end gap-1 mt-0.5">
                             @for (layover of itineraryLayovers(itinerary); track $index) {
                                <span class="text-[9px] text-slate-500 font-medium bg-slate-50 px-1 rounded-sm border border-slate-100">
                                   {{ layover.duration }} in <app-airport-name [code]="layover.at"></app-airport-name>
                                </span>
                             }
                          </div>
                       </div>
                    </div>

                    <!-- Emissions (Desktop Only) -->
                    <div class="hidden xl:flex flex-col text-left min-w-[100px]">
                       <span class="text-[15px] text-slate-900 font-medium">2{{ priceValue(flight).toString().slice(0, 2) }} kg CO2e</span>
                       <span class="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><lucide-icon [name]="leafIcon" class="w-3 h-3"></lucide-icon> -14% EMB</span>
                    </div>
                  </div>
                }
              </div>


              <!-- Pricing Row -->
              <div class="flex items-center justify-between lg:justify-end gap-6 lg:w-auto lg:min-w-[180px] pl-0 lg:pl-8 lg:border-l lg:border-slate-200">
                 <div class="flex flex-col lg:items-end">
                    <span class="text-xl sm:text-2xl font-black text-blue-700 whitespace-nowrap leading-none mb-1">BDT {{ priceValue(flight) | number }}</span>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ itineraries(flight).length > 1 ? 'Round trip' : 'One way' }}</span>
                 </div>
                 <button class="bg-slate-100 text-slate-500 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm">
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
                                       <span class="text-[15px] text-slate-900"><app-airport-name [code]="segment.departure.iataCode"></app-airport-name></span>
                                    </div>
                                 </div>
                                 
                                 <!-- Flight Metdata Row -->
                                 <div class="relative z-10 pl-8 pb-4">
                                     <div class="flex items-start gap-4">
                                       <app-airline-logo [code]="segment.carrierCode" [showName]="true" size="md" class="mt-0.5"></app-airline-logo>
                                       <div class="text-[13px] text-slate-600 space-y-0.5">
                                          <p class="font-medium text-slate-900">Travel time: {{ formatDuration(segment.duration) }}</p>
                                          <p class="text-slate-500">{{ segment.carrierCode }} {{ segment.number }} • {{ segment.aircraft?.code || 'Aircraft' }} • {{ getSegmentClass(flight, segment.id || segIndex.toString()) }}</p>
                                       </div>
                                     </div>
                                 </div>
                                 
                                 <!-- Arrival Location -->
                                 <div class="relative z-10 pl-8 pb-4">
                                    <div class="absolute left-[5px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 border border-white"></div>
                                    <div class="flex items-center gap-3">
                                       <span class="text-[15px] font-bold text-slate-900 w-12">{{ formatTime(segment.arrival.at) }}</span>
                                       <span class="text-[15px] text-slate-900"><app-airport-name [code]="segment.arrival.iataCode"></app-airport-name></span>
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

  itineraryLayovers(itinerary: any): any[] {
     const segments = this.itinerarySegments(itinerary);
     if (segments.length <= 1) return [];
     
     const layovers = [];
     for (let i = 0; i < segments.length - 1; i++) {
        layovers.push({
           duration: this.calculateLayoverDuration(segments[i].arrival.at, segments[i+1].departure.at),
           at: segments[i].arrival.iataCode
        });
     }
     return layovers;
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

  public getSegmentClass(flight: any, segmentId: string): string {
     try {
       const travelerPricing = flight?.travelerPricings?.[0];
       if (travelerPricing?.fareDetailsBySegment) {
          const fareDetail = travelerPricing.fareDetailsBySegment.find((f: any) => 
               f.segmentId === segmentId || f.segmentId?.toString() === segmentId
          );
          if (fareDetail) {
             const cabinRaw = fareDetail.cabin || fareDetail.cabinClass || 'Economy';
             const cabin = cabinRaw.charAt(0).toUpperCase() + cabinRaw.slice(1).toLowerCase();
             const rbd = fareDetail.class || fareDetail.bookingClass; // booking class
             return rbd ? `${cabin} (${rbd})` : cabin;
          }
       }
     } catch(e) {}
     
     // Fallback if segment specific is not found, but overall cabin exists
     const defaultCabin = flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin 
                         || flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabinClass
                         || 'Economy';
     return defaultCabin.charAt(0).toUpperCase() + defaultCabin.slice(1).toLowerCase();
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
