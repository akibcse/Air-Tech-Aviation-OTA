import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FlightService } from '../../services/flight.service';
import { LucideAngularModule, Loader2, LogOut, User, Shield, Ticket, Plane } from 'lucide-angular';
import { AirportNameComponent } from '../../components/airport-name/airport-name.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink, DatePipe, AirportNameComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      @if (auth.isLoading()) {
        <div class="flex items-center justify-center min-h-[50vh]">
          <lucide-icon [name]="loaderIcon" class="w-8 h-8 animate-spin text-blue-600"></lucide-icon>
        </div>
      } @else if (auth.currentUser()) {
        <div class="max-w-4xl mx-auto space-y-6">
          <h1 class="text-3xl font-bold text-gray-900 font-outfit uppercase tracking-tight">My Dashboard</h1>

          <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div class="p-8 border-b border-gray-50 flex flex-wrap justify-between items-center text-gray-900 gap-6">
              <div class="flex items-center gap-6">
                <div class="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 overflow-hidden shadow-inner ring-4 ring-white">
                  @if (auth.currentUser()?.photoURL) {
                    <img [src]="auth.currentUser()?.photoURL" class="w-full h-full object-cover" />
                  } @else {
                    <lucide-icon [name]="userIcon" class="w-10 h-10"></lucide-icon>
                  }
                </div>
                <div>
                  <h2 class="text-2xl font-black text-gray-900 leading-tight">
                    {{ auth.currentUser()?.displayName || 'Traveler' }}
                  </h2>
                  <p class="text-gray-400 font-medium text-sm">{{ auth.currentUser()?.email }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white">
                      {{ auth.currentUser()?.role || 'User' }}
                    </span>
                  </div>
                </div>
              </div>

              <button
                (click)="auth.logout()"
                class="flex items-center gap-2 px-6 py-3 border-2 border-red-50 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all scale-95 hover:scale-100 shadow-sm"
              >
                <lucide-icon [name]="logOutIcon" class="w-5 h-5"></lucide-icon>
                Sign Out
              </button>
            </div>

            <div class="p-8 bg-gray-50/50">
              <h3 class="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Account Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-5 bg-white rounded-2xl border border-gray-100">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Account ID</p>
                  <p class="font-mono text-xs text-gray-900 break-all bg-gray-50 p-2 rounded-lg">{{ auth.currentUser()?.uid }}</p>
                </div>

                <div class="p-5 bg-white rounded-2xl border border-gray-100">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Contact Number</p>
                  <p class="text-sm font-bold text-gray-900">{{ auth.currentUser()?.phone || 'Not linked' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Bookings Section -->
          <div class="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div class="p-8 border-b border-gray-50 flex justify-between items-center text-gray-900">
              <h3 class="text-xl font-black flex items-center gap-3">
                <lucide-icon [name]="ticketIcon" class="w-6 h-6 text-blue-600"></lucide-icon>
                Your Journeys
              </h3>
              <a routerLink="/my-bookings" class="text-blue-600 font-black text-xs uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all">View All</a>
            </div>
            
            <div class="p-8">
              @if (isBookingsLoading()) {
                <div class="flex flex-col items-center justify-center py-12">
                  <lucide-icon [name]="loaderIcon" class="w-8 h-8 animate-spin text-blue-500 mb-4"></lucide-icon>
                  <p class="text-sm text-gray-400 font-bold animate-pulse">Scanning the skies...</p>
                </div>
              } @else if (recentBookings().length === 0) {
                <div class="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                  <p class="text-gray-400 font-bold mb-4">You haven't booked any flights yet.</p>
                  <a routerLink="/" class="text-blue-600 font-black text-sm uppercase underline decoration-2 underline-offset-4">Find your first destination</a>
                </div>
              } @else {
                <div class="grid gap-4">
                  @for (booking of recentBookings(); track booking.id) {
                    <div (click)="goToBookings()" class="group flex items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer">
                      <div class="flex items-center gap-6">
                        <div class="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                          <lucide-icon [name]="planeIcon" class="w-5 h-5 text-white"></lucide-icon>
                        </div>
                        <div>
                          <div class="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                             <app-airport-name [code]="booking.flight.itineraries[0].segments[0].departure.iataCode"></app-airport-name>
                             <span class="text-gray-300">→</span>
                             <app-airport-name [code]="booking.flight.itineraries[0].segments[booking.flight.itineraries[0].segments.length - 1].arrival.iataCode"></app-airport-name>
                          </div>
                          <div class="flex items-center gap-3 mt-1">
                            <span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-black tracking-widest">{{ booking.pnr }}</span>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{{ booking.createdAt | date:'mediumDate' }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xl font-black text-blue-700 tracking-tighter">{{ booking.currency }} {{ booking.amount }}</div>
                        <span [class]="getStatusClass(booking.status)" class="text-[10px] font-black uppercase tracking-widest px-3 py-1 mt-2 inline-block rounded-full">
                          {{ booking.status }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          @if (auth.isAdmin()) {
            <div class="p-1 rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 shadow-xl shadow-purple-500/20">
              <div class="bg-white rounded-[22px] p-8 text-gray-900">
                <div class="flex flex-wrap items-center justify-between gap-6">
                  <div class="flex items-center gap-4">
                    <div class="bg-purple-100 p-4 rounded-2xl text-purple-600">
                      <lucide-icon [name]="shieldIcon" class="w-8 h-8"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="text-xl font-black tracking-tight">Admin Terminal</h3>
                      <p class="text-gray-500 text-sm font-medium">Full system administrative access granted.</p>
                    </div>
                  </div>
                  <button routerLink="/admin" class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center gap-2 group">
                    Go to Admin Panel
                    <lucide-icon [name]="shieldIcon" class="w-4 h-4 group-hover:rotate-12 transition-transform"></lucide-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);
  router = inject(Router);
  flightService = inject(FlightService);

  // Icons
  loaderIcon = Loader2;
  logOutIcon = LogOut;
  userIcon = User;
  shieldIcon = Shield;
  ticketIcon = Ticket;
  planeIcon = Plane;

  recentBookings = signal<any[]>([]);
  isBookingsLoading = signal(true);

  constructor() {
    // Watch for auth changes and fetch bookings
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.flightService.getUserBookings(user.uid).subscribe({
          next: (data) => {
            this.recentBookings.set((Array.isArray(data) ? data : []).slice(0, 3));
            this.isBookingsLoading.set(false);
          },
          error: (err) => {
            console.error("Dashboard bookings error:", err);
            this.isBookingsLoading.set(false);
          }
        });
      }
    });

    // Redirect if not logged in
    effect(() => {
      if (!this.auth.isLoading() && !this.auth.currentUser()) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  goToBookings() {
    this.router.navigate(['/my-bookings']);
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

  getRoute(booking: any): string {
    if (!booking || !booking.flight || !booking.flight.itineraries) return 'N/A';
    const itinerary = booking.flight.itineraries[0];
    if (!itinerary || !itinerary.segments) return 'N/A';
    const first = itinerary.segments[0];
    const last = itinerary.segments[itinerary.segments.length - 1];
    return `${first.departure.iataCode} → ${last.arrival.iataCode}`;
  }
}
