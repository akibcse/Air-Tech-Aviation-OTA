import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchTabsComponent } from '../search-tabs/search-tabs.component';
import { FlightSearchFormComponent } from '../flight-search-form/flight-search-form.component';

@Component({
    selector: 'app-hero',
    standalone: true,
    imports: [CommonModule, SearchTabsComponent, FlightSearchFormComponent],
    template: `
    <div class="relative bg-[#000000] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8">
      <!-- Dynamic Background Image -->
      <div
        class="absolute inset-0 z-0 opacity-50 bg-cover bg-center"
        style="background-image: url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20 z-0"></div>

      <div class="relative z-10 max-w-[1248px] mx-auto">
        <!-- Headline -->
        <h1 class="text-4xl md:text-5xl lg:text-[64px] font-black tracking-tight mb-8 leading-[1.1] max-w-4xl">
          Millions of cheap flights. <br class="hidden sm:block" />
          One simple search.
        </h1>

        <!-- Search Container -->
        <div class="bg-white/10 backdrop-blur-md p-2 rounded-t-xl inline-block">
          <app-search-tabs [activeTab]="activeTab()" (onChange)="activeTab.set($event)"></app-search-tabs>
        </div>

        <div class="bg-white rounded-b-xl rounded-tr-xl p-6 shadow-2xl">
          @if (activeTab() === 'flights') {
            <app-flight-search-form></app-flight-search-form>
          }
          @if (activeTab() === 'hotels') {
            <div class="text-gray-800 p-8 text-center font-medium">Hotel search coming soon!</div>
          }
          @if (activeTab() === 'cars') {
            <div class="text-gray-800 p-8 text-center font-medium">Car Hire search coming soon!</div>
          }
        </div>
      </div>
    </div>
  `
})
export class HeroComponent {
    activeTab = signal<'flights' | 'hotels' | 'cars'>('flights');
}
