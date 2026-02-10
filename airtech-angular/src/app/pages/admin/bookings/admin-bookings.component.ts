import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5 text-gray-900">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 class="text-2xl font-black">All Bookings</h2>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            [(ngModel)]="searchText"
            placeholder="Search PNR or route"
            class="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            [(ngModel)]="statusFilter"
            class="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ISSUED">Issued</option>
            <option value="CANCEL_REQUESTED">Cancel Requested</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Bookings</p>
          <p class="text-lg font-black">{{ bookings().length }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Revenue</p>
          <p class="text-lg font-black">{{ totalRevenue() | number }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Pending Cancel</p>
          <p class="text-lg font-black">{{ cancelRequestCount() }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Showing</p>
          <p class="text-lg font-black">{{ filteredBookings().length }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th class="p-4">PNR</th>
                <th class="p-4">Route</th>
                <th class="p-4">Amount</th>
                <th class="p-4">Status</th>
                <th class="p-4">Date</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (booking of filteredBookings(); track booking.id) {
                <tr class="hover:bg-gray-50">
                  <td class="p-4 font-mono font-bold text-blue-600">{{ booking.pnr }}</td>
                  <td class="p-4 text-sm font-medium">{{ getRoute(booking) }}</td>
                  <td class="p-4 text-sm font-bold">{{ booking.currency }} {{ booking.amount }}</td>
                  <td class="p-4"><span [class]="statusBadge(booking.status)">{{ booking.status }}</span></td>
                  <td class="p-4 text-sm text-gray-500">{{ booking.createdAt | date:'shortDate' }}</td>
                  <td class="p-4 text-right">
                    <div class="inline-flex gap-2">
                      @if (booking.status === 'CONFIRMED' || booking.status === 'CANCEL_REQUESTED') {
                        <button (click)="updateStatus(booking.id, 'ISSUED')" class="bg-blue-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold hover:bg-blue-700 transition-colors uppercase">Issue</button>
                        <button (click)="updateStatus(booking.id, 'CANCELLED')" class="bg-red-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold hover:bg-red-700 transition-colors uppercase">Cancel</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="md:hidden p-3 space-y-3">
          @for (booking of filteredBookings(); track booking.id) {
            <article class="rounded-xl border border-gray-200 p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-mono font-bold text-blue-600">{{ booking.pnr }}</p>
                  <p class="text-sm font-semibold text-gray-900">{{ getRoute(booking) }}</p>
                  <p class="text-xs text-gray-500">{{ booking.createdAt | date:'mediumDate' }}</p>
                </div>
                <span [class]="statusBadge(booking.status)">{{ booking.status }}</span>
              </div>

              <div class="flex items-center justify-between">
                <p class="font-black text-gray-900">{{ booking.currency }} {{ booking.amount }}</p>
                @if (booking.status === 'CONFIRMED' || booking.status === 'CANCEL_REQUESTED') {
                  <div class="inline-flex gap-2">
                    <button (click)="updateStatus(booking.id, 'ISSUED')" class="bg-blue-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold hover:bg-blue-700 transition-colors uppercase">Issue</button>
                    <button (click)="updateStatus(booking.id, 'CANCELLED')" class="bg-red-600 text-white px-2.5 py-1.5 rounded text-[10px] font-bold hover:bg-red-700 transition-colors uppercase">Cancel</button>
                  </div>
                }
              </div>
            </article>
          }
        </div>

        @if (!authService.isAdmin() && !authService.isLoading()) {
          <div class="p-12 text-center bg-red-50 border-t border-red-100">
            <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
            <p class="text-red-600 text-sm font-medium">Administrative authorization required.</p>
          </div>
        } @else if (filteredBookings().length === 0) {
          <div class="p-10 text-center text-gray-400 italic">No bookings match your filters.</div>
        }
      </div>
    </div>
  `
})
export class AdminBookingsComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  bookings = signal<any[]>([]);
  searchText = '';
  statusFilter: 'ALL' | 'CONFIRMED' | 'ISSUED' | 'CANCEL_REQUESTED' | 'CANCELLED' = 'ALL';

  totalRevenue = computed(() => this.bookings().reduce((sum, b) => sum + Number(b.amount || 0), 0));
  cancelRequestCount = computed(() => this.bookings().filter(b => b.status === 'CANCEL_REQUESTED').length);

  filteredBookings = computed(() => {
    const search = this.searchText.toLowerCase().trim();
    return this.bookings().filter(booking => {
      const statusOk = this.statusFilter === 'ALL' || booking.status === this.statusFilter;
      const haystack = `${booking.pnr || ''} ${this.getRoute(booking)}`.toLowerCase();
      const searchOk = !search || haystack.includes(search);
      return statusOk && searchOk;
    });
  });

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadBookings();
      }
    });
  }

  ngOnInit() {}

  loadBookings() {
    this.adminService.getBookings().subscribe({
      next: data => this.bookings.set(data),
      error: err => console.error('Admin Bookings Load Error:', err)
    });
  }

  updateStatus(id: string, status: string) {
    if (confirm(`Are you sure you want to update status to ${status}?`)) {
      this.adminService.updateBookingStatus(id, status).subscribe({
        next: () => {
          alert(`Booking status updated to ${status}`);
          this.loadBookings();
        },
        error: err => {
          alert('Failed to update status');
          console.error(err);
        }
      });
    }
  }

  statusBadge(status: string) {
    return 'px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + this.getStatusBadgeClass(status);
  }

  getStatusBadgeClass(status: string) {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'ISSUED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCEL_REQUESTED':
        return 'bg-amber-100 text-amber-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getRoute(booking: any): string {
    if (!booking || !booking.flight || !booking.flight.itineraries) {
      return 'N/A';
    }
    const itinerary = booking.flight.itineraries[0];
    if (!itinerary || !itinerary.segments) {
      return 'N/A';
    }
    const first = itinerary.segments[0];
    const last = itinerary.segments[itinerary.segments.length - 1];
    return `${first.departure.iataCode} -> ${last.arrival.iataCode}`;
  }
}
