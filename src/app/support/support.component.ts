import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent {
  ticket = { subject: '', priority: '', description: '' };

  tickets = [
    { category: 'Device connection issue', id: '#2891731', status: 'open' },
    { category: 'Billing question', id: '#5126127', status: 'solved' },
  ];

  constructor(public language: LanguageService) {}

  submitTicket() {
    if (this.ticket.subject && this.ticket.description) {
      this.tickets.unshift({
        category: this.ticket.subject,
        id: '#' + Math.floor(Math.random() * 9000000 + 1000000),
        status: 'open',
      });
      this.ticket = { subject: '', priority: '', description: '' };
    }
  }
}
