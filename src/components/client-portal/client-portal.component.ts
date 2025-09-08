import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrmApiService } from '../../services/crm-api.service';
import { Booking, Quote, BookingStatus } from '../../models/api.models';
import { Invoice } from '../../models/invoice.model';

@Component({
  selector: 'app-client-portal',
  templateUrl: './client-portal.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientPortalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private apiService = inject(CrmApiService);
  
  booking = signal<Booking | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  isProcessing = signal(false);

  signatureForm: FormGroup;

  constructor() {
    this.signatureForm = this.fb.group({
      signerName: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  ngOnInit(): void {
    // Check for payment redirect
    this.route.queryParams.subscribe(params => {
        if(params['payment_status'] === 'success' && this.booking()) {
            // Refetch data to confirm payment
            const b = this.booking()!;
            this.loadBooking(b.id, b.clientPortalToken!);
        }
    });

    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    const token = this.route.snapshot.paramMap.get('token');

    if (bookingId && token) {
      this.loadBooking(bookingId, token);
    } else {
      this.error.set('Lien de réservation invalide ou expiré.');
      this.loading.set(false);
    }
  }

  async loadBooking(id: number, token: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const bookingData = await this.apiService.getBookingForClient(id, token);
      if (bookingData) {
        this.booking.set(bookingData);
        if (!this.signatureForm.value.signerName && bookingData.client) {
            this.signatureForm.patchValue({ signerName: `${bookingData.client.firstName} ${bookingData.client.lastName}` });
        }
      } else {
        this.error.set('Impossible de trouver la réservation. Le lien est peut-être expiré.');
      }
    } catch (e) {
      this.error.set('Une erreur est survenue lors du chargement de votre réservation.');
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async onSignQuote(): Promise<void> {
    if (this.signatureForm.invalid || !this.booking()) return;
    this.isProcessing.set(true);

    const bookingData = this.booking()!;
    try {
      const updatedBooking = await this.apiService.signQuoteForClient(
        bookingData.id,
        bookingData.clientPortalToken!,
        this.signatureForm.value.signerName
      );
      this.booking.set(updatedBooking);
    } catch (e) {
      this.error.set('Une erreur est survenue lors de la signature.');
      console.error(e);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async onPayDeposit(): Promise<void> {
    if (!this.booking()) return;
    this.isProcessing.set(true);

    const bookingData = this.booking()!;
    try {
      const updatedBooking = await this.apiService.processDepositPaymentForClient(
        bookingData.id,
        bookingData.clientPortalToken!
      );
      this.booking.set(updatedBooking);
    } catch (e) {
      this.error.set('Une erreur est survenue lors du paiement.');
      console.error(e);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async onPayFinalBalance(): Promise<void> {
    if (!this.booking()) return;
    this.isProcessing.set(true);

    const bookingData = this.booking()!;
    try {
        const updatedBooking = await this.apiService.processFinalPaymentForClient(
            bookingData.id,
            bookingData.clientPortalToken!
        );
        this.booking.set(updatedBooking);
    } catch (e) {
        this.error.set('Une erreur est survenue lors du paiement du solde.');
        console.error(e);
    } finally {
        this.isProcessing.set(false);
    }
  }

  get finalInvoice(): Invoice | undefined {
    return this.booking()?.invoices?.find(inv => inv.type === 'Final');
  }
  
  getBookingStatusClass(status: BookingStatus): string {
    switch (status) {
      case 'Confirmé': return 'bg-green-100 text-green-800';
      case 'Devis': return 'bg-yellow-100 text-yellow-800';
      case 'En attente de paiement final': return 'bg-orange-100 text-orange-800';
      case 'Payé en totalité':
      case 'Terminé':
        return 'bg-teal-100 text-teal-800';
      case 'Annulé': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}