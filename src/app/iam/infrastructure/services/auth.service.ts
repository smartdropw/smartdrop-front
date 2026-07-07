import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface SmartDropUser {
  id?: number;
  email: string;
  password?: string;
  fullName: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public readonly apiUrl = 'https://smartdrop-api.duckdns.org';
  private readonly currentUserKey = 'smartdrop-current-user-v2';
  private readonly defaultEmail = 'smartdrop@gmail.com';

  constructor(private http: HttpClient) {}

  register(email: string, password: string, fullName = ''): Observable<any> {
    const body = { email, password, fullName };
    return this.http.post(`${this.apiUrl}/api/identity/auth/register`, body);
  }

  login(email: string, password: string): Observable<boolean> {
    const body = { email, password };
    return this.http.post<any>(`${this.apiUrl}/api/identity/auth/login`, body).pipe(
      switchMap((res) => {
        if (res && res.userId) {
          return this.http.get<boolean>(`${this.apiUrl}/api/identity/auth/users/${res.userId}/has-role/ADMIN`).pipe(
            map((isAdmin) => {
              const user: SmartDropUser = {
                id: res.userId,
                email: res.email,
                fullName: res.fullName,
                isAdmin: isAdmin,
              };
              localStorage.setItem(this.currentUserKey, JSON.stringify(user));
              return true;
            }),
            catchError(() => {
              const user: SmartDropUser = {
                id: res.userId,
                email: res.email,
                fullName: res.fullName,
                isAdmin: false,
              };
              localStorage.setItem(this.currentUserKey, JSON.stringify(user));
              return of(true);
            })
          );
        }
        return of(false);
      }),
      catchError(() => of(false))
    );
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
  }

  getCurrentUser(): SmartDropUser {
    const saved = localStorage.getItem(this.currentUserKey);
    if (saved) return JSON.parse(saved);
    return { id: 1, email: this.defaultEmail, fullName: 'Alexander' };
  }

  isDefaultUser(): boolean {
    return this.getCurrentUser().email === this.defaultEmail;
  }

  getStorageKey(area: string): string {
    const email = this.getCurrentUser().email.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return `smartdrop-${area}-${email}-v4`;
  }
}
