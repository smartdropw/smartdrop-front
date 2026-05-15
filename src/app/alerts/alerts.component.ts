import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.scss'],
})
export class AlertsComponent {
  stats = [
    { label: 'Critical Alerts', value: 3, color: 'red', icon: 'triangle' },
    { label: 'Warnings', value: 7, color: 'yellow', icon: 'clock' },
    { label: 'Info Alerts', value: 12, color: 'blue', icon: 'info' },
    { label: 'Resolved Today', value: 15, color: 'green', icon: 'check' },
  ];

  alerts = [
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

  removeAlert(index: number) {
    this.alerts.splice(index, 1);
  }
}
