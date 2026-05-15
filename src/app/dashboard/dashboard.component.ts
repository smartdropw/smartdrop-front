import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  metrics = [
    { label: 'Total Consumption', value: '2,847 L', sub: '+12% from last month', icon: 'drop', trend: 'up' },
    { label: 'Current Flow Rate', value: '15.2 L/min', sub: 'Normal range', icon: 'activity', trend: 'ok' },
    { label: 'Water Temperature', value: '22°C', sub: 'Optimal temperature', icon: 'thermometer', trend: 'ok' },
    { label: 'Active Devices', value: '8/10', sub: '2 devices offline', icon: 'wifi', trend: 'warn' },
  ];

  devices = [
    { name: 'Kitchen Sink Sensor', location: 'Kitchen', flow: '12.5 L/min', daily: '245 L', battery: 85, status: 'online' },
    { name: 'Main Bathroom Sensor', location: 'Bathroom', flow: '18.2 L/min', daily: '357 L', battery: 92, status: 'online' },
    { name: 'Garden Irrigation Sensor', location: 'Garden', flow: '0 L/min', daily: '156 L', battery: 15, status: 'offline' },
  ];

  patterns = [
    {
      type: 'warning',
      title: 'Unusual Nighttime Usage',
      desc: 'High water consumption detected between 2:00 AM – 4:00 AM',
      location: 'Main Bathroom',
      impact: 'Potential leak · 45L wasted',
      tag: 'active',
      time: '2 hours ago',
    },
    {
      type: 'success',
      title: 'Peak Efficiency Period',
      desc: 'Optimal water usage pattern detected during morning hours',
      location: 'Kitchen',
      impact: '15% more efficient than average',
      tag: 'resolved',
      time: '6 hours ago',
    },
  ];

  soilMoisture = 45;
  irrigationNext = 'Tomorrow 6:00 AM';

  ngAfterViewInit() {
    this.drawChart();
  }

  drawChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    const data = [12, 18, 14, 22, 19, 28, 24, 30, 26, 22, 18, 24, 20, 28, 32, 28, 24, 20, 16, 22, 18, 14, 10, 8];
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const max = Math.max(...data) + 5;
    const padL = 40, padR = 20, padT = 20, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#e8edf2';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, 'rgba(0, 180, 216, 0.25)');
    grad.addColorStop(1, 'rgba(0, 180, 216, 0)');

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = padT + chartH - (v / max) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + chartW, padT + chartH);
    ctx.lineTo(padL, padT + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#00B4D8';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      const y = padT + chartH - (v / max) * chartH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // X labels (every 4 hrs)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    [0, 4, 8, 12, 16, 20, 23].forEach(i => {
      const x = padL + (i / (data.length - 1)) * chartW;
      ctx.fillText(labels[i], x, H - 6);
    });
  }
}
