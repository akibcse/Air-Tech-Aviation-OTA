import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Database, ref, push } from '@angular/fire/database';
import { catchError, of, firstValueFrom } from 'rxjs';

export interface VisitorLocation {
    ip?: string;
    city?: string;
    region?: string;
    country_name?: string;
    country_code?: string;
    latitude?: number;
    longitude?: number;
    org?: string;
    postal?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VisitorTrackerService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private db = inject(Database);

    private hasTracked = false;

    async trackVisitor(action: string = 'page_load', extraEmail?: string): Promise<void> {
        if (this.hasTracked && action === 'page_load') {
            return;
        }

        try {
            // Silently attempt to fetch IP and Location details
            let geoData: VisitorLocation = {};
            try {
                const res = await firstValueFrom(
                    this.http.get<VisitorLocation>('https://ipapi.co/json/').pipe(
                        catchError(() => of({}))
                    )
                );
                geoData = res || {};
            } catch {
                // Fallback to simple IP API if ipapi.co fails or is blocked
                try {
                    const ipRes = await firstValueFrom(
                        this.http.get<{ ip: string }>('https://api.ipify.org?format=json').pipe(
                            catchError(() => of({ ip: 'Unknown' }))
                        )
                    );
                    geoData = { ip: ipRes.ip };
                } catch {
                    geoData = { ip: 'Unknown' };
                }
            }

            const currentUser = this.authService.currentUser();
            const userEmail = extraEmail || currentUser?.email || localStorage.getItem('user_email') || null;

            const payload = {
                ip: geoData.ip || 'Unknown',
                location: {
                    city: geoData.city || 'Unknown',
                    region: geoData.region || 'Unknown',
                    country: geoData.country_name || 'Unknown',
                    countryCode: geoData.country_code || '',
                    lat: geoData.latitude || null,
                    lon: geoData.longitude || null,
                    org: geoData.org || ''
                },
                email: userEmail,
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                pageUrl: typeof window !== 'undefined' ? window.location.href : '',
                action: action,
                timestamp: new Date().toISOString()
            };

            // 1. Send silently to Node.js backend
            this.http.post('/api/public/track-visitor', payload).pipe(
                catchError(() => of(null))
            ).subscribe();

            // 2. Direct push to Firebase Database fallback
            try {
                const leadsRef = ref(this.db, 'visitor_leads');
                await push(leadsRef, payload);
            } catch (err) {
                // Silent catch
            }

            this.hasTracked = true;
            console.log('[VisitorTracker] Visitor tracked silently:', payload.ip, payload.email);

        } catch (e) {
            // Silently suppress any errors so UX is never impacted
        }
    }
}
