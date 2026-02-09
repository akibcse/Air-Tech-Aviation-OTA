import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookingService, Passenger } from '../../../services/booking.service';
import { LucideAngularModule, User, CreditCard, ArrowLeft } from 'lucide-angular';

@Component({
    selector: 'app-passenger-info',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, RouterLink],
    template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button
          (click)="goBack()"
          class="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
        >
          <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon> Back to Flight Details
        </button>

        <h1 class="text-3xl font-bold mb-8">Passenger Details</h1>

        @if (!selectedFlight()) {
          <div class="bg-white p-12 rounded-xl text-center shadow-sm text-gray-900">
            <p class="text-red-500 mb-4 font-bold">Session expired. Please search again.</p>
            <a routerLink="/" class="text-blue-600 font-bold hover:underline">Back to Search</a>
          </div>
        } @else {
          <form (submit)="handleSubmit($event)" class="space-y-6">
            @for (passenger of passengers(); track passenger.id; let idx = $index) {
              <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-gray-900">
                <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                  <lucide-icon [name]="userIcon" class="w-5 h-5 text-blue-600"></lucide-icon>
                  Passenger {{ idx + 1 }} ({{ passenger.type }})
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <select
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                      [(ngModel)]="passenger.title"
                      [name]="'title' + idx"
                      required
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>

                  <div class="hidden md:block"></div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      [(ngModel)]="passenger.firstName"
                      [name]="'firstName' + idx"
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      [(ngModel)]="passenger.lastName"
                      [name]="'lastName' + idx"
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      [(ngModel)]="passenger.dateOfBirth"
                      [name]="'dob' + idx"
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      required
                      [(ngModel)]="passenger.nationality"
                      [name]="'nat' + idx"
                      placeholder="e.g. Bangladesh"
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                    <input
                      type="text"
                      required
                      [(ngModel)]="passenger.passportNumber"
                      [name]="'passport' + idx"
                      class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <!-- Contact Info for Passenger 1 -->
                  @if (idx === 0) {
                    <div class="md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                      <h4 class="font-medium text-sm text-gray-900 mb-3">Contact Information</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            required
                            [(ngModel)]="passenger.email"
                            name="email"
                            class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            [(ngModel)]="passenger.phone"
                            name="phone"
                            class="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <button
              type="submit"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-xl transition-all"
            >
              Continue to Seat Selection
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class PassengerInfoComponent {
    private bookingService = inject(BookingService);
    private router = inject(Router);

    selectedFlight = this.bookingService.selectedFlight;
    passengers = signal<Passenger[]>([]);

    // Icons
    arrowLeftIcon = ArrowLeft;
    userIcon = User;

    constructor() {
        // Initialize based on traveler pricings
        const flight = this.selectedFlight();
        if (flight) {
            const ps: Passenger[] = (flight.travelerPricings || [{}]).map((_: any, idx: number) => ({
                id: (idx + 1).toString(),
                type: 'ADULT', // default
                title: 'Mr',
                firstName: '',
                lastName: '',
                dateOfBirth: '',
                nationality: '',
                passportNumber: '',
                email: '',
                phone: ''
            }));
            this.passengers.set(ps);
        }
    }

    goBack() {
        window.history.back();
    }

    handleSubmit(e: Event) {
        e.preventDefault();
        this.bookingService.setPassengers(this.passengers());
        this.router.navigate(['/book/seats']);
    }
}
