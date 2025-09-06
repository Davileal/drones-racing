import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaderboardComponent, LeaderboardItem } from './leaderboard.component';
import { By } from '@angular/platform-browser';

describe('LeaderboardComponent', () => {
  let fixture: ComponentFixture<LeaderboardComponent>;
  let component: LeaderboardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaderboardComponent);
    component = fixture.componentInstance;
  });

  it('shows empty state when items is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('No winner yet — be the first!');
  });

  it('renders items and emits select on click', () => {
    const items: LeaderboardItem[] = [
      { id: 'd1', name: 'Falcon', stop: 10, rank: 1 },
      { id: 'd2', name: 'Aurora', stop: 9, rank: 2 },
      { id: 'd3', name: 'Hornet', stop: 8, rank: 3 },
      { id: 'd4', name: 'Raven', stop: 7, rank: 4 },
    ];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Falcon');
    expect(html.textContent).toContain('#1');

    spyOn(component.select, 'emit');
    const clickable = fixture.debugElement.query(By.css('[role="button"]'));
    clickable.triggerEventHandler('click', {});
    expect(component.select.emit).toHaveBeenCalledWith('d1');
  });
});
