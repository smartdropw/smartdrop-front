import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';

@Component({
  selector: 'app-two-factor-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './two-factor-setup.component.html',
  styleUrls: ['./two-factor-setup.component.scss']
})
export class TwoFactorSetupComponent {
  code = '';
  message = '';

  constructor(
    public language: LanguageService,
    private router: Router
  ) {}

  enable2FA() {
    if (!this.code || this.code.length !== 6) {
      this.message = 'Please enter a valid 6-digit code.';
      return;
    }
    
    // Simulate API call to enable 2FA
    alert('Two-Factor Authentication has been enabled successfully!');
    this.router.navigate(['/app/dashboard']);
  }
}
