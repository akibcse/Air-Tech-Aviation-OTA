import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, lastValueFrom, map } from 'rxjs';

export interface FlightSearchQuery {
    origin?: string;
    destination?: string;
    date?: string;
    returnDate?: string;
    tripType?: 'one-way' | 'return' | 'multi-city';
    adults?: number;
    children?: number;
    cabin?: string;
    direct?: boolean;
    segments?: string; // JSON string for multi-city
}

@Injectable({
    providedIn: 'root'
})
export class FlightService {
    private http = inject(HttpClient);
    private apiUrl = '/api';

    searchFlights(query: FlightSearchQuery): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/search`, {
            params: { ...query }
        });
    }

    searchAirports(query: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/airports`, {
            params: { query }
        });
    }

    createBooking(data: any): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.apiUrl}/bookings`, data));
    }

    // New Amadeus Methods
    confirmPrice(flightOffer: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/flights/price`, { flightOffer });
    }

    getSeatMap(flightOffer: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/flights/seat-map`, { flightOffer });
    }

    bookFlight(flightOffer: any, travelers: any[]): Promise<any> {
        return lastValueFrom(this.http.post<any>(`${this.apiUrl}/flights/book`, { flightOffer, travelers }));
    }

    getUserBookings(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/user/bookings`, {
            params: { userId }
        });
    }

    requestCancellation(bookingId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/request-cancel`, {});
    }

    getBookingByPnr(userId: string, pnr: string): Observable<any> {
        return this.getUserBookings(userId).pipe(
            map(bookings => bookings.find(b => b.pnr === pnr))
        );
    }
}
