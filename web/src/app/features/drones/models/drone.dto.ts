import { DroneStatus } from './drone-status.enum';

export interface DroneDto {
  id: string;
  name: string;
  model: string;
  status: DroneStatus;
  currentStop?: number;
  startedAt?: number;
  finishedAt?: number;
}
