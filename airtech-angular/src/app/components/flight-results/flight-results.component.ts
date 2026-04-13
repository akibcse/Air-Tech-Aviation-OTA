import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ArrowRight, CheckCircle, Clock3, LucideAngularModule, Plane, Star } from 'lucide-angular';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-flight-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-3">
      @if (loading) {
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 transition-opacity duration-200">
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold">Searching flights...</p>
            <p class="font-black text-blue-700">{{ progress }}%</p>
          </div>
          <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out" [style.width.%]="progress"></div>
          </div>
        </div>

        <div class="space-y-3">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
              <div class="h-4 w-2/3 bg-gray-100 rounded mb-3"></div>
              <div class="h-3 w-full bg-gray-100 rounded mb-2"></div>
              <div class="h-3 w-5/6 bg-gray-100 rounded mb-4"></div>
              <div class="h-10 w-32 bg-gray-100 rounded-xl ml-auto"></div>
            </div>
          }
        </div>
      } @else if (error) {
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p class="text-sm font-semibold text-red-700 mb-2">Search interrupted</p>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      } @else if (flights.length === 0) {
        <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h3 class="text-lg font-black text-slate-900 mb-2">No flights found</h3>
          <p class="text-sm text-slate-500">Try adjusting your filters to see more options.</p>
        </div>
      } @else {
        @for (flight of flights; track flight.id || $index; let i = $index) {
          <article class="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden">
            <div class="flex flex-col lg:flex-row">
              <div class="flex-1 p-4 md:p-6 space-y-6">
                @for (itinerary of itineraries(flight); track $index; let itineraryIndex = $index) {
                  <div class="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="flex items-center gap-4 w-full md:w-48">
                      <div class="w-10 h-10 relative flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 transition-all">
                        <img
                          class="w-full h-full object-contain p-1.5"
                          [src]="logoUrl(itinerary)"
                          [alt]="itineraryAirlineCode(itinerary)"
                          (error)="handleImageError($event, itineraryAirlineCode(itinerary))"
                        />
                      </div>
                      <div>
                        <p class="font-black text-gray-900 leading-tight uppercase tracking-tighter">{{ itineraryAirlineCode(itinerary) }}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase">{{ itineraryFlightNumber(itinerary) }}</p>
                        @if (flightSource(flight)) {
                          <span class="inline-block mt-0.5 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase rounded-full" [class]="flightSource(flight) === 'SABRE' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'">{{ flightSource(flight) }}</span>
                        }
                      </div>
                    </div>

                    <div class="flex-1 flex items-center justify-center gap-4 sm:gap-8 w-full">
                    <div class="text-right">
                      <p class="text-xl font-black text-gray-900 uppercase leading-none">{{ itineraryDepartureTime(itinerary) }}</p>
                      <p class="text-xs text-gray-400 font-black mt-1" [title]="itineraryDepartureDisplay(itinerary)">{{ itineraryDepartureDisplay(itinerary) }}</p>
                    </div>

                      <div
                        class="flex flex-col items-center flex-1 max-w-[220px] relative group/tooltip"
                        (touchstart)="startLongPress(longPressKey(flight, itineraryIndex))"
                        (touchend)="endLongPress()"
                        (touchcancel)="endLongPress()"
                      >
                        <p class="text-[10px] text-gray-400 mb-1 font-bold uppercase tracking-widest">{{ itineraryDurationLabel(itinerary) }}</p>
                        <div class="w-full flex items-center gap-2">
                          <div class="h-[2px] bg-gray-100 flex-1 relative rounded-full">
                            <div class="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                          </div>
                          <lucide-icon [name]="planeIcon" class="w-3.5 h-3.5 text-blue-500 rotate-90 opacity-70 group-hover:opacity-100 transition-opacity"></lucide-icon>
                          <div class="h-[2px] bg-gray-100 flex-1 relative rounded-full">
                            <div class="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          </div>
                        </div>
                        <p class="text-[10px] font-black mt-1 tracking-widest uppercase cursor-help" [class]="itineraryStops(itinerary) === 0 ? 'text-green-600' : 'text-amber-600'">
                          {{ itineraryStops(itinerary) === 0 ? 'Direct' : itineraryStops(itinerary) + ' Stop' + (itineraryStops(itinerary) > 1 ? 's' : '') }}
                        </p>

                        @if (itineraryStops(itinerary) > 0) {
                          <div class="hidden md:block absolute z-20 mt-2 top-full left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 text-white text-[11px] px-2.5 py-2 shadow-lg min-w-56 text-left opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity">
                            <p class="font-bold mb-1">Transit Details</p>
                            @for (layover of itineraryLayovers(itinerary); track layover.code + layover.duration) {
                              <div class="mb-1 last:mb-0">
                                <div>{{ layover.airport }}</div>
                                <div class="text-slate-300 text-[10px]">Layover: {{ layover.duration }}</div>
                              </div>
                            }
                          </div>
                        }

                        @if (itineraryStops(itinerary) > 0 && longPressTooltipId === longPressKey(flight, itineraryIndex)) {
                          <div class="absolute z-20 mt-2 top-full left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 text-white text-[11px] px-2.5 py-2 shadow-lg min-w-56 text-left md:hidden">
                            <p class="font-bold mb-1">Transit Details</p>
                            @for (layover of itineraryLayovers(itinerary); track layover.code + layover.duration) {
                              <div class="mb-1 last:mb-0">
                                <div>{{ layover.airport }}</div>
                                <div class="text-slate-300 text-[10px]">Layover: {{ layover.duration }}</div>
                              </div>
                            }
                          </div>
                        }
                      </div>

                      <div class="text-left">
                        <p class="text-xl font-black text-gray-900 uppercase leading-none">{{ itineraryArrivalTime(itinerary) }}</p>
                        <p class="text-xs text-gray-400 font-black mt-1" [title]="itineraryArrivalDisplay(itinerary)">{{ itineraryArrivalDisplay(itinerary) }}</p>
                      </div>
                    </div>
                  </div>

                  @if (itineraryIndex < itineraries(flight).length - 1) {
                    <div class="border-t border-dashed border-gray-100 my-4 relative">
                      <span class="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest">Next Flight</span>
                    </div>
                  }
                }
              </div>

              <div class="w-full lg:w-64 bg-gray-50/50 p-4 md:p-6 flex flex-col justify-center items-end border-l border-gray-100 group-hover:bg-blue-50/50 transition-colors">
                <div class="text-right mb-4">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Inc. Taxes</p>
                  <div class="flex items-baseline justify-end gap-1">
                    <span class="text-sm font-bold text-blue-600">BDT</span>
                    <span class="text-3xl font-black text-blue-600 tracking-tighter">{{ priceValue(flight) | number }}</span>
                  </div>
                  @if (discountAmount(flight) > 0) {
                    <p class="text-xs text-gray-400 line-through">BDT {{ oldPrice(flight) | number }}</p>
                  }
                </div>

                <button
                  type="button"
                  (click)="toggleDetails(flight.id || i.toString())"
                  class="w-full py-3 mb-2 bg-white text-blue-600 border border-blue-200 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  {{ expandedFlightId === (flight.id || i.toString()) ? 'Hide Details' : 'View Details' }}
                </button>

                <button
                  type="button"
                  (click)="handleSelect(flight)"
                  class="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Select Flight
                  <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>

            @if (expandedFlightId === (flight.id || i.toString())) {
              <div class="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <lucide-icon [name]="planeIcon" class="w-4 h-4"></lucide-icon>
                      Flight Details
                    </h4>

                    <div class="space-y-6">
                      @for (itinerary of itineraries(flight); track $index; let itineraryIndex = $index) {
                        <div class="relative pl-4 border-l-2 border-gray-200 space-y-4">
                          @for (segment of itinerarySegments(itinerary); track segment.id || $index) {
                            <div class="relative">
                              <div class="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                              <div class="flex justify-between items-start mb-2 gap-3">
                                <div>
                                  <p class="font-bold text-gray-900">{{ airportDisplay(segment.departure) }} <span class="text-gray-400 mx-2">-></span> {{ airportDisplay(segment.arrival) }}</p>
                                  <p class="text-xs text-gray-500">{{ segment.departure.at | date:'medium' }}</p>
                                </div>
                                <div class="text-right">
                                  <p class="font-bold text-gray-900">{{ segment.carrierCode }} {{ segment.number }}</p>
                                  <p class="text-xs text-gray-500">{{ segment.aircraft?.code || 'N/A' }}</p>
                                </div>
                              </div>
                              <p class="text-xs text-gray-500 bg-white p-2 rounded border border-gray-100 inline-block">Duration: {{ formatDuration(segment.duration) }}</p>
                            </div>
                          }
                        </div>

                        @if (itineraryIndex < itineraries(flight).length - 1) {
                          <div class="border-t border-gray-200 my-4"></div>
                        }
                      }
                    </div>
                  </div>

                  <div>
                    <h4 class="font-bold text-gray-900 mb-4">Baggage & Fare Rules</h4>
                    <div class="bg-white p-4 rounded-xl border border-gray-100 space-y-3">
                      <div class="flex justify-between items-center text-sm"><span class="text-gray-500">Cabin Baggage</span><span class="font-bold text-gray-900">7kg</span></div>
                      <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3"><span class="text-gray-500">Checked Baggage</span><span class="font-bold text-gray-900">20kg</span></div>
                      <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3"><span class="text-gray-500">Fare Class</span><span class="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded">Economy Standard</span></div>
                      <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3"><span class="text-gray-500">Refundable</span><span class="font-bold text-green-600">Partial</span></div>
                      <div class="flex justify-between items-center text-sm border-t border-gray-50 pt-3"><span class="text-gray-500">Points</span><span class="font-bold text-gray-900">{{ points(flight) }}</span></div>
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
  longPressTooltipId: string | null = null;
  private pressTimeout: ReturnType<typeof setTimeout> | null = null;

  arrowRightIcon = ArrowRight;
  clockIcon = Clock3;
  planeIcon = Plane;
  checkIcon = CheckCircle;
  starIcon = Star;

  private readonly airportNameByCode: Record<string, string> = {
    DAC: 'Dhaka - Hazrat Shahjalal Intl',
    CXB: "Cox's Bazar Airport",
    DXB: 'Dubai International Airport',
    DWC: 'Al Maktoum International Airport',
    DOH: 'Doha Hamad International Airport',
    CGP: 'Chattogram Shah Amanat Intl',
    ZYL: 'Sylhet Osmani International',
    JED: 'Jeddah King Abdulaziz Intl',
    RUH: 'Riyadh King Khalid Intl',
    KUL: 'Kuala Lumpur International',
    SIN: 'Singapore Changi Airport'
  };

  toggleDetails(id: string) {
    this.expandedFlightId = this.expandedFlightId === id ? null : id;
  }

  handleSelect(flight: any) {
    this.bookingService.setSelectedFlight(flight);
    this.onSelect.emit(flight);
    this.router.navigate(['/book/details']);
  }

  startLongPress(key: string) {
    this.endLongPress();
    this.pressTimeout = setTimeout(() => {
      this.longPressTooltipId = key;
    }, 500);
  }

  endLongPress() {
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
    }
    this.longPressTooltipId = null;
  }

  longPressKey(flight: any, itineraryIndex: number): string {
    return `${flight?.id || 'flight'}-${itineraryIndex}`;
  }

  itineraries(flight: any): any[] {
    const list = flight?.itineraries;
    return Array.isArray(list) && list.length ? list : [];
  }

  itinerarySegments(itinerary: any): any[] {
    const list = itinerary?.segments;
    return Array.isArray(list) ? list : [];
  }

  itineraryAirlineCode(itinerary: any): string {
    return this.itinerarySegments(itinerary)?.[0]?.carrierCode || 'AIR';
  }

  itineraryFlightNumber(itinerary: any): string {
    const first = this.itinerarySegments(itinerary)?.[0];
    return first ? `${first.carrierCode}${first.number} • ${first.aircraft?.code || 'N/A'}` : 'N/A';
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

  itineraryDepartureAirport(itinerary: any): string {
    return this.itinerarySegments(itinerary)?.[0]?.departure?.iataCode || '---';
  }

  itineraryDepartureDisplay(itinerary: any): string {
    const departure = this.itinerarySegments(itinerary)?.[0]?.departure;
    return this.airportDisplay(departure);
  }

  itineraryArrivalAirport(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    return segments.length ? segments[segments.length - 1]?.arrival?.iataCode || '---' : '---';
  }

  itineraryArrivalDisplay(itinerary: any): string {
    const segments = this.itinerarySegments(itinerary);
    const arrival = segments.length ? segments[segments.length - 1]?.arrival : null;
    return this.airportDisplay(arrival);
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
    return `${hours}h ${minutes}m`;
  }

  itineraryStops(itinerary: any): number {
    return Math.max(0, this.itinerarySegments(itinerary).length - 1);
  }

  itineraryLayoverAirports(itinerary: any): string[] {
    const segments = this.itinerarySegments(itinerary);
    if (segments.length <= 1) {
      return [];
    }
    return segments.slice(0, -1).map((segment: any) => segment.arrival?.iataCode).filter(Boolean);
  }

  itineraryLayovers(itinerary: any): { code: string; airport: string; duration: string }[] {
    const segments = this.itinerarySegments(itinerary);
    if (segments.length <= 1) {
      return [];
    }

    const layovers: { code: string; airport: string; duration: string }[] = [];
    for (let index = 0; index < segments.length - 1; index += 1) {
      const current = segments[index];
      const next = segments[index + 1];
      const code = current?.arrival?.iataCode || '---';
      const airport = this.airportDisplay(current?.arrival);
      const duration = this.calculateLayoverDuration(current?.arrival?.at, next?.departure?.at);
      layovers.push({ code, airport, duration });
    }
    return layovers;
  }

  airportDisplay(location: any): string {
    const code = location?.iataCode || '---';
    const fullName = location?.cityName || location?.airportName || this.airportNameByCode[code] || 'Unknown Airport';
    return `${fullName} (${code})`;
  }

  logoUrl(itinerary: any): string {
    const code = this.itineraryAirlineCode(itinerary).toUpperCase();
    // pics.avs.io – free airline logo CDN, no API key required
    return `https://pics.avs.io/200/200/${code}.png`;
  }

  priceValue(flight: any): number {
    return Number(flight?.price?.total || 0);
  }

  oldPrice(flight: any): number {
    const base = Number(flight?.price?.base || 0);
    const total = Number(flight?.price?.total || 0);
    return base > total ? base : total;
  }

  discountAmount(flight: any): number {
    const base = Number(flight?.price?.base || 0);
    const total = Number(flight?.price?.total || 0);
    return base > total ? base - total : 0;
  }

  points(flight: any): number {
    return Math.max(1, Math.floor(this.priceValue(flight) / 1000));
  }

  handleImageError(event: any, code: string) {
    const img = event.target as HTMLImageElement;
    const current = img.src || '';
    const c = (code || 'AIR').toUpperCase();

    if (current.includes('pics.avs.io')) {
      // Fallback 1: AirHex
      img.src = `https://content.airhex.com/content/logos/airlines_${c}_200_200_s.png`;
    } else if (current.includes('airhex.com')) {
      // Fallback 2: Duffel assets
      img.src = `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${c}.svg`;
    } else {
      // Final fallback: colored initial avatar
      img.src = `https://ui-avatars.com/api/?name=${c}&background=EEF2FF&color=4F46E5&bold=true&size=200`;
    }
  }

  flightSource(flight: any): string {
    return flight?.source || '';
  }

  formatDuration(duration: string): string {
    if (!duration) {
      return '-';
    }
    return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
  }

  private parseDurationToMinutes(duration: string): number {
    if (!duration || !duration.startsWith('PT')) {
      return 0;
    }
    const hours = Number(duration.match(/(\d+)H/)?.[1] || 0);
    const minutes = Number(duration.match(/(\d+)M/)?.[1] || 0);
    return hours * 60 + minutes;
  }

  private calculateLayoverDuration(arrivalAt: string, departureAt: string): string {
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
    return `${hours}h ${minutes}m`;
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  }
}
