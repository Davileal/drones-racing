import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { DronesService } from '../../drones.service';
import { DroneVM } from '../../models/drone.vm';

@Component({
  selector: 'app-drone-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (drone()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
      (click)="close.emit()"
      (keydown.escape)="close.emit()"
      tabindex="0"
      aria-modal="true"
      role="dialog"
      aria-label="Drone details"
    >
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"></div>
      <div class="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl"></div>

      <div
        class="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur"
        (click)="$event.stopPropagation()"
        role="document"
        aria-live="polite"
      >
        <div class="pointer-events-none absolute inset-0 -z-10 opacity-70 bg-[conic-gradient(at_70%_10%,rgba(99,102,241,0.12),transparent_30%,rgba(20,184,166,0.12),transparent_60%)]"></div>

        <button
          class="absolute top-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-gray-200 ring-1 ring-white/15 transition hover:bg-white/20 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300/30"
          (click)="close.emit()"
          aria-label="Close details"
          title="Close"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        <div class="grid grid-cols-1 gap-8 p-6 pr-6 pl-6 lg:grid-cols-3 lg:p-8">
          <div class="lg:col-span-1 flex flex-col items-center justify-start gap-5">
            <div
              class="relative flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 shadow-xl"
              aria-hidden="true"
            >
              <img
                class="h-full w-full object-cover"
                [src]="drone()!.photo"
                [alt]="drone()!.name + ' photo'"
                decoding="async"
                loading="lazy"
              />
              <div
                class="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-100 ring-1 ring-white/15"
              >
                {{ drone()!.model }}
              </div>
              <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-3">
              <div
                class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ring-1"
                [class.bg-white/10]="drone()!.status === 'idle'"
                [class.text-gray-200]="drone()!.status === 'idle'"
                [class.ring-white/15]="drone()!.status === 'idle'"
                [class.bg-blue-500/10]="drone()!.status === 'running'"
                [class.text-blue-300]="drone()!.status === 'running'"
                [class.ring-blue-400/20]="drone()!.status === 'running'"
                [class.bg-green-500/10]="drone()!.status === 'finished'"
                [class.text-green-300]="drone()!.status === 'finished'"
                [class.ring-green-400/20]="drone()!.status === 'finished'"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  [class.bg-gray-400]="drone()!.status === 'idle'"
                  [class.bg-blue-500]="drone()!.status === 'running'"
                  [class.bg-green-500]="drone()!.status === 'finished'"
                ></span>
                {{ drone()!.status | uppercase }}
              </div>

              <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-gray-200 ring-1 ring-white/15">
                <svg class="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" opacity="0.2" />
                </svg>
                Stop {{ drone()!.currentStop }} / 10
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 space-y-6">
            <div class="flex items-start justify-between gap-6">
              <div class="flex-1">
                <div class="text-xs uppercase tracking-wide text-gray-400">Pilot / Name</div>
                <div class="mt-1 text-3xl font-extrabold tracking-tight text-white">{{ drone()!.name }}</div>

                <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div class="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div class="text-xs text-gray-400">Status</div>
                    <div class="mt-1 text-sm text-gray-200">{{ drone()!.status }}</div>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div class="text-xs text-gray-400">Current stop</div>
                    <div class="mt-1 text-sm text-gray-200">{{ drone()!.currentStop }} / 10</div>
                  </div>
                  <div class="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div class="text-xs text-gray-400">Progress</div>
                    <div class="mt-1 text-sm text-gray-200">{{ drone()!.progressPct | number:'1.0-0' }}%</div>
                  </div>
                </div>

                <!-- progress -->
                <div class="mt-6">
                  <div class="mb-2 text-sm text-gray-400">Race progress</div>
                  <div class="h-4 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      class="h-4 bg-gradient-to-r from-indigo-700 to-teal-400 transition-all duration-500"
                      [style.width.%]="drone()!.progressPct"
                      role="progressbar"
                      [attr.aria-valuenow]="drone()!.progressPct"
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div class="mt-2 text-sm text-gray-300">
                    {{ drone()!.progressPct | number:'1.0-0' }}% — Stop {{ drone()!.currentStop }} / 10
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between border-t border-white/10 pt-4">
              <div class="text-xs text-gray-400">Press <span class="rounded bg-white/10 px-1 py-0.5 text-[10px] text-gray-200 ring-1 ring-white/15">Esc</span> or click outside to close</div>
              <button
                class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-teal-500 px-5 py-2.5 font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-teal-600 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300/30"
                (click)="close.emit()"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class DroneDetailsModalComponent {
  private svc = inject(DronesService);
  private id = signal<string | null>(null);

  readonly drone = computed<DroneVM | null>(() => {
    const id = this.id();
    if (!id) return null;
    return this.svc.drones().find((d) => d.id === id) ?? null;
  });

  @Input()
  set droneId(value: string | null) {
    this.id.set(value ?? null);
  }

  @Output() close = new EventEmitter<void>();
}
