import { Injectable } from '@angular/core';

export interface SmartDropUser {
  email: string;
  password: string;
  fullName: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly usersKey = 'smartdrop-users-v2';
  private readonly currentUserKey = 'smartdrop-current-user-v2';
  private readonly defaultEmail = 'smartdrop@gmail.com';

  private users: SmartDropUser[] = this.loadUsers();

  register(email: string, password: string, fullName = '') {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.users.find((user) => user.email === normalizedEmail);

    if (existing) {
      existing.password = password;
      existing.fullName = fullName || existing.fullName || normalizedEmail;
    } else {
      this.users.push({
        email: normalizedEmail,
        password,
        fullName: fullName || normalizedEmail,
      });
    }

    this.saveUsers();
  }

  login(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find((item) => item.email === normalizedEmail && item.password === password);
    if (!user) return false;

    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    return true;
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
  }

  getCurrentUser(): SmartDropUser {
    const saved = localStorage.getItem(this.currentUserKey);
    if (saved) return JSON.parse(saved);
    return this.users[0];
  }

  isDefaultUser(): boolean {
    return this.getCurrentUser().email === this.defaultEmail;
  }

  getStorageKey(area: string): string {
    const email = this.getCurrentUser().email.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return `smartdrop-${area}-${email}-v4`;
  }

  private loadUsers(): SmartDropUser[] {
    const saved = localStorage.getItem(this.usersKey);
    if (saved) return JSON.parse(saved);

    const defaults = [
      { email: this.defaultEmail, password: 'smartdrop0', fullName: 'Alexander' },
    ];
    localStorage.setItem(this.usersKey, JSON.stringify(defaults));
    return defaults;
  }

  private saveUsers() {
    localStorage.setItem(this.usersKey, JSON.stringify(this.users));
  }
}
