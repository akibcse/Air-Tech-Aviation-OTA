import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5 text-gray-900">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 class="text-2xl font-black">Manage Users</h2>
        <div class="flex flex-col sm:flex-row gap-2">
          <input
            [(ngModel)]="searchText"
            placeholder="Search name or email"
            class="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            [(ngModel)]="roleFilter"
            class="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admins</option>
            <option value="USER">Users</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Total Users</p>
          <p class="text-lg font-black">{{ users().length }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Admins</p>
          <p class="text-lg font-black">{{ adminCount() }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Regular Users</p>
          <p class="text-lg font-black">{{ userCount() }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-3">
          <p class="text-[11px] uppercase text-gray-500">Showing</p>
          <p class="text-lg font-black">{{ filteredUsers().length }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left">
            <thead class="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th class="p-4">Name</th>
                <th class="p-4">Email</th>
                <th class="p-4">Role</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (user of filteredUsers(); track user.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="p-4 font-bold">{{ user.displayName || user.name || 'Anonymous' }}</td>
                  <td class="p-4 text-sm text-gray-600">{{ user.email }}</td>
                  <td class="p-4">
                    <span [class]="badgeClass(user.role)">{{ user.role || 'USER' }}</span>
                  </td>
                  <td class="p-4"><span class="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">ACTIVE</span></td>
                  <td class="p-4 text-right">
                    <button
                      (click)="toggleRole(user)"
                      [class]="buttonClass(user.role)"
                    >
                      {{ user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="md:hidden p-3 space-y-3">
          @for (user of filteredUsers(); track user.id) {
            <article class="rounded-xl border border-gray-200 p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-bold text-gray-900">{{ user.displayName || user.name || 'Anonymous' }}</p>
                  <p class="text-xs text-gray-500 break-all">{{ user.email }}</p>
                </div>
                <span [class]="badgeClass(user.role)">{{ user.role || 'USER' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">ACTIVE</span>
                <button (click)="toggleRole(user)" [class]="buttonClass(user.role)">
                  {{ user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin' }}
                </button>
              </div>
            </article>
          }
        </div>

        @if (!authService.isAdmin() && !authService.isLoading()) {
          <div class="p-12 text-center bg-red-50 border-t border-red-100">
            <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
            <p class="text-red-600 text-sm font-medium">You do not have administrative privileges.</p>
          </div>
        } @else if (filteredUsers().length === 0) {
          <div class="p-10 text-center text-gray-400 italic">No users match your filters.</div>
        }
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);

  users = signal<any[]>([]);
  searchText = '';
  roleFilter: 'ALL' | 'ADMIN' | 'USER' = 'ALL';

  adminCount = computed(() => this.users().filter(u => (u.role || 'USER') === 'ADMIN').length);
  userCount = computed(() => this.users().length - this.adminCount());

  filteredUsers = computed(() => {
    const search = this.searchText.toLowerCase().trim();
    return this.users().filter(u => {
      const role = (u.role || 'USER').toUpperCase();
      const roleOk = this.roleFilter === 'ALL' || role === this.roleFilter;
      const haystack = `${u.displayName || u.name || ''} ${u.email || ''}`.toLowerCase();
      const searchOk = !search || haystack.includes(search);
      return roleOk && searchOk;
    });
  });

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadUsers();
      }
    });
  }

  ngOnInit() {}

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: data => this.users.set(data),
      error: err => console.error('Admin Users Load Error:', err)
    });
  }

  toggleRole(user: any) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      this.adminService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          alert(`User role successfully changed to ${newRole}`);
          this.loadUsers();
        },
        error: err => {
          alert('Failed to update role. Please check admin permissions.');
          console.error(err);
        }
      });
    }
  }

  badgeClass(role: string) {
    return 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' +
      (role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700');
  }

  buttonClass(role: string) {
    return role === 'ADMIN'
      ? 'bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-gray-200 transition-all uppercase tracking-widest border border-gray-200'
      : 'bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all uppercase tracking-widest shadow-sm';
  }
}
