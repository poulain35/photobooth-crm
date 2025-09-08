import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CrmApiService } from '../../../services/crm-api.service';
import { DashboardSummary, Opportunity } from '../../../models/api.models';
import { CreateEventModalComponent } from '../create-event-modal/create-event-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CreateEventModalComponent],
})
export class DashboardComponent implements OnInit {
  private apiService = inject(CrmApiService);
  private router = inject(Router);

  summary = signal<DashboardSummary | null>(null);
  loading = signal<boolean>(true);
  isModalOpen = signal<boolean>(false);

  ngOnInit() {
    this.loadSummary();
  }

  async loadSummary() {
    this.loading.set(true);
    try {
      const data = await this.apiService.getDashboardSummary();
      this.summary.set(data);
    } catch (error) {
      console.error('Failed to load dashboard summary', error);
      // Here you would set an error signal to show a message in the UI
    } finally {
      this.loading.set(false);
    }
  }

  handleOpenModal() {
    this.isModalOpen.set(true);
  }

  handleCloseModal() {
    this.isModalOpen.set(false);
  }

  async handleFormSubmit(opportunity: Opportunity) {
    try {
      // Logic to create client if new, then create booking
      console.log('Opportunity data received:', opportunity);
      const { newBookingId } = await this.apiService.createBookingFromOpportunity(opportunity);
      this.isModalOpen.set(false);
      // Navigate to the newly created booking/quote page
      // Using a timeout to simulate a small delay for better UX
      setTimeout(() => {
         // In a real app, you would navigate to a route like:
         // this.router.navigate(['/admin/bookings', newBookingId, 'create-quote']);
         // For now, let's just log it and navigate to the bookings list
         console.log(`Navigating to create a quote for booking ID: ${newBookingId}`);
         this.router.navigate(['/admin/bookings']);
      }, 300);
    } catch (error) {
      console.error('Failed to create booking from opportunity', error);
      // Here you would show an error toast to the user
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

   timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) {
      return "il y a " + Math.floor(interval) + " ans";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return "il y a " + Math.floor(interval) + " mois";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return "il y a " + Math.floor(interval) + " jours";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return "il y a " + Math.floor(interval) + " heures";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return "il y a " + Math.floor(interval) + " minutes";
    }
    return "il y a quelques secondes";
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Devis': return 'bg-yellow-100 text-yellow-800';
      case 'Terminé': return 'bg-blue-100 text-blue-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
