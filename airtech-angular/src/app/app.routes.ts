import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { FlightResultsPageComponent } from './pages/flight-results-page/flight-results-page.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BookingFlightDetailsComponent } from './pages/book/flight-details/flight-details.component';
import { PassengerInfoComponent } from './pages/book/passenger-info/passenger-info.component';
import { SeatSelectionComponent } from './pages/book/seat-selection/seat-selection.component';
import { PaymentComponent } from './pages/book/payment/payment.component';
import { ConfirmationComponent } from './pages/book/confirmation/confirmation.component';
import { AdminLayoutComponent } from './pages/admin/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/admin/users/admin-users.component';
import { AdminBookingsComponent } from './pages/admin/bookings/admin-bookings.component';
import { AdminSystemSettingsComponent } from './pages/admin/settings/admin-system-settings.component';
import { AdminApiHealthComponent } from './pages/admin/api-health/admin-api-health.component';
import { UserBookingsComponent } from './pages/user-bookings/user-bookings.component';
import { SupportComponent } from './pages/support/support.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'search', component: FlightResultsPageComponent },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/register', component: RegisterComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'my-bookings', component: UserBookingsComponent },
    { path: 'support', component: SupportComponent },
    { path: 'book/details', component: BookingFlightDetailsComponent },
    { path: 'book/passenger-info', component: PassengerInfoComponent },
    { path: 'book/seats', component: SeatSelectionComponent },
    { path: 'book/payment', component: PaymentComponent },
    { path: 'book/confirmation', component: ConfirmationComponent },
    {
        path: 'admin',
        component: AdminLayoutComponent,
        children: [
            { path: '', component: AdminDashboardComponent },
            { path: 'users', component: AdminUsersComponent },
            { path: 'bookings', component: AdminBookingsComponent },
            { path: 'api-health', component: AdminApiHealthComponent },
            { path: 'settings', component: AdminSystemSettingsComponent },
        ]
    },
    { path: '**', redirectTo: '' }
];
