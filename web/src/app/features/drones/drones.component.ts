import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DronesService, type DroneVM } from './drones.service';
import { DroneDetailsModalComponent } from './modal/drone-details-modal.component';
import { DroneRaceGameComponent } from './drone-race-game.component';

type LeaderboardItem = Readonly<{
  id: string;
  name: string;
  stop: number;
  finishedAt?: number;
  originalIndex: number;
  rank: number;
}>;

@Component({
  selector: 'app-drones',
  standalone: true,
  imports: [CommonModule, DroneDetailsModalComponent, DroneRaceGameComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drones.component.html',
})
export class DronesComponent implements OnInit {
  private static readonly TOTAL_STOPS = 10;
  private static readonly FINISHED_STATUS = 'finished' as const;
  private readonly service = inject(DronesService);

  private static readonly PALETTE = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-amber-600',
  ] as const;

  readonly colorDots: readonly string[] = DronesComponent.PALETTE;
  readonly markerBg: readonly string[] = DronesComponent.PALETTE;
  readonly stops: number[] = Array.from({ length: DronesComponent.TOTAL_STOPS }, (_, i) => i + 1);
  readonly selectedDroneId = signal<string | null>(null);

  openModal(id: string): void {
    this.selectedDroneId.set(id);
  }
  closeModal(): void {
    this.selectedDroneId.set(null);
  }

  get getDrones() {
    return this.service.drones();
  }

  /**
   * Computes a sorted leaderboard of finished drones.
   *
   * This computed signal filters for drones that have completed the race,
   * sorts them by their finish time (earliest first), and assigns a rank.
   * It uses a stable sort by `originalIndex` if `finishedAt` is not available,
   * ensuring a consistent order for drones that have not finished.
   */
  leaderboard() {
    const list = this.service.drones(); // signal -> leitura reativa

    // finished first, by total time asc
    const finished = list
      .filter((d) => d.status === 'finished' && d.startedAt != null && d.finishedAt != null)
      .sort((a, b) => a.finishedAt! - a.startedAt! - (b.finishedAt! - b.startedAt!));

    // then running/idle, by stop desc; tie-breaker by name
    const inRace = list
      .filter((d) => d.status !== 'finished')
      .sort((a, b) => {
        if (b.currentStop !== a.currentStop) return b.currentStop - a.currentStop;
        return a.name.localeCompare(b.name);
      });

    const ordered = [...finished, ...inRace];

    return ordered.map((d, i) => ({
      id: d.id,
      name: d.name,
      stop: d.currentStop,
      rank: i + 1,
    }));
  }

  readonly allFinished = computed<boolean>(() => {
    const list = this.service.drones();
    if (list.length === 0) return false;

    return list.every(
      (d) =>
        d.status === DronesComponent.FINISHED_STATUS ||
        d.finishedAt != null ||
        (d.currentStop ?? 0) >= DronesComponent.TOTAL_STOPS
    );
  });

  readonly winnerId = computed<string | undefined>(() => {
    const lb = this.leaderboard();
    return this.allFinished() && lb.length > 0 ? lb[0].id : undefined;
  });

  ngOnInit(): void {
    this.service.loadList();
  }

  launch(id: string): void {
    this.service.launch(id);
  }

  launchAll(): void {
    this.service.launchAll();
  }

  reload(): void {
    this.service.loadList();
  }

  // ——— Template utilities ———

  percent(d: DroneVM): string {
    const pct = Math.max(0, Math.min(100, d.progressPct));
    // Keep the small offset you had; expose as calc()
    return `calc(${pct}% - 1rem)`;
  }

  stopPct(stop: number): number {
    return Math.min(100, (stop / DronesComponent.TOTAL_STOPS) * 100);
  }

  displayName(id: string): string {
    const drone = this.service.drones().find((x) => x.id === id);
    return drone?.name ?? id;
  }

  colorFor(d: DroneVM): string {
    const idx = this.service.drones().findIndex((x) => x.id === d.id);
    const safe = idx >= 0 ? idx % this.colorDots.length : 0;
    return this.colorDots[safe] ?? '';
  }

  readonly trackById = (_: number, item: { id: string }) => item.id;
}
