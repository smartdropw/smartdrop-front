import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface Tank {
  tankId?: number;
  name: string;
  capacity: number;
  current: number;
}

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './business.component.html',
  styleUrls: ['./business.component.scss'],
})
export class BusinessComponent implements OnInit {
  tanks: Tank[] = [];

  showForm = false;
  editingIndex: number | null = null;
  form: Tank = this.emptyTank();
  message = '';

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
  }

  get closeToReplenish() {
    return this.tanks.filter((tank) => this.getLevel(tank) < 30).length;
  }

  get savings() {
    return this.tanks.reduce((sum, tank) => sum + Math.round((tank.capacity - tank.current) * 0.12), 0);
  }

  get fillAverage() {
    if (!this.tanks.length) return '0 h';
    const hours = this.tanks.reduce((sum, tank) => sum + ((tank.capacity - tank.current) / 1000), 0) / this.tanks.length;
    return `${Math.max(0.2, hours).toFixed(1)} h`;
  }

  getLevel(tank: Tank): number {
    return tank.capacity ? Math.round((tank.current / tank.capacity) * 100) : 0;
  }

  openForm(index?: number) {
    this.editingIndex = (typeof index === 'number' && this.tanks[index]) ? index : null;
    this.form = (typeof index === 'number' && this.tanks[index]) ? { ...this.tanks[index] } : this.emptyTank();
    this.showForm = true;
  }

  saveTank() {
    if (!this.form.name || this.form.capacity <= 0) {
      this.message = 'Tank name and capacity are required.';
      return;
    }

    const payload = {
      name: this.form.name,
      capacity: Number(this.form.capacity),
      current: Math.min(Number(this.form.current) || 0, Number(this.form.capacity)),
    };

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    if (this.editingIndex === null) {
      this.http.post<Tank>(`${this.authService.apiUrl}/api/v1/inventory/tanks`, { ...payload, userId }).subscribe({
        next: (res) => {
          this.tanks.unshift(res);
          this.message = 'Tank added.';
          this.showForm = false;
          this.form = this.emptyTank();
          this.cdr.detectChanges();
        }
      });
    } else {
      const existing = this.tanks[this.editingIndex];
      if (existing && existing.tankId) {
        this.http.put<Tank>(`${this.authService.apiUrl}/api/v1/inventory/tanks/${existing.tankId}`, payload).subscribe({
          next: (res) => {
            this.tanks[this.editingIndex!] = res;
            this.message = 'Tank updated.';
            this.showForm = false;
            this.form = this.emptyTank();
            this.editingIndex = null;
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  replenish(index: number) {
    const tank = this.tanks[index];
    if (!tank) return;
    if (tank.tankId) {
      this.http.put<Tank>(`${this.authService.apiUrl}/api/v1/inventory/tanks/${tank.tankId}/replenish`, {}).subscribe({
        next: (res) => {
          this.tanks[index] = res;
          this.message = `${tank.name} replenished.`;
          this.cdr.detectChanges();
        }
      });
    } else {
      tank.current = tank.capacity;
      this.message = `${tank.name} replenished.`;
    }
  }

  removeTank(index: number) {
    const tank = this.tanks[index];
    if (!tank) return;
    if (tank.tankId) {
      this.http.delete(`${this.authService.apiUrl}/api/v1/inventory/tanks/${tank.tankId}`).subscribe({
        next: () => {
          this.tanks.splice(index, 1);
          this.message = `${tank.name} removed.`;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.tanks.splice(index, 1);
      this.message = `${tank.name} removed.`;
    }
  }

  private emptyTank(): Tank {
    return { name: '', capacity: 5000, current: 0 };
  }

  private load() {
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    this.http.get<Tank[]>(`${this.authService.apiUrl}/api/v1/inventory/tanks/user/${userId}`).subscribe({
      next: (data) => {
        this.tanks = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.tanks = [];
        this.cdr.detectChanges();
      }
    });
  }
}
