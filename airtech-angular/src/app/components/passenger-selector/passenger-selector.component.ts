import { Component, HostListener, Input, Output, EventEmitter, signal } from '@angular/core';
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
        (click)="toggleOpen($event)"
        class="w-full h-12 px-3 border border-slate-300 rounded-xl bg-white inline-flex items-center justify-between gap-2 text-sm font-medium text-slate-700 hover:border-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span class="inline-flex items-center gap-2 min-w-0">
          <lucide-icon [name]="userIcon" class="w-4 h-4 text-slate-400"></lucide-icon>
          <span class="truncate" [title]="summaryText">{{ summaryText }}</span>
        </span>
        <lucide-icon [name]="chevronDownIcon" [class]="'w-4 h-4 transition-transform ' + (isOpen() ? 'rotate-180' : '')"></lucide-icon>
      </button>

      @if (isOpen()) {
        <div
          class="fixed text-left bg-white rounded-xl shadow-2xl border border-slate-200 p-5 z-[2200]"
          [style.top.px]="dropdownTop"
          [style.left.px]="dropdownLeft"
          [style.width.px]="dropdownWidth"
        >
          <div class="mb-6">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Cabin Class</label>
            <select
              [value]="cabin"
              (change)="onCabinChange($event)"
               class="w-full p-2 border border-slate-300 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="Economy">Economy</option>
              <option value="Premium Economy">Premium Economy</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>

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
    dropdownTop = 0;
    dropdownLeft = 0;
    dropdownWidth = 320;
    private triggerElement: HTMLElement | null = null;

    // Icons
    chevronDownIcon = ChevronDown;
    userIcon = User;
    minusIcon = Minus;
    plusIcon = Plus;

    get totalPassengers() {
        return this.adults + this.childrenCount;
    }

    get summaryText() {
        return `${this.cabin}, ${this.totalPassengers} Traveller${this.totalPassengers > 1 ? 's' : ''}`;
    }

    toggleOpen(event: Event) {
        this.triggerElement = event.currentTarget as HTMLElement;
        this.isOpen.set(!this.isOpen());
        if (this.isOpen()) {
            this.positionDropdown();
        }
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
        if (typeof window !== 'undefined') {
            window.addEventListener('mousedown', (e: any) => {
                if (!e.target.closest('app-passenger-selector')) {
                    this.isOpen.set(false);
                }
            });
        }
    }

    @HostListener('window:resize')
    @HostListener('window:scroll')
    onViewportChange() {
        if (this.isOpen()) {
            this.positionDropdown();
        }
    }

    private positionDropdown() {
        if (!this.triggerElement) {
            return;
        }

        const rect = this.triggerElement.getBoundingClientRect();
        this.dropdownTop = rect.bottom + 6;
        this.dropdownLeft = rect.left;
        this.dropdownWidth = Math.max(300, rect.width);
    }
}
