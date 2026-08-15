import {
  Component,
  signal,
  inject,
  AfterViewChecked,
  ElementRef,
  ViewChild,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';

interface Message {
  from: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">

      <!-- Header -->
      <header class="chat-header">
        <div class="chat-header-inner">
          <button class="back-btn" (click)="goBack()" aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>

          <div class="ai-identity">
            <div class="ai-avatar-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <p class="ai-name">AirTech AI</p>
              <span class="ai-status">
                <span class="status-dot"></span>
                Online
              </span>
            </div>
          </div>

          <button class="reset-btn" (click)="resetChat()" title="Reset conversation" aria-label="Reset conversation">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Messages Area -->
      <main class="messages-area" #messagesContainer>

        <!-- Welcome Screen (shown when no messages) -->
        @if (messages().length === 0 && !loading()) {
          <div class="welcome-screen">
            <div class="welcome-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 class="welcome-title">Bangladesh's First AI Flight Booking</h1>
            <p class="welcome-subtitle">Innovation by Md. Akib Hasan (GDS Expert)</p>
            <p class="welcome-desc">
              Experience the future of travel with AirTech AI. Created by Md. Akib Hasan, an Aviation Trainer & GDS Expert, this assistant understands your needs in plain English.
            </p>

            <div class="suggestion-chips">
              <p class="chips-label">Try asking:</p>
              <div class="chips-grid">
                @for (prompt of suggestedPrompts; track prompt) {
                  <button class="chip" (click)="usePrompt(prompt)">{{ prompt }}</button>
                }
              </div>
            </div>

            <div class="features-grid">
              @for (feat of features; track feat.title) {
                <div class="feature-card">
                  <span class="feature-icon">{{ feat.icon }}</span>
                  <div>
                    <p class="feature-title">{{ feat.title }}</p>
                    <p class="feature-desc">{{ feat.desc }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Message Bubbles -->
        @for (msg of messages(); track msg.timestamp) {
          <div [class]="'message-row ' + msg.from">
            @if (msg.from === 'ai') {
              <div class="bubble-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
            }
            @if (msg.from === 'system') {
              <div class="system-msg">{{ msg.text }}</div>
            } @else {
              <div [class]="'bubble bubble-' + msg.from">
                <p class="bubble-text">{{ msg.text }}</p>
                <span class="bubble-time">{{ msg.timestamp | date:'h:mm a' }}</span>
              </div>
            }
          </div>
        }

        <!-- Typing Indicator -->
        @if (loading()) {
          <div class="message-row ai">
            <div class="bubble-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="bubble bubble-ai typing-bubble">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </div>
        }

        <!-- Searching Transition -->
        @if (searching()) {
          <div class="searching-banner">
            <div class="searching-spinner"></div>
            <p>Searching flights... redirecting</p>
          </div>
        }
      </main>

      <!-- Input Bar -->
      <footer class="input-bar">
        <div class="input-inner">
          <textarea
            #inputField
            [(ngModel)]="inputText"
            (keydown)="onKeyDown($event)"
            placeholder="Tell me where you want to fly..."
            rows="1"
            [disabled]="loading() || searching()"
            class="chat-input"
            id="chat-input"
            aria-label="Chat message input"
          ></textarea>

          <button
            (click)="send()"
            [disabled]="!inputText.trim() || loading() || searching()"
            class="send-btn"
            aria-label="Send message"
          >
            @if (loading()) {
              <span class="send-spinner"></span>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            }
          </button>
        </div>

        <p class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line</p>
      </footer>
    </div>
  `,
  styles: [`
    /* ─── Page Layout ─── */
    .chat-page {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: #f0f4ff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ─── Header ─── */
    .chat-header {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      z-index: 10;
      flex-shrink: 0;
    }
    .chat-header-inner {
      max-width: 800px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .back-btn, .reset-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    }
    .back-btn:hover { background: #e2e8f0; color: #1e293b; }
    .reset-btn { margin-left: auto; }
    .reset-btn:hover { background: #fef2f2; color: #ef4444; }

    .ai-identity {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }
    .ai-avatar-sm {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }
    .ai-name {
      font-weight: 700;
      font-size: 14px;
      color: #0f172a;
      margin: 0;
    }
    .ai-status {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: #22c55e;
      font-weight: 600;
    }
    .status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      animation: pulse-green 2s infinite;
    }
    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ─── Messages Area ─── */
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .messages-area::-webkit-scrollbar { width: 4px; }
    .messages-area::-webkit-scrollbar-track { background: transparent; }
    .messages-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

    /* ─── Welcome Screen ─── */
    .welcome-screen {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
      padding: 20px 0 40px;
    }
    .welcome-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3), 0 0 0 8px rgba(37, 99, 235, 0.08);
    }
    .welcome-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .welcome-subtitle {
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 12px;
    }
    .welcome-desc {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.7;
      margin: 0 0 28px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .suggestion-chips { margin-bottom: 28px; }
    .chips-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .chip {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1.5px solid #e2e8f0;
      background: white;
      color: #3b82f6;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .chip:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
      transform: translateY(-1px);
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: left;
    }
    @media (max-width: 480px) {
      .features-grid { grid-template-columns: 1fr; }
    }
    .feature-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .feature-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
    .feature-title { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0 0 2px; }
    .feature-desc { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; }

    /* ─── Message Rows ─── */
    .message-row {
      display: flex;
      gap: 8px;
      max-width: 780px;
      margin: 0 auto;
      width: 100%;
      align-items: flex-end;
      animation: slide-up 0.2s ease-out;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .message-row.user {
      flex-direction: row-reverse;
    }

    .bubble-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
    }

    .bubble {
      max-width: 75%;
      border-radius: 18px;
      padding: 10px 14px;
      position: relative;
    }
    .bubble-ai {
      background: white;
      border: 1px solid #e2e8f0;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
    }
    .bubble-user {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.3);
    }
    .bubble-text {
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 4px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .bubble-ai .bubble-text { color: #1e293b; }
    .bubble-user .bubble-text { color: white; }
    .bubble-time {
      font-size: 10px;
      opacity: 0.55;
      display: block;
    }

    /* ─── Typing Indicator ─── */
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 12px 18px;
      min-width: 60px;
    }
    .typing-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #94a3b8;
      animation: bounce-dot 1.2s infinite ease-in-out;
    }
    .typing-dot:nth-child(1) { animation-delay: 0s; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce-dot {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* ─── System Message ─── */
    .system-msg {
      width: 100%;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      font-weight: 500;
      padding: 4px 0;
    }

    /* ─── Searching Banner ─── */
    .searching-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white;
      border-radius: 12px;
      padding: 14px 20px;
      font-weight: 600;
      font-size: 14px;
      margin: 0 auto;
      max-width: 300px;
      box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
      animation: slide-up 0.3s ease-out;
    }
    .searching-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ─── Input Bar ─── */
    .input-bar {
      background: white;
      border-top: 1px solid #e2e8f0;
      padding: 12px 16px 16px;
      flex-shrink: 0;
      box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
    }
    .input-inner {
      max-width: 780px;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 10px 10px 10px 16px;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .input-inner:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
      background: white;
    }
    .chat-input {
      flex: 1;
      border: none;
      background: transparent;
      resize: none;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      outline: none;
      max-height: 120px;
      overflow-y: auto;
      font-family: inherit;
    }
    .chat-input::placeholder { color: #94a3b8; }
    .chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

    .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    }
    .send-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #1d4ed8, #4338ca);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
      transform: translateY(-1px);
    }
    .send-btn:disabled {
      background: #cbd5e1;
      box-shadow: none;
      cursor: not-allowed;
      transform: none;
    }
    .send-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .input-hint {
      max-width: 780px;
      margin: 6px auto 0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    .input-hint kbd {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 10px;
      color: #64748b;
      font-family: inherit;
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('inputField') private inputField!: ElementRef;

  private chatService = inject(ChatService);
  private router = inject(Router);

  messages = signal<Message[]>([]);
  loading = signal(false);
  searching = signal(false);
  inputText = '';

  suggestedPrompts = [
    'Dhaka to Dubai next Friday, 2 adults',
    'One way DAC to SIN on 15 May',
    'Round trip Dhaka to London, 1 adult business class',
    'Chittagong to Doha next Monday'
  ];

  features = [
    {
      icon: '🗣️',
      title: 'Natural Language',
      desc: 'Just describe your trip in plain English'
    },
    {
      icon: '✈️',
      title: 'Smart IATA Lookup',
      desc: 'City names auto-converted to correct codes'
    },
    {
      icon: '👥',
      title: 'Passenger Reuse',
      desc: 'Saved details offered on repeat bookings'
    },
    {
      icon: '🔍',
      title: 'Instant Search',
      desc: 'Hands off to Sabre the moment info is complete'
    }
  ];

  private shouldScrollToBottom = false;

  ngOnInit() {
    // Focus input on load
    setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  usePrompt(prompt: string) {
    this.inputText = prompt;
    this.send();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send() {
    const text = this.inputText.trim();
    if (!text || this.loading() || this.searching()) return;

    // Add user message
    this.messages.update(msgs => [
      ...msgs,
      { from: 'user', text, timestamp: new Date() }
    ]);
    this.inputText = '';
    this.loading.set(true);
    this.shouldScrollToBottom = true;

    this.chatService.sendMessage(text).subscribe({
      next: (res) => {
        this.loading.set(false);

        // Add AI reply
        this.messages.update(msgs => [
          ...msgs,
          { from: 'ai', text: res.reply, timestamp: new Date() }
        ]);
        this.shouldScrollToBottom = true;

        if (res.action === 'SEARCH' && res.data) {
          this.handleSearchAction(res.data);
        } else if (res.action === 'RESET') {
          this.messages.update(msgs => [
            ...msgs,
            { from: 'system', text: '— Conversation reset —', timestamp: new Date() }
          ]);
        }

        // Re-focus input
        setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
      },
      error: (err) => {
        this.loading.set(false);
        const errMsg = err?.error?.reply || err?.error?.error || 'Something went wrong. Please try again.';
        this.messages.update(msgs => [
          ...msgs,
          { from: 'ai', text: errMsg, timestamp: new Date() }
        ]);
        this.shouldScrollToBottom = true;
        setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
      }
    });
  }

  private handleSearchAction(data: any) {
    this.searching.set(true);
    this.shouldScrollToBottom = true;

    // Build query params — same shape as flight-search-form.component.ts handleSearch()
    const params: any = {
      tripType: data.tripType || 'one-way',
      origin: data.origin,
      destination: data.destination,
      date: data.departureDate,
      adults: data.adults || 1,
      children: data.children || 0,
      cabin: (data.cabin || 'ECONOMY').toUpperCase(),
      direct: 'false'
    };

    if (data.tripType === 'return' && data.returnDate) {
      params.returnDate = data.returnDate;
    }

    // Small delay for UX — let user see the searching banner
    setTimeout(() => {
      this.searching.set(false);
      this.router.navigate(['/search'], { queryParams: params });
    }, 1800);
  }

  resetChat() {
    this.loading.set(true);
    this.chatService.resetSession().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messages.set([]);
        setTimeout(() => this.inputField?.nativeElement?.focus(), 100);
      },
      error: () => {
        this.loading.set(false);
        this.messages.set([]);
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }
}
