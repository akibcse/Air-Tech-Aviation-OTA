import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  // Filters State
  filtersSheetActive = signal(false);
  
  // Date Picker State
  datePickerActive = signal(false);
  activeDateType = signal<'departure' | 'return'>('departure');
  activeSegmentIndex = signal(0);
  datePickerAnchor = signal<DOMRect | null>(null);
  
  // Autocomplete State
  autocompleteActive = signal(false);
  activeInputType = signal<'origin' | 'destination'>('origin');

  openFilters() {
    this.filtersSheetActive.set(true);
  }

  closeFilters() {
    this.filtersSheetActive.set(false);
  }

  openDatePicker(type: 'departure' | 'return' = 'departure', anchor?: DOMRect, index: number = 0) {
    this.activeDateType.set(type);
    this.activeSegmentIndex.set(index);
    if (anchor) this.datePickerAnchor.set(anchor);
    else this.datePickerAnchor.set(null);
    this.datePickerActive.set(true);
  }

  closeDatePicker() {
    this.datePickerActive.set(false);
  }

  openAutocomplete(type: 'origin' | 'destination', index: number = 0) {
    this.activeInputType.set(type);
    this.activeSegmentIndex.set(index);
    this.autocompleteActive.set(true);
  }

  closeAutocomplete() {
    this.autocompleteActive.set(false);
  }
}
