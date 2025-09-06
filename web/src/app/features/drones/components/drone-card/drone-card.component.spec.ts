import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DroneCardComponent, DroneCardVM } from './drone-card.component';

describe('DroneCardComponent', () => {
  let fixture: ComponentFixture<DroneCardComponent>;
  let component: DroneCardComponent;

  const vm: DroneCardVM = {
    id: 'd1',
    name: 'Falcon',
    status: 'idle',
    currentStop: 1,
    progressPct: 0,
    totalStops: 10,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DroneCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DroneCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vm', vm);
    fixture.detectChanges();
  });

  it('renders name and stop/total', () => {
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Falcon');
    expect(html.textContent).toContain('Stop 1 / 10');
  });

  it('emits launch when clicking Launch', () => {
    spyOn(component.launch, 'emit');
    const btn = fixture.debugElement.query(By.css('button'));
    btn.triggerEventHandler('click', {});
    expect(component.launch.emit).toHaveBeenCalledWith('d1');
  });

  it('emits open when clicking the title', () => {
    spyOn(component.open, 'emit');
    const title = fixture.debugElement.query(By.css('h2'));
    title.triggerEventHandler('click', {});
    expect(component.open.emit).toHaveBeenCalledWith('d1');
  });

  it('disables Launch when status is running', () => {
    fixture.componentRef.setInput('vm', { ...vm, status: 'running' });
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(btn.disabled).toBeTrue();
  });
});
