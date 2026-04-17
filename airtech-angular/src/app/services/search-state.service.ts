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
    fareType: 'regular' | 'bg-umrah';
}

@Injectable({
    providedIn: 'root'
})
export class SearchStateService {
    private getDefaultDate(): string {
        const date = new Date();
        date.setDate(date.getDate() + 5);
        return date.toISOString().split('T')[0];
    }

    state = signal<SearchState>({
        tripType: 'one-way',
        segments: [
            { 
                origin: { iata: 'DAC', display: 'Dhaka (DAC)' }, 
                destination: { iata: 'SIN', display: 'Singapore (SIN)' }, 
                date: this.getDefaultDate() 
            }
        ],
        travellers: { adults: 1, childrenCount: 0, cabin: 'Economy' },
        directOnly: false,
        returnDate: '',
        addHotel: false,
        fareType: 'regular'
    });

    updateState(partial: Partial<SearchState>) {
        this.state.set({ ...this.state(), ...partial });
    }

    setSegments(segments: FlightSegment[]) {
        this.state.update(s => ({ ...s, segments }));
    }
}
