import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataEnrichmentService, AirlineData } from '../../services/data-enrichment.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-airline-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (data$ | async; as airline) {
      <div class="flex items-center gap-2">
        @if (airline.logo) {
          <img [src]="airline.logo" [alt]="airline.name" class="w-6 h-6 object-contain rounded bg-white shadow-sm" (error)="handleError($event, airline.code)" />
        } @else {
          <div class="w-6 h-6 flex items-center justify-center rounded bg-blue-100 text-blue-700 font-bold text-[10px]">
            {{ airline.code }}
          </div>
        }
        @if (showName) {
          <span class="text-sm font-medium text-gray-700 truncate min-w-0" [title]="airline.name">{{ airline.name }}</span>
        }
      </div>
    }
  `
})
export class AirlineLogoComponent implements OnInit {
  @Input({ required: true }) code!: string;
  @Input() showName = true;

  data$!: Observable<AirlineData>;

  private enrichmentService = inject(DataEnrichmentService);

  ngOnInit() {
    this.data$ = this.enrichmentService.getAirline(this.code);
  }

  handleError(event: any, code: string) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    img.insertAdjacentHTML('afterend', `<div class="w-6 h-6 flex items-center justify-center rounded bg-blue-100 text-blue-700 font-bold text-[10px] shadow-sm">${code}</div>`);
  }
}
