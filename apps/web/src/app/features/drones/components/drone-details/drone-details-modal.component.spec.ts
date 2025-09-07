import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DroneDetailsModalComponent } from './drone-details-modal.component';
import { DronesService } from '../../drones.service';
import { DroneVM } from '../../models/drone.vm';
import { DroneStatus } from '../../models/drone-status.enum';

describe('DroneDetailsModalComponent', () => {
  let fixture: ComponentFixture<DroneDetailsModalComponent>;
  let component: DroneDetailsModalComponent;
  let mockSvc: Partial<DronesService> & { drones: ReturnType<typeof signal> };

  const sample: DroneVM = {
    id: 'd1',
    name: 'Falcon X',
    model: 'FX-1',
    photo: '/assets/images/d01.png',
    status: DroneStatus.Running,
    currentStop: 5,
    progressPct: 50,
  };

  beforeEach(waitForAsync(() => {
    mockSvc = {
      drones: signal<DroneVM[]>([]),
    } as any;

    TestBed.configureTestingModule({
      imports: [DroneDetailsModalComponent],
      providers: [{ provide: DronesService, useValue: mockSvc }],
    }).compileComponents();

    fixture = TestBed.createComponent(DroneDetailsModalComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not render dialog when droneId is not set', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(el).toBeNull();
  });

  it('renders drone details when droneId matches a drone in service', () => {
    (mockSvc.drones as any).set([sample]);
    component.droneId = 'd1';
    fixture.detectChanges();

    const host = fixture.nativeElement;
    expect(host.textContent).toContain(sample.name);
    expect(host.textContent).toContain(sample.model);
    expect(host.textContent).toContain(`Stop ${sample.currentStop} / 10`);
    expect(host.textContent).toContain(`${sample.progressPct}%`);
    expect(host.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('updates view reactively when service drone changes', () => {
    (mockSvc.drones as any).set([sample]);
    component.droneId = 'd1';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('50%');

    (mockSvc.drones as any).set([
      { ...sample, progressPct: 78, currentStop: 8, status: 'running' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('78%');
    expect(fixture.nativeElement.textContent).toContain('Stop 8 / 10');
  });

  it('emits close when close button is clicked (top X)', () => {
    (mockSvc.drones as any).set([sample]);
    component.droneId = 'd1';
    fixture.detectChanges();

    spyOn(component.close, 'emit');
    const btn = fixture.nativeElement.querySelector('button[title="Close"]');
    expect(btn).toBeTruthy();
    btn.click();
    expect(component.close.emit).toHaveBeenCalled();
  });
});
