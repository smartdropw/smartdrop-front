import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
})
export class BillingComponent {
  Math = Math; // expose Math to template

  settings = { autoPay: true, emailNotif: true, smsAlerts: false, cycle: 'Monthly' };

  transactions = [
    { name: 'Monthly Service', date: 'Dec 1, 2024', amount: -189.30 },
    { name: 'Tank Refill', date: 'Nov 28, 2024', amount: -75.00 },
    { name: 'Maintenance Fee', date: 'Nov 25, 2024', amount: -45.00 },
    { name: 'Refund', date: 'Nov 20, 2024', amount: +25.00 },
  ];

  paymentMethods = [
    { type: 'visa', label: 'Visa •••• 4242', sub: 'Expires 12/25', primary: true },
    { type: 'paypal', label: 'PayPal', sub: 'user@example.com', primary: false },
    { type: 'bank', label: 'Bank Transfer', sub: '•••• 7890', primary: false },
  ];
}
