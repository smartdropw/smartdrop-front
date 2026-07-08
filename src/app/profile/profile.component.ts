import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService, SmartDropUser } from '../iam/infrastructure/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  currentUser: SmartDropUser = { email: '', fullName: '' };
  editName = '';
  currentPassword = '';
  newPassword = '';
  confirmNewPassword = '';
  is2FAEnabled = false;
  showDisableWarning = false;
  message = '';
  isError = false;

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.editName = this.currentUser.fullName;
    this.load2FAStatus();
  }

  get userInitial(): string {
    return (this.currentUser.fullName || 'U').charAt(0).toUpperCase();
  }

  updateName() {
    if (!this.editName.trim()) {
      this.showMessage('Name cannot be empty.', true);
      return;
    }

    const userId = this.currentUser.id || 1;

    // Update profile via existing profiles endpoint
    this.http.get<any>(`${this.authService.apiUrl}/api/v1/profiles/by-user/${userId}`).subscribe({
      next: (profile) => {
        if (profile && profile.profileId) {
          this.http.put<any>(`${this.authService.apiUrl}/api/v1/profiles/${profile.profileId}`, {
            fullName: this.editName.trim(),
            email: this.currentUser.email,
            language: profile.language || 'en',
            notificationsEnabled: profile.notificationsEnabled ?? true
          }).subscribe({
            next: () => {
              // Also update in IAM
              this.http.put<any>(`${this.authService.apiUrl}/api/iam/auth/change-name`, {
                email: this.currentUser.email,
                newName: this.editName.trim()
              }).subscribe({
                next: () => {
                  setTimeout(() => {
                    this.currentUser.fullName = this.editName.trim();
                    const saved = JSON.parse(localStorage.getItem('smartdrop-current-user-v2') || '{}');
                    saved.fullName = this.editName.trim();
                    localStorage.setItem('smartdrop-current-user-v2', JSON.stringify(saved));
                    this.showMessage('Profile updated successfully.');
                    this.cdr.detectChanges();
                  });
                }
              });
            },
            error: () => this.showMessage('Error updating profile.', true)
          });
        } else {
          // Create profile if it doesn't exist
          this.http.post<any>(`${this.authService.apiUrl}/api/v1/profiles`, {
            userId,
            fullName: this.editName.trim(),
            email: this.currentUser.email,
            language: 'en',
            notificationsEnabled: true
          }).subscribe({
            next: () => {
              // Also update in IAM
              this.http.put<any>(`${this.authService.apiUrl}/api/iam/auth/change-name`, {
                email: this.currentUser.email,
                newName: this.editName.trim()
              }).subscribe({
                next: () => {
                  setTimeout(() => {
                    this.currentUser.fullName = this.editName.trim();
                    const saved = JSON.parse(localStorage.getItem('smartdrop-current-user-v2') || '{}');
                    saved.fullName = this.editName.trim();
                    localStorage.setItem('smartdrop-current-user-v2', JSON.stringify(saved));
                    this.showMessage('Profile created and updated.');
                    this.cdr.detectChanges();
                  });
                }
              });
            },
            error: () => this.showMessage('Error creating profile.', true)
          });
        }
      },
      error: () => {
        // Profile doesn't exist, create it
        this.http.post<any>(`${this.authService.apiUrl}/api/v1/profiles`, {
          userId,
          fullName: this.editName.trim(),
          email: this.currentUser.email,
          language: 'en',
          notificationsEnabled: true
        }).subscribe({
          next: () => {
            // Also update in IAM
            this.http.put<any>(`${this.authService.apiUrl}/api/iam/auth/change-name`, {
              email: this.currentUser.email,
              newName: this.editName.trim()
            }).subscribe({
              next: () => {
                setTimeout(() => {
                  this.currentUser.fullName = this.editName.trim();
                  const saved = JSON.parse(localStorage.getItem('smartdrop-current-user-v2') || '{}');
                  saved.fullName = this.editName.trim();
                  localStorage.setItem('smartdrop-current-user-v2', JSON.stringify(saved));
                  this.showMessage('Profile created and updated.');
                  this.cdr.detectChanges();
                });
              }
            });
          },
          error: () => this.showMessage('Error creating profile.', true)
        });
      }
    });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword) {
      this.showMessage('Please fill in all password fields.', true);
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.showMessage('New passwords do not match.', true);
      return;
    }

    if (this.newPassword.length < 6) {
      this.showMessage('New password must be at least 6 characters.', true);
      return;
    }

    this.http.put<any>(`${this.authService.apiUrl}/api/iam/auth/change-password`, {
      email: this.currentUser.email,
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.showMessage('Password changed successfully.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.showMessage('Incorrect current password or server error.', true);
        this.cdr.detectChanges();
      }
    });
  }

  toggle2FA() {
    if (this.is2FAEnabled) {
      // User wants to DISABLE → show warning
      this.showDisableWarning = true;
    } else {
      // User wants to ENABLE
      this.authService.enable2FA(this.currentUser.email).subscribe({
        next: () => {
          this.is2FAEnabled = true;
          this.showMessage('Two-Factor Authentication enabled. You will receive a 6-digit code by email on each login.');
          this.cdr.detectChanges();
        },
        error: () => {
          this.showMessage('Error enabling 2FA.', true);
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelDisable2FA() {
    this.showDisableWarning = false;
  }

  confirmDisable2FA() {
    this.showDisableWarning = false;
    this.http.post<any>(`${this.authService.apiUrl}/api/iam/auth/2fa/disable`, {
      email: this.currentUser.email
    }).subscribe({
      next: () => {
        this.is2FAEnabled = false;
        this.showMessage('⚠️ Two-Factor Authentication has been DISABLED. Your account is less secure.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.showMessage('Error disabling 2FA.', true);
        this.cdr.detectChanges();
      }
    });
  }

  private load2FAStatus() {
    this.http.get<any>(`${this.authService.apiUrl}/api/iam/auth/2fa/status/${this.currentUser.email}`).subscribe({
      next: (res) => {
        this.is2FAEnabled = res?.enabled || false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.is2FAEnabled = false;
        this.cdr.detectChanges();
      }
    });
  }

  private showMessage(msg: string, error = false) {
    this.message = msg;
    this.isError = error;
    setTimeout(() => {
      this.message = '';
      this.cdr.detectChanges();
    }, 5000);
  }
}
