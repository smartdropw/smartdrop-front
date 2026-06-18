import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent {
  private readonly storageKey: string;
  ticket = { subject: '', priority: '', description: '' };
  message = '';

  tickets = [
    { category: 'Device connection issue', id: '#2891731', status: 'open' },
    { category: 'Billing question', id: '#5126127', status: 'solved' },
  ];

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('support');
    if (!this.authService.isDefaultUser()) {
      this.tickets = [];
    }
    this.load();
  }

  submitTicket() {
    if (this.ticket.subject && this.ticket.description) {
      this.tickets.unshift({
        category: this.ticket.subject,
        id: '#' + Math.floor(Math.random() * 9000000 + 1000000),
        status: 'open',
      });
      this.message = 'Support ticket created.';
      this.ticket = { subject: '', priority: '', description: '' };
      this.save();
    } else {
      this.message = 'Subject and description are required.';
    }
  }

  markSolved(index: number) {
    this.tickets[index].status = 'solved';
    this.message = 'Ticket marked as solved.';
    this.save();
  }

  removeTicket(index: number) {
    this.tickets.splice(index, 1);
    this.message = 'Ticket removed.';
    this.save();
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({ tickets: this.tickets }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.tickets = data.tickets ?? this.tickets;
  }
}
