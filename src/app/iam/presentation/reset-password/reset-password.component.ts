import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LanguageService } from '../../../shared/language/language.service';

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

  constructor(
    public language: LanguageService,
    private router: Router
  ) {}

  updatePassword() {
    if (!this.password || !this.confirmPassword) {
      this.message = 'Please fill in both fields.';
      return;
    }
    
    if (this.password !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }
    
    // Simulate API call to reset password
    alert('Password updated successfully!');
    this.router.navigate(['/login']);
  }
}
