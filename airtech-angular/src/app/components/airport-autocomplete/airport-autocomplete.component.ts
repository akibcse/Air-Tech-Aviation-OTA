import { Component, HostListener, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../services/flight.service';
import { LucideAngularModule, Plane } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-airport-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="relative group">
      <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-semibold text-gray-500 group-focus-within:text-blue-600 transition-colors z-10">
        {{ label }}
      </label>
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
        <lucide-icon [name]="planeIcon" class="w-4 h-4"></lucide-icon>
      </span>
      <input
        type="text"
        [(ngModel)]="query"
        (focus)="openDropdown($event)"
        (mouseenter)="openDropdown($event)"
        (input)="onInput($event)"
        (keydown.ArrowDown)="onArrowDown($event)"
        (keydown.ArrowUp)="onArrowUp($event)"
        (keydown.Enter)="onEnter($event)"
        (keydown.Escape)="closeDropdown()"
        [title]="query"
        [placeholder]="placeholder"
        [required]="required"
        class="w-full h-12 pl-10 pr-4 bg-white border border-gray-300 rounded-xl font-medium text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        autocomplete="off"
      />

      @if (showResults() && results().length > 0) {
        <div
          class="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[2200] max-h-80 overflow-y-auto overflow-x-hidden custom-scrollbar"
          [style.top.px]="dropdownTop"
          [style.left.px]="dropdownLeft"
          [style.width.px]="dropdownWidth"
        >
          @for (loc of results(); track loc.iata; let i = $index) {
            <button
              type="button"
              (click)="selectLocation(loc)"
              (mouseenter)="activeIndex = i"
              [class.bg-blue-50]="activeIndex === i"
              class="w-full px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-50 last:border-0 transition-colors flex items-center justify-between group/item"
            >
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="font-bold text-gray-900 truncate" [innerHTML]="highlightMatch(loc.city)"></span>
                <span class="text-xs text-gray-500 truncate" [innerHTML]="highlightMatch(loc.airport || loc.name)"></span>
              </div>
              <span 
                class="bg-gray-100 group-hover/item:bg-blue-100 font-bold px-2 py-1 rounded text-sm transition-colors"
                [class.text-blue-700]="activeIndex === i"
                [class.bg-blue-100]="activeIndex === i"
                [class.text-gray-600]="activeIndex !== i"
                [innerHTML]="highlightMatch(loc.iata)"
              >
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

  planeIcon = Plane;

  private flightService = inject(FlightService);
  private searchSubject = new Subject<string>();
  private activeInput: HTMLElement | null = null;
  private currentRawQuery = '';

  query = '';
  results = signal<any[]>([]);
  showResults = signal(false);
  activeIndex = -1;

  constructor() {
    this.searchSubject.pipe(
      debounceTime(150),
      switchMap(q => {
        const query = q.trim();
        this.currentRawQuery = query;
        if (query.length < 1) {
          return of([]);
        }
        return this.flightService.searchAirports(query);
      }),
      catchError(() => of([]))
    ).subscribe(res => {
      this.results.set(res);
      this.activeIndex = -1;
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('click', (e: any) => {
        if (!e.target.closest('app-airport-autocomplete')) {
          this.closeDropdown();
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
    this.currentRawQuery = '';
    const name = loc.airport || loc.name || loc.city || '';
    this.query = `${this.toTitleCase(name)} (${loc.iata})`;
    this.valueChange.emit(this.query);
    this.selected.emit(loc);
    this.closeDropdown();
  }

  toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      if (word.startsWith('(') || word === '-') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  onArrowDown(event: Event) {
    if (!this.showResults() || this.results().length === 0) return;
    event.preventDefault();
    if (this.activeIndex < this.results().length - 1) {
      this.activeIndex++;
    }
  }

  onArrowUp(event: Event) {
    if (!this.showResults() || this.results().length === 0) return;
    event.preventDefault();
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  onEnter(event: Event) {
    if (this.showResults() && this.activeIndex >= 0 && this.activeIndex < this.results().length) {
      event.preventDefault();
      this.selectLocation(this.results()[this.activeIndex]);
    }
  }

  closeDropdown() {
    this.activeIndex = -1;
    this.showResults.set(false);
  }

  dropdownTop = 0;
  dropdownLeft = 0;
  dropdownWidth = 0;

  openDropdown(event: Event) {
    this.activeInput = event.target as HTMLElement;
    this.activeInput.focus();
    this.positionDropdown();
    this.showResults.set(true);
    // Keep results based on current query
    this.searchSubject.next(this.query || '');
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onViewportChange() {
    if (this.showResults() && this.activeInput) {
      this.positionDropdown();
    }
  }

  private positionDropdown() {
    if (!this.activeInput) return;
    const rect = this.activeInput.getBoundingClientRect();
    this.dropdownTop = rect.bottom + 6;
    this.dropdownLeft = rect.left;
    this.dropdownWidth = rect.width;
  }

  highlightMatch(text: string): string {
    if (!text) return '';
    if (!this.currentRawQuery) return text;
    
    // Escape regex characters
    const escapedQuery = this.currentRawQuery.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    // Important: DO NOT format the replacement directly with classes if you use innerHTML without sanitization protection 
    // unless you know it's safe. We'll use a bold tag and generic color styling.
    return text.toString().replace(regex, '<span class="text-blue-600 font-black bg-blue-50 px-0.5 rounded">$1</span>');
  }
}
