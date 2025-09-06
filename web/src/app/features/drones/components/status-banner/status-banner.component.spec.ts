import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBannerComponent } from './status-banner.component';

describe('StatusBannerComponent', () => {
  let fixture: ComponentFixture<StatusBannerComponent>;
  let component: StatusBannerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBannerComponent);
    component = fixture.componentInstance;
  });

  it('renders "Waiting" when winnerName is undefined', () => {
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Waiting for the race to finish');
  });

  it('renders "Winner: <name>" when winnerName is provided', () => {
    fixture.componentRef.setInput('winnerName', 'Falcon');
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Winner:');
    expect(html.textContent).toContain('Falcon');
  });
});
