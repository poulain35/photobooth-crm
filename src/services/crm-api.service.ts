import { Injectable, signal } from '@angular/core';
import { Booking, Client, DashboardSummary, BookingStatus, Opportunity, Quote, ClientDetails, BookingSummary } from '../models/api.models';
import { Invoice } from '../models/invoice.model';

const MOCK_CLIENTS: Client[] = [
    { id: 1, firstName: 'Alice', lastName: 'Martin', company: 'Innovate Corp', email: 'alice.martin@example.com', phone: '0612345678', createdAt: '2023-10-15T10:00:00Z' },
    { id: 2, firstName: 'Bob', lastName: 'Dupont', company: 'Solutions Pro', email: 'bob.dupont@example.com', phone: '0687654321', createdAt: '2023-11-20T14:30:00Z' },
    { id: 3, firstName: 'Carla', lastName: 'Dubois', email: 'carla.dubois@example.com', phone: '0611223344', createdAt: '2024-01-05T09:15:00Z' },
];

const MOCK_BOOKINGS: Booking[] = [
    { id: 101, clientId: 1, clientName: 'Alice Martin', eventName: 'Mariage Martin & Durand', eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Confirmé', amount: 850, invoices: [] },
    { id: 102, clientId: 2, clientName: 'Bob Dupont', eventName: 'Séminaire Solutions Pro', eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'Confirmé', amount: 1200, invoices: [] },
    { id: 103, clientId: 3, clientName: 'Carla Dubois', eventName: 'Anniversaire 30 ans', eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), status: 'Devis', amount: 0, quote: { id: 'q-103', items: [], subTotal: 0, taxRate: 0.20, taxAmount: 0, total: 0, depositAmount: 0, status: 'Draft' }, invoices: [] },
    { id: 104, clientId: 3, clientName: 'Carla Dubois', eventName: 'Lancement Produit', eventDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Payé en totalité', amount: 950, invoices: [] },
    { id: 105, clientId: 1, clientName: 'Alice Martin', eventName: 'Gala de charité', eventDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(), status: 'Devis', amount: 0, invoices: [] },
    { id: 106, clientId: 1, clientName: 'Alice Martin', eventName: 'Fête de Noël Innovate Corp', eventDate: '2023-12-22T19:00:00Z', status: 'Terminé', amount: 900, invoices: [] },
];

@Injectable({ providedIn: 'root' })
export class CrmApiService {
  private clients = signal<Client[]>(MOCK_CLIENTS);
  private bookings = signal<Booking[]>(MOCK_BOOKINGS);
  private nextClientId = signal(MOCK_CLIENTS.length + 1);
  private nextBookingId = signal(MOCK_BOOKINGS.length + 101);

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Admin methods
  async getDashboardSummary(): Promise<DashboardSummary> {
    await this.delay(500);
    const sortedEvents = [...this.bookings()].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    return {
      upcomingEvents: sortedEvents.filter(b => new Date(b.eventDate) > new Date()).slice(0, 5),
      monthlyStats: {
        revenue: 4500,
        newBookings: 8,
        conversionRate: 65,
      },
      recentActivities: [
        { id: 1, description: 'Devis envoyé à Carla Dubois', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 2, description: 'Paiement reçu de Alice Martin', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { id: 3, description: 'Contrat signé par Bob Dupont', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      ],
    };
  }

  async getClients(): Promise<Client[]> {
    await this.delay(300);
    return this.clients();
  }
  
  async checkClientExistsByEmail(email: string): Promise<{ exists: boolean, clientId?: number }> {
    await this.delay(500);
    const foundClient = this.clients().find(c => c.email.toLowerCase() === email.toLowerCase());
    if (foundClient) {
      return { exists: true, clientId: foundClient.id };
    }
    return { exists: false };
  }

  async addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    await this.delay(400);
    const newClient: Client = {
      id: this.nextClientId(),
      ...clientData,
      createdAt: new Date().toISOString(),
    };
    this.clients.update(clients => [...clients, newClient]);
    this.nextClientId.update(id => id + 1);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
    await this.delay(500);
    let updatedClient: Client | undefined;
    this.clients.update(clients =>
      clients.map(c => {
        if (c.id === id) {
          updatedClient = { ...c, ...clientData };
          return updatedClient;
        }
        return c;
      })
    );
    if (!updatedClient) {
      throw new Error('Client not found');
    }
    // Also update clientName in existing bookings
    this.bookings.update(bookings => 
      bookings.map(b => {
        if (b.clientId === id) {
          return { ...b, clientName: `${updatedClient!.firstName} ${updatedClient!.lastName}` };
        }
        return b;
      })
    );
    return updatedClient;
  }

  async getClientDetails(id: number): Promise<ClientDetails | undefined> {
    await this.delay(600);
    const client = this.clients().find(c => c.id === id);
    if (!client) {
      return undefined;
    }

    const clientBookings = this.bookings().filter(b => b.clientId === id)
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    const bookingSummaries: BookingSummary[] = clientBookings.map(b => ({
      id: b.id,
      eventName: b.eventName,
      eventDate: b.eventDate,
      status: b.status,
      totalAmount: b.amount,
    }));

    const clientInvoices: Invoice[] = clientBookings.flatMap(b => b.invoices || []);
    
    // Add some mock invoices for demonstration if none exist
    if (clientInvoices.length === 0 && clientBookings.length > 0) {
        const firstBooking = clientBookings[0];
        if (firstBooking.quote && firstBooking.quote.depositAmount > 0) {
            clientInvoices.push({
                id: `inv_dep_${firstBooking.id}`, bookingId: firstBooking.id, type: 'Deposit', status: 'Paid', amount: firstBooking.quote.depositAmount,
                dueDate: new Date().toISOString(), createdAt: new Date().toISOString(), paidAt: new Date().toISOString()
            });
        }
    }


    return {
      ...client,
      bookings: bookingSummaries,
      invoices: clientInvoices,
    };
  }

  async getBookings(): Promise<Booking[]> {
    await this.delay(300);
    return this.bookings();
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    await this.delay(400);
    const booking = this.bookings().find(b => b.id === id);
    if (booking) {
      const client = this.clients().find(c => c.id === booking.clientId);
      return { ...booking, client };
    }
    return undefined;
  }
  
  async createBookingFromOpportunity(data: Opportunity): Promise<{ newBookingId: number }> {
    await this.delay(800);
    let clientId: number;

    if (data.client.isExisting && data.client.existingClientId) {
      clientId = data.client.existingClientId;
    } else {
      const newClient = await this.addClient({
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        company: data.client.company,
        email: data.client.email,
        phone: data.client.phone
      });
      clientId = newClient.id;
    }
    
    const newBooking: Booking = {
      id: this.nextBookingId(),
      clientId: clientId,
      clientName: `${data.client.firstName} ${data.client.lastName}`,
      eventName: data.event.name,
      eventDate: new Date(data.event.date).toISOString(),
      status: 'Devis',
      amount: 0,
      invoices: [],
    };

    this.bookings.update(bookings => [...bookings, newBooking]);
    this.nextBookingId.update(id => id + 1);

    return { newBookingId: newBooking.id };
  }

  async updateQuote(bookingId: number, quoteData: Quote): Promise<Booking> {
    await this.delay(600);
    let updatedBooking: Booking | undefined;
    this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === bookingId) {
          updatedBooking = { ...b, quote: quoteData, amount: quoteData.total };
          return updatedBooking;
        }
        return b;
      })
    );
    if (!updatedBooking) {
      throw new Error('Booking not found');
    }
    console.log('Quote saved (draft):', updatedBooking);
    return updatedBooking;
  }

  async sendQuoteForSignature(bookingId: number): Promise<Booking> {
    await this.delay(1000);
    const token = `tok_${Math.random().toString(36).substring(2, 15)}`;
    let updatedBooking: Booking | undefined;

     this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === bookingId && b.quote) {
          const newQuote: Quote = { ...b.quote, status: 'Sent' };
          updatedBooking = { ...b, quote: newQuote, clientPortalToken: token };
          return updatedBooking;
        }
        return b;
      })
    );

     if (!updatedBooking) {
      throw new Error('Booking or quote not found');
    }

    const portalUrl = `${window.location.origin}/#/portal/${updatedBooking.id}/${token}`;
    console.log(`Quote sent. Client portal link: ${portalUrl}`);
    return updatedBooking;
  }

  // Client Portal Methods
  async getBookingForClient(id: number, token: string): Promise<Booking | null> {
    await this.delay(500);
    const booking = this.bookings().find(b => b.id === id && b.clientPortalToken === token);
    if (!booking) {
      return null;
    }
    const client = this.clients().find(c => c.id === booking.clientId);
    return { ...booking, client };
  }

  async signQuoteForClient(id: number, token: string, signerName: string): Promise<Booking> {
    await this.delay(1200); // Simulate signature process
    let signedBooking: Booking | undefined;
     this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === id && b.clientPortalToken === token && b.quote?.status === 'Sent') {
          const client = this.clients().find(c => c.id === b.clientId);
          const updatedQuote: Quote = {
            ...b.quote,
            status: 'Signed',
            signedAt: new Date().toISOString(),
            signedBy: { name: signerName, email: client?.email || '' }
          };
          signedBooking = { ...b, quote: updatedQuote };
          return signedBooking;
        }
        return b;
      })
    );
    if (!signedBooking) {
      throw new Error('Could not sign quote. Booking not found or invalid status.');
    }
    return signedBooking;
  }

  async processDepositPaymentForClient(id: number, token: string): Promise<Booking> {
    await this.delay(2000); // Simulate payment processing
    let paidBooking: Booking | undefined;
     this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === id && b.clientPortalToken === token && b.quote?.status === 'Signed') {
           const updatedQuote: Quote = { ...b.quote, status: 'DepositPaid' };
           const depositInvoice: Invoice = {
             id: `inv_dep_${b.id}`,
             bookingId: b.id,
             type: 'Deposit',
             status: 'Paid',
             amount: b.quote.depositAmount,
             dueDate: new Date().toISOString(),
             createdAt: new Date().toISOString(),
             paidAt: new Date().toISOString(),
           };
           paidBooking = { ...b, quote: updatedQuote, status: 'Confirmé', invoices: [depositInvoice] };
           return paidBooking;
        }
        return b;
      })
    );
    if (!paidBooking) {
      throw new Error('Payment failed. Booking not found or invalid status.');
    }
    return paidBooking;
  }

  async processFinalPaymentForClient(id: number, token: string): Promise<Booking> {
    await this.delay(2000);
    let paidBooking: Booking | undefined;
    this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === id && b.clientPortalToken === token && b.status === 'En attente de paiement final') {
          const updatedQuote: Quote = { ...b.quote!, status: 'FullyPaid' };
          const updatedInvoices = b.invoices?.map(inv => inv.type === 'Final' ? { ...inv, status: 'Paid', paidAt: new Date().toISOString() } as Invoice : inv) || [];
          paidBooking = { ...b, quote: updatedQuote, status: 'Payé en totalité', invoices: updatedInvoices };
          return paidBooking;
        }
        return b;
      })
    );
    if (!paidBooking) {
      throw new Error('Final payment failed. Booking not found or invalid status.');
    }
    return paidBooking;
  }
  
  // Invoicing and Booking Management Methods (Admin)
  async createFinalInvoice(bookingId: number): Promise<Invoice> {
    await this.delay(700);
    let newInvoice: Invoice | undefined;
    let finalBooking: Booking | undefined;

    this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === bookingId && b.status === 'Confirmé' && b.quote) {
          const depositPaid = b.invoices?.find(inv => inv.type === 'Deposit' && inv.status === 'Paid')?.amount || b.quote.depositAmount;
          const finalAmount = b.quote.total - depositPaid;
          
          newInvoice = {
            id: `inv_fin_${b.id}`,
            bookingId: b.id,
            type: 'Final',
            status: 'Draft',
            amount: finalAmount,
            dueDate: new Date(new Date(b.eventDate).getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days before event
            createdAt: new Date().toISOString(),
          };
          finalBooking = { ...b, invoices: [...(b.invoices || []), newInvoice]};
          return finalBooking;
        }
        return b;
      })
    );
    if (!newInvoice) {
      throw new Error('Could not create final invoice.');
    }
    return newInvoice;
  }

  async sendFinalInvoice(invoiceId: string, bookingId: number): Promise<Booking> {
    await this.delay(1000);
    let updatedBooking: Booking | undefined;
    this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === bookingId) {
          const updatedInvoices = b.invoices?.map(inv => inv.id === invoiceId ? { ...inv, status: 'Sent' } as Invoice : inv) || [];
          updatedBooking = { ...b, invoices: updatedInvoices, status: 'En attente de paiement final' };
          return updatedBooking;
        }
        return b;
      })
    );
    if (!updatedBooking) {
      throw new Error('Could not send invoice.');
    }
    return updatedBooking;
  }

  async completeBooking(bookingId: number): Promise<Booking> {
    await this.delay(500);
    let completedBooking: Booking | undefined;
    this.bookings.update(bookings =>
      bookings.map(b => {
        if (b.id === bookingId && b.status === 'Payé en totalité') {
          completedBooking = { ...b, status: 'Terminé' };
          return completedBooking;
        }
        return b;
      })
    );
    if (!completedBooking) {
      throw new Error('Could not complete booking.');
    }
    return completedBooking;
  }
}