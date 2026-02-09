import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { HeroComponent } from '../../components/hero/hero.component';
import { FlightResultsComponent } from '../../components/flight-results/flight-results.component';
import { FilterSidebarComponent } from '../../components/filter-sidebar/filter-sidebar.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, HeroComponent, FlightResultsComponent, FilterSidebarComponent],
  template: `
    <main class="min-h-screen bg-gray-100">
      <!-- We reuse Hero to allow searching again from results page -->
      <app-hero></app-hero>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Sidebar -->
          <aside class="w-full md:w-64 flex-shrink-0 hidden md:block">
            <app-filter-sidebar></app-filter-sidebar>
          </aside>

          <!-- List -->
          <div class="flex-1 min-w-0">
            <app-flight-results
              [flights]="flights()"
              [loading]="loading()"
              [error]="error()"
            ></app-flight-results>
          </div>
        </div>
      </div>
    </main>
  `
})
export class SearchComponent {
  private route = inject(ActivatedRoute);
  private flightService = inject(FlightService);

  flights = signal<any[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.performSearch(params);
    });
  }

  performSearch(params: any) {
    if (!params.origin && !params.segments) return;

    this.loading.set(true);
    this.error.set(null);

    this.flightService.searchFlights(params).subscribe({
      next: (res) => {
        this.flights.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Search Error:", err);
        this.error.set("Failed to fetch flight results. Please check your connection or try again.");
        this.loading.set(false);
      }
    });
  }
}
