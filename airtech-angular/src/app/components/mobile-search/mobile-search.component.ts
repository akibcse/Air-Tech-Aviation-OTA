import { Component, inject, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Plane,
  Repeat,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  ArrowLeftRight,
  Search,
  TrendingDown,
  BarChart3,
  Bell,
  Sparkles,
  Map
} from 'lucide-angular';
import { SearchStateService } from '../../services/search-state.service';
import { UiService } from '../../services/ui.service';
import { Router } from '@angular/router';
import { MobileDatePickerComponent } from '../mobile-date-picker/mobile-date-picker.component';
import { MobileAutocompleteComponent } from '../mobile-autocomplete/mobile-autocomplete.component';

@Component({
  selector: 'app-mobile-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MobileDatePickerComponent, MobileAutocompleteComponent],
  templateUrl: './mobile-search.component.html',
  styleUrls: ['./mobile-search.component.scss']
})
export class MobileSearchComponent {
  searchState = inject(SearchStateService);
  ui = inject(UiService);
  router = inject(Router);

  @Input() isModifySearch = false;

  // Icons
  planeIcon = Plane;
  repeatIcon = Repeat;
  mapPinIcon = MapPin;
  calendarIcon = Calendar;
  usersIcon = Users;
  chevronDownIcon = ChevronDown;
  chevronRightIcon = ChevronRight;
  swapIcon = ArrowLeftRight;
  searchIcon = Search;
  trendingIcon = TrendingDown;
  insightsIcon = BarChart3;
  bellIcon = Bell;
  sparklesIcon = Sparkles;
  mapIcon = Map;

  tripTypes: { value: 'return' | 'one-way' | 'multi-city'; label: string }[] = [
    { value: 'return', label: 'Round trip' },
    { value: 'one-way', label: 'One way' },
    { value: 'multi-city', label: 'Multi-city' }
  ];

  cabinClasses = ['Economy', 'Premium Economy', 'Business', 'First'];

  // Dropdown state
  activeDropdown: 'tripType' | 'passengers' | 'cabin' | null = null;

  // Tools accordion state
  expandedTool: string | null = null;

  toolItems = [
    { id: 'cheapest', label: 'Find cheapest days to fly', icon: 'trendingIcon', description: 'See a calendar view of the lowest fares for your route.' },
    { id: 'insights', label: 'Price insights', icon: 'insightsIcon', description: 'Current prices are typical for this route. We\'ll let you know if they change.' },
    { id: 'track', label: 'Track prices', icon: 'bellIcon', description: 'Get email alerts when prices drop for your saved flights.' },
    { id: 'ai', label: 'Explore with AI', icon: 'sparklesIcon', description: 'Let AI find the best deals based on your flexible dates and destinations.' }
  ];

  // Destination suggestions
  destinations = [
    { from: 'Dhaka', fromCode: 'DAC', to: 'Cox\'s Bazar', toCode: 'CXB', date: 'May 15 – May 18', stops: 'Nonstop', price: 4850 },
    { from: 'Dhaka', fromCode: 'DAC', to: 'Chittagong', toCode: 'CGP', date: 'May 20 – May 22', stops: 'Nonstop', price: 3200 },
    { from: 'Dhaka', fromCode: 'DAC', to: 'Sylhet', toCode: 'ZYL', date: 'Jun 1 – Jun 4', stops: 'Nonstop', price: 4100 },
    { from: 'Dhaka', fromCode: 'DAC', to: 'Saidpur', toCode: 'SPD', date: 'Jun 10 – Jun 13', stops: 'Nonstop', price: 5500 }
  ];

  get state() {
    return this.searchState.state();
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdown = null;
  }

  toggleDropdown(name: 'tripType' | 'passengers' | 'cabin', event: Event) {
    event.stopPropagation();
    this.activeDropdown = this.activeDropdown === name ? null : name;
  }

  setTripType(type: 'return' | 'one-way' | 'multi-city') {
    this.searchState.updateState({ tripType: type });
    this.activeDropdown = null;
    
    // Automatically open return date picker when switching to Round trip
    if (type === 'return' && !this.state.returnDate) {
      setTimeout(() => this.openDatePicker('return'), 50);
    }
  }

  setCabin(cabin: string) {
    this.searchState.updateState({
      travellers: { ...this.state.travellers, cabin }
    });
    this.activeDropdown = null;
  }

  adjustAdults(delta: number) {
    const current = this.state.travellers.adults;
    const next = Math.max(1, Math.min(9, current + delta));
    this.searchState.updateState({
      travellers: { ...this.state.travellers, adults: next }
    });
  }

  adjustChildren(delta: number) {
    const current = this.state.travellers.childrenCount;
    const next = Math.max(0, Math.min(8, current + delta));
    this.searchState.updateState({
      travellers: { ...this.state.travellers, childrenCount: next }
    });
  }

  swapAirports() {
    const segments = [...this.state.segments];
    if (segments.length > 0) {
      const first = { ...segments[0] };
      const temp = first.origin;
      first.origin = first.destination;
      first.destination = temp;
      segments[0] = first;
      this.searchState.setSegments(segments);
    }
  }

  openDatePicker(type: 'departure' | 'return') {
    if (type === 'return' && this.state.tripType !== 'return') {
      this.searchState.updateState({ tripType: 'return' });
    }
    this.ui.openDatePicker(type);
  }

  openAutocomplete(type: 'origin' | 'destination') {
    this.ui.openAutocomplete(type);
  }

  toggleTool(id: string) {
    this.expandedTool = this.expandedTool === id ? null : id;
  }

  getToolIcon(iconName: string) {
    const map: Record<string, any> = {
      trendingIcon: this.trendingIcon,
      insightsIcon: this.insightsIcon,
      bellIcon: this.bellIcon,
      sparklesIcon: this.sparklesIcon
    };
    return map[iconName] || this.sparklesIcon;
  }

  onSearch() {
    const s = this.state;
    const queryParams: any = {
      tripType: s.tripType,
      origin: s.segments[0].origin.iata,
      destination: s.segments[0].destination.iata,
      date: s.segments[0].date,
      adults: s.travellers.adults,
      children: s.travellers.childrenCount,
      cabin: s.travellers.cabin,
      direct: s.directOnly
    };

    if (s.tripType === 'return') {
      queryParams.returnDate = s.returnDate;
    }

    this.router.navigate(['/search'], { queryParams });
  }

  searchDestination(dest: any) {
    this.router.navigate(['/search'], {
      queryParams: {
        tripType: 'return',
        origin: dest.fromCode,
        destination: dest.toCode,
        date: '',
        adults: 1,
        children: 0,
        cabin: 'Economy',
        direct: false
      }
    });
  }
}
