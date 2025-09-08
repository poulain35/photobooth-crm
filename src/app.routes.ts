import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { AdminLayoutComponent } from './components/admin/admin-layout.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { ClientsComponent } from './components/admin/clients/clients.component';
import { ClientDetailComponent } from './components/admin/clients/client-detail/client-detail.component';
import { BookingsComponent } from './components/admin/bookings/bookings.component';
import { QuoteBuilderComponent } from './components/admin/quote-builder/quote-builder.component';
import { ClientPortalComponent } from './components/client-portal/client-portal.component';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clients', component: ClientsComponent },
      { path: 'clients/:id', component: ClientDetailComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'bookings/:id', component: QuoteBuilderComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
    // canActivate: [AuthGuard] // Example of route protection
  },
  { 
    path: 'portal/:id/:token', 
    component: ClientPortalComponent
  },
  { path: '', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/admin/dashboard' } // Fallback route
];