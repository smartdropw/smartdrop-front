import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-business',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './business.component.html',
  styleUrls: ['./business.component.scss'],
})
export class BusinessComponent {
  tanks = [
    { name: 'MAIN TANK', capacity: 5000, current: 4200 },
    { name: 'Reserve Tank A', capacity: 5000, current: 4200 },
    { name: 'Reserve Tank B', capacity: 5000, current: 4200 },
  ];

  getLevel(tank: any): number {
    return Math.round((tank.current / tank.capacity) * 100);
  }
}
