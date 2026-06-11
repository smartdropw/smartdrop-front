import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../language/language.service';
import { AuthService } from '../../iam/infrastructure/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  constructor(
    private router: Router,
    public language: LanguageService,
    private authService: AuthService,
  ) {}

  navItems = [
    { labelKey: 'dashboard', icon: 'grid', route: '/app/dashboard', badge: null },
    { labelKey: 'alerts', icon: 'bell', route: '/app/alerts', badge: null },
    { labelKey: 'reports', icon: 'bar-chart', route: '/app/reports', badge: null },
    { labelKey: 'business', icon: 'briefcase', route: '/app/business', badge: null },
    { labelKey: 'support', icon: 'help-circle', route: '/app/support', badge: null },
    { labelKey: 'billing', icon: 'credit-card', route: '/app/billing', badge: null },
  ];

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  get userName() {
    return this.authService.getCurrentUser().fullName;
  }

  get userEmail() {
    return this.authService.getCurrentUser().email;
  }
}
