import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataEnrichmentService, AirportData } from '../../services/data-enrichment.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-airport-name',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (data$ | async; as airport) {
      <span class="inline-flex items-center gap-1.5">
        @if (airport.airport || airport.name || airport.city) {
          <span class="font-bold text-slate-900">
            {{ toTitleCase(airport.airport || airport.name || airport.city || '') }}
          </span>
          <span class="font-bold text-slate-900 shrink-0">({{ airport.code || code }})</span>
        } @else {
          <span class="font-bold text-slate-900 tracking-widest uppercase">{{ airport.code || code }}</span>
        }
      </span>
    }
  `
})
export class AirportNameComponent implements OnInit {
  @Input({ required: true }) code!: string;

  data$!: Observable<AirportData>;

  private enrichmentService = inject(DataEnrichmentService);

  ngOnInit() {
    this.data$ = this.enrichmentService.getAirport(this.code);
  }

  toTitleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => {
      // Handle cases like (SD) or -
      if (word.startsWith('(') || word === '-') return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }
}
