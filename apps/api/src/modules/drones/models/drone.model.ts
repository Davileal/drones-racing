import { DroneStatus } from "./drone-status.enum";

export interface Drone {
  id: string;
  name: string;
  model: string;
  status: DroneStatus;
  currentStop: number; // 1..10
  totalMs?: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface DroneEvent {
  stop: number;
  finished: boolean;
  etaToNextMs?: number;
  startedAt?: number;
  finishedAt?: number;
}
