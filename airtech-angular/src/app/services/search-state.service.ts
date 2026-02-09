import { Injectable, signal } from '@angular/core';

export interface FlightSegment {
    origin: { iata: string; display: string };
    destination: { iata: string; display: string };
    date: string;
}

export interface SearchState {
    tripType: 'return' | 'one-way' | 'multi-city';
    segments: FlightSegment[];
    travellers: { adults: number; childrenCount: number; cabin: string };
    directOnly: boolean;
    returnDate: string;
    addHotel: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class SearchStateService {
    state = signal<SearchState>({
        tripType: 'return',
        segments: [
            { origin: { iata: '', display: '' }, destination: { iata: '', display: '' }, date: '' }
        ],
        travellers: { adults: 1, childrenCount: 0, cabin: 'Economy' },
        directOnly: false,
        returnDate: '',
        addHotel: false
    });

    updateState(partial: Partial<SearchState>) {
        this.state.set({ ...this.state(), ...partial });
    }

    setSegments(segments: FlightSegment[]) {
        this.state.update(s => ({ ...s, segments }));
    }
}
