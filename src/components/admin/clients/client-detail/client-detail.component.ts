import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrmApiService } from '../../../../services/crm-api.service';
// Fix: Corrected the import path for the 'Invoice' type.
import { ClientDetails, BookingSummary, BookingStatus } from '../../../../models/api.models';
import { Invoice } from '../../../../models/invoice.model';

@Component({
  selector: 'app-client-detail',
  templateUrl: './client-detail.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private apiService = inject(CrmApiService);

  client = signal<ClientDetails | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  
  isEditMode = signal(false);
  isSaving = signal(false);
  clientForm!: FormGroup;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadClientDetails(Number(id));
      } else {
        this.error.set("Aucun ID de client fourni.");
        this.loading.set(false);
      }
    });
  }

  async loadClientDetails(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const clientDetails = await this.apiService.getClientDetails(id);
      if (clientDetails) {
        this.client.set(clientDetails);
        this.buildForm(clientDetails);
      } else {
        this.error.set("Client non trouvé.");
      }
    } catch (err) {
      this.error.set("Erreur lors du chargement des informations du client.");
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  buildForm(client: ClientDetails): void {
    this.clientForm = this.fb.group({
      firstName: [client.firstName, Validators.required],
      lastName: [client.lastName, Validators.required],
      email: [client.email, [Validators.required, Validators.email]],
      phone: [client.phone, Validators.required],
      company: [client.company || ''],
    });
  }

  toggleEditMode(): void {
    const wasEditing = this.isEditMode();
    this.isEditMode.set(!wasEditing);
    // If we are canceling the edit, reset the form
    if (wasEditing) {
      this.clientForm.reset(this.client() as any);
    }
  }

  async saveChanges(): Promise<void> {
    if (this.clientForm.invalid || !this.clientForm.dirty) {
      return;
    }
    this.isSaving.set(true);
    const currentClient = this.client();
    if (!currentClient) return;

    try {
      const updatedClient = await this.apiService.updateClient(currentClient.id, this.clientForm.value);
      // We receive only the client, so we need to merge it with existing bookings/invoices
      this.client.update(c => c ? { ...c, ...updatedClient } : null);
      this.isEditMode.set(false);
      // In a real app, show a success toast
      console.log('Client updated successfully');
    } catch (err) {
      // Show an error toast
      console.error('Failed to update client', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  navigateToBooking(bookingId: number): void {
    this.router.navigate(['/admin/bookings', bookingId]);
  }

  navigateToInvoice(invoiceId: string): void {
    // In a real app, this might open a PDF or a separate invoice view
    console.log(`Navigating to invoice ${invoiceId}`);
  }
  
  // Status Styling
  getBookingStatusClass(status: BookingStatus): string {
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
  
  getInvoiceStatusClass(status: Invoice['status']): string {
     switch (status) {
      case 'Draft': return 'bg-gray-200 text-gray-800';
      case 'Sent': return 'bg-blue-200 text-blue-800';
      case 'Paid': return 'bg-green-200 text-green-800';
      case 'Overdue': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  }
}