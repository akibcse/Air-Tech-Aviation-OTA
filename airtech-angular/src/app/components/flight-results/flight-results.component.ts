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
    <div class="space-y-2.5">
      @if (loading) {
        <div class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          Searching flights... {{ progress }}%
        </div>

        <div class="space-y-2.5">
          @for (_ of [1,2,3,4]; track $index) {
            <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm animate-pulse">
              <div class="h-4 w-2/3 bg-slate-100 rounded mb-2"></div>
              <div class="h-3 w-full bg-slate-100 rounded mb-1.5"></div>
              <div class="h-3 w-5/6 bg-slate-100 rounded mb-3"></div>
              <div class="h-9 w-28 bg-slate-100 rounded-full ml-auto"></div>
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
        @for (flight of flights; track flight.id; let i = $index) {
          <article class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div class="p-3.5">
              <div class="flex items-center gap-1.5 flex-wrap mb-3">
                <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                  <lucide-icon [name]="checkIcon" class="w-3 h-3"></lucide-icon>
                  Partially Refundable
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                  <lucide-icon [name]="starIcon" class="w-3 h-3"></lucide-icon>
                  {{ i % 2 === 0 ? 'BEST' : 'PREFERRED' }}
                </span>
                <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                  <lucide-icon [name]="clockIcon" class="w-3 h-3"></lucide-icon>
                  Pay Later
                </span>
              </div>

              <div class="grid grid-cols-[1fr,90px,1fr] gap-2 items-center mb-3">
                <div>
                  <p class="text-xl font-black text-slate-900 leading-none">{{ departureTime(flight) }}</p>
                  <p class="text-sm font-bold text-slate-700 mt-1">{{ departureAirport(flight) }}</p>
                  <p class="text-[11px] text-slate-500">{{ departureDate(flight) }}</p>
                </div>

                <div class="text-center" (touchstart)="startLongPress(flight.id)" (touchend)="endLongPress()" (touchcancel)="endLongPress()">
                  <p class="text-[11px] font-semibold text-slate-600">{{ durationLabel(flight) }}</p>
                  <div class="relative flex items-center justify-center py-1.5">
                    <span class="absolute left-2 right-2 h-[2px] bg-slate-300"></span>
                    <lucide-icon [name]="planeIcon" class="w-4 h-4 text-blue-600 bg-white relative"></lucide-icon>
                  </div>
                  <p class="text-[11px] font-semibold text-slate-700">{{ stopText(flight) }}</p>

                  @if ((getStops(flight) > 0) && (longPressTooltipId === flight.id)) {
                    <div class="absolute z-20 mt-1 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900 text-white text-[11px] px-2 py-1.5 shadow-lg">
                      @for (layover of layoverAirports(flight); track layover) {
                        <div>{{ layover }} transit</div>
                      }
                    </div>
                  }
                </div>

                <div class="text-right">
                  <p class="text-xl font-black text-slate-900 leading-none">{{ arrivalTime(flight) }}</p>
                  <p class="text-sm font-bold text-slate-700 mt-1">{{ arrivalAirport(flight) }}</p>
                  <p class="text-[11px] text-slate-500">{{ arrivalDate(flight) }}</p>
                </div>
              </div>

              <div class="flex items-end justify-between gap-3 mb-2">
                <div>
                  <p class="text-[10px] uppercase tracking-wider text-slate-500">Starting from</p>
                  <p class="text-2xl font-black text-slate-900">BDT {{ priceValue(flight) | number }}</p>
                  @if (discountAmount(flight) > 0) {
                    <p class="text-xs text-slate-400 line-through">BDT {{ oldPrice(flight) | number }}</p>
                  }
                </div>

                <button
                  type="button"
                  (click)="handleSelect(flight)"
                  class="h-11 min-w-[94px] rounded-full bg-orange-500 text-white px-4 inline-flex items-center justify-center gap-1.5 font-bold text-sm hover:bg-orange-600"
                >
                  Select
                  <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
                </button>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <p>
                  <span class="font-semibold text-slate-600">{{ fareCode(flight) }}</span>
                  •
                  <lucide-icon [name]="starIcon" class="w-3.5 h-3.5 inline-block -mt-0.5"></lucide-icon>
                  {{ points(flight) }}
                </p>
                <button type="button" (click)="toggleDetails(flight.id)" class="font-semibold text-blue-700 underline underline-offset-2">
                  {{ expandedFlightId === flight.id ? 'Hide Details' : 'View Details' }}
                </button>
              </div>
            </div>

            @if (expandedFlightId === flight.id) {
              <div class="border-t border-slate-200 bg-slate-50 px-3.5 py-3">
                <div class="space-y-3">
                  <div>
                    <h4 class="text-sm font-black text-slate-900 mb-2">Itinerary</h4>
                    <div class="space-y-2">
                      @for (segment of segments(flight); track segment.id) {
                        <div class="rounded-lg border border-slate-200 bg-white p-2.5">
                          <p class="text-sm font-semibold text-slate-900">{{ segment.departure.iataCode }} -> {{ segment.arrival.iataCode }}</p>
                          <p class="text-[11px] text-slate-500">{{ segment.departure.at | date:'medium' }} • {{ segment.arrival.at | date:'medium' }}</p>
                          <p class="text-[11px] text-slate-600">{{ segment.carrierCode }}{{ segment.number }} • Aircraft {{ segment.aircraft?.code || 'N/A' }}</p>
                        </div>
                      }
                    </div>
                  </div>

                  <div class="rounded-lg border border-slate-200 bg-white p-2.5 text-[12px] space-y-1.5">
                    <div class="flex justify-between"><span class="text-slate-500">Baggage</span><span class="font-semibold text-slate-900">7kg cabin, 20kg check-in</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Refund</span><span class="font-semibold text-emerald-700">Partial refund applies</span></div>
                    <div class="flex justify-between"><span class="text-slate-500">Fare Type</span><span class="font-semibold text-slate-900">Economy Saver</span></div>
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

  toggleDetails(id: string) {
    this.expandedFlightId = this.expandedFlightId === id ? null : id;
  }

  handleSelect(flight: any) {
    this.bookingService.setSelectedFlight(flight);
    this.onSelect.emit(flight);
    this.router.navigate(['/book/details']);
  }

  startLongPress(id: string) {
    this.endLongPress();
    this.pressTimeout = setTimeout(() => {
      this.longPressTooltipId = id;
    }, 500);
  }

  endLongPress() {
    if (this.pressTimeout) {
      clearTimeout(this.pressTimeout);
      this.pressTimeout = null;
    }
    this.longPressTooltipId = null;
  }

  segments(flight: any): any[] {
    return flight?.itineraries?.[0]?.segments || [];
  }

  getStops(flight: any): number {
    return Math.max(0, this.segments(flight).length - 1);
  }

  stopText(flight: any): string {
    const stops = this.getStops(flight);
    if (stops === 0) {
      return 'Non-Stop';
    }
    return `${stops} Stop${stops > 1 ? 's' : ''}`;
  }

  layoverAirports(flight: any): string[] {
    const segs = this.segments(flight);
    if (segs.length <= 1) {
      return [];
    }
    return segs.slice(0, -1).map((segment: any) => segment.arrival?.iataCode).filter(Boolean);
  }

  departureAirport(flight: any): string {
    return this.segments(flight)?.[0]?.departure?.iataCode || '---';
  }

  arrivalAirport(flight: any): string {
    const segs = this.segments(flight);
    return segs.length ? segs[segs.length - 1]?.arrival?.iataCode || '---' : '---';
  }

  departureTime(flight: any): string {
    const first = this.segments(flight)?.[0]?.departure?.at;
    return first ? this.formatTime(first) : '--:--';
  }

  arrivalTime(flight: any): string {
    const segs = this.segments(flight);
    const last = segs.length ? segs[segs.length - 1]?.arrival?.at : null;
    return last ? this.formatTime(last) : '--:--';
  }

  departureDate(flight: any): string {
    const first = this.segments(flight)?.[0]?.departure?.at;
    return first ? this.formatDate(first) : '-';
  }

  arrivalDate(flight: any): string {
    const segs = this.segments(flight);
    const last = segs.length ? segs[segs.length - 1]?.arrival?.at : null;
    return last ? this.formatDate(last) : '-';
  }

  durationLabel(flight: any): string {
    return this.formatDuration(flight?.itineraries?.[0]?.duration || '');
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

  fareCode(flight: any): string {
    const ref = flight?.id || flight?.lastTicketingDate || 'STLRS';
    return String(ref).slice(0, 8).toUpperCase();
  }

  points(flight: any): number {
    return Math.max(1, Math.floor(this.priceValue(flight) / 1000));
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const hour = date.getHours();
    const minute = String(date.getMinutes()).padStart(2, '0');
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${minute} ${suffix}`;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', weekday: 'short' });
  }

  private formatDuration(duration: string): string {
    if (!duration) {
      return '-';
    }
    return duration.replace('PT', '').replace('H', 'hr ').replace('M', 'min').toLowerCase();
  }
}
