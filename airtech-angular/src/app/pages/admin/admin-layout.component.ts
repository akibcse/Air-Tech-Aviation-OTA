import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, Users, Plane, Settings, ArrowLeft, Activity } from 'lucide-angular';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-xl font-bold text-blue-600 flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              A
            </div>
            Admin Panel
          </h2>
        </div>

        <nav class="flex-1 p-4 space-y-2 pt-8">
          @for (item of menuItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-blue-50 text-blue-600"
              [routerLinkActiveOptions]="{ exact: item.path === '/admin' }"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 font-bold transition-all hover:bg-gray-50 group"
            >
              <lucide-icon [name]="item.icon" class="w-5 h-5 group-hover:scale-110 transition-transform"></lucide-icon>
              {{ item.label }}
            </a>
          }
        </nav>

        <div class="p-4 border-t border-gray-100">
          <a routerLink="/" class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-bold px-4 py-2">
            <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon>
            Back to Site
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-8 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Bookings', path: '/admin/bookings', icon: Plane }, // Plane icon for bookings as alternative
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'API Health', path: '/admin/api-health', icon: Activity },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  arrowLeftIcon = ArrowLeft;
}
