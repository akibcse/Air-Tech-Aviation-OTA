import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, User, Minus, Plus } from 'lucide-angular';

@Component({
    selector: 'app-passenger-selector',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="relative">
      <button
        type="button"
        (click)="isOpen.set(!isOpen())"
        class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors focus:outline-none"
      >
        <span>{{ totalPassengers }} Traveller{{ totalPassengers > 1 ? 's' : '' }}, {{ cabin }}</span>
        <lucide-icon [name]="chevronDownIcon" 
                    [class]="'w-4 h-4 transition-transform ' + (isOpen() ? 'rotate-180' : '')"></lucide-icon>
      </button>

      @if (isOpen()) {
        <div class="absolute top-full text-left left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-6 z-50">
          <!-- Cabin Class -->
          <div class="mb-6">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cabin Class</label>
            <select
              [value]="cabin"
              (change)="onCabinChange($event)"
              class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Economy">Economy</option>
              <option value="Premium Economy">Premium Economy</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>

          <!-- Adults -->
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="font-semibold text-gray-900">Adults</p>
              <p class="text-xs text-gray-500">Age 16+</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="updateCount('adults', -1)"
                [disabled]="adults <= 1"
                class="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-300"
              >
                <lucide-icon [name]="minusIcon" class="w-4 h-4"></lucide-icon>
              </button>
              <span class="w-4 text-center font-semibold">{{ adults }}</span>
              <button
                type="button"
                (click)="updateCount('adults', 1)"
                class="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600"
              >
                <lucide-icon [name]="plusIcon" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Children -->
          <div class="flex justify-between items-center">
            <div>
              <p class="font-semibold text-gray-900">Children</p>
              <p class="text-xs text-gray-500">Age 0-15</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="updateCount('children', -1)"
                [disabled]="childrenCount <= 0"
                class="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600 disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-300"
              >
                <lucide-icon [name]="minusIcon" class="w-4 h-4"></lucide-icon>
              </button>
              <span class="w-4 text-center font-semibold">{{ childrenCount }}</span>
              <button
                type="button"
                (click)="updateCount('children', 1)"
                class="w-8 h-8 rounded-full border border-blue-600 flex items-center justify-center text-blue-600"
              >
                <lucide-icon [name]="plusIcon" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-gray-100 flex justify-end">
            <button
              (click)="isOpen.set(false)"
              class="text-blue-600 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class PassengerSelectorComponent {
    @Input() adults = 1;
    @Input() childrenCount = 0;
    @Input() cabin = 'Economy';
    @Output() onChange = new EventEmitter<any>();

    isOpen = signal(false);

    // Icons
    chevronDownIcon = ChevronDown;
    minusIcon = Minus;
    plusIcon = Plus;

    get totalPassengers() {
        return this.adults + this.childrenCount;
    }

    updateCount(type: 'adults' | 'children', delta: number) {
        if (type === 'adults') {
            const newVal = Math.max(1, this.adults + delta);
            this.onChange.emit({ adults: newVal, childrenCount: this.childrenCount, cabin: this.cabin });
        } else {
            const newVal = Math.max(0, this.childrenCount + delta);
            this.onChange.emit({ adults: this.adults, childrenCount: newVal, cabin: this.cabin });
        }
    }

    onCabinChange(event: any) {
        this.onChange.emit({ adults: this.adults, childrenCount: this.childrenCount, cabin: event.target.value });
    }

    constructor() {
        // Close on outside click
        if (typeof window !== 'undefined') {
            window.addEventListener('mousedown', (e: any) => {
                if (!e.target.closest('app-passenger-selector')) {
                    this.isOpen.set(false);
                }
            });
        }
    }
}
