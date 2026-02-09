import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { LucideAngularModule, ArrowLeft, ArrowRight, Check } from 'lucide-angular';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="flex justify-between items-center mb-8">
          <button
            (click)="goBack()"
            class="flex items-center gap-2 text-gray-500 hover:text-gray-900"
          >
            <lucide-icon [name]="arrowLeftIcon" class="w-4 h-4"></lucide-icon> Back to Passenger Details
          </button>

          <button
            (click)="handleContinue()"
            class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2"
          >
            Continue to Payment <lucide-icon [name]="arrowRightIcon" class="w-4 h-4"></lucide-icon>
          </button>
        </div>

        <h1 class="text-3xl font-bold mb-2">Select Seats</h1>
        <p class="text-gray-500 mb-8">Choose your preferred seats for the upcoming flight.</p>

        @if (passengers().length > 0) {
          <div class="flex flex-col md:flex-row gap-8">
            <!-- Sidebar: Passenger Selector -->
            <div class="w-full md:w-64 space-y-4">
              <h3 class="font-semibold text-lg">Select Seat For:</h3>
              @for (p of passengers(); track p.id; let idx = $index) {
                <div
                  (click)="currentPassengerIndex.set(idx)"
                  [class]="'p-4 rounded-lg cursor-pointer border transition-all ' + 
                           (idx === currentPassengerIndex() ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50')"
                >
                  <div class="font-bold text-gray-900">{{ p.firstName || 'Passenger ' + (idx + 1) }}</div>
                  <div class="text-sm text-gray-500 font-medium">
                    {{ selectedSeats()[p.id] ? 'Seat: ' + selectedSeats()[p.id] : 'No seat selected' }}
                  </div>
                </div>
              }
            </div>

            <!-- Seat Map -->
            <div class="flex-1 bg-white p-8 rounded-xl border border-gray-200 flex justify-center sticky top-4">
              <div class="w-full max-w-[300px]">
                <!-- Front of plane -->
                <div class="w-full h-16 bg-gray-100 rounded-t-[50%] mb-8 border-t border-l border-r border-gray-200"></div>

                <div class="space-y-2">
                  @for (row of rows; track row) {
                    <div class="flex justify-between items-center gap-2">
                      @for (col of seats; track col) {
                        @if (col === '') {
                          <div class="w-8 flex justify-center text-xs text-gray-300 font-bold font-mono">{{ row }}</div>
                        } @else {
                          @let seatId = row + col;
                          @let isCurrent = selectedSeats()[currentPassenger.id || ''] === seatId;
                          @let isTaken = isSeatTaken(seatId);

                          <button
                            (click)="handleSeatClick(seatId)"
                            [disabled]="isTaken && !isCurrent"
                            [class]="'w-10 h-10 rounded-t-lg rounded-b-md border shadow-sm transition-colors text-xs font-bold flex items-center justify-center ' + 
                                     (isCurrent ? 'bg-blue-600 border-blue-600 text-white' : 
                                      isTaken ? 'bg-blue-200 border-blue-300 cursor-not-allowed opacity-50' : 
                                      'bg-gray-100 border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600')"
                          >
                            {{ col }}
                          </button>
                        }
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        } @else {
          <div class="bg-white p-12 rounded-xl text-center shadow-sm">
            <p class="text-red-500 font-bold mb-4">No passenger information found.</p>
            <a routerLink="/book/passenger-info" class="text-blue-600 font-bold hover:underline">Go back</a>
          </div>
        }
      </div>
    </div>
  `
})
export class SeatSelectionComponent {
  private bookingService = inject(BookingService);
  private router = inject(Router);

  passengers = this.bookingService.passengers;
  selectedSeats = this.bookingService.selectedSeats;
  currentPassengerIndex = signal(0);

  rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  seats = ['A', 'B', 'C', '', 'D', 'E', 'F']; // Empty string for aisle

  arrowLeftIcon = ArrowLeft;
  arrowRightIcon = ArrowRight;

  get currentPassenger() {
    return this.passengers()[this.currentPassengerIndex()];
  }

  isSeatTaken(seatId: string) {
    return Object.values(this.selectedSeats()).includes(seatId);
  }

  handleSeatClick(seatId: string) {
    const p = this.currentPassenger;
    if (!p) return;

    const currentSeats = { ...this.selectedSeats() };
    const isTakenBySomeoneElse = this.isSeatTaken(seatId) && currentSeats[p.id] !== seatId;

    if (isTakenBySomeoneElse) return;

    if (currentSeats[p.id] === seatId) {
      delete currentSeats[p.id];
    } else {
      currentSeats[p.id] = seatId;
    }

    this.bookingService.selectedSeats.set(currentSeats);
  }

  goBack() {
    window.history.back();
  }

  handleContinue() {
    const allSelected = this.passengers().every(p => this.selectedSeats()[p.id]);
    if (!allSelected) {
      if (!confirm('Not all passengers have seats selected. Continue to payment anyway?')) return;
    }
    this.router.navigate(['/book/payment']);
  }
}
