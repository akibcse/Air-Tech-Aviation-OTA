import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Filter } from 'lucide-angular';
import { UiService } from '../../services/ui.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-mobile-filters-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './mobile-filters-sheet.component.html',
  styleUrls: ['./mobile-filters-sheet.component.scss'],
  animations: [
    trigger('sheetSlide', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('backdropFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('250ms ease', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class MobileFiltersSheetComponent {
  ui = inject(UiService);

  // Icons
  closeIcon = X;
  filterIcon = Filter;

  @Input() availableAirlines: string[] = [];
  @Output() onApply = new EventEmitter<any>();

  selectedStops = new Set<number>();
  selectedAirlines = new Set<string>();
  maxPrice: number = 50000;

  close() {
    this.ui.closeFilters();
  }

  toggleStop(stop: number) {
    if (this.selectedStops.has(stop)) {
      this.selectedStops.delete(stop);
    } else {
      this.selectedStops.add(stop);
    }
  }

  toggleAirline(airline: string) {
    if (this.selectedAirlines.has(airline)) {
      this.selectedAirlines.delete(airline);
    } else {
      this.selectedAirlines.add(airline);
    }
  }

  apply() {
    this.onApply.emit({
      stops: Array.from(this.selectedStops),
      airlines: Array.from(this.selectedAirlines),
      maxPrice: this.maxPrice
    });
    this.close();
  }

  reset() {
    this.selectedStops.clear();
    this.selectedAirlines.clear();
    this.maxPrice = 50000;
  }
}
