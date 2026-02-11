import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PublicService {
    private http = inject(HttpClient);
    private apiUrl = '/api';
    private readonly noCacheHeaders = new HttpHeaders({
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
    });

    private freshParams() {
        return new HttpParams().set('_ts', Date.now().toString());
    }

    getBanners(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/public/banners`);
    }

    getHeroBackground(): Observable<string> {
        return this.http.get<{ backgroundUrl: string }>(`${this.apiUrl}/public/hero-background`).pipe(
            map((data: any) => data?.backgroundUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')
        );
    }

    getHomeSeo(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/public/home-seo`, {
            headers: this.noCacheHeaders,
            params: this.freshParams()
        });
    }

    getMetaTags(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/public/meta-tags`, {
            headers: this.noCacheHeaders,
            params: this.freshParams()
        });
    }
}
