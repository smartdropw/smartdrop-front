import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../infrastructure/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';

  // Variables de control de UI
  showPassword = false;
  showConfirm = false;

  constructor(private authService: AuthService, private router: Router) {
    console.log('Componente de Registro Inicializado');
  }

  onRegister() {
    console.log('Datos actuales:', this.email, this.password);

    if (!this.email || !this.password) {
      alert('Falta email o password');
      return;
    }
    console.log(' Intentando registrar:', this.email);

    if (!this.email || !this.password) {
      alert('Por favor, llena los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.authService.register(this.email, this.password);
    alert('Usuario guardado con éxito');
    this.router.navigate(['/login']);
  }
}
