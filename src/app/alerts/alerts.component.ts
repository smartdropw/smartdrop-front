import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

type AlertType = 'critical' | 'warning' | 'info';

interface AlertItem {
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
export class AlertsComponent {
  private readonly storageKey: string;

  alerts: AlertItem[] = [
    { type: 'critical', title: 'Water Pressure Critical', desc: 'Main tank pressure dropped below 15 PSI', time: '2 minutes ago' },
    { type: 'warning', title: 'High Water Usage Detected', desc: 'Usage 40% above normal for this time', time: '15 minutes ago' },
    { type: 'info', title: 'Scheduled Maintenance Due', desc: 'Filter replacement scheduled for tomorrow', time: '1 hour ago' },
  ];

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

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('alerts');
    if (!this.authService.isDefaultUser()) {
      this.alerts = [];
      this.settings = {
        criticalAlerts: true,
        usageWarnings: true,
        maintenanceReminders: true,
        pushNotifications: true,
        email: true,
        sms: false,
      };
    }
    this.load();
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

    this.alerts.unshift({ ...this.newAlert, time: 'Just now' });
    this.newAlert = this.emptyAlert();
    this.message = 'Alert added.';
    this.save();
  }

  resolveAlert(alert: AlertItem) {
    alert.resolved = true;
    alert.time = 'Resolved just now';
    this.message = `${alert.title} resolved.`;
    this.save();
  }

  removeAlert(alert: AlertItem) {
    this.alerts = this.alerts.filter((item) => item !== alert);
    this.message = 'Alert removed.';
    this.save();
  }

  saveSettings() {
    this.message = 'Notification settings saved.';
    this.save();
  }

  private count(type: AlertType) {
    return this.activeAlerts.filter((alert) => alert.type === type).length;
  }

  private emptyAlert(): AlertItem {
    return { type: 'info', title: '', desc: '', time: 'Just now' };
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({ alerts: this.alerts, settings: this.settings }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.alerts = data.alerts ?? this.alerts;
    this.settings = data.settings ?? this.settings;
  }
}
