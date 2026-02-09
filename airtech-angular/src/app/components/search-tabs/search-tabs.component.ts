import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plane, Building, Car } from 'lucide-angular';

@Component({
    selector: 'app-search-tabs',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      @for (tab of tabs; track tab.id) {
        <button
          (click)="onChange.emit(tab.id)"
          [class]="'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ' + 
                   (activeTab === tab.id ? 'bg-gray-800 text-white shadow-md' : 'text-white hover:bg-white/10')"
        >
          <lucide-icon [name]="tab.icon" class="w-4 h-4"></lucide-icon>
          {{ tab.label }}
        </button>
      }
    </div>
  `
})
export class SearchTabsComponent {
    @Input() activeTab: 'flights' | 'hotels' | 'cars' = 'flights';
    @Output() onChange = new EventEmitter<'flights' | 'hotels' | 'cars'>();

    tabs = [
        { id: 'flights', label: 'Flights', icon: Plane },
        { id: 'hotels', label: 'Hotels', icon: Building },
        { id: 'cars', label: 'Car Hire', icon: Car }
    ] as const;
}
