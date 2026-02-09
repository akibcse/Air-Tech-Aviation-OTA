import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, take, map, throwError } from 'rxjs';
import { Auth, user, getIdToken } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private auth = inject(Auth);
    private apiUrl = '/api/admin';

    private getAuthHeaders(): Observable<HttpHeaders> {
        return user(this.auth).pipe(
            take(1),
            switchMap(u => {
                if (!u) {
                    console.error("AdminService: No user found in Auth state");
                    return throwError(() => new Error('Unauthorized: No user logged in'));
                }
                return from(getIdToken(u)).pipe(
                    map(token => {
                        if (!token) throw new Error('Could not get ID token');
                        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
                    })
                );
            })
        );
    }

    getStats(): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.get<any>(`${this.apiUrl}/stats`, { headers }))
        );
    }

    getBookings(): Observable<any[]> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.get<any[]>(`${this.apiUrl}/bookings`, { headers }))
        );
    }

    getUsers(): Observable<any[]> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.get<any[]>(`${this.apiUrl}/users`, { headers }))
        );
    }

    getSettings(): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.get<any>(`${this.apiUrl}/settings`, { headers }))
        );
    }

    updatePricing(markup: any): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.post<any>(`${this.apiUrl}/settings/pricing`, markup, { headers }))
        );
    }

    updateAviationProvider(provider: any): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.post<any>(`${this.apiUrl}/settings/aviation-provider`, provider, { headers }))
        );
    }

    updateBookingStatus(id: string, status: string): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.patch<any>(`${this.apiUrl}/bookings/${id}`, { status }, { headers }))
        );
    }

    updateUserRole(userId: string, role: string): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.patch<any>(`${this.apiUrl}/users/${userId}`, { role }, { headers }))
        );
    }

    getApiHealth(): Observable<any[]> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.get<any[]>(`${this.apiUrl}/api-health`, { headers }))
        );
    }

    updateBanners(banners: any[]): Observable<any> {
        return this.getAuthHeaders().pipe(
            switchMap(headers => this.http.post<any>(`${this.apiUrl}/settings/banners`, banners, { headers }))
        );
    }
}
