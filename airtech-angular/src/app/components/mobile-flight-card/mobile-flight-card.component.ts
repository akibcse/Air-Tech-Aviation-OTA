import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, Clock, Plane, Info, Wifi, Coffee, Monitor } from 'lucide-angular';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-mobile-flight-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './mobile-flight-card.component.html',
  styleUrls: ['./mobile-flight-card.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: '0', overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: '1' })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ])
  ]
})
export class MobileFlightCardComponent {
  @Input() flight: any;
  
  isExpanded = signal(false);

  // Icons
  chevronDownIcon = ChevronDown;
  clockIcon = Clock;
  planeIcon = Plane;
  infoIcon = Info;
  wifiIcon = Wifi;
  coffeeIcon = Coffee;
  monitorIcon = Monitor;

  toggleExpand() {
    this.isExpanded.set(!this.isExpanded());
  }

  getAirlineName(segment: any): string {
    return segment.carrierName || segment.carrierCode;
  }

  getDuration(durationStr: string): string {
    if (!durationStr) return '';
    // Simple parser for ISO 8601 duration (e.g. PT2H30M)
    const hours = durationStr.match(/(\d+)H/)?.[1] || '0';
    const minutes = durationStr.match(/(\d+)M/)?.[1] || '0';
    return `${hours}h ${minutes}m`;
  }

  getStopsLabel(itinerary: any): string {
    const count = itinerary.segments.length - 1;
    if (count === 0) return 'Non-stop';
    if (count === 1) return '1 stop';
    return `${count} stops`;
  }

  getLayoverTime(segment1: any, segment2: any): string {
    const arrival = new Date(segment1.arrival.at).getTime();
    const departure = new Date(segment2.departure.at).getTime();
    const diffMs = departure - arrival;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m layover`;
  }
}
