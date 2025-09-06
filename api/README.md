# Drone Racing API

Drone racing simulator built with **NestJS + TypeScript**. Provides:

* List of 4 drones
* Individual drone launch
* **SSE** (Server-Sent Events) for **live** progress of each drone through 10 stops
* Winner calculation after all 4 finish
* (Optional bonus) Simple validation via `x-api-key` and/or HTTPS check

## Requirements

* Node.js 20+
* npm 9+


## Installation & Run

```bash
# 1) Install dependencies
npm install

# 2) Development with reload
npm run start:dev
# Serves at http://localhost:3000 by default
```

## Main Concepts

* **Simulation**: each drone runs through 10 stops (1→10). Total race time is randomly chosen between **10 and 40s**. The service divides this into legs and advances `currentStop` with `setTimeout`.
* **Live Update**: endpoint `GET /drones/:id/stream` uses **SSE** (`text/event-stream`) and sends events `{ stop, finished, startedAt, finishedAt }`.
* **Winner**: `GET /drones/race/winner` returns `{ winnerId }` once **all** drones finish.


## Endpoints

### 1) List drones

`GET /drones`

```json
[
  { "id": "d1", "model": "DJI Mini 4 Pro", "name": "Falcon", "status": "idle", "currentStop": 1 },
  { "id": "d2", "model": "DJI Neo Standard", "name": "Wasp",   "status": "idle", "currentStop": 1 },
  { "id": "d3", "model": "DJI Agra T25", "name": "Hornet", "status": "idle", "currentStop": 1 },
  { "id": "d4", "model": "DJI Inspire 3", "name": "Raven",  "status": "idle", "currentStop": 1 }
]
```

### 2) Launch drone

`POST /drones/:id/launch`

* Starts the simulation if not already running.
* Simple idempotency: calling again won’t restart if already `running`.

### 3) Drone status (debug)

`GET /drones/:id`

* Returns a **snapshot** of the current state.

### 4) Drone stream (SSE)

`GET /drones/:id/stream`

* Returns an **SSE** stream; each event comes as JSON, e.g.:

```json
{"stop":2,"finished":false,"etaToNextMs":1000}
```

* Nest sets headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

### 5) Winner

`GET /drones/race/winner`

* When all 4 finish, returns `{ "winnerId": "d3" }`.
