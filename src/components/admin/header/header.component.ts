// Fix: Removed HostListener from imports
import { Component, ChangeDetectionStrategy, signal, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Fix: Replaced @HostListener with the host property for better practice
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class HeaderComponent {
  private elementRef = inject(ElementRef);
  private router = inject(Router);

  isUserMenuOpen = signal(false);
  user = signal({ name: 'Admin', initials: 'A' });
  notificationCount = signal(3);

  toggleUserMenu() {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  logout() {
    this.closeUserMenu();
    // Simulate logout logic
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }

  // Close dropdown if clicked outside
  // Fix: @HostListener decorator removed
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeUserMenu();
    }
  }
}
