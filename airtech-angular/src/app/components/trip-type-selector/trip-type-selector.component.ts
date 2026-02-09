import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-trip-type-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex gap-1 p-1 bg-gray-100 rounded-lg">
      @for (type of types; track type.id) {
        <button
          type="button"
          (click)="onChange.emit(type.id)"
          [class]="'px-4 py-1.5 rounded-md text-sm font-semibold transition-all ' + 
                   (value === type.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900')"
        >
          {{ type.label }}
        </button>
      }
    </div>
  `
})
export class TripTypeSelectorComponent {
    @Input() value: 'return' | 'one-way' | 'multi-city' = 'return';
    @Output() onChange = new EventEmitter<any>();

    types = [
        { id: 'return', label: 'Return' },
        { id: 'one-way', label: 'One way' },
        { id: 'multi-city', label: 'Multi-city' }
    ] as const;
}
