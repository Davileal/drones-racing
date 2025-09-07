import { Injectable, NotFoundException } from "@nestjs/common";

export const NUM_STOPS = 10;
export const MIN_TOTAL_MS = 10_000; // 10s
export const MAX_TOTAL_MS = 40_000; // 40s
export const FIRST_STOP = 1;
export const LAST_STOP = NUM_STOPS;

export type DroneStatus = "idle" | "running" | "finished";

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

type Listener = (payload: DroneEvent) => void;

interface SimulationState {
  timer?: NodeJS.Timeout;
}

@Injectable()
export class DronesService {
  // State in memory (suitable for Take-Home). In production: Persistence/Redis
  private readonly drones = new Map<string, Drone>([
    [
      "d1",
      {
        id: "d1",
        name: "Falcon",
        model: "DJI Mini 4 Pro",
        status: "idle",
        currentStop: FIRST_STOP,
      },
    ],
    [
      "d2",
      {
        id: "d2",
        name: "Wasp",
        model: "DJI Neo Standard",
        status: "idle",
        currentStop: FIRST_STOP,
      },
    ],
    [
      "d3",
      {
        id: "d3",
        name: "Hornet",
        model: "DJI Agras T25",
        status: "idle",
        currentStop: FIRST_STOP,
      },
    ],
    [
      "d4",
      {
        id: "d4",
        name: "Raven",
        model: "DJI Inspire 3",
        status: "idle",
        currentStop: FIRST_STOP,
      },
    ],
  ]);

  // listeners by drone for this
  private readonly listeners = new Map<string, Set<Listener>>([
    ["d1", new Set<Listener>()],
    ["d2", new Set<Listener>()],
    ["d3", new Set<Listener>()],
    ["d4", new Set<Listener>()],
  ]);

  // Timers control by drone (to clean in Edge Cases)
  private readonly sim = new Map<string, SimulationState>([
    ["d1", {}],
    ["d2", {}],
    ["d3", {}],
    ["d4", {}],
  ]);

  public getAll(): ReadonlyArray<Drone> {
    return Array.from(this.drones.values());
  }

  public getById(id: string): Drone {
    const drone = this.drones.get(id);
    if (!drone) throw new NotFoundException(`Drone '${id}' not found`);
    return drone;
  }

  public on(id: string, cb: Listener): () => void {
    const set = this.listeners.get(id);
    if (!set) throw new NotFoundException(`Drone '${id}' not found`);
    set.add(cb);
    return () => set.delete(cb);
  }

  private emit(id: string, payload: DroneEvent): void {
    const set = this.listeners.get(id);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(payload);
      } catch {
        /* não derrubar outros listeners */
      }
    }
  }

  /**
   * Launches the drone simulation. Idempotent: If it's already 'running', you return current snapshot.
   */
  public launch(id: string): Drone {
    const drone = this.getById(id);

    if (drone.status === "running") {
      return drone;
    }

    // security reset if there was already a timer hanging
    this.stopTimer(id);

    drone.status = "running";
    drone.currentStop = FIRST_STOP;
    drone.startedAt = Date.now();
    drone.finishedAt = undefined;

    const totalMs = this.randomInt(MIN_TOTAL_MS, MAX_TOTAL_MS);
    drone.totalMs = totalMs;

    // Distributes time between 9 legs (stops 1 → 10). Here I use normalized random weights
    // to look more “organic” than equal slices.
    const legCount = NUM_STOPS - 1;
    const legs = this.randomLegs(totalMs, legCount);

    // Initial event emission (stop 1)
    this.emit(id, {
      stop: FIRST_STOP,
      finished: false,
      etaToNextMs: legs[0],
      startedAt: drone.startedAt,
    });

    // Recursive loop per race leg
    let nextStop = FIRST_STOP + 1;
    const runLeg = (legIdx: number) => {
      if (nextStop > LAST_STOP) {
        drone.status = "finished";
        drone.finishedAt = Date.now();
        this.emit(id, {
          stop: LAST_STOP,
          finished: true,
          startedAt: drone.startedAt,
          finishedAt: drone.finishedAt,
        });
        this.stopTimer(id);
        return;
      }

      drone.currentStop = nextStop;
      const eta = legIdx + 1 < legs.length ? legs[legIdx + 1] : 0;

      this.emit(id, {
        stop: drone.currentStop,
        finished: false,
        etaToNextMs: eta,
      });

      nextStop++;
      this.scheduleTimer(id, () => runLeg(legIdx + 1), eta);
    };

    // schedule the first race leg
    this.scheduleTimer(id, () => runLeg(0), legs[0]);

    return { ...drone };
  }

  // ---------- Helpers ----------
  private scheduleTimer(id: string, fn: () => void, delayMs: number): void {
    const state = this.sim.get(id)!;
    state.timer = setTimeout(fn, delayMs);
  }

  private stopTimer(id: string): void {
    const state = this.sim.get(id)!;
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = undefined;
    }
  }

  private randomInt(minInclusive: number, maxInclusive: number): number {
    const span = maxInclusive - minInclusive + 1;
    return minInclusive + Math.floor(Math.random() * span);
  }

  private randomLegs(total: number, legs: number): number[] {
    // generates 'legs' random weights and normalizes to add to the total
    const weights = Array.from({ length: legs }, () => Math.random() + 0.2); // +0.2 avoid zero
    const sum = weights.reduce((a, b) => a + b, 0);
    const raw = weights.map((w) => Math.floor((w / sum) * total));

    // Fine adjustment to ensure exact sum to total (due to floors)
    let diff = total - raw.reduce((a, b) => a + b, 0);
    for (let i = 0; diff !== 0 && i < raw.length; i++) {
      raw[i] += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
    return raw;
  }
}
