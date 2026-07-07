import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface UserResponseDto {
  id: number;
  fullName: string;
  email: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.scss']
})
export class AdminUsersComponent implements OnInit {
  users: UserResponseDto[] = [];
  message = '';

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    if (!this.authService.getCurrentUser().isAdmin) {
      this.message = 'You do not have permission to view this page.';
      return;
    }

    this.http.get<UserResponseDto[]>(`${this.authService.apiUrl}/api/identity/auth/users`).subscribe({
      next: (data) => {
        this.users = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Failed to load users.';
        this.cdr.detectChanges();
      }
    });
  }
}
