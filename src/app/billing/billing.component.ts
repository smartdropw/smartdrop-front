import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface Transaction {
  transactionId?: number;
  name: string;
  date: string;
  amount: number;
}

interface PaymentMethod {
  paymentMethodId?: number;
  type: 'visa' | 'paypal' | 'bank';
  label: string;
  sub: string;
  primary: boolean;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
})
export class BillingComponent implements OnInit {
  Math = Math;
  private readonly storageKey: string;

  settings = { autoPay: true, emailNotif: true, smsAlerts: false, cycle: 'Monthly' };
  walletBalance = 0;
  walletAmount = 25;
  showMethodForm = false;
  showAllTransactions = false;
  message = '';

  transactions: Transaction[] = [];
  paymentMethods: PaymentMethod[] = [];
  methodForm: PaymentMethod = this.emptyMethod();

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.storageKey = this.authService.getStorageKey('billing-settings');
  }

  ngOnInit() {
    this.loadSettings();
    this.loadBillingData();
  }

  get currentBalance() {
    return Math.abs(this.transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
  }

  get monthlyAverage() {
    const payments = this.transactions.filter((tx) => tx.amount < 0);
    return payments.length ? Math.abs(payments.reduce((sum, tx) => sum + tx.amount, 0) / payments.length) : 0;
  }

  get visibleTransactions() {
    return this.showAllTransactions ? this.transactions : this.transactions.slice(0, 4);
  }

  get namePlaceholder() {
    switch (this.methodForm.type) {
      case 'paypal': return 'email@paypal.com';
      case 'bank': return 'IBAN / Account Number';
      case 'visa': default: return '0000 0000 0000 0000';
    }
  }

  get detailPlaceholder() {
    switch (this.methodForm.type) {
      case 'paypal': return 'PayPal Account';
      case 'bank': return 'Bank Name';
      case 'visa': default: return 'MM/YY';
    }
  }

  onTypeChange() {
    this.methodForm.label = '';
    this.methodForm.sub = '';
  }

  onLabelInput(event: any) {
    if (this.methodForm.type === 'visa') {
      let val = event.target.value.replace(/\D/g, '').substring(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      event.target.value = val;
      this.methodForm.label = val;
    }
  }

  onSubInput(event: any) {
    if (this.methodForm.type === 'visa') {
      let val = event.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length > 2) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      event.target.value = val;
      this.methodForm.sub = val;
    }
  }

  addMethod() {
    if (!this.methodForm.label || !this.methodForm.sub) {
      this.message = 'Payment method name and detail are required.';
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    const payload = {
      userId,
      type: this.methodForm.type,
      label: this.methodForm.label,
      sub: this.methodForm.sub,
      primary: this.methodForm.primary
    };

    this.http.post<any>(`${this.authService.apiUrl}/api/v1/finance/payment-methods`, payload).subscribe({
      next: (res) => {
        if (res.primary) {
          this.paymentMethods.forEach((method) => method.primary = false);
        }
        this.paymentMethods.unshift({
          paymentMethodId: res.paymentMethodId,
          type: res.type as 'visa' | 'paypal' | 'bank',
          label: res.label,
          sub: res.sub,
          primary: res.primary
        });
        this.methodForm = this.emptyMethod();
        this.showMethodForm = false;
        this.message = 'Payment method added.';
      }
    });
  }

  setPrimary(index: number) {
    const method = this.paymentMethods[index];
    if (!method) return;
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    if (method.paymentMethodId) {
      this.http.put<any>(`${this.authService.apiUrl}/api/v1/finance/payment-methods/${method.paymentMethodId}/primary/user/${userId}`, {}).subscribe({
        next: () => {
          this.paymentMethods.forEach((m, i) => m.primary = i === index);
          this.message = 'Primary payment method updated.';
        }
      });
    } else {
      this.paymentMethods.forEach((m, i) => m.primary = i === index);
      this.message = 'Primary payment method updated.';
    }
  }

  removeMethod(index: number) {
    const method = this.paymentMethods[index];
    if (!method) return;
    if (method.paymentMethodId) {
      this.http.delete(`${this.authService.apiUrl}/api/v1/finance/payment-methods/${method.paymentMethodId}`).subscribe({
        next: () => {
          this.paymentMethods.splice(index, 1);
          if (method.primary && this.paymentMethods.length) {
            this.setPrimary(0);
          }
          this.message = 'Payment method removed.';
        }
      });
    } else {
      this.paymentMethods.splice(index, 1);
      if (method.primary && this.paymentMethods.length) this.paymentMethods[0].primary = true;
      this.message = 'Payment method removed.';
    }
  }

  saveSettings() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
    this.message = 'Billing settings saved.';
  }

  addFunds() {
    const amount = Number(this.walletAmount);
    if (amount <= 0) return;

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    this.http.post<any>(`${this.authService.apiUrl}/api/v1/finance/wallet/user/${userId}/add-funds`, {
      amount,
      transactionName: 'Wallet Funds Added'
    }).subscribe({
      next: (res) => {
        this.walletBalance = res.balance;
        this.loadTransactions(userId);
        this.message = `$${amount.toFixed(2)} added to wallet.`;
      }
    });
  }

  withdraw() {
    const amount = Number(this.walletAmount);
    if (amount <= 0 || amount > this.walletBalance) {
      this.message = 'Enter an amount available in the wallet.';
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    this.http.post<any>(`${this.authService.apiUrl}/api/v1/finance/wallet/user/${userId}/withdraw`, {
      amount,
      transactionName: 'Wallet Withdrawal'
    }).subscribe({
      next: (res) => {
        this.walletBalance = res.balance;
        this.loadTransactions(userId);
        this.message = `$${amount.toFixed(2)} withdrawn from wallet.`;
      }
    });
  }

  private emptyMethod(): PaymentMethod {
    return { type: 'visa', label: '', sub: '', primary: false };
  }

  private loadSettings() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.settings = JSON.parse(saved);
    }
  }

  private loadBillingData() {
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    // Load Wallet
    this.http.get<any>(`${this.authService.apiUrl}/api/v1/finance/wallet/user/${userId}`).subscribe({
      next: (res) => {
        this.walletBalance = res.balance;
        this.loadTransactions(userId);
      },
      error: () => {
        this.walletBalance = 0;
      }
    });

    // Load Payment Methods
    this.http.get<any[]>(`${this.authService.apiUrl}/api/v1/finance/payment-methods/user/${userId}`).subscribe({
      next: (data) => {
        this.paymentMethods = (data || []).map(item => ({
          paymentMethodId: item.paymentMethodId,
          type: item.type as 'visa' | 'paypal' | 'bank',
          label: item.label,
          sub: item.sub,
          primary: item.primary
        }));
      },
      error: () => {
        this.paymentMethods = [];
      }
    });
  }

  private loadTransactions(userId: number) {
    this.http.get<any[]>(`${this.authService.apiUrl}/api/v1/finance/wallet/user/${userId}/transactions`).subscribe({
      next: (data) => {
        this.transactions = (data || []).map(tx => ({
          transactionId: tx.transactionId,
          name: tx.name,
          amount: tx.amount,
          date: this.formatDate(tx.transactionDate)
        }));
      },
      error: () => {
        this.transactions = [];
      }
    });
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return 'Today';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Today';
    }
  }
}
