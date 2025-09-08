
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
})
export class SideNavComponent {
  navItems = signal([
    { label: 'Tableau de bord', path: '/admin/dashboard', icon: 'home' },
    { label: 'Réservations', path: '/admin/bookings', icon: 'calendar' },
    { label: 'Clients', path: '/admin/clients', icon: 'users' },
    // { label: 'Factures', path: '/admin/invoices', icon: 'invoice' },
    // { label: 'Inventaire', path: '/admin/inventory', icon: 'inventory' },
    // { label: 'Paramètres', path: '/admin/settings', icon: 'settings' },
  ]);
}
