import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, CheckCircle, Download, Home } from 'lucide-angular';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FlightService } from '../../../services/flight.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center space-y-6">

        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <lucide-icon [name]="checkIcon" class="w-10 h-10 text-green-600"></lucide-icon>
        </div>

        <h1 class="text-3xl font-bold text-gray-900">Booking Confirmed!</h1>
        <p class="text-gray-500">
          Your flight has been successfully booked. A confirmation email has been sent to your registered address.
        </p>

        @if (pnr) {
          <div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <p class="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Booking Reference (PNR)</p>
            <p class="text-4xl font-mono font-bold text-blue-600 tracking-wider">{{ pnr }}</p>
          </div>

          <div class="flex justify-center gap-4 text-sm text-gray-600 font-medium">
            <p>Amount Paid: <span class="font-bold text-gray-900">{{ currency }} {{ amount }}</span></p>
          </div>

          <div class="flex flex-col gap-3 pt-4">
            <button
              (click)="handleDownloadTicket()"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
            >
              <lucide-icon [name]="downloadIcon" class="w-4 h-4"></lucide-icon> Download E-Ticket
            </button>
            <a
              routerLink="/dashboard"
              class="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <lucide-icon [name]="homeIcon" class="w-4 h-4"></lucide-icon> Go to Dashboard
            </a>
          </div>
        } @else {
          <p class="text-red-500">Invalid booking session.</p>
          <a routerLink="/" class="text-blue-600 hover:underline">Return to Home</a>
        }

      </div>
    </div>
  `
})
export class ConfirmationComponent {
  private route = inject(ActivatedRoute);
  private flightService = inject(FlightService);
  private authService = inject(AuthService);

  booking: any = null;

  pnr = '';
  amount = '';
  currency = '';

  checkIcon = CheckCircle;
  downloadIcon = Download;
  homeIcon = Home;

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.pnr = params['pnr'];
      this.amount = params['amount'];
      this.currency = params['currency'];

      const userId = this.authService.currentUser()?.uid;
      if (this.pnr && userId) {
        this.flightService.getBookingByPnr(userId, this.pnr).subscribe(booking => {
          this.booking = booking;
        });
      }
    });
  }

  handleDownloadTicket() {
    const doc = new jsPDF();

    // Company Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("AirTech Aviation", 14, 25);

    doc.setFontSize(10);
    doc.text("Electronic Ticket Receipt", 160, 25);

    // Booking Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Booking Reference (PNR): ${this.pnr}`, 14, 55);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 62);

    if (this.booking && this.booking.passengers) {
      doc.text(`Passenger: ${this.booking.passengers[0].title} ${this.booking.passengers[0].firstName} ${this.booking.passengers[0].lastName}`, 14, 69);
    }

    let yPos = 80;

    if (this.booking && this.booking.flight && this.booking.flight.itineraries) {
      // New Multi-City PDF Layout
      this.booking.flight.itineraries.forEach((itinerary: any, index: number) => {
        itinerary.segments.forEach((segment: any, segIndex: number) => {
          // Check for page break
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(`SEGMENT ${index + segIndex + 1}`, 14, yPos);
          yPos += 7;

          doc.setFont('helvetica', 'normal');
          doc.text(`${segment.departure.iataCode || ''} -> ${segment.arrival.iataCode || ''}`, 14, yPos);
          yPos += 7;

          doc.text(`${segment.carrierCode || ''} ${segment.number || ''} | ${segment.aircraft?.code || 'Aircraft'}`, 14, yPos);
          yPos += 7;

          doc.text(`Depart: ${new Date(segment.departure.at).toLocaleString()}`, 14, yPos);
          yPos += 7;
          doc.text(`Arrive: ${new Date(segment.arrival.at).toLocaleString()}`, 14, yPos);
          yPos += 7;

          doc.text(`Duration: ${(segment.duration || '').replace('PT', '').toLowerCase()}`, 14, yPos);
          yPos += 10;

          doc.setDrawColor(200, 200, 200);
          doc.line(14, yPos, 196, yPos);
          yPos += 10;
        });
      });
    } else {
      // Fallback minimal table
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Details']],
        body: [
          ['PNR', this.pnr || 'N/A'],
          ['Payment Status', 'Confirmed'],
          ['Total Amount', `${this.currency || ''} ${this.amount || ''}`],
        ],
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Pricing Section
    if (yPos > 240) { doc.addPage(); yPos = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Pricing Details", 14, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Amount: ${this.currency || ''} ${this.amount || ''}`, 14, yPos);
    yPos += 20;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for flying with AirTech Aviation.", 14, yPos);
    doc.text("This is a computer generated document.", 14, yPos + 5);

    doc.save(`ticket-${this.pnr}.pdf`);
  }
}
