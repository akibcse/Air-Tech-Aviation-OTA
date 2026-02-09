import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { FlightService } from '../../../services/flight.service';
import { LucideAngularModule, ArrowLeft, Lock, Loader2, CreditCard } from 'lucide-angular';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button (click)="goBack()" class="flex items-center gap-2 text-gray-500 mb-6 hover:text-gray-900 transition-colors">
          <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon> Back to Seats
        </button>

        <h1 class="text-3xl font-bold mb-8">Secure Payment</h1>

        @if (selectedFlight(); as flight) {
          <div class="flex flex-col md:flex-row gap-8">
            <div class="flex-1 space-y-6">
              <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 class="font-semibold mb-6 flex items-center gap-2 text-gray-900">
                  <lucide-icon [name]="creditCardIcon" class="w-5 h-5 text-gray-700"></lucide-icon> Payment Methods
                </h3>

                <!-- Payment Method Tabs -->
                <div class="flex gap-4 mb-8">
                  <button class="flex-1 py-3 px-4 border-2 border-blue-600 bg-blue-50 text-blue-700 font-bold rounded-lg flex items-center justify-center gap-2">
                    <lucide-icon [name]="creditCardIcon" class="w-5 h-5"></lucide-icon> Cards / Mobile Banking
                  </button>
                  <button class="flex-1 py-3 px-4 border border-gray-200 text-gray-400 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
                    <div class="w-5 h-5 bg-gray-200 rounded-full"></div> Bank Transfer (Soon)
                  </button>
                </div>

                <div class="space-y-4 mb-8">
                  <p class="text-sm text-gray-500 mb-2">Select your preferred payment channel:</p>
                  <div class="grid grid-cols-3 gap-4">
                    <!-- Mock Gateways -->
                    <div class="border border-blue-600 bg-blue-50 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer ring-2 ring-blue-600 ring-offset-2">
                      <div class="h-8 w-16 bg-pink-600 rounded mb-2 flex items-center justify-center text-white text-[10px] font-bold">bkash</div>
                      <span class="text-xs font-bold text-gray-700">bKash</span>
                    </div>
                    <div class="border border-gray-200 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                      <div class="h-8 w-16 bg-orange-500 rounded mb-2 flex items-center justify-center text-white text-[10px] font-bold">Nagad</div>
                      <span class="text-xs font-bold text-gray-500">Nagad</span>
                    </div>
                    <div class="border border-gray-200 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 transition-colors">
                      <div class="h-8 w-16 bg-purple-700 rounded mb-2 flex items-center justify-center text-white text-[10px] font-bold">Rocket</div>
                      <span class="text-xs font-bold text-gray-500">Rocket</span>
                    </div>
                  </div>
                </div>

                <div class="text-center py-4 border-t border-gray-100 pt-6">
                  <button
                    (click)="handlePayment()"
                    [disabled]="isProcessing()"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-blue-200 shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    @if (isProcessing()) {
                      <lucide-icon [name]="loaderIcon" class="w-6 h-6 animate-spin"></lucide-icon> Processing Secure Payment...
                    } @else {
                      Pay {{ flight.price.currency }} {{ total().toFixed(2) }} Now
                    }
                  </button>
                  <p class="text-xs text-gray-400 mt-4">
                    By clicking "Pay Now", you agree to our Terms & Conditions.
                  </p>
                </div>

                <div class="flex items-center gap-2 text-sm text-gray-500 justify-center mt-6">
                  <lucide-icon [name]="lockIcon" class="w-3 h-3 text-green-600"></lucide-icon> Encrypted & Secure Connection (SSL)
                </div>
              </div>
            </div>

            <!-- Summary Sidebar -->
            <div class="w-full md:w-80 h-fit bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-gray-900">
              <h3 class="font-semibold mb-4 border-b pb-2">Order Summary</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Flight Fare</span>
                  <span class="font-medium">{{ flight.price.currency }} {{ (flight.price.total).toFixed(2) }}</span>
                </div>
                @if (seatCost() > 0) {
                  <div class="flex justify-between">
                    <span class="text-gray-600">Seat Selection</span>
                    <span class="font-medium">{{ flight.price.currency }} {{ seatCost().toFixed(2) }}</span>
                  </div>
                }
                <div class="flex justify-between font-bold text-lg pt-2 border-t text-gray-900">
                  <span>Total</span>
                  <span>{{ flight.price.currency }} {{ total().toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-white p-12 rounded-xl text-center shadow-sm">
            <p class="text-red-500 font-bold mb-4">No active booking session.</p>
            <a routerLink="/" class="text-blue-600 font-bold hover:underline">Back to Search</a>
          </div>
        }
      </div>
    </div>
  `
})
export class PaymentComponent {
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private flightService = inject(FlightService);
  private router = inject(Router);

  selectedFlight = this.bookingService.selectedFlight;
  selectedSeats = this.bookingService.selectedSeats;
  passengers = this.bookingService.passengers;
  isProcessing = signal(false);

  // Icons
  arrowLeftIcon = ArrowLeft;
  lockIcon = Lock;
  loaderIcon = Loader2;
  creditCardIcon = CreditCard;

  seatCost = computed(() => Object.keys(this.selectedSeats()).length * 25);
  total = computed(() => {
    const flight = this.selectedFlight();
    if (!flight) return 0;
    return parseFloat(flight.price.total.toString()) + this.seatCost();
  });

  goBack() {
    window.history.back();
  }

  async handlePayment() {
    this.isProcessing.set(true);
    try {
      // Simulation delay
      await new Promise(r => setTimeout(r, 2000));

      const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const paymentId = `ANG_PAY_${Math.random().toString(36).substring(7)}`;
      const flight = this.selectedFlight();

      const bookingPayload = {
        pnr,
        paymentId,
        userId: this.authService.currentUser()?.uid,
        flight,
        passengers: this.passengers(),
        selectedSeats: this.selectedSeats(),
        amount: this.total(),
        currency: flight?.price.currency || 'BDT',
        status: 'CONFIRMED'
      };

      // Call backend to save
      await this.flightService.createBooking(bookingPayload);

      // Navigate to confirmation
      this.router.navigate(['/book/confirmation'], {
        queryParams: { pnr, amount: this.total(), currency: bookingPayload.currency }
      });
    } catch (e) {
      console.error("Payment failed", e);
      alert("Payment/Booking failed. Please try again.");
    } finally {
      this.isProcessing.set(false);
    }
  }
}
