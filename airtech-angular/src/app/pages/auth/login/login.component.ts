import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LucideAngularModule, Loader2, AlertCircle } from 'lucide-angular';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
    template: `
    <div class="min-h-screen grid items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div class="text-center">
          <h1 class="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p class="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        @if (error()) {
          <div class="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
            <lucide-icon [name]="alertIcon" class="w-4 h-4"></lucide-icon>
            {{ error() }}
          </div>
        }

        <form (submit)="handleSubmit($event)" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              [(ngModel)]="email"
              name="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-sm font-medium text-gray-700">Password</label>
              <a routerLink="/auth/forgot-password" class="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>
            <input
              type="password"
              required
              [(ngModel)]="password"
              name="password"
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
              Sign In
            }
          </button>
        </form>

        <p class="text-center text-sm text-gray-600">
          Don't have an account? 
          <a routerLink="/auth/register" class="text-blue-600 font-semibold hover:underline">Create account</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    email = '';
    password = '';
    loading = signal(false);
    error = signal<string | null>(null);

    alertIcon = AlertCircle;
    loaderIcon = Loader2;

    async handleSubmit(event: Event) {
        event.preventDefault();
        this.error.set(null);
        this.loading.set(true);

        try {
            await this.authService.login(this.email, this.password);
            this.router.navigate(['/dashboard']);
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = "Failed to sign in. Please check your credentials.";
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                errorMessage = "Invalid email or password.";
            }
            this.error.set(errorMessage);
        } finally {
            this.loading.set(false);
        }
    }
}
