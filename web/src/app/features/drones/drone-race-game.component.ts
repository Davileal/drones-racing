import {
  Component,
  DestroyRef,
  AfterViewInit,
  ViewChild,
  ElementRef,
  effect,
  inject,
  EnvironmentInjector,
} from '@angular/core';
import { DronesService } from './drones.service';

type LegState = { fromStop: number; toStop: number; legStart: number; legDuration: number };

@Component({
  selector: 'app-drone-race-game',
  standalone: true,
  template: `
    <canvas #canvas class="w-full h-[340px] rounded-xl border border-white/10 bg-black/10"></canvas>
    <div class="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
      @for (d of drones(); track d.id; let i = $index) {
      <div class="flex items-center gap-2">
        <span
          class="inline-block w-2.5 h-2.5 rounded-full"
          [style.background]="colors[i % colors.length]"
        ></span>
        <span class="font-medium text-white">{{ d.name }}</span>
        <span class="text-gray-300">— Stop {{ d.currentStop }}/10</span>
        @if (d.status==='finished') { <span class="ml-1">🏁</span> }
      </div>
      }
    </div>
  `,
})
export class DroneRaceGameComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private svc = inject(DronesService);
  private destroyRef = inject(DestroyRef);
  private env = inject(EnvironmentInjector);

  drones = this.svc.drones;
  colors = ['#60a5fa', '#34d399', '#f87171', '#f59e0b'];

  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;
  private legs = new Map<string, LegState>();

  // ✅ Crie o effect como campo (em contexto de injeção)
  private trackLegsEffect = effect(() => {
    const list = this.drones();
    const now = performance.now();
    for (const d of list) {
      if (d.status === 'finished') {
        this.legs.delete(d.id);
        continue;
      }
      const cur = this.legs.get(d.id);
      const eta = d.etaToNextMs ?? 0;
      if (!cur || cur.fromStop !== d.currentStop) {
        const toStop = Math.min(10, d.currentStop + 1);
        this.legs.set(d.id, { fromStop: d.currentStop, toStop, legStart: now, legDuration: eta });
      } else if (eta && cur.legDuration !== eta) {
        this.legs.set(d.id, { ...cur, legStart: now, legDuration: eta });
      }
    }
  });

  ngAfterViewInit(): void {
    // pega contexto do canvas
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.ctx = ctx;

    this.resize(canvas);
    const onResize = () => this.resize(canvas);
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));

    // loop de desenho
    const loop = () => {
      this.draw(canvas);
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.rafId));
  }

  private resize(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private draw(canvas: HTMLCanvasElement) {
    if (!this.ctx) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width,
      h = rect.height;

    this.ctx.clearRect(0, 0, w, h);

    const cx = w / 2,
      cy = h / 2;
    const rx = Math.min(w * 0.42, 380);
    const ry = Math.min(h * 0.32, 160);

    // pista
    this.ctx.lineWidth = 18;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    this.ellipse(cx, cy, rx, ry);
    this.ctx.stroke();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    this.ellipse(cx, cy, rx, ry);
    this.ctx.stroke();

    // checkpoints
    this.ctx.fillStyle = 'rgba(148,163,184,0.9)';
    for (let i = 0; i < 10; i++) {
      const [px, py] = this.point(cx, cy, rx, ry, i / 10);
      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // bandeira
    const [fx, fy] = this.point(cx, cy, rx, ry, 0);
    this.ctx.font = '16px system-ui, -apple-system, Segoe UI, Roboto';
    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
    this.ctx.fillText('🏁', fx - 8, fy - 10);

    // drones
    const now = performance.now();
    const list = this.drones();
    list.forEach((d, i) => {
      let frac: number;
      if (d.status === 'finished') {
        frac = 0;
      } else {
        const leg = this.legs.get(d.id);
        if (!leg || !leg.legDuration || leg.legDuration <= 0) {
          frac = (d.currentStop - 1) / 10;
        } else {
          const p = Math.min(1, (now - leg.legStart) / leg.legDuration);
          const base = (leg.fromStop - 1) / 10;
          frac = base + p * (1 / 10);
        }
      }

      const [x, y] = this.point(cx, cy, rx, ry, frac % 1);

      // sombra
      this.ctx.fillStyle = 'rgba(17,24,39,0.18)';
      this.ctx.beginPath();
      this.ctx.ellipse(x, y + 6, 10, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // drone
      this.ctx.fillStyle = this.colors[i % this.colors.length];
      this.ctx.beginPath();
      this.ctx.arc(x, y, 9, 0, Math.PI * 2);
      this.ctx.fill();

      // label
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(String(d.currentStop), x, y + 3);
    });
  }

  private point(cx: number, cy: number, rx: number, ry: number, t: number): [number, number] {
    const angle = -Math.PI / 2 + Math.PI * 2 * t;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  }
  private ellipse(cx: number, cy: number, rx: number, ry: number) {
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
}
