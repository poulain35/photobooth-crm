import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CrmApiService } from '../../../services/crm-api.service';
import { Opportunity } from '../../../models/api.models';

@Component({
  selector: 'app-create-event-modal',
  templateUrl: './create-event-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
})
export class CreateEventModalComponent {
  isOpen = input<boolean>(false);
  closeModal = output<void>();
  submitForm = output<Opportunity>();

  private fb = inject(FormBuilder);
  private apiService = inject(CrmApiService);

  clientStatus = signal<'idle' | 'checking' | 'new' | 'existing'>('idle');
  eventForm: FormGroup;

  eventTypes = ['Mariage', 'Anniversaire', 'Entreprise', 'Autre'];

  constructor() {
    this.eventForm = this.fb.group({
      client: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        company: [''],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        isExisting: [false],
        existingClientId: [null],
      }),
      event: this.fb.group({
        name: ['', Validators.required],
        date: ['', Validators.required],
        type: ['Mariage', Validators.required],
        location: [''],
      }),
    });
  }

  get clientFirstName() { return this.eventForm.get('client.firstName'); }
  get clientLastName() { return this.eventForm.get('client.lastName'); }
  get clientEmail() { return this.eventForm.get('client.email'); }
  get eventName() { return this.eventForm.get('event.name'); }
  get eventDate() { return this.eventForm.get('event.date'); }

  async onEmailBlur(): Promise<void> {
    const emailControl = this.clientEmail;
    if (emailControl?.valid && emailControl.value) {
      this.clientStatus.set('checking');
      try {
        const result = await this.apiService.checkClientExistsByEmail(emailControl.value);
        if (result.exists) {
          this.clientStatus.set('existing');
          this.eventForm.get('client')?.patchValue({
            isExisting: true,
            existingClientId: result.clientId,
          });
        } else {
          this.clientStatus.set('new');
          this.eventForm.get('client')?.patchValue({
            isExisting: false,
            existingClientId: null,
          });
        }
      } catch (error) {
        console.error('Error checking client email', error);
        this.clientStatus.set('idle'); // Reset on error
      }
    }
  }

  onSubmit(): void {
    this.eventForm.markAllAsTouched();
    if (this.eventForm.invalid) {
      return;
    }
    const formData = this.eventForm.getRawValue() as Opportunity;
    this.submitForm.emit(formData);
  }

  onClose(): void {
    this.eventForm.reset({
      client: { firstName: '', lastName: '', company: '', email: '', phone: '', isExisting: false, existingClientId: null },
      event: { name: '', date: '', type: 'Mariage', location: '' }
    });
    this.clientStatus.set('idle');
    this.closeModal.emit();
  }
}