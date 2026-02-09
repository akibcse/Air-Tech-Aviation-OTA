import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PublicService {
    private http = inject(HttpClient);

    getBanners(): Observable<any[]> {
        return this.http.get<any[]>('/api/public/banners');
    }
}
