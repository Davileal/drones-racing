import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type DroneStatus = 'idle' | 'running' | 'finished';
export interface DroneVM {
  id: string;
  name: string;
  model: string;
  photo: string;
  status: 'idle' | 'running' | 'finished';
  currentStop: number;
  progressPct: number;
  startedAt?: number;
  finishedAt?: number;
}

@Injectable({ providedIn: 'root' })
export class DronesService {
  private base = environment.API_BASE;
  drones = signal<DroneVM[]>([]);

  constructor(private http: HttpClient) {}

  loadList() {
    this.http.get<any[]>(`${this.base}/drones`).subscribe((list) => {
      const mapped: DroneVM[] = list.map((d) => ({
        id: d.id,
        name: d.name,
        photo: `/images/${d.id}.png`,
        model: d.model,
        status: d.status,
        currentStop: d.currentStop ?? 1,
        progressPct: Math.min(100, (((d.currentStop ?? 1) - 1) / 9) * 100),
        startedAt: d.startedAt,
        finishedAt: d.finishedAt,
      }));
      this.drones.set(mapped);
    });
  }

  launch(id: string) {
    this.http.post(`${this.base}/drones/${id}/launch`, {}).subscribe(() => {
      this.attachStream(id);
    });
  }

  launchAll() {
    this.drones().forEach((d) => this.launch(d.id));
  }

  private updateDrone(id: string, patch: Partial<DroneVM>) {
    this.drones.update((list) => list.map((d) => (d.id !== id ? d : { ...d, ...patch })));
  }

  attachStream(id: string) {
    const es = new EventSource(`${this.base}/drones/${id}/stream`);
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      const progress = Math.min(100, ((data.stop - 1) / 9) * 100);
      this.updateDrone(id, {
        status: data.finished ? 'finished' : 'running',
        currentStop: data.stop,
        startedAt: data.startedAt ?? undefined,
        finishedAt: data.finished ? data.finishedAt : undefined,
        progressPct: progress,
      });
    };
    es.onerror = () => es.close();
  }

  async pollWinner(): Promise<string | undefined> {
    const r: any = await fetch(`${this.base}/drones/race/winner`).then((r) => r.json());
    return r.winnerId;
  }
}
