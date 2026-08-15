import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  action?: 'SEARCH' | 'RESET';
  data?: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    cabin: string;
    tripType: 'one-way' | 'return' | 'multi-city';
    passengerProfiles?: any[];
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = '/api/chat';
  private readonly SESSION_KEY = 'airtech_chat_session_id';

  getSessionId(): string {
    let id = localStorage.getItem(this.SESSION_KEY);
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(this.SESSION_KEY, id);
    }
    return id;
  }

  sendMessage(message: string): Observable<ChatResponse> {
    const body: ChatRequest = {
      message,
      sessionId: this.getSessionId()
    };
    return this.http.post<ChatResponse>(this.apiUrl, body);
  }

  resetSession(): Observable<ChatResponse> {
    return this.sendMessage('/reset');
  }
}
