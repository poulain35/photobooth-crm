export interface Invoice {
  id: string;
  bookingId: number;
  type: 'Deposit' | 'Final';
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  amount: number;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}
