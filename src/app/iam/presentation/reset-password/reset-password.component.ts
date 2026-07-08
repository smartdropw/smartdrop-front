import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';
import { AuthService } from '../../infrastructure/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  message = '';
  showPassword = false;

  token = '';

  constructor(
    public language: LanguageService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
    });
  }

  updatePassword() {
    if (!this.password || !this.confirmPassword) {
      this.message = 'Please fill in both fields.';
      return;
    }
    
    if (this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }
    
    if (!this.token) {
      this.message = 'Invalid or missing recovery token.';
      return;
    }

    // Call the backend API
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        alert('Password updated successfully!');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.message = 'Error updating password. Token may be invalid or expired.';
      }
    });
  }
}
