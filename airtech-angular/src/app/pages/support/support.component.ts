import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-[70vh] bg-gray-50 px-4 py-8">
      <section class="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <h1 class="text-3xl font-black text-gray-900 mb-2">AirTech Aviation Support</h1>
        <p class="text-gray-600 mb-6">Need help with flight booking, payment, schedule updates, or refund requests in Bangladesh? Our support team is ready to help.</p>

        <div class="grid md:grid-cols-2 gap-4 text-sm">
          <div class="rounded-lg border border-gray-200 p-4">
            <h2 class="font-bold text-gray-900 mb-2">Customer Care</h2>
            <p class="text-gray-600">Email: <a class="text-blue-700 font-semibold" href="mailto:roadyakib@gmail.com">roadyakib&#64;gmail.com</a></p>
            <p class="text-gray-600 mt-1">Phone: <a class="text-blue-700 font-semibold" href="tel:01521438546">01521438546</a></p>
          </div>
          <div class="rounded-lg border border-gray-200 p-4">
            <h2 class="font-bold text-gray-900 mb-2">Service Area</h2>
            <p class="text-gray-600">Primary market: Dhaka and all major cities in Bangladesh.</p>
            <p class="text-gray-600 mt-1">We support domestic and international flight bookings.</p>
          </div>
        </div>

        <div class="mt-6">
          <a routerLink="/search" class="inline-flex items-center rounded-lg bg-blue-600 text-white px-5 py-2.5 font-semibold hover:bg-blue-700 transition-colors">Search Flights</a>
        </div>
      </section>
    </main>
  `
})
export class SupportComponent {}
