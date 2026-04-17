import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { LucideAngularModule, Plane, ArrowLeft, Clock, Info, Check, AlertCircle } from 'lucide-angular';
import { format, parseISO } from 'date-fns';

import { AirportNameComponent } from '../../../components/airport-name/airport-name.component';

@Component({
    selector: 'app-booking-flight-details',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterLink, AirportNameComponent],
    template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <button
          (click)="goBack()"
          class="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon> Back to Results
        </button>

        <h1 class="text-3xl font-bold mb-8">Review your flight</h1>

        @if (selectedFlight(); as flight) {
          @let itinerary = flight.itineraries[0];
          @let firstSegment = itinerary.segments[0];
          @let lastSegment = itinerary.segments[itinerary.segments.length - 1];

          <div class="space-y-6">
            <!-- Flight Card -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <div class="bg-blue-100 p-2 rounded-lg">
                    <lucide-icon [name]="planeIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
                  </div>
                  <span class="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <app-airport-name [code]="firstSegment.departure.iataCode"></app-airport-name> 
                    <span class="text-gray-400">to</span> 
                    <app-airport-name [code]="lastSegment.arrival.iataCode"></app-airport-name>
                  </span>
                </div>
                <span class="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                  {{ formatDuration(itinerary.duration) }}
                </span>
              </div>

              <div class="p-6 space-y-8">
                @for (segment of itinerary.segments; track segment.number; let idx = $index) {
                  <div class="relative pl-8 border-l-2 border-gray-100 last:border-0 pb-8 last:pb-0">
                    <!-- Dot -->
                    <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-blue-500 rounded-full"></div>

                    <div class="flex flex-col sm:flex-row justify-between gap-4">
                      <div class="text-gray-900">
                        <div class="text-lg font-bold">
                          {{ segment.departure.at | date:'HH:mm' }} • {{ segment.departure.at | date:'EEE, d MMM' }}
                        </div>
                        <div class="text-gray-500">
                           <app-airport-name [code]="segment.departure.iataCode"></app-airport-name> (Terminal {{ segment.departure.terminal || '1' }})
                        </div>
                        <div class="mt-2 text-sm text-gray-600 bg-gray-50 inline-block px-3 py-1 rounded-md">
                          <span class="font-medium">{{ segment.carrierCode }} {{ segment.number }}</span> • {{ segment.aircraft.code }}
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm text-gray-400">Duration</div>
                        <div class="text-gray-900">{{ formatDuration(segment.duration) }}</div>
                      </div>
                    </div>

                    @if (idx < itinerary.segments.length - 1) {
                      <div class="my-8 flex items-center gap-2 text-orange-600 text-sm font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <lucide-icon [name]="clockIcon" class="w-4 h-4"></lucide-icon>
                        <span>Layover in <app-airport-name [code]="segment.arrival.iataCode" class="font-bold"></app-airport-name></span>
                      </div>
                    }
                  </div>
                }

                <!-- Final Arrival -->
                <div class="relative pl-8 border-l-2 border-transparent">
                  <div class="absolute -left-[9px] top-0 w-4 h-4 bg-gray-900 border-2 border-gray-900 rounded-full"></div>
                  <div class="text-gray-900">
                    <div class="text-lg font-bold">
                      {{ lastSegment.arrival.at | date:'HH:mm' }} • {{ lastSegment.arrival.at | date:'EEE, d MMM' }}
                    </div>
                    <div class="text-gray-500">
                      <app-airport-name [code]="lastSegment.arrival.iataCode"></app-airport-name> (Terminal {{ lastSegment.arrival.terminal || '1' }})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fare Rules & Baggage -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-gray-900">
              <h3 class="font-semibold mb-4 flex items-center gap-2">
                <lucide-icon [name]="infoIcon" class="w-4 h-4 text-blue-600"></lucide-icon> Fare Rules & Baggage
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex items-start gap-3">
                  <lucide-icon [name]="checkIcon" class="w-5 h-5 text-green-500 mt-0.5"></lucide-icon>
                  <div>
                    <div class="font-medium text-sm">Cabin Baggage</div>
                    <div class="text-sm text-gray-500">1 x 7kg included</div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <lucide-icon [name]="checkIcon" class="w-5 h-5 text-green-500 mt-0.5"></lucide-icon>
                  <div>
                    <div class="font-medium text-sm">Checked Baggage</div>
                    <div class="text-sm text-gray-500">1 x 23kg included</div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <lucide-icon [name]="alertCircleIcon" class="w-5 h-5 text-orange-500 mt-0.5"></lucide-icon>
                  <div>
                    <div class="font-medium text-sm">Cancellation</div>
                    <div class="text-sm text-gray-500">Refundable with fee ($50)</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Price Summary & Action -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-6 sticky bottom-0 border-t sm:border-t-0 z-10 text-gray-900">
              <div>
                <div class="text-sm text-gray-500">Total Price for {{ flight.travelerPricings?.length || 1 }} Passenger(s)</div>
                <div class="text-3xl font-bold text-gray-900">
                  {{ flight.price.currency }} {{ flight.price.total }}
                </div>
              </div>
              <button
                (click)="continue()"
                class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-xl transition-all"
              >
                Continue to Passenger Details
              </button>
            </div>
          </div>
        } @else {
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-900">
            <p class="text-gray-500 mb-4">No flight selected.</p>
            <a routerLink="/" class="text-blue-600 font-bold hover:underline">Back to Search</a>
          </div>
        }
      </div>
    </div>
  `
})
export class BookingFlightDetailsComponent {
    private bookingService = inject(BookingService);
    private router = inject(Router);

    selectedFlight = this.bookingService.selectedFlight;

    // Icons
    arrowLeftIcon = ArrowLeft;
    planeIcon = Plane;
    clockIcon = Clock;
    infoIcon = Info;
    checkIcon = Check;
    alertCircleIcon = AlertCircle;

    formatDuration(duration: string) {
        return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
    }

    goBack() {
        window.history.back();
    }

    continue() {
        this.router.navigate(['/book/passenger-info']);
    }
}
