import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';

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

  constructor(
    public language: LanguageService,
    private router: Router
  ) {}

  verifyCode() {
    if (!this.code || this.code.length !== 6) {
      this.message = 'Please enter a valid 6-digit code.';
      return;
    }
    
    // Simulate API call to verify 2FA
    if (this.code === '123456') {
      this.router.navigate(['/dashboard']);
    } else {
      this.message = 'Invalid verification code. Try "123456".';
    }
  }
}
