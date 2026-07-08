import { OnInit, AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../shared/language/language.service';
import { AuthService } from '../iam/infrastructure/services/auth.service';

type DeviceStatus = 'online' | 'offline';
type PatternStatus = 'active' | 'resolved' | 'investigating';

interface Device {
  deviceId?: number;
  name: string;
  location: string;
  flow: string;
  daily: string;
  battery: number;
  status: DeviceStatus;
}

interface Pattern {
  patternId?: number;
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
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  devices: Device[] = [];
  patterns: Pattern[] = [];

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

  constructor(
    public language: LanguageService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

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

  ngOnInit() {
    this.load();
  }

  ngAfterViewInit() {
    setTimeout(() => this.drawChart());
  }

  toggleManualOverride() {
    this.manualOverride = !this.manualOverride;
    this.message = this.manualOverride ? 'Manual irrigation override enabled.' : 'Manual irrigation override disabled.';
    
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;
    this.http.put(`${this.authService.apiUrl}/api/v1/inventory/irrigation/user/${userId}`, {
      manualOverride: this.manualOverride,
      soilMoisture: this.soilMoisture,
      irrigationNext: this.irrigationNext
    }).subscribe();
  }

  scheduleIrrigation() {
    if (!this.scheduleForm.date || !this.scheduleForm.time) {
      this.message = 'Select date and time before scheduling irrigation.';
      return;
    }

    this.soilMoisture = Number(this.scheduleForm.moisture);
    this.irrigationNext = `${this.scheduleForm.date} ${this.scheduleForm.time}`;
    this.message = `Irrigation scheduled for ${this.irrigationNext}.`;
    
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;
    this.http.put(`${this.authService.apiUrl}/api/v1/inventory/irrigation/user/${userId}`, {
      manualOverride: this.manualOverride,
      soilMoisture: this.soilMoisture,
      irrigationNext: this.irrigationNext
    }).subscribe();
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

    let flow = String(this.deviceForm.flow).trim();
    if (flow && !flow.includes('L/min')) flow += ' L/min';
    let daily = String(this.deviceForm.daily).trim();
    if (daily && !daily.includes('L')) daily += ' L';

    const device = {
      ...this.deviceForm,
      flow: flow || '0 L/min',
      daily: daily || '0 L',
      battery: Math.max(0, Math.min(100, Number(this.deviceForm.battery) || 0)),
    };

    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    if (this.editingDeviceIndex === null) {
      this.http.post<Device>(`${this.authService.apiUrl}/api/v1/inventory/devices`, { ...device, userId }).subscribe({
        next: (res) => {
          this.devices.unshift(res);
          this.message = 'Device added.';
          this.showDeviceForm = false;
          this.editingDeviceIndex = null;
          this.deviceForm = this.emptyDevice();
          setTimeout(() => this.drawChart());
        }
      });
    } else {
      const existing = this.editingDeviceIndex !== null ? this.devices[this.editingDeviceIndex] : null;
      if (existing && existing.deviceId) {
        this.http.put<Device>(`${this.authService.apiUrl}/api/v1/inventory/devices/${existing.deviceId}`, device).subscribe({
          next: (res) => {
            if (this.editingDeviceIndex !== null) {
              this.devices[this.editingDeviceIndex] = res;
            }
            this.message = 'Device updated.';
            this.showDeviceForm = false;
            this.editingDeviceIndex = null;
            this.deviceForm = this.emptyDevice();
            setTimeout(() => this.drawChart());
          }
        });
      }
    }
  }

  removeDevice(index: number) {
    if (index === null || index === undefined || index < 0 || index >= this.devices.length) {
      return;
    }
    const device = this.devices[index];
    if (!device) return;

    if (device.deviceId) {
      this.http.delete(`${this.authService.apiUrl}/api/v1/inventory/devices/${device.deviceId}`).subscribe({
        next: () => {
          this.devices.splice(index, 1);
          this.message = `${device.name} removed.`;
          this.selectedDevice = null;
          setTimeout(() => this.drawChart());
        }
      });
    } else {
      this.devices.splice(index, 1);
      this.selectedDevice = null;
      setTimeout(() => this.drawChart());
    }
  }

  showDetails(device: Device) {
    this.selectedDevice = device;
    this.showDeviceForm = false;
  }

  updatePattern(index: number, tag: PatternStatus) {
    const pattern = this.patterns[index];
    if (pattern.patternId) {
      this.http.put<Pattern>(`${this.authService.apiUrl}/api/v1/analytics/patterns/${pattern.patternId}/status`, { tag }).subscribe({
        next: (res) => {
          this.patterns[index] = res;
          this.message = tag === 'resolved' ? 'Pattern marked as resolved.' : 'Pattern moved to investigation.';
        }
      });
    } else {
      pattern.tag = tag;
      pattern.type = tag === 'resolved' ? 'success' : 'warning';
      pattern.time = 'Just now';
      this.message = tag === 'resolved' ? 'Pattern marked as resolved.' : 'Pattern moved to investigation.';
    }
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
    return { name: '', location: '', flow: '', daily: '', battery: 100, status: 'online' };
  }

  private parseLiters(value: string) {
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
  }

  private parseNumber(value: string) {
    return Number(String(value).replace(/[^0-9.]/g, '')) || 0;
  }

  private load() {
    const user = this.authService.getCurrentUser();
    const userId = user.id || 1;

    // 1. Load devices
    this.http.get<Device[]>(`${this.authService.apiUrl}/api/v1/inventory/devices/user/${userId}`).subscribe({
      next: (data) => {
        this.devices = data || [];
        this.cdr.detectChanges();
        this.drawChart();
      },
      error: () => {
        this.devices = [];
        this.cdr.detectChanges();
        this.drawChart();
      }
    });

    // 2. Load irrigation config
    this.http.get<any>(`${this.authService.apiUrl}/api/v1/inventory/irrigation/user/${userId}`).subscribe({
      next: (data) => {
        if (data) {
          this.soilMoisture = data.soilMoisture ?? 0;
          this.irrigationNext = data.irrigationNext ?? 'Not scheduled';
          this.manualOverride = data.manualOverride ?? false;
        } else {
          this.soilMoisture = 0;
          this.irrigationNext = 'Not scheduled';
          this.manualOverride = false;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.soilMoisture = 0;
        this.irrigationNext = 'Not scheduled';
        this.manualOverride = false;
        this.cdr.detectChanges();
      }
    });

    // 3. Load patterns
    this.http.get<Pattern[]>(`${this.authService.apiUrl}/api/v1/analytics/patterns/user/${userId}`).subscribe({
      next: (data) => {
        this.patterns = data || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.patterns = [];
        this.cdr.detectChanges();
      }
    });
  }
}
