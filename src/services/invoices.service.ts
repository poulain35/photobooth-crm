import { Injectable, inject } from '@angular/core';
import { CrmApiService } from './crm-api.service';
import { Invoice } from '../models/invoice.model';
import { Booking } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class InvoicesService {
  private apiService = inject(CrmApiService);

  async createFinalInvoice(bookingId: number): Promise<Invoice> {
    return this.apiService.createFinalInvoice(bookingId);
  }

  // Fix: The Booking type is now correctly imported.
  async sendInvoice(invoiceId: string, bookingId: number): Promise<Booking> {
    return this.apiService.sendFinalInvoice(invoiceId, bookingId);
  }
}
