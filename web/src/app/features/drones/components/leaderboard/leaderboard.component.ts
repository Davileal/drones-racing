import { Component, ChangeDetectionStrategy, EventEmitter, Output, input } from '@angular/core';

export type LeaderboardItem = Readonly<{
  id: string;
  name: string;
  stop: number;
  rank: number;
}>;

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-2xl font-semibold">Leaderboard</h3>
        <div class="text-sm text-gray-400">Top finishers</div>
      </div>

      <div class="space-y-4">
        @if (items().length === 0) {
          <div class="py-12 text-center text-base text-gray-400">
            <div class="mb-4">
              <svg class="w-14 h-14 mx-auto text-gray-500/50" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2l3.2 6.5L22 9l-5 4 1.4 7L12 17.8 5.6 20l1.4-7-5-4 6.8-0.5L12 2z" fill="currentColor"/>
              </svg>
            </div>
            No winner yet — be the first!
          </div>
        } @else {
          @let lbTop = items().slice(0, 3);
          @let lbRest = items().slice(3);

          @for (item of lbTop; track item.id) {
            <div
              class="flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ring-1 cursor-pointer hover:bg-white/20 hover:ring-white/25 hover:-translate-y-1"
              [class.bg-white/10]="item.rank === 1"
              [class.ring-yellow-300/30]="item.rank === 1"
              [class.shadow-2xl]="item.rank === 1"
              [class.scale-105]="item.rank === 1"
              [class.bg-white/5]="item.rank !== 1"
              [class.ring-white/10]="item.rank !== 1"
              (click)="select.emit(item.id)"
              (keydown.enter)="select.emit(item.id)"
              tabindex="0"
              role="button"
              [attr.aria-label]="'Rank ' + item.rank + ' — ' + item.name"
            >
              <div class="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                <div class="text-lg font-bold">
                  @if (item.rank === 1) {
                    <svg class="w-7 h-7 text-yellow-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2l3.2 6.5L22 9l-5 4 1.4 7L12 17.8 5.6 20l1.4-7-5-4 6.8-0.5L12 2z" fill="currentColor"/>
                    </svg>
                  } @else if (item.rank === 2) {
                    <svg class="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 3l2.4 4.8L20 9l-4 3.6L17 20l-5-3-5 3 1-7.4L4 9l5.6-1.2L12 3z" fill="currentColor"/>
                    </svg>
                  } @else {
                    <svg class="w-7 h-7 text-amber-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 4l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" fill="currentColor"/>
                    </svg>
                  }
                </div>
              </div>

              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-lg font-semibold text-white">{{ item.name }}</div>
                    <div class="text-sm text-gray-400">Stop {{ item.stop }}</div>
                  </div>
                  <div class="text-sm text-gray-300 font-medium">#{{ item.rank }}</div>
                </div>

                <div class="mt-3 h-3 bg-white/10 rounded overflow-hidden" aria-hidden="true">
                  <div class="h-3 bg-gradient-to-r from-indigo-600 to-emerald-400 transition-all duration-500" [style.width.%]="(item.stop / 10) * 100"></div>
                </div>
              </div>
            </div>
          }

          <div class="divide-y divide-white/10 rounded-md overflow-hidden ring-1 ring-white/10 bg-white/5">
            @for (item of lbRest; track item.id) {
              <div
                class="flex items-center justify-between px-4 py-3 transition-colors duration-200 cursor-pointer hover:bg-white/10"
                (click)="select.emit(item.id)"
                (keydown.enter)="select.emit(item.id)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Rank ' + item.rank + ' — ' + item.name"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center font-medium text-sm text-gray-200">
                    {{ item.rank }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-white">{{ item.name }}</div>
                    <div class="text-xs text-gray-400">Stop {{ item.stop }}</div>
                  </div>
                </div>
                <div class="text-sm text-gray-300">#{{ item.rank }}</div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LeaderboardComponent {
  items = input.required<LeaderboardItem[]>();
  @Output() select = new EventEmitter<string>();
}
