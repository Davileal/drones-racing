import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-status-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6">
      @if (winnerName()) {
      <div
        class="flex items-center gap-4 px-5 py-4 rounded-xl bg-green-500/10 text-green-200 border border-green-400/20 shadow-xl backdrop-blur"
        role="status"
        aria-live="polite"
      >
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2l2.9 6.1L21 9l-5 4.1L17.8 21 12 17.7 6.2 21 7 13.1 2 9l6.1-0.9L12 2z"
            fill="currentColor"
          />
        </svg>
        <div class="text-base">
          Winner:
          <strong class="ml-1 text-lg text-white">{{ winnerName() }}</strong>
        </div>
      </div>
      } @else {
      <div
        class="px-5 py-4 rounded-xl bg-white/5 text-gray-200 border border-white/10 shadow-xl backdrop-blur"
        role="status"
        aria-live="polite"
      >
        Waiting for the race to finish — winner will be revealed soon.
      </div>
      }
    </div>
  `,
})
export class StatusBannerComponent {
  winnerName = input<string | undefined>();
}
