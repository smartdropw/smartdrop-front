import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

type AlertType = 'critical' | 'warning' | 'info';

interface AlertItem {
  alertId?: number;
  type: AlertType;
  title: string;
  desc: string;
  time: string;
  resolved?: boolean;
}

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
})
export class AlertsComponent implements OnInit {
  private readonly storageKey: string;

  alerts: AlertItem[] = [];

  settings = {
    criticalAlerts: true,
    usageWarnings: true,
    maintenanceReminders: false,
    pushNotifications: true,
    email: true,
    sms: false,
  };

  newAlert: AlertItem = this.emptyAlert();
  message = '';

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.storageKey = this.authService.getStorageKey('alerts-settings');
  }

  ngOnInit() {
    this.loadSettings();
    this.loadAlerts();
  }

  get stats() {
    return [
      { label: 'Critical Alerts', value: this.count('critical'), color: 'red', icon: 'triangle' },
      { label: 'Warnings', value: this.count('warning'), color: 'yellow', icon: 'clock' },
      { label: 'Info Alerts', value: this.count('info'), color: 'blue', icon: 'info' },
      { label: 'Resolved Today', value: this.alerts.filter((alert) => alert.resolved).length, color: 'green', icon: 'check' },
    ];
  }

  get activeAlerts() {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  addAlert() {
    if (!this.newAlert.title || !this.newAlert.desc) {
      this.message = 'Title and description are required.';
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    const payload = {
      userId,
      type: this.newAlert.type,
      title: this.newAlert.title,
      description: this.newAlert.desc
    };

    this.http.post<any>(`${this.authService.apiUrl}/api/v1/support/alerts`, payload).subscribe({
      next: (res) => {
        this.alerts.unshift({
          alertId: res.alertId,
          type: res.type as AlertType,
          title: res.title,
          desc: res.description,
          resolved: res.resolved,
          time: 'Just now'
        });
        this.newAlert = this.emptyAlert();
        this.message = 'Alert added.';
        this.cdr.detectChanges();
      }
    });
  }

  resolveAlert(alert: AlertItem) {
    if (alert.alertId) {
      this.http.put<any>(`${this.authService.apiUrl}/api/v1/support/alerts/${alert.alertId}/resolve`, {}).subscribe({
        next: () => {
          alert.resolved = true;
          alert.time = 'Resolved just now';
          this.message = `${alert.title} resolved.`;
          this.cdr.detectChanges();
        }
      });
    } else {
      alert.resolved = true;
      alert.time = 'Resolved just now';
      this.message = `${alert.title} resolved.`;
    }
  }

  removeAlert(alert: AlertItem) {
    if (alert.alertId) {
      this.http.delete(`${this.authService.apiUrl}/api/v1/support/alerts/${alert.alertId}`).subscribe({
        next: () => {
          this.alerts = this.alerts.filter((item) => item !== alert);
          this.message = 'Alert removed.';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.alerts = this.alerts.filter((item) => item !== alert);
      this.message = 'Alert removed.';
    }
  }

  saveSettings() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    this.message = 'Notification settings saved.';
  }

  private count(type: AlertType) {
    return this.activeAlerts.filter((alert) => alert.type === type).length;
  }

  private emptyAlert(): AlertItem {
    return { type: 'info', title: '', desc: '', time: 'Just now' };
  }

  private loadSettings() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  private loadAlerts() {
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    this.http.get<any[]>(`${this.authService.apiUrl}/api/v1/support/alerts/user/${userId}`).subscribe({
      next: (data) => {
        this.alerts = (data || []).map(item => ({
          alertId: item.alertId,
          type: item.type as AlertType,
          title: item.title,
          desc: item.description,
          resolved: item.resolved,
          time: this.formatTime(item.createdAt)
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.alerts = [];
        this.cdr.detectChanges();
      }
    });
  }

  private formatTime(createdAtStr?: string): string {
    if (!createdAtStr) return 'Just now';
    try {
      const date = new Date(createdAtStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs} hours ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recent';
    }
  }
}
