import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 text-gray-900">
      <h2 class="text-2xl font-bold">Manage Users & Roles</h2>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-gray-900">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="p-4 text-gray-900">Name</th>
              <th class="p-4 text-gray-900">Email</th>
              <th class="p-4 text-gray-900">Role</th>
              <th class="p-4 text-gray-900">Status</th>
              <th class="p-4 text-gray-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (user of users(); track user.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-4 font-bold text-gray-900">{{ user.displayName || user.name || 'Anonymous' }}</td>
                <td class="p-4 text-sm text-gray-600 font-medium">{{ user.email }}</td>
                <td class="p-4">
                  <span [class]="'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ' + 
                                 (user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')">
                    {{ user.role || 'USER' }}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span class="text-xs font-bold text-gray-400">ACTIVE</span>
                  </div>
                </td>
                <td class="p-4 text-right">
                   @if (user.role !== 'ADMIN') {
                     <button (click)="changeRole(user.id, 'ADMIN')"
                             class="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-purple-700 transition-all uppercase tracking-widest shadow-sm">
                       Make Admin
                     </button>
                   } @else {
                      <button (click)="changeRole(user.id, 'USER')"
                             class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-gray-200 transition-all uppercase tracking-widest border border-gray-200">
                       Revoke Admin
                     </button>
                   }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!authService.isAdmin() && !authService.isLoading()) {
          <div class="p-12 text-center bg-red-50 rounded-xl border border-red-100">
            <h3 class="text-red-800 font-black uppercase tracking-widest mb-2">Access Denied</h3>
            <p class="text-red-600 text-sm font-medium">You do not have administrative privileges. Contact the system owner if this is an error.</p>
          </div>
        } @else if (users().length === 0) {
          <div class="p-12 text-center text-gray-400 font-medium font-italic italic">No users found. If this persists, check database permissions.</div>
        }
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  adminService = inject(AdminService);
  authService = inject(AuthService);
  users = signal<any[]>([]);

  constructor() {
    effect(() => {
      if (this.authService.currentUser() && this.authService.isAdmin()) {
        this.loadUsers();
      }
    });
  }

  ngOnInit() {
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error("Admin Users Load Error:", err)
    });
  }

  changeRole(userId: string, newRole: string) {
    if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      this.adminService.updateUserRole(userId, newRole).subscribe({
        next: () => {
          alert(`User role successfully changed to ${newRole}`);
          this.loadUsers();
        },
        error: (err) => {
          alert("Failed to update role. Please check admin permissions.");
          console.error(err);
        }
      });
    }
  }
}
