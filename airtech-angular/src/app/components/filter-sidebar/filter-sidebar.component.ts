import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-filter-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 sticky top-4 space-y-8 text-gray-900">
      <div>
        <h3 class="font-semibold mb-4">Filters</h3>

        <!-- Stops -->
        <div class="mb-6">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Stops</h4>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                [checked]="stops().includes('0')"
                (change)="handleStopChange('0')"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Direct
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                [checked]="stops().includes('1')"
                (change)="handleStopChange('1')"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              1 Stop
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                [checked]="stops().includes('2+')"
                (change)="handleStopChange('2+')"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              2+ Stops
            </label>
          </div>
        </div>

        <!-- Price -->
        <div>
          <div class="flex justify-between text-sm mb-2">
            <span class="font-medium text-gray-700">Max Price</span>
            <span class="text-gray-500">৳{{ maxPrice() | number }}</span>
          </div>
          <input
            type="range"
            min="0"
            max="500000"
            step="1000"
            [ngModel]="maxPrice()"
            (ngModelChange)="maxPrice.set($event)"
            (mouseup)="handlePriceCommit()"
            (touchend)="handlePriceCommit()"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>
      </div>
    </div>
  `
})
export class FilterSidebarComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    maxPrice = signal(200000);
    stops = signal<string[]>([]);

    constructor() {
        // Initialize from URL
        this.route.queryParams.subscribe(params => {
            if (params['maxPrice']) this.maxPrice.set(Number(params['maxPrice']));
            if (params['stops']) this.stops.set(params['stops'].split(','));
        });
    }

    handleStopChange(stopVal: string) {
        const current = this.stops();
        const next = current.includes(stopVal)
            ? current.filter(s => s !== stopVal)
            : [...current, stopVal];
        this.stops.set(next);
        this.updateFilters();
    }

    handlePriceCommit() {
        this.updateFilters();
    }

    private updateFilters() {
        const queryParams: any = {};
        if (this.maxPrice() < 500000) queryParams.maxPrice = this.maxPrice();
        if (this.stops().length > 0) queryParams.stops = this.stops().join(',');

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge'
        });
    }
}
