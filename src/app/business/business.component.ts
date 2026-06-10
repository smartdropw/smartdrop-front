import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

interface Tank {
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
export class BusinessComponent {
  private readonly storageKey: string;

  tanks: Tank[] = [
    { name: 'MAIN TANK', capacity: 5000, current: 4200 },
    { name: 'Reserve Tank A', capacity: 5000, current: 4200 },
    { name: 'Reserve Tank B', capacity: 5000, current: 4200 },
  ];

  showForm = false;
  editingIndex: number | null = null;
  form: Tank = this.emptyTank();
  message = '';

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('business');
    if (!this.authService.isDefaultUser()) {
      this.tanks = [];
    }
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
    this.editingIndex = typeof index === 'number' ? index : null;
    this.form = typeof index === 'number' ? { ...this.tanks[index] } : this.emptyTank();
    this.showForm = true;
  }

  saveTank() {
    if (!this.form.name || this.form.capacity <= 0) {
      this.message = 'Tank name and capacity are required.';
      return;
    }

    const tank = {
      name: this.form.name,
      capacity: Number(this.form.capacity),
      current: Math.min(Number(this.form.current) || 0, Number(this.form.capacity)),
    };

    if (this.editingIndex === null) {
      this.tanks.unshift(tank);
      this.message = 'Tank added.';
    } else {
      this.tanks[this.editingIndex] = tank;
      this.message = 'Tank updated.';
    }

    this.showForm = false;
    this.form = this.emptyTank();
    this.editingIndex = null;
    this.save();
  }

  replenish(index: number) {
    this.tanks[index].current = this.tanks[index].capacity;
    this.message = `${this.tanks[index].name} replenished.`;
    this.save();
  }

  removeTank(index: number) {
    const [tank] = this.tanks.splice(index, 1);
    this.message = `${tank.name} removed.`;
    this.save();
  }

  private emptyTank(): Tank {
    return { name: '', capacity: 5000, current: 0 };
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({ tanks: this.tanks }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.tanks = data.tanks ?? this.tanks;
  }
}
