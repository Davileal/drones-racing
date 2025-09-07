import { DroneStatus } from './drone-status.enum';

export interface DroneVM {
  id: string;
  name: string;
  model: string;
  photo: string;
  status: DroneStatus;
  currentStop: number; // 1..10
  progressPct: number; // 0..100
  startedAt?: number;
  finishedAt?: number;
}
