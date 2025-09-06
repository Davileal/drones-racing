import { Component, ChangeDetectionStrategy, EventEmitter, Output, input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';

export type DroneCardVM = Readonly<{
  id: string;
  name: string;
  status: 'idle' | 'running' | 'finished';
  currentStop: number;
  progressPct: number;
  totalStops: number;
}>;

@Component({
  selector: 'app-drone-card',
  standalone: true,
  imports: [NgClass, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur transition-transform duration-300 hover:-translate-y-1"
    >
      <div class="flex items-start justify-between gap-6">
        <div class="flex items-center gap-4">
          <div>
            <h2
              class="text-2xl font-semibold leading-tight cursor-pointer hover:underline"
              (click)="open.emit(vm().id)"
              (keydown.enter)="open.emit(vm().id)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Open details for ' + vm().name"
            >
              {{ vm().name }}
            </h2>
            <p class="text-sm text-gray-400 mt-1">
              Stop {{ vm().currentStop }} / {{ vm().totalStops }}
            </p>
          </div>
        </div>

        <div class="flex flex-col items-end gap-3">
          <span
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ring-1"
            [ngClass]="{
              'bg-white/10 text-gray-200 ring-white/15': vm().status === 'idle',
              'bg-blue-500/10 text-blue-300 ring-blue-400/20': vm().status === 'running',
              'bg-green-500/10 text-green-300 ring-green-400/20': vm().status === 'finished'
            }"
            [attr.aria-live]="vm().status === 'running' ? 'polite' : null"
          >
            {{ vm().status }}
          </span>

          <button
            type="button"
            class="btn btn-lg px-5 py-3 text-sm lg:text-base bg-gradient-to-r from-indigo-600 to-teal-500 text-white rounded-lg transform transition-all duration-300 hover:from-indigo-700 hover:to-teal-600 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-indigo-300/30"
            (click)="launch.emit(vm().id)"
            [disabled]="vm().status === 'running'"
            [class.opacity-60]="vm().status === 'running'"
            [attr.aria-disabled]="vm().status === 'running'"
            [attr.aria-label]="'Launch ' + vm().name"
          >
            Launch
          </button>
        </div>
      </div>

      <div class="mt-6">
        <div class="w-full h-4 bg-white/10 rounded-full overflow-hidden" aria-hidden="true">
          <div
            class="h-4 bg-gradient-to-r from-indigo-700 to-teal-400 transition-all duration-500"
            [style.width.%]="vm().progressPct"
            role="progressbar"
            [attr.aria-valuenow]="vm().progressPct"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>

        <div class="mt-3 flex items-center justify-between text-sm text-gray-300">
          <div>
            Progress:
            <strong class="text-base text-white">{{ vm().progressPct | number : '1.0-0' }}%</strong>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-sm text-gray-400">Stop {{ vm().currentStop }}</div>
            @if (vm().status === 'running') {
            <div class="text-sm text-blue-400 animate-pulse" aria-hidden="true">● running</div>
            }
          </div>
        </div>
      </div>
    </article>
  `,
})
export class DroneCardComponent {
  vm = input.required<DroneCardVM>();
  @Output() launch = new EventEmitter<string>();
  @Output() open = new EventEmitter<string>();
}
