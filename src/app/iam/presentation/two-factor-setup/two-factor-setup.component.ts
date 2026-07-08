import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';
import { AuthService } from '../../infrastructure/services/auth.service';

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
    private router: Router,
    private authService: AuthService
  ) {}

  enable2FA() {
    const user = this.authService.getCurrentUser();
    
    // Call API to enable 2FA
    this.authService.enable2FA(user.email).subscribe({
      next: () => {
        alert('Two-Factor Authentication via Email has been enabled successfully!');
        this.router.navigate(['/app/dashboard']);
      },
      error: () => {
        this.message = 'Error enabling 2FA. Try again.';
      }
    });
  }
}
