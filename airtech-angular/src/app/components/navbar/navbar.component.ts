import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, LogIn, Menu, X, LogOut, Search, Ticket, Shield, Sparkles } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav class="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16 items-center">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <span class="text-xl font-black text-blue-600 tracking-tight">
              AirTech<span class="text-gray-900">Aviation</span>
            </span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
             <a routerLink="/" routerLinkActive="text-blue-600" [routerLinkActiveOptions]="{exact: true}"
                class="text-gray-900 hover:text-blue-600 font-medium transition-colors">
              Flights
             </a>
             <a routerLink="/" fragment="hotels" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">
               Hotels
             </a>
             <a routerLink="/" fragment="cars" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">
               Car Hire
             </a>
             <a routerLink="/support" routerLinkActive="text-blue-600" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">
               Support
             </a>
             <a routerLink="/chat" routerLinkActive="text-blue-600"
                class="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-bold px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-sm hover:shadow-md"
             >
               <span class="text-xs">✦</span> Ask AI
             </a>

            @if (auth.isLoading()) {
              <div class="flex items-center gap-4 ml-4 animate-pulse">
                <div class="h-8 w-20 bg-gray-200 rounded-lg"></div>
                <div class="h-8 w-24 bg-blue-100 rounded-lg"></div>
              </div>
            } @else {
              <!-- Admin Link -->
              @if (auth.isAdmin()) {
                <a routerLink="/admin" class="text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                  Admin Panel
                </a>
              }

              @if (auth.currentUser(); as user) {
                <div class="flex items-center gap-4 ml-4">
                  <a routerLink="/my-bookings" 
                     class="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    My Bookings
                  </a>
                  <a routerLink="/dashboard"
                     class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium hover:bg-blue-100 transition-colors">
                    <lucide-icon [name]="userIcon" class="w-4 h-4"></lucide-icon>
                    <span>{{ user.displayName || 'Dashboard' }}</span>
                  </a>
                  <button (click)="auth.logout()"
                          class="text-gray-600 hover:text-red-600 font-medium transition-colors">
                    Log out
                  </button>
                </div>
              } @else {
                <div class="flex items-center gap-4 ml-4">
                  <a routerLink="/auth/login"
                     class="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    Log in
                  </a>
                  <a routerLink="/auth/register"
                     class="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                    Sign up
                  </a>
                </div>
              }
            }
          </div>

          <!-- Mobile Menu Button -->
          <button class="md:hidden p-2 text-gray-600" (click)="isMenuOpen.set(!isMenuOpen())" aria-label="Toggle menu">
            <lucide-icon [name]="isMenuOpen() ? xIcon : menuIcon"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      @if (isMenuOpen()) {
        <div class="md:hidden bg-white border-t border-gray-100 p-4 space-y-4">
          <a routerLink="/" (click)="isMenuOpen.set(false)" class="block text-gray-600 font-medium">Home</a>
          <a routerLink="/search" (click)="isMenuOpen.set(false)" class="block text-gray-600 font-medium">Search Flights</a>
          <a routerLink="/support" (click)="isMenuOpen.set(false)" class="block text-gray-600 font-medium">Support</a>
          <a routerLink="/chat" (click)="isMenuOpen.set(false)" class="flex items-center gap-2 text-blue-600 font-bold">
            <lucide-icon [name]="sparklesIcon" class="w-4 h-4"></lucide-icon>
            AI Assistant
          </a>
          
          @if (!auth.isLoading()) {
            <div class="pt-4 border-t border-gray-100 space-y-3">
              @if (auth.currentUser(); as user) {
                @if (auth.isAdmin()) {
                  <a routerLink="/admin" (click)="isMenuOpen.set(false)" class="block text-indigo-600 font-bold">Admin Panel</a>
                }
                <a routerLink="/dashboard" (click)="isMenuOpen.set(false)" class="flex items-center gap-2 text-blue-600 font-medium">
                  <lucide-icon [name]="userIcon" class="w-4 h-4"></lucide-icon>
                  Dashboard
                </a>
                <a routerLink="/my-bookings" (click)="isMenuOpen.set(false)" class="block text-gray-600 font-medium">My Bookings</a>
                <button (click)="auth.logout(); isMenuOpen.set(false)" 
                        class="flex items-center gap-2 text-gray-600 font-medium w-full text-left hover:text-red-600">
                  <lucide-icon [name]="logOutIcon" class="w-4 h-4"></lucide-icon>
                  Log out
                </button>
              } @else {
                <a routerLink="/auth/login" (click)="isMenuOpen.set(false)" class="block text-gray-700 font-medium">Log in</a>
                <a routerLink="/auth/register" (click)="isMenuOpen.set(false)" class="block w-full text-center py-2 bg-blue-600 text-white rounded-lg font-medium">Sign Up</a>
              }
            </div>
          }

          <div class="pt-6 border-t border-gray-100">
            <p class="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Created By</p>
            <p class="text-xs font-bold text-gray-700">Md. Akib Hasan</p>
            <p class="text-[10px] text-blue-600 font-semibold">Aviation Trainer & GDS Expert</p>
          </div>
        </div>
      }

      <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 px-2 py-2 pb-safe">
        <div class="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <a
            routerLink="/"
            [routerLinkActiveOptions]="{ exact: true }"
            routerLinkActive="text-blue-600 bg-blue-50"
            class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
          >
            <lucide-icon [name]="searchIcon" class="w-4 h-4"></lucide-icon>
            <span class="text-[10px] font-semibold">Explore</span>
          </a>

          <a
            routerLink="/search"
            routerLinkActive="text-blue-600 bg-blue-50"
            class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
          >
            <lucide-icon [name]="searchIcon" class="w-4 h-4"></lucide-icon>
            <span class="text-[10px] font-semibold">Search</span>
          </a>

          <a
            routerLink="/chat"
            routerLinkActive="text-blue-600 bg-blue-50"
            class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
          >
            <lucide-icon [name]="sparklesIcon" class="w-4 h-4"></lucide-icon>
            <span class="text-[10px] font-semibold">AI Chat</span>
          </a>

          @if (auth.currentUser()) {
            <a
              routerLink="/my-bookings"
              routerLinkActive="text-blue-600 bg-blue-50"
              class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
            >
              <lucide-icon [name]="ticketIcon" class="w-4 h-4"></lucide-icon>
              <span class="text-[10px] font-semibold">Trips</span>
            </a>
          } @else {
            <a
              routerLink="/auth/login"
              routerLinkActive="text-blue-600 bg-blue-50"
              class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
            >
              <lucide-icon [name]="logInIcon" class="w-4 h-4"></lucide-icon>
              <span class="text-[10px] font-semibold">Login</span>
            </a>
          }

          @if (auth.isAdmin()) {
            <a
              routerLink="/admin"
              routerLinkActive="text-blue-600 bg-blue-50"
              class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
            >
              <lucide-icon [name]="shieldIcon" class="w-4 h-4"></lucide-icon>
              <span class="text-[10px] font-semibold">Admin</span>
            </a>
          } @else {
            <a
              routerLink="/dashboard"
              routerLinkActive="text-blue-600 bg-blue-50"
              class="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-gray-500"
            >
              <lucide-icon [name]="userIcon" class="w-4 h-4"></lucide-icon>
              <span class="text-[10px] font-semibold">Account</span>
            </a>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  isMenuOpen = signal(false);

  // Icons
  userIcon = User;
  logInIcon = LogIn;
  logOutIcon = LogOut;
  menuIcon = Menu;
  xIcon = X;
  searchIcon = Search;
  ticketIcon = Ticket;
  shieldIcon = Shield;
  sparklesIcon = Sparkles;
}
