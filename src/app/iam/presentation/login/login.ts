import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../infrastructure/services/auth.service';
import { LanguageService } from '../../../shared/language/language.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public language: LanguageService,
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      alert('Por favor, ingresa tu email y contraseña.');
      return;
    }
    this.authService.login(this.email, this.password).subscribe((res) => {
      if (res && res.requires2FA) {
        this.router.navigate(['/2fa-verify'], { queryParams: { email: this.email } });
      } else if (res) {
        this.router.navigate(['/dashboard']);
      } else {
        alert('Credenciales incorrectas.');
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}
