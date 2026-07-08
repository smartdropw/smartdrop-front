import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';
import { AuthService } from '../../infrastructure/services/auth.service';

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
    private router: Router,
    private authService: AuthService
  ) {}

  sendRecoveryLink() {
    if (!this.email) {
      this.message = 'Please enter your email address.';
      return;
    }
    
    // Call the backend
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = 'A recovery token has been simulated in the backend console.';
        
        // Pass the generated token to the URL so they can copy-paste it
        setTimeout(() => {
          this.router.navigate(['/reset-password'], { queryParams: { token: res.token } });
        }, 2000);
      },
      error: () => {
        this.message = 'Error communicating with the server.';
      }
    });
  }
}
