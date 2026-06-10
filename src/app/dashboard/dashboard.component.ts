import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

type DeviceStatus = 'online' | 'offline';
type PatternStatus = 'active' | 'resolved' | 'investigating';

interface Device {
  name: string;
  location: string;
  flow: string;
  daily: string;
  battery: number;
  status: DeviceStatus;
}

interface Pattern {
  type: 'warning' | 'success';
  title: string;
  desc: string;
  location: string;
  impact: string;
  tag: PatternStatus;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly storageKey: string;

  devices: Device[] = [
    { name: 'Kitchen Sink Sensor', location: 'Kitchen', flow: '12.5 L/min', daily: '245 L', battery: 85, status: 'online' },
    { name: 'Main Bathroom Sensor', location: 'Bathroom', flow: '18.2 L/min', daily: '357 L', battery: 92, status: 'online' },
    { name: 'Garden Irrigation Sensor', location: 'Garden', flow: '0 L/min', daily: '156 L', battery: 15, status: 'offline' },
  ];

  patterns: Pattern[] = [
    {
      type: 'warning',
      title: 'Unusual Nighttime Usage',
      desc: 'High water consumption detected between 2:00 AM - 4:00 AM',
      location: 'Main Bathroom',
      impact: 'Potential leak - 45L wasted',
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
  manualOverride = false;
  message = '';
  showDeviceForm = false;
  editingDeviceIndex: number | null = null;
  selectedDevice: Device | null = null;
  showAllPatterns = false;

  deviceForm: Device = this.emptyDevice();
  scheduleForm = {
    date: '',
    time: '06:00',
    moisture: 45,
  };

  constructor(public language: LanguageService, private authService: AuthService) {
    this.storageKey = this.authService.getStorageKey('dashboard');
    if (!this.authService.isDefaultUser()) {
      this.devices = [];
      this.patterns = [];
      this.soilMoisture = 0;
      this.irrigationNext = 'Not scheduled';
      this.scheduleForm.moisture = 0;
    }
  }

  get metrics() {
    const totalDaily = this.devices.reduce((sum, device) => sum + this.parseLiters(device.daily), 0);
    const online = this.devices.filter((device) => device.status === 'online').length;
    const offline = this.devices.length - online;
    const avgFlow = this.devices.length
      ? this.devices.reduce((sum, device) => sum + this.parseNumber(device.flow), 0) / this.devices.length
      : 0;

    return [
      { labelKey: 'totalConsumption', value: `${totalDaily.toLocaleString()} L`, subKey: 'updatedDevices', icon: 'drop', trend: 'up' },
      { labelKey: 'currentFlowRate', value: `${avgFlow.toFixed(1)} L/min`, subKey: this.manualOverride ? 'manualOverrideActive' : 'normalRange', icon: 'activity', trend: 'ok' },
      { labelKey: 'waterTemperature', value: '22 deg C', subKey: 'defaultOperatingValue', icon: 'thermometer', trend: 'ok' },
      { labelKey: 'activeDevices', value: `${online}/${this.devices.length}`, subText: `${offline} ${this.language.t('devicesOffline')}`, icon: 'wifi', trend: offline ? 'warn' : 'ok' },
    ];
  }

  get visiblePatterns() {
    return this.showAllPatterns ? this.patterns : this.patterns.slice(0, 2);
  }

  ngAfterViewInit() {
    this.load();
    this.drawChart();
  }

  toggleManualOverride() {
    this.manualOverride = !this.manualOverride;
    this.message = this.manualOverride ? 'Manual irrigation override enabled.' : 'Manual irrigation override disabled.';
    this.save();
  }

  scheduleIrrigation() {
    if (!this.scheduleForm.date || !this.scheduleForm.time) {
      this.message = 'Select date and time before scheduling irrigation.';
      return;
    }

    this.soilMoisture = Number(this.scheduleForm.moisture);
    this.irrigationNext = `${this.scheduleForm.date} ${this.scheduleForm.time}`;
    this.message = `Irrigation scheduled for ${this.irrigationNext}.`;
    this.save();
  }

  openDeviceForm(index?: number) {
    this.editingDeviceIndex = typeof index === 'number' ? index : null;
    this.deviceForm = typeof index === 'number' ? { ...this.devices[index] } : this.emptyDevice();
    this.showDeviceForm = true;
    this.selectedDevice = null;
  }

  saveDevice() {
    if (!this.deviceForm.name || !this.deviceForm.location) {
      this.message = 'Device name and location are required.';
      return;
    }

    const device = {
      ...this.deviceForm,
      battery: Math.max(0, Math.min(100, Number(this.deviceForm.battery) || 0)),
    };

    if (this.editingDeviceIndex === null) {
      this.devices.unshift(device);
      this.message = 'Device added.';
    } else {
      this.devices[this.editingDeviceIndex] = device;
      this.message = 'Device updated.';
    }

    this.showDeviceForm = false;
    this.editingDeviceIndex = null;
    this.deviceForm = this.emptyDevice();
    this.save();
    setTimeout(() => this.drawChart());
  }

  removeDevice(index: number) {
    const [device] = this.devices.splice(index, 1);
    this.message = `${device.name} removed.`;
    this.selectedDevice = null;
    this.save();
  }

  showDetails(device: Device) {
    this.selectedDevice = device;
    this.showDeviceForm = false;
  }

  updatePattern(index: number, tag: PatternStatus) {
    this.patterns[index].tag = tag;
    this.patterns[index].type = tag === 'resolved' ? 'success' : 'warning';
    this.patterns[index].time = 'Just now';
    this.message = tag === 'resolved' ? 'Pattern marked as resolved.' : 'Pattern moved to investigation.';
    this.save();
  }

  drawChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const data = this.devices.length
      ? this.devices.map((device) => Math.max(1, this.parseLiters(device.daily) / 10))
      : [1, 1, 1];
    while (data.length < 8) data.push(data[data.length - 1] + 2);
    const labels = data.map((_, i) => `${i * 3}:00`);
    const max = Math.max(...data) + 5;
    const padL = 40, padR = 20, padT = 20, padB = 30;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#e8edf2';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }

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

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      const x = padL + (i / (data.length - 1)) * chartW;
      ctx.fillText(label, x, H - 6);
    });
  }

  private emptyDevice(): Device {
    return { name: '', location: '', flow: '0 L/min', daily: '0 L', battery: 100, status: 'online' };
  }

  private parseLiters(value: string) {
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
  }

  private parseNumber(value: string) {
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify({
      devices: this.devices,
      patterns: this.patterns,
      soilMoisture: this.soilMoisture,
      irrigationNext: this.irrigationNext,
      manualOverride: this.manualOverride,
    }));
  }

  private load() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    const data = JSON.parse(saved);
    this.devices = data.devices ?? this.devices;
    this.patterns = data.patterns ?? this.patterns;
    this.soilMoisture = data.soilMoisture ?? this.soilMoisture;
    this.irrigationNext = data.irrigationNext ?? this.irrigationNext;
    this.manualOverride = data.manualOverride ?? this.manualOverride;
  }
}
