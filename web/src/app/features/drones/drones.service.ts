import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DroneStatus } from './models/drone-status.enum';
import { DroneVM } from './models/drone.vm';
import { DroneDto } from './models/drone.dto';

@Injectable({ providedIn: 'root' })
export class DronesService {
  private readonly base = environment.API_BASE;
  private readonly TOTAL_STOPS = 10;

  readonly drones = signal<DroneVM[]>([]);

  constructor(private http: HttpClient) {}

  public loadList(): void {
    this.http.get<DroneDto[]>(`${this.base}/drones`).subscribe((list) => {
      const mapped = list.map((d) => this.toVM(d));
      this.drones.set(mapped);
    });
  }

  public launch(id: string): void {
    this.http.post(`${this.base}/drones/${id}/launch`, {}).subscribe(() => {
      this.attachStream(id);
    });
  }

  public launchAll(): void {
    this.drones().forEach((d) => this.launch(d.id));
  }

  private toVM(dto: DroneDto): DroneVM {
    const currentStop = dto.currentStop ?? 1;
    const progressPct = Math.min(
      100,
      Math.max(0, ((currentStop - 1) / (this.TOTAL_STOPS - 1)) * 100)
    );
    return {
      id: dto.id,
      name: dto.name,
      model: dto.model,
      photo: `/images/${dto.id}.png`,
      status: this.normalizeStatus(dto.status),
      currentStop,
      progressPct,
      startedAt: dto.startedAt,
      finishedAt: dto.finishedAt,
    };
  }

  private normalizeStatus(s: DroneDto['status']): DroneStatus {
    switch (s) {
      case DroneStatus.Idle:
      case 'idle':
        return DroneStatus.Idle;
      case DroneStatus.Running:
      case 'running':
        return DroneStatus.Running;
      case DroneStatus.Finished:
      case 'finished':
        return DroneStatus.Finished;
      default:
        return DroneStatus.Idle;
    }
  }

  private updateDrone(id: string, patch: Partial<DroneVM>) {
    this.drones.update((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  private attachStream(id: string): void {
    const es = new EventSource(`${this.base}/drones/${id}/stream`);
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as {
        stop: number;
        finished: boolean;
        startedAt?: number;
        finishedAt?: number;
        etaToNextMs?: number;
      };

      const stop = Math.max(1, Math.min(this.TOTAL_STOPS, data.stop));
      const progressPct = Math.min(100, Math.max(0, ((stop - 1) / (this.TOTAL_STOPS - 1)) * 100));

      this.updateDrone(id, {
        status: data.finished ? DroneStatus.Finished : DroneStatus.Running,
        currentStop: stop,
        startedAt: data.startedAt ?? undefined,
        finishedAt: data.finished ? data.finishedAt : undefined,
        progressPct,
      });

      if (data.finished) {
        es.close();
      }
    };
    es.onerror = () => es.close();
  }
}
