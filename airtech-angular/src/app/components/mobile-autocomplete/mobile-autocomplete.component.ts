import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, MapPin, PlaneTakeoff, PlaneLanding, Search } from 'lucide-angular';
import { UiService } from '../../services/ui.service';
import { SearchStateService } from '../../services/search-state.service';
import { FlightService } from '../../services/flight.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { debounceTime, switchMap, catchError, of, Subject, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-mobile-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './mobile-autocomplete.component.html',
  styleUrls: ['./mobile-autocomplete.component.scss'],
  animations: [
    trigger('modalSlide', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('350ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class MobileAutocompleteComponent implements OnInit {
  ui = inject(UiService);
  searchState = inject(SearchStateService);
  flightService = inject(FlightService);

  // Icons
  closeIcon = X;
  pinIcon = MapPin;
  takeoffIcon = PlaneTakeoff;
  landingIcon = PlaneLanding;
  searchIcon = Search;

  query = signal<string>('');
  results = signal<any[]>([]);
  loading = signal<boolean>(false);
  
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q.trim()) return of([]);
        this.loading.set(true);
        return this.flightService.searchAirports(q).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(res => {
      this.results.set(res);
      this.loading.set(false);
    });
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.query.set(val);
    this.searchSubject.next(val);
  }

  highlightMatch(text: string): string {
    if (!text) return '';
    const q = this.query();
    if (!q) return text;
    
    const escapedQuery = q.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.toString().replace(regex, '<span class="match-highlight">$1</span>');
  }

  selectLocation(loc: any) {
    const type = this.ui.activeInputType();
    const name = loc.airport || loc.name || loc.city || '';
    const display = `${this.toTitleCase(name)} (${loc.iata})`;
    
    const segments = [...this.searchState.state().segments];
    const index = this.ui.activeSegmentIndex();
    if (segments[index]) {
      segments[index][type] = { iata: loc.iata, display };
      this.searchState.setSegments(segments);
    }

    this.close();
  }

  toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      if (word.startsWith('(') || word === '-') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  close() {
    this.query.set('');
    this.results.set([]);
    this.ui.closeAutocomplete();
  }
}
