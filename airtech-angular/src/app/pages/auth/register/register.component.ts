import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LucideAngularModule, Loader2, AlertCircle } from 'lucide-angular';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
    template: `
    <div class="min-h-screen grid items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Create Account</h1>
          <p class="text-gray-500 mt-2">Join Air Tech Aviation today</p>
        </div>

        @if (error()) {
          <div class="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
            <lucide-icon [name]="alertIcon" class="w-4 h-4"></lucide-icon>
            {{ error() }}
          </div>
        }

        <form (submit)="handleSubmit($event)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              [(ngModel)]="formData.name"
              name="name"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              [(ngModel)]="formData.email"
              name="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              [(ngModel)]="formData.phone"
              name="phone"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              [(ngModel)]="formData.password"
              name="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              [(ngModel)]="formData.confirmPassword"
              name="confirmPassword"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            @if (loading()) {
              <lucide-icon [name]="loaderIcon" class="w-5 h-5 animate-spin"></lucide-icon>
            } @else {
              Sign Up
            }
          </button>
        </form>

        <p class="text-center text-sm text-gray-600">
          Already have an account? 
          <a routerLink="/auth/login" class="text-blue-600 font-semibold hover:underline">Log in</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    formData = {
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    };

    loading = signal(false);
    error = signal<string | null>(null);

    alertIcon = AlertCircle;
    loaderIcon = Loader2;

    async handleSubmit(event: Event) {
        event.preventDefault();
        this.error.set(null);

        if (this.formData.password !== this.formData.confirmPassword) {
            this.error.set("Passwords do not match");
            return;
        }

        if (this.formData.password.length < 6) {
            this.error.set("Password must be at least 6 characters");
            return;
        }

        this.loading.set(true);

        try {
            await this.authService.register(this.formData);
            this.router.navigate(['/dashboard']);
        } catch (err: any) {
            console.error("Registration error:", err);
            let errorMessage = "Failed to create account. Please try again.";
            if (err.code === "auth/email-already-in-use") {
                errorMessage = "Email is already registered.";
            }
            this.error.set(errorMessage);
        } finally {
            this.loading.set(false);
        }
    }
}
