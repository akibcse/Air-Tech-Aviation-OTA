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
  Map,
  X,
  Plus
} from 'lucide-angular';
import { SearchStateService } from '../../services/search-state.service';
import { UiService } from '../../services/ui.service';
import { DateUtils } from '../../utils/date-utils';
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
  closeIcon = X;
  plusIcon = Plus;
  xIcon = X;

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
    this.ui.activeSegmentIndex.set(0);
    
    // For Multi-city, ensure at least 2 segments
    if (type === 'multi-city' && this.state.segments.length < 2) {
      this.addSegment();
    }

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
    const index = this.ui.activeSegmentIndex();
    if (segments[index]) {
      const seg = { ...segments[index] };
      const temp = seg.origin;
      seg.origin = seg.destination;
      seg.destination = temp;
      segments[index] = seg;
      this.searchState.setSegments(segments);
    }
  }

  setActiveSegment(index: number) {
    this.ui.activeSegmentIndex.set(index);
  }

  openDatePicker(type: 'departure' | 'return', index?: number) {
    const targetIndex = index !== undefined ? index : this.ui.activeSegmentIndex();
    
    // Guard: Only switch to 'return' if we are NOT in multi-city mode
    if (type === 'return' && this.state.tripType !== 'return' && this.state.tripType !== 'multi-city') {
      this.searchState.updateState({ tripType: 'return' });
    }
    this.ui.openDatePicker(type, undefined, targetIndex);
  }

  openAutocomplete(type: 'origin' | 'destination', index?: number) {
    const targetIndex = index !== undefined ? index : this.ui.activeSegmentIndex();
    this.ui.openAutocomplete(type, targetIndex);
  }

  toggleTool(id: string) {
    this.expandedTool = this.expandedTool === id ? null : id;
  }

  addSegment() {
    const segments = [...this.state.segments];
    if (segments.length < 5) {
      const last = segments[segments.length - 1];
      const newDateStr = DateUtils.addDays(last.date, 2);
      
      segments.push({
        origin: { ...last.destination },
        destination: { iata: '', display: 'Where to?' },
        date: newDateStr
      });
      this.searchState.setSegments(segments);
      
      // Select the newly added segment
      setTimeout(() => {
        this.ui.activeSegmentIndex.set(segments.length - 1);
      }, 0);
    }
  }

  removeSegment(index: number) {
    const segments = [...this.state.segments];
    if (segments.length > 2) {
      segments.splice(index, 1);
      this.searchState.setSegments(segments);
    }
  }

  swapSegmentLocations(index: number) {
    const segments = [...this.state.segments];
    if (segments[index]) {
      const temp = { ...segments[index].origin };
      segments[index].origin = { ...segments[index].destination };
      segments[index].destination = temp;
      this.searchState.setSegments(segments);
    }
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

  trackBySegment(index: number, segment: any) {
    return index;
  }

  onSearch() {
    const s = this.state;
    
    // Validate segments
    const isIncomplete = s.segments.some(seg => !seg.origin?.iata || !seg.destination?.iata || !seg.date);
    if (isIncomplete) {
      alert('Please fill in ALL origin, destination, and date fields for all segments.');
      return;
    }

    const first = s.segments[0];
    const queryParams: any = {
      tripType: s.tripType,
      origin: first.origin.iata,
      destination: first.destination.iata,
      date: first.date,
      adults: s.travellers.adults,
      children: s.travellers.childrenCount,
      cabin: s.travellers.cabin.toUpperCase(),
      direct: s.directOnly ? 'true' : 'false'
    };

    if (s.tripType === 'return' && s.returnDate) {
      queryParams.returnDate = s.returnDate;
    }

    if (s.tripType === 'multi-city') {
      queryParams.segments = JSON.stringify(s.segments.map(seg => ({
        o: seg.origin.iata,
        d: seg.destination.iata,
        t: seg.date
      })));
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
