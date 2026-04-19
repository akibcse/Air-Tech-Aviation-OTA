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

  openDatePicker(type: 'departure' | 'return' = 'departure', anchor?: DOMRect) {
    this.activeDateType.set(type);
    if (anchor) this.datePickerAnchor.set(anchor);
    else this.datePickerAnchor.set(null);
    this.datePickerActive.set(true);
  }

  closeDatePicker() {
    this.datePickerActive.set(false);
  }

  openAutocomplete(type: 'origin' | 'destination') {
    this.activeInputType.set(type);
    this.autocompleteActive.set(true);
  }

  closeAutocomplete() {
    this.autocompleteActive.set(false);
  }
}
