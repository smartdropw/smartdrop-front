import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements AfterViewInit {
  @ViewChild('trendCanvas') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('costCanvas') costCanvas!: ElementRef<HTMLCanvasElement>;

  timePeriod = 'Last 7 Days';
  reportType = 'Usage Analytics';
  location = 'All Locations';
  efficiencyScore = 87;

  recentReports = [
    { name: 'Monthly Usage Report', date: 'Generated 2 days ago' },
    { name: 'Cost Analysis Q3', date: 'Generated 1 week ago' },
    { name: 'Efficiency Report', date: 'Generated 2 weeks ago' },
  ];

  ngAfterViewInit() {
    this.drawTrendChart();
    this.drawCostChart();
  }

  drawTrendChart() {
    const canvas = this.trendCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth || 400;
    const H = canvas.height = canvas.offsetHeight || 200;
    const data = [45, 52, 48, 61, 55, 67, 58];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const max = 80;
    const padL = 35, padR = 15, padT = 15, padB = 25;
    const cW = W - padL - padR;
    const cH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, padT, 0, H);
    grad.addColorStop(0, 'rgba(0,180,216,0.2)');
    grad.addColorStop(1, 'rgba(0,180,216,0)');
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = padL + (i / (data.length - 1)) * cW;
      const y = padT + cH - (v / max) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padL + cW, padT + cH);
    ctx.lineTo(padL, padT + cH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    ctx.beginPath(); ctx.strokeStyle = '#00B4D8'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = padL + (i / (data.length - 1)) * cW;
      const y = padT + cH - (v / max) * cH;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      const x = padL + (i / (data.length - 1)) * cW;
      ctx.fillText(l, x, H - 5);
    });
  }

  drawCostChart() {
    const canvas = this.costCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth || 300;
    const H = canvas.height = canvas.offsetHeight || 200;
    const data = [189, 145, 210, 167, 195, 178, 156];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const max = 250;
    const padL = 40, padR = 15, padT = 15, padB = 25;
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const barW = (cW / data.length) * 0.6;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#e8edf2'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

    data.forEach((v, i) => {
      const x = padL + (i / data.length) * cW + (cW / data.length - barW) / 2;
      const barH = (v / max) * cH;
      const y = padT + cH - barH;
      ctx.fillStyle = '#00B4D8';
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#94a3b8'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barW / 2, H - 5);
    });
  }
}
