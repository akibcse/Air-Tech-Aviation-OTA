import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, Plane, Settings, ArrowLeft, Activity, Menu, X, Megaphone, Tags, Eye } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <aside class="w-72 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-xl font-black text-slate-900 flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-blue-600 text-white grid place-content-center text-sm">A</span>
            Admin Console
          </h2>
        </div>

        <nav class="flex-1 p-4 space-y-2 pt-6">
          @for (item of menuItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-blue-50 text-blue-700"
              [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-semibold transition-all hover:bg-gray-50"
            >
              <lucide-icon [name]="item.icon" class="w-5 h-5"></lucide-icon>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="p-4 border-t border-gray-100">
          <a routerLink="/" class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-semibold px-4 py-2">
            <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon>
            Back to Site
          </a>
        </div>
      </aside>

      <div class="flex-1 min-w-0">
        <header class="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <p class="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">Admin</p>
            <p class="font-black text-slate-900">Operations</p>
          </div>
          <button (click)="mobileMenuOpen.set(true)" class="rounded-lg border border-gray-200 p-2" aria-label="Open admin menu">
            <lucide-icon [name]="menuIcon" class="w-5 h-5"></lucide-icon>
          </button>
        </header>

        <main class="p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <router-outlet></router-outlet>
        </main>

        <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-2">
          <div class="grid grid-cols-8 gap-1 max-w-2xl mx-auto">
            @for (item of menuItems; track item.path) {
              <a
                [routerLink]="item.path"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
                routerLinkActive="text-blue-700 bg-blue-50"
                class="flex flex-col items-center gap-1 py-2 rounded-xl text-gray-500"
              >
                <lucide-icon [name]="item.icon" class="w-4 h-4"></lucide-icon>
                <span class="text-[10px] font-semibold">{{ item.shortLabel }}</span>
              </a>
            }
          </div>
        </nav>
      </div>

      @if (mobileMenuOpen()) {
        <div class="lg:hidden fixed inset-0 z-50 bg-black/45" (click)="mobileMenuOpen.set(false)"></div>
        <aside class="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl p-5">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black text-slate-900">Admin Menu</h3>
            <button (click)="mobileMenuOpen.set(false)" aria-label="Close admin menu">
              <lucide-icon [name]="xIcon" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <div class="space-y-2">
            @for (item of menuItems; track item.path) {
              <a
                [routerLink]="item.path"
                (click)="mobileMenuOpen.set(false)"
                routerLinkActive="bg-blue-50 text-blue-700"
                [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
                class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-semibold"
              >
                <lucide-icon [name]="item.icon" class="w-5 h-5"></lucide-icon>
                {{ item.label }}
              </a>
            }
          </div>

          <a routerLink="/" (click)="mobileMenuOpen.set(false)" class="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 font-semibold">
            <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon>
            Back to Site
          </a>
        </aside>
      }
    </div>
  `
})
export class AdminLayoutComponent {
  mobileMenuOpen = signal(false);

  menuItems = [
    { label: 'Dashboard', shortLabel: 'Home', path: '/admin', icon: LayoutDashboard },
    { label: 'Bookings', shortLabel: 'Orders', path: '/admin/bookings', icon: Plane },
    { label: 'Users', shortLabel: 'Users', path: '/admin/users', icon: Users },
    { label: 'Visitor Leads', shortLabel: 'Leads', path: '/admin/visitors', icon: Eye },
    { label: 'API Health', shortLabel: 'API', path: '/admin/api-health', icon: Activity },
    { label: 'Homepage SEO', shortLabel: 'SEO', path: '/admin/digital-marketing/homepage-seo', icon: Megaphone },
    { label: 'Meta Tags', shortLabel: 'Meta', path: '/admin/digital-marketing/meta-tags', icon: Tags },
    { label: 'Settings', shortLabel: 'Setup', path: '/admin/settings', icon: Settings }
  ];
  arrowLeftIcon = ArrowLeft;
  menuIcon = Menu;
  xIcon = X;
}
