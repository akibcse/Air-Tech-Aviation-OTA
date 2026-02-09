import { Component, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../services/flight.service';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-airport-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative group">
      <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-gray-500 group-focus-within:text-blue-600 transition-colors z-10">
        {{ label }}
      </label>
      <input
        type="text"
        [(ngModel)]="query"
        (focus)="openDropdown($event)"
        (input)="onInput($event)"
        [placeholder]="placeholder"
        [required]="required"
        class="w-full h-12 pl-4 pr-4 bg-white border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        autocomplete="off"
      />

      @if (showResults() && results().length > 0) {
        <div class="absolute mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[1000] max-h-80 overflow-y-auto overflow-x-hidden w-full custom-scrollbar">
          @for (loc of results(); track loc.iata) {
            <button
              type="button"
              (click)="selectLocation(loc)"
              class="w-full px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between group/item"
            >
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="font-bold text-gray-900 truncate">{{ loc.city }}</span>
                <span class="text-xs text-gray-500 truncate">{{ loc.airport }}</span>
              </div>
              <span class="bg-gray-100 group-hover/item:bg-blue-100 text-gray-600 group-hover/item:text-blue-700 font-bold px-2 py-1 rounded text-sm transition-colors">
                {{ loc.iata }}
              </span>
            </button>
          }
        </div>
      }
    </div>
    
  `
})
export class AirportAutocompleteComponent {
  @Input() label = '';
  @Input() placeholder = 'Country, city or airport';
  @Input() required = false;
  @Input() set value(v: string) { this.query = v; }

  @Output() valueChange = new EventEmitter<string>();
  @Output() selected = new EventEmitter<any>();

  private flightService = inject(FlightService);
  private searchSubject = new Subject<string>();

  query = '';
  results = signal<any[]>([]);
  showResults = signal(false);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => q.length >= 1 ? this.flightService.searchAirports(q) : of([])),
      catchError(() => of([]))
    ).subscribe(res => {
      this.results.set(res);
    });

    // Close results when clicking outside (simple realization)
    if (typeof window !== 'undefined') {
      window.addEventListener('click', (e: any) => {
        if (!e.target.closest('app-airport-autocomplete')) {
          this.showResults.set(false);
        }
      });
    }
  }

  onInput(event?: Event) {
    if (event) {
      this.openDropdown(event);
    }
    this.valueChange.emit(this.query);
    this.searchSubject.next(this.query);
  }

  selectLocation(loc: any) {
    this.query = `${loc.city} (${loc.iata})`;
    this.valueChange.emit(this.query);
    this.selected.emit(loc);
    this.showResults.set(false);
  }

  // Dropdown positioning
  dropdownTop = 0;
  dropdownLeft = 0;
  dropdownWidth = 0;

  openDropdown(event: Event) {
    const input = event.target as HTMLElement;
    const rect = input.getBoundingClientRect();
    this.dropdownTop = rect.bottom + window.scrollY;
    this.dropdownLeft = rect.left + window.scrollX;
    this.dropdownWidth = rect.width;
    this.showResults.set(true);
  }
}
