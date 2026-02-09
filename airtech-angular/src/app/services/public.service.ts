import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PublicService {
    private http = inject(HttpClient);
    private apiUrl = '/api';

    getBanners(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/public/banners`);
    }

    getHeroBackground(): Observable<string> {
        return this.http.get<{ backgroundUrl: string }>(`${this.apiUrl}/public/hero-background`).pipe(
            map((data: any) => data?.backgroundUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')
        );
    }
}
