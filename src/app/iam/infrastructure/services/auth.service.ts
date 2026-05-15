import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: any[] = [
    { email: 'smartdrop@gmail.com', password: 'smartdrop0' }
  ];

  register(email: string, password: string) {
    this.users.push({ email, password });
    console.log('Usuarios en memoria:', this.users);
  }

  login(email: string, password: string): boolean {
    return this.users.some(u => u.email === email && u.password === password);
  }
}
