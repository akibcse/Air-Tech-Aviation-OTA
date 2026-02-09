import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plane, ArrowRight, Loader2, Clock, MapPin } from 'lucide-angular';
import { BookingService } from '../../services/booking.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4">
      @if (loading) {
        <div class="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
          <div class="w-full max-w-md space-y-6 text-center">
             <!-- Animated Illustration -->
             <div class="relative w-32 h-32 mx-auto mb-8">
                <div class="absolute inset-0 border-4 border-blue-100 rounded-full animate-[spin_3s_linear_infinite]"></div>
                <div class="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-[spin_1.5s_linear_infinite]"></div>
                <lucide-icon [name]="planeIcon" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-blue-600 animate-pulse"></lucide-icon>
             </div>

             <!-- Progress Bar -->
             <div class="space-y-2">
                <div class="flex justify-between text-sm font-bold text-gray-500 uppercase tracking-widest">
                  <span>Searching Flights</span>
                  <span>{{ progress }}%</span>
                </div>
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                   <div 
                     class="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                     [style.width.%]="progress"
                   ></div>
                </div>
             </div>

             <!-- Status Text -->
             <p class="text-gray-400 text-sm font-medium animate-pulse">{{ loadingStatus }}</p>

             <!-- Tips Carousel -->
             <div class="mt-8 pt-6 border-t border-dashed border-gray-100">
                <p class="text-xs text-gray-400">Did you know? <span class="text-gray-600 font-medium">We search over 400 airlines instantly.</span></p>
             </div>
          </div>
        </div>
      } @else if (error) {
        <div class="p-12 text-center bg-red-50 rounded-2xl border border-red-100 shadow-sm">
           <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl text-red-600 font-bold">!</span>
           </div>
           <h3 class="text-xl font-bold text-red-900 mb-2">Search Interrupted</h3>
           <p class="text-red-600 max-w-sm mx-auto mb-6">{{ error }}</p>
           <button (click)="window.location.reload()" class="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all">Try Again</button>
        </div>
      } @else if (flights.length === 0) {
        <div class="p-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <lucide-icon [name]="mapPinIcon" class="w-16 h-16 text-gray-200 mx-auto mb-4"></lucide-icon>
          <h3 class="text-xl font-bold text-gray-900 mb-2">No Flights Found</h3>
          <p class="text-gray-500">We couldn't find any flights for these criteria. Try adjusting your dates or locations.</p>
        </div>
      } @else {
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-black text-gray-900">
            {{ flights.length }} <span class="text-gray-400 font-medium">results found</span>
          </h3>
          <div class="flex gap-2">
            <span class="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full uppercase tracking-widest">Cheapest first</span>
          </div>
        </div>

        <div class="space-y-4">
          @for (flight of flights; track flight.id) {
            <div
              (click)="toggleDetails(flight.id)"
              class="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group overflow-hidden"
            >
              <div class="flex flex-col lg:flex-row">
                <!-- Itineraries Section -->
                <div class="flex-1 p-6 space-y-6">
                  @for (itinerary of flight.itineraries; track $index) {
                    @let firstSegment = itinerary.segments[0];
                    @let lastSegment = itinerary.segments[itinerary.segments.length - 1];
                    @let airlineCode = firstSegment.carrierCode;
                    @let stops = itinerary.segments.length - 1;

                    <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                      <!-- Airline Info -->
                      <div class="flex items-center gap-4 w-full md:w-48">
                        <div class="w-10 h-10 relative flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 grayscale group-hover:grayscale-0 transition-all">
                          <img
                            [src]="'https://content.airhex.com/content/logos/airlines_' + airlineCode + '_200_200_s.png'"
                            [alt]="airlineCode"
                            class="w-full h-full object-contain p-1.5"
                            (error)="handleImageError($event, airlineCode)"
                          />
                        </div>
                        <div>
                          <p class="font-black text-gray-900 leading-tight uppercase tracking-tighter">{{ airlineCode }}</p>
                          <p class="text-[10px] text-gray-400 font-bold uppercase">{{ firstSegment.carrierCode }}{{ firstSegment.number }} • {{ firstSegment.aircraft?.code || 'Jet' }}</p>
                        </div>
                      </div>

                      <!-- Route Info -->
                      <div class="flex-1 flex items-center justify-center gap-4 sm:gap-8 w-full">
                        <div class="text-right">
                          <p class="text-xl font-black text-gray-900 uppercase leading-none">
                            {{ firstSegment.departure.at | date:'HH:mm' }}
                          </p>
                          <p class="text-xs text-gray-400 font-black mt-1 uppercase">{{ firstSegment.departure.iataCode }}</p>
                        </div>

                        <div class="flex flex-col items-center flex-1 max-w-[200px] relative group/tooltip">
                          <p class="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-widest">{{ formatDuration(itinerary.duration) }}</p>
                          <div class="w-full flex items-center gap-2">
                             <div class="h-[2px] bg-gray-100 flex-1 relative rounded-full">
                                <div class="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                             </div>
                             <lucide-icon [name]="planeIcon" class="w-3.5 h-3.5 text-blue-500 rotate-90 opacity-40 group-hover:opacity-100 transition-opacity"></lucide-icon>
                             <div class="h-[2px] bg-gray-100 flex-1 relative rounded-full">
                                <div class="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                             </div>
                          </div>
                          <p class="text-[10px] font-black mt-1 tracking-widest uppercase cursor-help" 
                             [class.text-green-600]="stops === 0" [class.text-amber-600]="stops > 0">
                            {{ stops === 0 ? 'Direct' : stops + ' Stop' + (stops > 1 ? 's' : '') }}
                          </p>
                          
                          <!-- Hover Tooltip for Stops -->
                          @if (stops > 0) {
                            <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                                <div class="font-bold mb-1 border-b border-gray-700 pb-1">Layover Details</div>
                                @for (seg of itinerary.segments; track $index) {
                                  @if ($index < itinerary.segments.length - 1) {
                                    <div class="flex justify-between py-1">
                                      <span>{{ seg.arrival.iataCode }}</span>
                                      <span class="text-gray-400">Change Planes</span>
                                    </div>
                                  }
                                }
                                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          }
                        </div>

                        <div class="text-left">
                          <p class="text-xl font-black text-gray-900 uppercase leading-none">
                            {{ lastSegment.arrival.at | date:'HH:mm' }}
                          </p>
                          <p class="text-xs text-gray-400 font-black mt-1 uppercase">{{ lastSegment.arrival.iataCode }}</p>
                        </div>
                      </div>
                    </div>
                    @if ($index < flight.itineraries.length - 1) {
                      <div class="border-t border-dashed border-gray-100 my-4 relative">
                        <span class="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Next Flight</span>
                      </div>
                    }
                  }
                </div>

                <!-- Price & Booking Section -->
                <div class="w-full lg:w-64 bg-gray-50/50 p-6 flex flex-col justify-center items-end border-l border-gray-100 group-hover:bg-blue-50/50 transition-colors">
                  <div class="text-right mb-4">
                    <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Inc. Taxes</p>
                    <div class="flex items-baseline justify-end gap-1">
                      <span class="text-sm font-bold text-blue-600">{{ flight.price.currency }}</span>
                      <span class="text-3xl font-black text-blue-600 tracking-tighter">{{ flight.price.total | number }}</span>
                    </div>
                  </div>
                  <button
                    (click)="toggleDetails(flight.id); $event.stopPropagation()"
                    class="w-full py-3 mb-2 bg-white text-blue-600 border border-blue-200 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                  >
                     {{ expandedFlightId === flight.id ? 'Hide Details' : 'View Details' }}
                  </button>
                  <button
                    (click)="handleSelect(flight); $event.stopPropagation()"
                    class="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    Select Flight <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                  </button>
                </div>
              </div>

              <!-- Expanded Details Section -->
              @if (expandedFlightId === flight.id) {
                <div class="border-t border-gray-100 bg-gray-50/50 p-6 animate-in slide-in-from-top-2 duration-200">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <lucide-icon [name]="planeIcon" class="w-4 h-4"></lucide-icon> Flight Details
                            </h4>
                            <div class="space-y-6">
                                @for (itinerary of flight.itineraries; track $index) {
                                    <div class="relative pl-4 border-l-2 border-gray-200 space-y-6">
                                        @for (seg of itinerary.segments; track seg.id) {
                                            <div class="relative">
                                                <div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                                <div class="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p class="font-bold text-gray-900">{{ seg.departure.iataCode }} <span class="text-gray-400 mx-2">→</span> {{ seg.arrival.iataCode }}</p>
                                                        <p class="text-xs text-gray-500">{{ seg.departure.at | date:'medium' }}</p>
                                                    </div>
                                                    <div class="text-right">
                                                        <p class="font-bold text-gray-900">{{ seg.carrierCode }} {{ seg.number }}</p>
                                                        <p class="text-xs text-gray-500">{{ seg.aircraft?.code || 'Boeing 737' }}</p>
                                                    </div>
                                                </div>
                                                <p class="text-xs text-gray-500 bg-white p-2 rounded border border-gray-100 inline-block">
                                                    Duration: {{ formatDuration(seg.duration) }}
                                                </p>
                                            </div>
                                        }
                                    </div>
                                    @if ($index < flight.itineraries.length - 1) { <div class="border-t border-gray-200 my-4"></div> }
                                }
                            </div>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900 mb-4">Baggage & Fare Rules</h4>
                            <div class="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-500">Cabin Baggage</span>
                                    <span class="font-bold text-gray-900">7kg</span>
                                </div>
                                <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
                                    <span class="text-gray-500">Checked Baggage</span>
                                    <span class="font-bold text-gray-900">20kg</span>
                                </div>
                                <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
                                    <span class="text-gray-500">Fare Class</span>
                                    <span class="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">Economy Standard</span>
                                </div>
                                <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3">
                                    <span class="text-gray-500">Refundable</span>
                                    <span class="font-bold text-green-600">Partial</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class FlightResultsComponent {
  @Input() set loading(val: boolean) {
    this._loading = val;
    if (val) this.startProgress();
    else this.resetProgress();
  }
  get loading() { return this._loading; }
  private _loading = false;

  @Input() flights: any[] = [];
  @Input() error: string | null = null;
  @Output() onSelect = new EventEmitter<any>();

  progress = 0;
  loadingStatus = 'Initializing Search...';
  private progressInterval: any;

  private bookingService = inject(BookingService);
  private router = inject(Router);

  expandedFlightId: string | null = null;

  // Icons
  planeIcon = Plane;
  arrowRightIcon = ArrowRight;
  loaderIcon = Loader2;
  mapPinIcon = MapPin;
  window = window;

  formatDuration(duration: string) {
    if (!duration) return '';
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
  }

  handleImageError(event: any, code: string) {
    event.target.src = `https://ui-avatars.com/api/?name=${code}&background=random`;
  }

  toggleDetails(id: string) {
    this.expandedFlightId = this.expandedFlightId === id ? null : id;
  }

  handleSelect(flight: any) {
    this.bookingService.setSelectedFlight(flight);
    this.router.navigate(['/book/details']);
  }

  private startProgress() {
    this.progress = 0;
    this.loadingStatus = 'Connecting to Amadeus GDS...';

    clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      if (this.progress < 90) {
        this.progress += Math.floor(Math.random() * 5) + 1;

        if (this.progress > 20 && this.progress < 50) this.loadingStatus = 'Searching Major Airlines...';
        else if (this.progress > 50 && this.progress < 80) this.loadingStatus = 'Finding Best Connections...';
        else if (this.progress > 80) this.loadingStatus = 'Finalizing Prices & Taxes...';
      }
    }, 200);
  }

  private resetProgress() {
    this.progress = 100;
    this.loadingStatus = 'Complete';
    setTimeout(() => {
      clearInterval(this.progressInterval);
      this.progress = 0;
    }, 500);
  }
}
