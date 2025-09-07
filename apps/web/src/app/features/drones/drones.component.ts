import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DroneCardComponent } from './components/drone-card/drone-card.component';
import { DroneDetailsModalComponent } from './components/drone-details/drone-details-modal.component';
import {
  LeaderboardComponent,
  type LeaderboardItem,
} from './components/leaderboard/leaderboard.component';
import { StatusBannerComponent } from './components/status-banner/status-banner.component';
import { DronesService } from './drones.service';
import { DroneStatus } from './models/drone-status.enum';

@Component({
  selector: 'app-drones',
  standalone: true,
  imports: [
    CommonModule,
    DroneDetailsModalComponent,
    StatusBannerComponent,
    DroneCardComponent,
    LeaderboardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drones.component.html',
})
export class DronesComponent implements OnInit {
  private static readonly TOTAL_STOPS = 10;
  private readonly service = inject(DronesService);

  readonly DroneStatus = DroneStatus;
  readonly stops: number[] = Array.from({ length: DronesComponent.TOTAL_STOPS }, (_, i) => i + 1);
  readonly selectedDroneId = signal<string | null>(null);

  readonly leaderboard = computed<LeaderboardItem[]>(() => {
    const drones = this.service.drones();

    const finished = drones
      .filter(
        (d) => d.status === DroneStatus.Finished && d.startedAt != null && d.finishedAt != null
      )
      .sort((a, b) => a.finishedAt! - a.startedAt! - (b.finishedAt! - b.startedAt!));

    return finished.map((d, i) => ({
      id: d.id,
      name: d.name,
      stop: d.currentStop,
      rank: i + 1,
    }));
  });

  readonly allFinished = computed<boolean>(() => {
    const list = this.service.drones();
    return (
      list.length > 0 &&
      list.every(
        (d) =>
          d.status === DroneStatus.Finished || (d.currentStop ?? 0) >= DronesComponent.TOTAL_STOPS
      )
    );
  });

  readonly winnerId = computed<string | undefined>(() => {
    const lb = this.leaderboard();
    return this.allFinished() && lb.length > 0 ? lb[0].id : undefined;
  });

  ngOnInit(): void {
    this.service.loadList();
  }

  openModal(id: string): void {
    this.selectedDroneId.set(id);
  }

  closeModal(): void {
    this.selectedDroneId.set(null);
  }

  get getDrones() {
    return this.service.drones();
  }

  launch(id: string): void {
    this.service.launch(id);
  }

  launchAll(): void {
    this.service.launchAll();
  }

  displayName(id: string): string {
    const drone = this.service.drones().find((item) => item.id === id);
    return drone?.name ?? id;
  }
}
