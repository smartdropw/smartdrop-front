import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface Transaction {
  name: string;
  date: string;
  amount: number;
}

interface PaymentMethod {
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
export class BillingComponent {
  Math = Math;
  private readonly storageKey: string;

  settings = { autoPay: true, emailNotif: true, smsAlerts: false, cycle: 'Monthly' };
  walletBalance = 125.75;
  walletAmount = 25;
  showMethodForm = false;
  showAllTransactions = false;
  message = '';

  transactions: Transaction[] = [
    { name: 'Monthly Service', date: 'Dec 1, 2024', amount: -189.30 },
    { name: 'Tank Refill', date: 'Nov 28, 2024', amount: -75.00 },
    { name: 'Maintenance Fee', date: 'Nov 25, 2024', amount: -45.00 },
    { name: 'Refund', date: 'Nov 20, 2024', amount: 25.00 },
  ];

  paymentMethods: PaymentMethod[] = [
    { type: 'visa', label: 'Visa **** 4242', sub: 'Expires 12/25', primary: true },
    { type: 'paypal', label: 'PayPal', sub: 'user@example.com', primary: false },
    { type: 'bank', label: 'Bank Transfer', sub: '**** 7890', primary: false },
  ];

  methodForm: PaymentMethod = this.emptyMethod();

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('billing');
    if (!this.authService.isDefaultUser()) {
      this.transactions = [];
      this.paymentMethods = [];
      this.walletBalance = 0;
      this.settings = { autoPay: false, emailNotif: true, smsAlerts: false, cycle: 'Monthly' };
    }
    this.load();
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

  addMethod() {
    if (!this.methodForm.label || !this.methodForm.sub) {
      this.message = 'Payment method name and detail are required.';
      return;
    }

    if (this.methodForm.primary) {
      this.paymentMethods.forEach((method) => method.primary = false);
    }

    this.paymentMethods.unshift({ ...this.methodForm });
    this.methodForm = this.emptyMethod();
    this.showMethodForm = false;
    this.message = 'Payment method added.';
    this.save();
  }

  setPrimary(index: number) {
    this.paymentMethods.forEach((method, i) => method.primary = i === index);
    this.message = 'Primary payment method updated.';
    this.save();
  }

  removeMethod(index: number) {
    const [method] = this.paymentMethods.splice(index, 1);
    if (method.primary && this.paymentMethods.length) this.paymentMethods[0].primary = true;
    this.message = 'Payment method removed.';
    this.save();
  }

  saveSettings() {
    this.message = 'Billing settings saved.';
    this.save();
  }

  addFunds() {
    const amount = Number(this.walletAmount);
    if (amount <= 0) return;
    this.walletBalance += amount;
    this.transactions.unshift({ name: 'Wallet Funds Added', date: 'Today', amount });
    this.message = `$${amount.toFixed(2)} added to wallet.`;
    this.save();
  }

  withdraw() {
    const amount = Number(this.walletAmount);
    if (amount <= 0 || amount > this.walletBalance) {
      this.message = 'Enter an amount available in the wallet.';
      return;
    }
    this.walletBalance -= amount;
    this.transactions.unshift({ name: 'Wallet Withdrawal', date: 'Today', amount: -amount });
    this.message = `$${amount.toFixed(2)} withdrawn from wallet.`;
    this.save();
  }

  private emptyMethod(): PaymentMethod {
    return { type: 'visa', label: '', sub: '', primary: false };
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      settings: this.settings,
      transactions: this.transactions,
      paymentMethods: this.paymentMethods,
      walletBalance: this.walletBalance,
    }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.settings = data.settings ?? this.settings;
    this.transactions = data.transactions ?? this.transactions;
    this.paymentMethods = data.paymentMethods ?? this.paymentMethods;
    this.walletBalance = data.walletBalance ?? this.walletBalance;
  }
}
