import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule, Ticket, Calendar, Plane, MapPin, Clock, AlertCircle, Loader2 } from 'lucide-angular';

@Component({
    selector: 'app-user-bookings',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between mb-8">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <lucide-icon [name]="ticketIcon" class="w-8 h-8 text-blue-600"></lucide-icon>
            My Bookings
          </h1>
        </div>

        @if (isLoading()) {
          <div class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <lucide-icon [name]="loaderIcon" class="w-10 h-10 animate-spin text-blue-600 mb-4"></lucide-icon>
            <p class="text-gray-500 font-medium">Loading your journeys...</p>
          </div>
        } @else if (bookings().length === 0) {
          <div class="text-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
             <div class="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <lucide-icon [name]="planeIcon" class="w-10 h-10 text-blue-500"></lucide-icon>
             </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p class="text-gray-500 max-w-sm mx-auto">You haven't made any flight bookings yet. Start your journey by searching for flights!</p>
          </div>
        } @else {
          <div class="grid gap-6">
            @for (booking of bookings(); track booking.id) {
              <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div class="p-6">
                  <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-4">
                      <div class="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wider">
                        PNR: {{ booking.pnr }}
                      </div>
                      <span [class]="getStatusClass(booking.status)" class="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                        {{ booking.status }}
                      </span>
                    </div>
                    <div class="text-sm text-gray-400">
                      Booked on {{ booking.createdAt | date:'mediumDate' }}
                    </div>
                  </div>

                  <div class="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <!-- Flight info -->
                    <div class="flex-1 w-full">
                       <div class="flex items-center justify-between mb-2">
                          <div class="text-center">
                            <div class="text-2xl font-black text-gray-900">{{ booking.flight.from }}</div>
                            <div class="text-xs text-gray-500 font-medium">{{ booking.flight.departureTime | date:'shortTime' }}</div>
                          </div>
                          
                          <div class="flex-1 px-8 flex flex-col items-center">
                             <div class="w-full flex items-center gap-2">
                                <div class="h-[2px] flex-1 bg-gray-200"></div>
                                <lucide-icon [name]="planeIcon" class="w-5 h-5 text-blue-600 rotate-90"></lucide-icon>
                                <div class="h-[2px] flex-1 bg-gray-200"></div>
                             </div>
                             <span class="text-[10px] text-gray-400 font-bold mt-1">{{ booking.flight.airline }} {{ booking.flight.flightNumber }}</span>
                          </div>

                          <div class="text-center">
                            <div class="text-2xl font-black text-gray-900">{{ booking.flight.to }}</div>
                            <div class="text-xs text-gray-500 font-medium">{{ booking.flight.arrivalTime | date:'shortTime' }}</div>
                          </div>
                       </div>
                    </div>

                    <!-- Price & Actions -->
                    <div class="flex flex-col items-end gap-3 min-w-[150px]">
                      <div class="text-2xl font-black text-blue-700">
                        {{ booking.currency }} {{ booking.amount }}
                      </div>
                      
                      @if (booking.status === 'CONFIRMED') {
                        <button 
                          (click)="cancelBooking(booking.id)"
                          class="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                        >
                          <lucide-icon [name]="alertIcon" class="w-4 h-4"></lucide-icon>
                          Request Cancel
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class UserBookingsComponent implements OnInit {
    private flightService = inject(FlightService);
    private authService = inject(AuthService);

    bookings = signal<any[]>([]);
    isLoading = signal(true);

    // Icons
    ticketIcon = Ticket;
    calendarIcon = Calendar;
    planeIcon = Plane;
    mapPinIcon = MapPin;
    clockIcon = Clock;
    alertIcon = AlertCircle;
    loaderIcon = Loader2;

    ngOnInit() {
        this.loadBookings();
    }

    loadBookings() {
        const user = this.authService.currentUser();
        if (user?.uid) {
            this.flightService.getUserBookings(user.uid).subscribe({
                next: (data) => {
                    this.bookings.set(data);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error("Error loading bookings:", err);
                    this.isLoading.set(false);
                }
            });
        } else {
            this.isLoading.set(false);
        }
    }

    cancelBooking(id: string) {
        if (confirm("Are you sure you want to request a cancellation for this booking?")) {
            this.flightService.requestCancellation(id).subscribe({
                next: () => {
                    alert("Cancellation request sent successfully. Admin will review your request.");
                    this.loadBookings();
                },
                error: (err) => {
                    alert("Failed to send cancellation request. Please try again later.");
                    console.error(err);
                }
            });
        }
    }

    getStatusClass(status: string) {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700';
            case 'ISSUED': return 'bg-blue-100 text-blue-700';
            case 'CANCEL_REQUESTED': return 'bg-amber-100 text-amber-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }
}
