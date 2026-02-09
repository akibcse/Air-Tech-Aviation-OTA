import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { LucideAngularModule, Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-angular';

@Component({
    selector: 'app-admin-api-health',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="space-y-6 text-gray-900">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-black">Amadeus API Health</h2>
        <div class="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full">
           <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           <span class="text-xs font-bold uppercase tracking-widest">Live Monitoring</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (api of apiStats(); track api.name) {
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
            <div class="flex justify-between items-start mb-4">
              <div class="p-2 bg-gray-50 rounded-lg">
                <lucide-icon [name]="activityIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
              </div>
              <span [class]="'px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ' + 
                             (api.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')">
                {{ api.status || 'OK' }}
              </span>
            </div>

            <h3 class="font-bold text-gray-900 truncate mb-1" [title]="api.name">{{ api.name }}</h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">Amadeus Provider</p>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-gray-400">
                  <lucide-icon [name]="zapIcon" class="w-3 h-3"></lucide-icon>
                  <span class="text-xs font-bold uppercase tracking-tighter">Requests</span>
                </div>
                <p class="text-xl font-black text-gray-900">{{ api.requests | number }}</p>
              </div>
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-gray-400">
                  <lucide-icon [name]="clockIcon" class="w-3 h-3"></lucide-icon>
                  <span class="text-xs font-bold uppercase tracking-tighter">Latency</span>
                </div>
                <p class="text-xl font-black text-gray-900">{{ api.avgResponseTime || 0 }}<span class="text-xs ml-0.5">ms</span></p>
              </div>
            </div>

            @if (api.lastError) {
              <div class="mt-6 p-3 bg-red-50 rounded-xl flex gap-3 items-start border border-red-100">
                <lucide-icon [name]="alertIcon" class="w-4 h-4 text-red-500 mt-0.5"></lucide-icon>
                <div>
                  <p class="text-[10px] font-black text-red-800 uppercase tracking-widest leading-none mb-1">Last Error</p>
                  <p class="text-[11px] text-red-600 font-medium line-clamp-2 leading-tight">{{ api.lastError }}</p>
                </div>
              </div>
            }

            <div class="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
              <span class="text-[10px] text-gray-400 font-bold uppercase">Errors: {{ api.errors || 0 }}</span>
              <span class="text-[10px] text-gray-400 font-medium italic">Last: {{ api.lastUsed | date:'HH:mm:ss' }}</span>
            </div>
          </div>
        }
      </div>

      @if (apiStats().length === 0) {
        <div class="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <lucide-icon [name]="activityIcon" class="w-12 h-12 text-gray-200 mx-auto mb-4 animate-pulse"></lucide-icon>
          <p class="text-gray-400 font-medium">No API calls tracked yet. Start a search to see data.</p>
        </div>
      }
    </div>
  `
})
export class AdminApiHealthComponent implements OnInit, OnDestroy {
    private adminService = inject(AdminService);
    apiStats = signal<any[]>([]);
    private pollInterval: any;

    // Icons
    activityIcon = Activity;
    alertIcon = AlertTriangle;
    checkIcon = CheckCircle;
    clockIcon = Clock;
    zapIcon = Zap;

    ngOnInit() {
        this.loadHealth();
        this.pollInterval = setInterval(() => this.loadHealth(), 10000); // Poll every 10s
    }

    ngOnDestroy() {
        if (this.pollInterval) clearInterval(this.pollInterval);
    }

    loadHealth() {
        this.adminService.getApiHealth().subscribe(data => {
            this.apiStats.set(data);
        });
    }
}
