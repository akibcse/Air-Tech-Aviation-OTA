import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 text-gray-900">
      <h2 class="text-2xl font-bold">All Bookings</h2>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-gray-900">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="p-4 text-gray-900">PNR</th>
              <th class="p-4 text-gray-900">Route</th>
              <th class="p-4 text-gray-900">Amount</th>
              <th class="p-4 text-gray-900">Status</th>
              <th class="p-4 text-gray-900">Date</th>
              <th class="p-4 text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (booking of bookings(); track booking.id) {
              <tr class="hover:bg-gray-50">
                <td class="p-4 font-mono font-bold text-blue-600">{{ booking.pnr }}</td>
                <td class="p-4 text-sm font-medium">
                  {{ getRoute(booking) }}
                </td>
                <td class="p-4 text-sm font-bold">{{ booking.currency }} {{ booking.amount }}</td>
                <td class="p-4">
                  <span [class]="'px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + 
                                 getStatusBadgeClass(booking.status)">
                    {{ booking.status }}
                  </span>
                </td>
                <td class="p-4 text-sm text-gray-500 font-medium">{{ booking.createdAt | date:'shortDate' }}</td>
                <td class="p-4">
                  <div class="flex gap-2">
                    @if (booking.status === 'CONFIRMED' || booking.status === 'CANCEL_REQUESTED') {
                      <button (click)="updateStatus(booking.id, 'ISSUED')" 
                              class="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-700 transition-colors">
                        ISSUE
                      </button>
                      <button (click)="updateStatus(booking.id, 'CANCELLED')" 
                              class="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-red-700 transition-colors">
                        CANCEL
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!authService.isAdmin() && !authService.isLoading()) {
          <div class="p-12 text-center bg-red-50 rounded-xl border border-red-100">
            <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
            <p class="text-red-600 text-sm font-medium">Administrative authorization required to view booking lists.</p>
          </div>
        } @else if (bookings().length === 0) {
            <div class="p-12 text-center text-gray-400 font-medium italic">No bookings found. Ensure the database contains records.</div>
        }
      </div>
    </div>
  `
})
export class AdminBookingsComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  bookings = signal<any[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadBookings();
      }
    });
  }

  ngOnInit() {
  }

  loadBookings() {
    this.adminService.getBookings().subscribe({
      next: (data) => this.bookings.set(data),
      error: (err) => console.error("Admin Bookings Load Error:", err)
    });
  }

  updateStatus(id: string, status: string) {
    if (confirm(`Are you sure you want to update status to ${status}?`)) {
      this.adminService.updateBookingStatus(id, status).subscribe({
        next: () => {
          alert(`Booking status updated to ${status}`);
          this.loadBookings();
        },
        error: (err) => {
          alert("Failed to update status");
          console.error(err);
        }
      });
    }
  }

  getStatusBadgeClass(status: string) {
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
