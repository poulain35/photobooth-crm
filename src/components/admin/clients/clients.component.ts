
import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { CrmApiService } from '../../../services/crm-api.service';
import { Client } from '../../../models/api.models';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsComponent implements OnInit {
  private apiService = inject(CrmApiService);

  clients = signal<Client[]>([]);
  loading = signal<boolean>(true);
  isModalOpen = signal<boolean>(false);
  
  searchTerm = signal<string>('');
  
  newClient = signal({ firstName: '', lastName: '', company: '', email: '', phone: '' });

  filteredClients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      return this.clients();
    }
    return this.clients().filter(client =>
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(term) ||
      (client.company && client.company.toLowerCase().includes(term)) ||
      client.email.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.loadClients();
  }

  async loadClients() {
    this.loading.set(true);
    try {
      const data = await this.apiService.getClients();
      this.clients.set(data);
    } catch (error) {
      console.error('Failed to load clients', error);
    } finally {
      this.loading.set(false);
    }
  }

  openModal() {
    this.newClient.set({ firstName: '', lastName: '', company: '', email: '', phone: '' });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  async saveClient() {
    const clientData = this.newClient();
    if (!clientData.firstName || !clientData.lastName || !clientData.email) {
      // Basic validation
      return;
    }
    try {
      await this.apiService.addClient(clientData);
      await this.loadClients(); // Reload the list
      this.closeModal();
    } catch (error) {
      console.error('Failed to save client', error);
    }
  }

  handleSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }
  
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}