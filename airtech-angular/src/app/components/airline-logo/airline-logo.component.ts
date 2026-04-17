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
      <div class="flex items-center gap-3">
        @if (airline.logo) {
          <img 
            [src]="airline.logo" 
            [alt]="airline.name" 
            [class]="sizeClasses[size].img"
            (error)="handleError($event, airline.code)" />
        } @else {
          <div [class]="sizeClasses[size].fallback">
            {{ airline.code }}
          </div>
        }
        @if (showName) {
          <span class="font-bold text-slate-800 truncate min-w-0" [class]="sizeClasses[size].text" [title]="airline.name">{{ airline.name }}</span>
        }
      </div>
    }
  `
})
export class AirlineLogoComponent implements OnInit {
  @Input({ required: true }) code!: string;
  @Input() showName = true;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';

  data$!: Observable<AirlineData>;

  sizeClasses = {
    xs: { img: 'w-4 h-4 object-contain', fallback: 'w-4 h-4 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[7px]', text: 'text-[11px]' },
    sm: { img: 'w-6 h-6 object-contain rounded', fallback: 'w-6 h-6 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[9px]', text: 'text-xs' },
    md: { img: 'w-9 h-9 object-contain rounded bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] p-0.5', fallback: 'w-9 h-9 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[11px] shadow-sm', text: 'text-sm' },
    lg: { img: 'w-12 h-12 object-contain rounded bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-1', fallback: 'w-12 h-12 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[14px] shadow-sm', text: 'text-base' },
    xl: { img: 'w-16 h-16 object-contain rounded bg-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] p-1', fallback: 'w-16 h-16 flex items-center justify-center rounded bg-blue-50 text-blue-600 font-bold text-[18px] shadow-md', text: 'text-lg' }
  };

  private enrichmentService = inject(DataEnrichmentService);

  ngOnInit() {
    this.data$ = this.enrichmentService.getAirline(this.code);
  }

  handleError(event: any, code: string) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const classes = this.sizeClasses[this.size].fallback;
    img.insertAdjacentHTML('afterend', `<div class="${classes}">${code}</div>`);
  }
}
