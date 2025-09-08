import { Component, ChangeDetectionStrategy, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrmApiService } from '../../../services/crm-api.service';
import { ProductsService } from '../../../services/products.service';
import { InvoicesService } from '../../../services/invoices.service';
import { Booking, Product, Quote, QuoteItem, BookingStatus } from '../../../models/api.models';
import { Invoice } from '../../../models/invoice.model';
import { Subscription, debounceTime, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-quote-builder',
  templateUrl: './quote-builder.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteBuilderComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private apiService = inject(CrmApiService);
  private productsService = inject(ProductsService);
  private invoicesService = inject(InvoicesService);
  
  private valueChangesSub!: Subscription;

  booking = signal<Booking | null>(null);
  products = signal<Product[]>([]);
  loading = signal(true);
  isProcessing = signal(false);
  
  quoteForm!: FormGroup;
  subTotal = signal(0);
  taxAmount = signal(0);
  total = signal(0);
  depositAmount = signal(0);
  
  TAX_RATE = 0.20; // 20%
  DEPOSIT_RATE = 0.30; // 30%

  ngOnInit(): void {
    const bookingId = Number(this.route.snapshot.paramMap.get('id'));
    if (bookingId) {
      this.loadData(bookingId);
    } else {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.valueChangesSub) {
      this.valueChangesSub.unsubscribe();
    }
  }

  async loadData(bookingId: number): Promise<void> {
    this.loading.set(true);
    try {
      const [bookingDetails, productsData] = await Promise.all([
        this.apiService.getBookingById(bookingId),
        firstValueFrom(this.productsService.getProducts())
      ]);

      if (bookingDetails) {
        this.booking.set(bookingDetails);
        this.products.set(productsData || []);
        this.initForm();
      }
    } catch (error) {
      console.error('Failed to load quote builder data', error);
    } finally {
      this.loading.set(false);
    }
  }

  initForm(): void {
    this.quoteForm = this.fb.group({
      items: this.fb.array([])
    });

    const existingQuote = this.booking()?.quote;
    if (existingQuote && existingQuote.items.length > 0) {
      existingQuote.items.forEach(item => this.items.push(this.createItem(item)));
    }

    this.calculateTotals();

    this.valueChangesSub = this.items.valueChanges.pipe(debounceTime(200)).subscribe(() => {
      this.calculateTotals();
    });
  }

  get items(): FormArray {
    return this.quoteForm.get('items') as FormArray;
  }

  createItem(item?: QuoteItem): FormGroup {
    return this.fb.group({
      productId: [item?.productId || null],
      description: [item?.description || '', Validators.required],
      quantity: [item?.quantity || 1, [Validators.required, Validators.min(1)]],
      unitPrice: [item?.unitPrice || 0, [Validators.required, Validators.min(0)]]
    });
  }

  addCustomItem(): void {
    this.items.push(this.createItem());
  }
  
  addProductItem(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    if (product) {
      this.items.push(this.createItem({
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price
      }));
    }
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  calculateTotals(): void {
    const itemsValue = this.items.getRawValue() as QuoteItem[];
    const sub = itemsValue.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = sub * this.TAX_RATE;
    const tot = sub + tax;
    const deposit = tot * this.DEPOSIT_RATE;

    this.subTotal.set(sub);
    this.taxAmount.set(tax);
    this.total.set(tot);
    this.depositAmount.set(deposit);
  }
  
  // Status Styling
  getQuoteStatusClass(status: Quote['status']): string {
    switch (status) {
      case 'Draft': return 'bg-gray-200 text-gray-800';
      case 'Sent': return 'bg-blue-200 text-blue-800';
      case 'Signed': return 'bg-yellow-200 text-yellow-800';
      case 'DepositPaid': return 'bg-green-100 text-green-800';
      case 'FullyPaid': return 'bg-green-200 text-green-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  }

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

  // Action Methods
  async saveQuote(): Promise<void> {
    if (this.quoteForm.invalid || !this.booking()) return;
    this.isProcessing.set(true);

    const currentBooking = this.booking()!;
    const quoteData: Quote = {
      id: currentBooking.quote?.id || `q-${currentBooking.id}`,
      items: this.items.getRawValue(),
      subTotal: this.subTotal(),
      taxRate: this.TAX_RATE,
      taxAmount: this.taxAmount(),
      total: this.total(),
      depositAmount: this.depositAmount(),
      status: this.booking()?.quote?.status || 'Draft'
    };
    
    try {
      const updatedBooking = await this.apiService.updateQuote(currentBooking.id, quoteData);
      this.booking.set(updatedBooking);
    } catch(error) {
      console.error('Failed to save quote', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async sendForSignature(): Promise<void> {
    if (this.items.length === 0 || !this.booking()) return;
    this.isProcessing.set(true);
    await this.saveQuote();

    try {
      const updatedBooking = await this.apiService.sendQuoteForSignature(this.booking()!.id);
      this.booking.set(updatedBooking);
      this.router.navigate(['/admin/bookings']);
    } catch(error) {
      console.error('Failed to send quote', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
  
  // Invoice Helpers & Actions
  hasFinalInvoice(): boolean {
    return !!this.booking()?.invoices?.some(inv => inv.type === 'Final');
  }

  get finalInvoice(): Invoice | undefined {
    return this.booking()?.invoices?.find(inv => inv.type === 'Final');
  }

  isEventPast(): boolean {
    return new Date(this.booking()?.eventDate || 0) < new Date();
  }

  async generateFinalInvoice(): Promise<void> {
    if (!this.booking()) return;
    this.isProcessing.set(true);
    try {
      await this.invoicesService.createFinalInvoice(this.booking()!.id);
      const updatedBooking = await this.apiService.getBookingById(this.booking()!.id);
      this.booking.set(updatedBooking);
    } catch (error) {
      console.error('Failed to generate final invoice', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async sendFinalInvoice(): Promise<void> {
    const invoice = this.finalInvoice;
    if (!invoice || !this.booking()) return;
    this.isProcessing.set(true);
    try {
      const updatedBooking = await this.invoicesService.sendInvoice(invoice.id, this.booking()!.id);
      this.booking.set(updatedBooking);
    } catch (error) {
      console.error('Failed to send final invoice', error);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async completeBooking(): Promise<void> {
    if (!this.booking()) return;
    this.isProcessing.set(true);
    try {
      const updatedBooking = await this.apiService.completeBooking(this.booking()!.id);
      this.booking.set(updatedBooking);
    } catch (error) {
      console.error('Failed to complete booking', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
