import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

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
  private readonly storageKey: string;

  timePeriod = 'Last 7 Days';
  reportType = 'Usage Analytics';
  location = 'All Locations';
  efficiencyScore = 87;
  waterSaved = 2340;
  costSaved = 156;
  message = '';
  trendData = [45, 52, 48, 61, 55, 67, 58];
  costData = [189, 145, 210, 167, 195, 178, 156];

  recentReports = [
    { name: 'Monthly Usage Report', date: 'Generated 2 days ago' },
    { name: 'Cost Analysis Q3', date: 'Generated 1 week ago' },
    { name: 'Efficiency Report', date: 'Generated 2 weeks ago' },
  ];

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('reports');
    if (!this.authService.isDefaultUser()) {
      this.efficiencyScore = 0;
      this.waterSaved = 0;
      this.costSaved = 0;
      this.trendData = [0, 0, 0, 0, 0, 0, 0];
      this.costData = [0, 0, 0, 0, 0, 0, 0];
      this.recentReports = [];
    }
    this.load();
  }

  generateReport() {
    const seed = this.timePeriod.length + this.reportType.length + this.location.length;
    this.trendData = Array.from({ length: 7 }, (_, i) => 35 + ((seed + i * 9) % 38));
    this.costData = this.trendData.map((value, i) => Math.round(value * 3.1 + i * 7));
    this.efficiencyScore = Math.min(98, Math.max(55, 100 - Math.round(this.trendData.reduce((a, b) => a + b, 0) / 16)));
    this.waterSaved = this.efficiencyScore * 28;
    this.costSaved = Math.round(this.efficiencyScore * 1.8);
    this.recentReports.unshift({
      name: `${this.reportType} - ${this.location}`,
      date: `Generated for ${this.timePeriod}`,
    });
    this.message = 'Report generated with the selected filters.';
    this.save();
    setTimeout(() => {
      this.drawTrendChart();
      this.drawCostChart();
    });
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      efficiencyScore: this.efficiencyScore,
      waterSaved: this.waterSaved,
      costSaved: this.costSaved,
      trendData: this.trendData,
      costData: this.costData,
      recentReports: this.recentReports,
    }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.efficiencyScore = data.efficiencyScore ?? this.efficiencyScore;
    this.waterSaved = data.waterSaved ?? this.waterSaved;
    this.costSaved = data.costSaved ?? this.costSaved;
    this.trendData = data.trendData ?? this.trendData;
    this.costData = data.costData ?? this.costData;
    this.recentReports = data.recentReports ?? this.recentReports;
  }

  downloadReport(report = { name: `${this.reportType} Report`, date: 'Generated now' }) {
    const content = [
      'SmartDrop Report',
      `Name: ${report.name}`,
      `Period: ${this.timePeriod}`,
      `Type: ${this.reportType}`,
      `Location: ${this.location}`,
      `Efficiency: ${this.efficiencyScore}%`,
      `Water saved: ${this.waterSaved}L`,
      `Cost saved: $${this.costSaved}`,
      `Date: ${report.date}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    this.message = 'Report downloaded.';
  }

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
    const data = this.trendData;
    const labels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((key) => this.language.t(key));
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
    const data = this.costData;
    const labels = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((key) => this.language.t(key));
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
