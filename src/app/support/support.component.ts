import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface TicketItem {
  ticketId?: number;
  id?: string;
  category: string;
  subject: string;
  priority: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  ticket = { subject: '', priority: 'medium', description: '' };
  message = '';
  tickets: TicketItem[] = [];
  get isAdmin(): boolean {
    return !!this.authService.getCurrentUser().isAdmin;
  }

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.load();
  }

  submitTicket() {
    if (!this.ticket.subject || !this.ticket.description) {
      this.message = 'Subject and description are required.';
      return;
    }

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    const payload = {
      userId,
      subject: this.ticket.subject,
      priority: this.ticket.priority,
      description: this.ticket.description
    };

    this.http.post<any>(`${this.authService.apiUrl}/api/v1/support/management/tickets`, payload).subscribe({
      next: (res) => {
        this.tickets.unshift({
          ticketId: res.ticketId,
          id: `#${res.ticketId}`,
          category: res.subject,
          subject: res.subject,
          priority: res.priority,
          description: res.description,
          status: res.status ? res.status.toLowerCase() : 'open'
        });
        this.message = 'Support ticket created.';
        this.ticket = { subject: '', priority: 'medium', description: '' };
      }
    });
  }

  markSolved(index: number) {
    const t = this.tickets[index];
    if (t.ticketId) {
      this.http.put<any>(`${this.authService.apiUrl}/api/v1/support/management/tickets/${t.ticketId}/status`, { status: 'SOLVED' }).subscribe({
        next: () => {
          t.status = 'solved';
          this.message = 'Ticket marked as solved.';
        }
      });
    } else {
      t.status = 'solved';
      this.message = 'Ticket marked as solved.';
    }
  }

  removeTicket(index: number) {
    const t = this.tickets[index];
    if (t.ticketId) {
      this.http.delete(`${this.authService.apiUrl}/api/v1/support/management/tickets/${t.ticketId}`).subscribe({
        next: () => {
          this.tickets.splice(index, 1);
          this.message = 'Ticket removed.';
        }
      });
    } else {
      this.tickets.splice(index, 1);
      this.message = 'Ticket removed.';
    }
  }

  private load() {
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    const endpoint = this.isAdmin 
      ? `${this.authService.apiUrl}/api/v1/support/management/tickets`
      : `${this.authService.apiUrl}/api/v1/support/management/tickets/user/${userId}`;

    this.http.get<any[]>(endpoint).subscribe({
      next: (data) => {
        this.tickets = (data || []).map(res => ({
          ticketId: res.ticketId,
          id: `#${res.ticketId}`,
          category: res.subject,
          subject: res.subject,
          priority: res.priority,
          description: res.description,
          status: res.status ? res.status.toLowerCase() : 'open'
        }));
      },
      error: () => {
        this.tickets = [];
      }
    });
  }
}
