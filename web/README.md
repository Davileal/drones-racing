# Drone Racing Web

A small Angular application that shows a live drone race (10 stops), lets you launch individual drones or all at once, and displays a realtime leaderboard. This repository is a take‑home test — instructions below show how to set up, run and test the project.

## Key features
- Standalone Angular components and Signals-based state
- Realtime UI updates (service updates drive UI and modal)
- Leaderboard that lists finishers in order (first finisher = winner)
- Accessible modal with live drone details and optimized image loading
- Gamified UI with emphasis on top positions

## Prerequisites
- Node.js 22+ (LTS recommended)
- npm 11+ or yarn
- Angular CLI (global optional): `npm install -g @angular/cli`

## Quick setup

1. Clone repository
   ```bash
   git clone <repo-url>
   cd drone-race-web
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   # yarn install
   ```

3. Start development server
   ```bash
   ng serve
   ```
   Open http://localhost:4200

## Available scripts
- `ng serve` — start dev server
- `ng build` — production build (artifacts in `dist/`)
- `ng test` — run unit tests (Karma + Jasmine by default)
- `ng lint` — run linter (if configured)

Run via npm:
```bash
npm run ng -- serve
# or simply
ng serve
```

## Running tests
Unit tests for components are under `src/app/.../*.spec.ts`. To run tests:
```bash
ng test
```
The test suite includes component tests for the Drones page and the modal and uses a lightweight service mock that exposes signals (so computed state updates during tests).

## Configuration / Environment
- API base is read from `environment` (e.g. `src/environments/environment.ts`).

## Implementation notes / best practices used
- Components use Signals and computed for derived state.
- Modal is componentized and derives the drone from the service using a computed — this guarantees realtime updates while the modal is open.
- When a new launch or "Launch All" is triggered, the current `winner` is cleared to allow a fresh race.
- Leaderboard starts empty and only shows finished drones ordered by finish time.
- Change detection uses OnPush where appropriate.

## Testing checklist for reviewer
- Launch app (`ng serve`) and verify drones list renders.
- Click "Launch" / "Launch All" — ensure winner is cleared and drones move to `running`.
- Open a drone modal — confirm progress updates live as drone state changes.
- Let a drone finish — confirm leaderboard shows the finished drone and the first finisher is displayed as winner.
