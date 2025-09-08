
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private router = inject(Router);

  login() {
    // Simulate login logic
    console.log('Attempting to log in...');
    // On success:
    this.router.navigate(['/admin']);
  }
}
