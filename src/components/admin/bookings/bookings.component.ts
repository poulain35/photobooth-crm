import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrmApiService } from '../../../services/crm-api.service';
import { Booking, BookingStatus } from '../../../models/api.models';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class BookingsComponent implements OnInit {
  private apiService = inject(CrmApiService);

  allBookings = signal<Booking[]>([]);
  loading = signal<boolean>(true);
  
  statusFilter = signal<BookingStatus | 'Tous'>('Tous');
  
  bookingStatuses: (BookingStatus | 'Tous')[] = ['Tous', 'Devis', 'Confirmé', 'En attente de paiement final', 'Payé en totalité', 'Terminé', 'Annulé'];

  filteredBookings = computed(() => {
    const filter = this.statusFilter();
    if (filter === 'Tous') {
      return this.allBookings();
    }
    return this.allBookings().filter(booking => booking.status === filter);
  });

  ngOnInit() {
    this.loadBookings();
  }

  async loadBookings() {
    this.loading.set(true);
    try {
      const data = await this.apiService.getBookings();
      this.allBookings.set(data.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()));
    } catch (error) {
      console.error('Failed to load bookings', error);
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(status: BookingStatus | 'Tous') {
    this.statusFilter.set(status);
  }

  getStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Devis': return 'bg-yellow-100 text-yellow-800';
      case 'En attente de paiement final': return 'bg-orange-100 text-orange-800';
      case 'Payé en totalité': return 'bg-teal-100 text-teal-800';
      case 'Terminé': return 'bg-blue-100 text-blue-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    // Fix: Corrected typo from `toLocaleDateDateString` to `toLocaleDateString`.
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}