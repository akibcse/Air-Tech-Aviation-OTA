import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { LucideAngularModule, Eye, Globe, MapPin, Mail, Search, RefreshCw, Clock, Laptop, Shield, UserCheck } from 'lucide-angular';

export interface VisitorLead {
  id: string;
  ip: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    countryCode?: string;
    lat?: number;
    lon?: number;
    org?: string;
  };
  email?: string | null;
  userAgent?: string;
  pageUrl?: string;
  action?: string;
  timestamp: string;
}

@Component({
  selector: 'app-admin-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span class="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <lucide-icon [name]="eyeIcon" class="w-6 h-6"></lucide-icon>
            </span>
            Visitor Lead Tracking
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Real-time analytics for store visitors, IP addresses, location metadata & lead emails.
          </p>
        </div>

        <button 
          (click)="loadVisitors()" 
          [disabled]="loading()"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50">
          <lucide-icon [name]="refreshIcon" class="w-4 h-4" [class.animate-spin]="loading()"></lucide-icon>
          Refresh Data
        </button>
      </div>

      <!-- Stats Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 grid place-content-center font-bold">
            <lucide-icon [name]="eyeIcon" class="w-6 h-6"></lucide-icon>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Visits</p>
            <p class="text-2xl font-black text-slate-900">{{ visitors().length }}</p>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 grid place-content-center font-bold">
            <lucide-icon [name]="userCheckIcon" class="w-6 h-6"></lucide-icon>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Identified Leads</p>
            <p class="text-2xl font-black text-emerald-600">{{ identifiedLeadsCount() }}</p>
          </div>
        </div>

        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 grid place-content-center font-bold">
            <lucide-icon [name]="globeIcon" class="w-6 h-6"></lucide-icon>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Unique Countries</p>
            <p class="text-2xl font-black text-indigo-600">{{ uniqueCountriesCount() }}</p>
          </div>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div class="relative w-full">
          <lucide-icon [name]="searchIcon" class="absolute left-3.5 top-3 w-4 h-4 text-slate-400"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by IP, Email, Location (City, Country), or Action..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      <!-- Table Section -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <lucide-icon [name]="refreshIcon" class="w-8 h-8 animate-spin text-blue-600"></lucide-icon>
            <p class="text-sm font-semibold">Loading visitor records...</p>
          </div>
        } @else if (filteredVisitors().length === 0) {
          <div class="p-12 text-center text-slate-500">
            <lucide-icon [name]="eyeIcon" class="w-12 h-12 mx-auto text-slate-300 mb-3"></lucide-icon>
            <p class="text-base font-bold text-slate-800">No Visitor Leads Found</p>
            <p class="text-xs text-slate-400 mt-1">Visitor location, IP address & email lead entries will appear here automatically on page load.</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th class="px-6 py-4">Visitor / IP</th>
                  <th class="px-6 py-4">Location</th>
                  <th class="px-6 py-4">Email Contact</th>
                  <th class="px-6 py-4">Action & Trigger</th>
                  <th class="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (v of filteredVisitors(); track v.id) {
                  <tr class="hover:bg-slate-50/80 transition-colors">
                    <!-- IP & Device -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class="p-1.5 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold">
                          {{ v.ip || 'Unknown' }}
                        </span>
                      </div>
                      <p class="text-[11px] text-slate-400 mt-1 max-w-xs truncate" [title]="v.userAgent || ''">
                        {{ v.userAgent || 'Web Browser' }}
                      </p>
                    </td>

                    <!-- Location -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                        <lucide-icon [name]="mapPinIcon" class="w-3.5 h-3.5 text-rose-500 shrink-0"></lucide-icon>
                        <span>{{ formatLocation(v.location) }}</span>
                      </div>
                      @if (v.location?.org) {
                        <p class="text-[11px] text-slate-400 mt-0.5">{{ v.location?.org }}</p>
                      }
                    </td>

                    <!-- Email Contact -->
                    <td class="px-6 py-4">
                      @if (v.email) {
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          <lucide-icon [name]="mailIcon" class="w-3 h-3 text-emerald-600"></lucide-icon>
                          {{ v.email }}
                        </div>
                      } @else {
                        <span class="text-xs text-slate-400 italic">Anonymous Visitor</span>
                      }
                    </td>

                    <!-- Action -->
                    <td class="px-6 py-4">
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        [ngClass]="{
                          'bg-blue-100 text-blue-800': v.action === 'gds_modal_impression',
                          'bg-indigo-100 text-indigo-800': v.action === 'gds_modal_click_enroll',
                          'bg-purple-100 text-purple-800': v.action === 'gds_modal_click_learn',
                          'bg-gray-100 text-gray-700': !v.action || v.action === 'page_load'
                        }">
                        {{ v.action || 'page_load' }}
                      </span>
                    </td>

                    <!-- Timestamp -->
                    <td class="px-6 py-4 text-xs text-slate-500 font-medium">
                      <div class="flex items-center gap-1">
                        <lucide-icon [name]="clockIcon" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                        {{ v.timestamp | date:'medium' }}
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class AdminVisitorsComponent implements OnInit {
  visitors = signal<VisitorLead[]>([]);
  loading = signal<boolean>(true);
  searchQuery = '';

  private adminService = inject(AdminService);

  eyeIcon = Eye;
  globeIcon = Globe;
  mapPinIcon = MapPin;
  mailIcon = Mail;
  searchIcon = Search;
  refreshIcon = RefreshCw;
  clockIcon = Clock;
  laptopIcon = Laptop;
  shieldIcon = Shield;
  userCheckIcon = UserCheck;

  filteredVisitors = computed(() => {
    const query = this.searchQuery.trim().toLowerCase();
    const list = this.visitors();
    if (!query) return list;

    return list.filter(v => {
      const ipMatch = (v.ip || '').toLowerCase().includes(query);
      const emailMatch = (v.email || '').toLowerCase().includes(query);
      const cityMatch = (v.location?.city || '').toLowerCase().includes(query);
      const countryMatch = (v.location?.country || '').toLowerCase().includes(query);
      const actionMatch = (v.action || '').toLowerCase().includes(query);
      return ipMatch || emailMatch || cityMatch || countryMatch || actionMatch;
    });
  });

  identifiedLeadsCount = computed(() => {
    return this.visitors().filter(v => !!v.email).length;
  });

  uniqueCountriesCount = computed(() => {
    const set = new Set<string>();
    this.visitors().forEach(v => {
      if (v.location?.country && v.location.country !== 'Unknown') {
        set.add(v.location.country);
      }
    });
    return set.size;
  });

  ngOnInit(): void {
    this.loadVisitors();
  }

  loadVisitors(): void {
    this.loading.set(true);
    this.adminService.getVisitors().subscribe({
      next: (data) => {
        this.visitors.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load visitors:', err);
        this.loading.set(false);
      }
    });
  }

  formatLocation(loc?: VisitorLead['location']): string {
    if (!loc) return 'Unknown Location';
    const parts = [loc.city, loc.region, loc.country].filter(p => p && p !== 'Unknown');
    return parts.length > 0 ? parts.join(', ') : 'Unknown Location';
  }
}
