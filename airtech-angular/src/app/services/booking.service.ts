import { Injectable, signal } from '@angular/core';

export interface Passenger {
    id: string;
    type: 'ADULT' | 'CHILD' | 'INFANT';
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    passportNumber?: string;
    nationality?: string;
    email?: string;
    phone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    selectedFlight = signal<any | null>(null);
    passengers = signal<Passenger[]>([]);
    selectedSeats = signal<Record<string, string>>({});

    setSelectedFlight(flight: any) {
        this.selectedFlight.set(flight);
        // Persist to local storage (optional but good for parity with Zentand persist)
        localStorage.setItem('selectedFlight', JSON.stringify(flight));
    }

    setPassengers(passengers: Passenger[]) {
        this.passengers.set(passengers);
        localStorage.setItem('passengers', JSON.stringify(passengers));
    }

    constructor() {
        // Rehydrate from local storage
        if (typeof localStorage !== 'undefined') {
            const flight = localStorage.getItem('selectedFlight');
            if (flight) this.selectedFlight.set(JSON.parse(flight));

            const ps = localStorage.getItem('passengers');
            if (ps) this.passengers.set(JSON.parse(ps));
        }
    }
}
