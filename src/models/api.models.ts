import { Invoice } from './invoice.model';

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type BookingStatus = 'Devis' | 'Confirmé' | 'En attente de paiement final' | 'Payé en totalité' | 'Terminé' | 'Annulé';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface QuoteItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  items: QuoteItem[];
  subTotal: number;
  taxRate: number; // Ex: 0.20 pour 20%
  taxAmount: number;
  total: number;
  depositAmount: number; // Montant de l'acompte
  status: 'Draft' | 'Sent' | 'Signed' | 'DepositPaid' | 'FullyPaid' | 'Canceled';
  signedAt?: string;
  signedBy?: { name: string; email: string };
}

export interface Booking {
  id: number;
  clientId: number;
  clientName: string;
  eventName: string;
  eventDate: string;
  status: BookingStatus;
  amount: number;
  quote?: Quote;
  client?: Client; // For detailed view
  clientPortalToken?: string;
  invoices?: Invoice[];
}

export interface DashboardSummary {
  upcomingEvents: Booking[];
  monthlyStats: {
    revenue: number;
    newBookings: number;
    conversionRate: number;
  };
  recentActivities: {
    id: number;
    description: string;
    timestamp: string;
  }[];
}

export interface Opportunity {
  client: {
    firstName: string;
    lastName: string;
    company?: string;
    email: string;
    phone: string;
    isExisting: boolean;
    existingClientId?: number;
  };
  event: {
    name: string;
    date: string; // Format YYYY-MM-DD
    type: 'Mariage' | 'Anniversaire' | 'Entreprise' | 'Autre';
    location: string;
  };
}

export interface BookingSummary {
  id: number;
  eventName: string;
  eventDate: string;
  status: BookingStatus;
  totalAmount: number;
}

export interface ClientDetails extends Client {
  bookings: BookingSummary[];
  invoices: Invoice[];
}
