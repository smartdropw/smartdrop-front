import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  message = '';

  constructor(
    public language: LanguageService,
    private router: Router
  ) {}

  sendRecoveryLink() {
    if (!this.email) {
      this.message = 'Please enter your email address.';
      return;
    }
    
    // Simulate sending an email
    this.message = 'If an account with that email exists, a recovery link has been sent.';
    
    // Mock navigating to the reset password page for demonstration purposes
    setTimeout(() => {
      this.router.navigate(['/reset-password']);
    }, 2000);
  }
}
