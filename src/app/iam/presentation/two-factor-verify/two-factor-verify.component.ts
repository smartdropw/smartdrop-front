import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';
import { AuthService } from '../../infrastructure/services/auth.service';

@Component({
  selector: 'app-two-factor-verify',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './two-factor-verify.component.html',
  styleUrls: ['./two-factor-verify.component.scss']
})
export class TwoFactorVerifyComponent {
  code = '';
  message = '';

  email = '';

  constructor(
    public language: LanguageService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  verifyCode() {
    if (!this.code || this.code.length !== 6) {
      this.message = 'Please enter a valid 6-digit code.';
      return;
    }
    
    if (!this.email) {
      this.message = 'Missing email. Please login again.';
      return;
    }

    // Call the backend API
    this.authService.verify2FA(this.email, this.code).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.message = 'Invalid verification code.';
        }
      },
      error: () => {
        this.message = 'Error verifying code.';
      }
    });
  }
}
