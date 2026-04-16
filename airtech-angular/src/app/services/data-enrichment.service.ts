import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AirlineData {
  code: string;
  name: string;
  logo: string | null;
}

export interface AirportData {
  code: string;
  name?: string;
  city?: string;
  country?: string;
  airport?: string;
  iata?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataEnrichmentService {
  private http = inject(HttpClient);
  private apiUrl = '/api';

  private airlineCache = new Map<string, AirlineData>();
  private airportCache = new Map<string, AirportData>();

  getAirline(code: string): Observable<AirlineData> {
    const ucCode = (code || '').toUpperCase();
    if (!ucCode) return of({ code: '', name: '', logo: null });

    if (this.airlineCache.has(ucCode)) {
      return of(this.airlineCache.get(ucCode)!);
    }

    return this.http.get<AirlineData>(`${this.apiUrl}/airlines/${ucCode}`).pipe(
      tap(data => {
        if (data && data.code) {
          this.airlineCache.set(ucCode, data);
        }
      }),
      catchError(() => {
        const fb = { code: ucCode, name: ucCode, logo: null };
        this.airlineCache.set(ucCode, fb);
        return of(fb);
      })
    );
  }

  getAirport(code: string): Observable<AirportData> {
    const ucCode = (code || '').toUpperCase();
    if (!ucCode) return of({ code: '' });

    if (this.airportCache.has(ucCode)) {
      return of(this.airportCache.get(ucCode)!);
    }

    return this.http.get<AirportData>(`${this.apiUrl}/airports/${ucCode}`).pipe(
      tap(data => {
        if (data && data.code) {
          this.airportCache.set(ucCode, data);
        }
      }),
      catchError(() => {
        const fb = { code: ucCode };
        this.airportCache.set(ucCode, fb);
        return of(fb);
      })
    );
  }
}
