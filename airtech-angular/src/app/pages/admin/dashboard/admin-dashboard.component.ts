import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { LucideAngularModule, DollarSign, Plane, Users, TrendingUp } from 'lucide-angular';
import { format } from 'date-fns';
import { AuthService } from '../../../services/auth.service';
import { effect } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 text-gray-900">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p class="text-gray-500 font-medium">Welcome back, Admin</p>
        </div>
      </div>

      @if (loading()) {
        <div class="p-12 text-center text-gray-500 font-bold">Loading dashboard metrics...</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (card of statCards(); track card.label) {
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm font-bold text-gray-500 lowercase tracking-wider">{{ card.label }}</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">{{ card.value }}</p>
                </div>
                <div class="p-2 bg-blue-50 rounded-lg">
                  <lucide-icon [name]="card.icon" class="w-5 h-5 text-blue-600"></lucide-icon>
                </div>
              </div>
              <div class="mt-4 flex items-center text-sm">
                <span class="text-green-600 font-bold uppercase text-[10px] tracking-widest">{{ card.trend }}</span>
              </div>
            </div>
          }
        </div>

        <!-- Recent Bookings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-gray-900">
          <div class="p-6 border-b border-gray-100">
            <h3 class="font-bold text-gray-900">Recent Bookings</h3>
          </div>
          <div class="overflow-x-auto">
            @if (stats().recentBookings.length === 0) {
              <div class="p-12 text-center text-gray-400 font-medium">No recent bookings found.</div>
            } @else {
              <table class="w-full text-left">
                <thead class="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th class="p-4">PNR</th>
                    <th class="p-4">User</th>
                    <th class="p-4">Amount</th>
                    <th class="p-4">Status</th>
                    <th class="p-4">Date</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (booking of stats().recentBookings; track booking.id) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="p-4 font-mono font-bold text-blue-600">{{ booking.pnr }}</td>
                      <td class="p-4 text-sm font-medium">{{ booking.userId || 'Guest' }}</td>
                      <td class="p-4 text-sm font-bold">{{ booking.currency }} {{ (booking.amount).toLocaleString() }}</td>
                      <td class="p-4">
                        <span [class]="'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + 
                                       (booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')">
                          {{ booking.status }}
                        </span>
                      </td>
                      <td class="p-4 text-sm text-gray-500 font-medium">
                        {{ booking.createdAt | date:'shortDate' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  loading = signal(true);
  stats = signal<any>({ totalRevenue: 0, totalBookings: 0, totalUsers: 0, recentBookings: [] });

  statCards = signal<any[]>([]);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && this.authService.isAdmin()) {
        this.loadStats();
      } else if (!this.authService.isLoading() && !user) {
        this.loading.set(false);
      }
    });
  }

  ngOnInit() { }

  loadStats() {
    this.loading.set(true);
    this.adminService.getStats().subscribe({
      next: (data: any) => {
        this.stats.set(data);
        this.updateCards(data);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error("Admin Stats Fetch Error:", err);
        this.loading.set(false);
      }
    });
  }

  updateCards(stats: any) {
    this.statCards.set([
      { label: "Total Revenue", value: `BDT ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, trend: "Auto-updated" },
      { label: "Total Bookings", value: stats.totalBookings, icon: Plane, trend: "Synced" },
      { label: "Active Users", value: stats.totalUsers, icon: Users, trend: "Registered" },
      { label: "Platform Status", value: "Active", icon: TrendingUp, trend: "Online" },
    ]);
  }
}
