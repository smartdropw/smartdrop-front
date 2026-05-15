import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  navItems = [
    { label: 'Dashboard', icon: 'grid', route: '/app/dashboard', badge: null },
    { label: 'Alerts', icon: 'bell', route: '/app/alerts', badge: 3 },
    { label: 'Reports', icon: 'bar-chart', route: '/app/reports', badge: null },
    { label: 'Business', icon: 'briefcase', route: '/app/business', badge: null },
    { label: 'Support', icon: 'help-circle', route: '/app/support', badge: null },
    { label: 'Billing', icon: 'credit-card', route: '/app/billing', badge: null },
  ];
}
