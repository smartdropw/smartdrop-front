import { Routes } from '@angular/router';
import { LoginComponent } from './iam/presentation/login/login';
import { RegisterComponent } from './iam/presentation/register/register';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./iam/presentation/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'reset-password', 
    loadComponent: () => import('./iam/presentation/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) 
  },
  { 
    path: '2fa-verify', 
    loadComponent: () => import('./iam/presentation/two-factor-verify/two-factor-verify.component').then(m => m.TwoFactorVerifyComponent) 
  },
  { path: 'dashboard', redirectTo: 'app/dashboard', pathMatch: 'full' },
  {
    path: 'app',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'alerts',
        loadComponent: () =>
          import('./alerts/alerts.component').then((m) => m.AlertsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'business',
        loadComponent: () =>
          import('./business/business.component').then((m) => m.BusinessComponent),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./support/support.component').then((m) => m.SupportComponent),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./billing/billing.component').then((m) => m.BillingComponent),
      },
      {
        path: 'admin-users',
        loadComponent: () =>
          import('./admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: 'settings/2fa',
        loadComponent: () =>
          import('./iam/presentation/two-factor-setup/two-factor-setup.component').then((m) => m.TwoFactorSetupComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
