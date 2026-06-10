import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../infrastructure/services/auth.service';
import { LanguageService } from '../../../shared/language/language.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public language: LanguageService,
  ) {}

  onRegister() {
    if (!this.email || !this.password) {
      alert('Por favor, llena los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.authService.register(this.email, this.password, this.fullName);
    alert('Usuario guardado con éxito');
    this.router.navigate(['/login']);
  }
}
