import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DronesComponent } from './drones.component';
import { DronesService } from './drones.service';
import { DroneVM } from './models/drone.vm';
import { DroneStatus } from './models/drone-status.enum';

describe('DronesComponent (container)', () => {
  let fixture: ComponentFixture<DronesComponent>;
  let component: DronesComponent;

  let mockSvc: Partial<DronesService> & {
    loadList: jasmine.Spy;
    launch: jasmine.Spy;
    launchAll: jasmine.Spy;
    drones: ReturnType<typeof signal> | any;
  };

  beforeEach(waitForAsync(() => {
    mockSvc = {
      drones: signal<DroneVM[]>([]),
      loadList: jasmine.createSpy('loadList').and.callFake(() => {
        (mockSvc.drones as any).set([
          {
            id: 'd1',
            name: 'Falcon',
            model: 'F-1',
            status: 'idle',
            currentStop: 0,
            progressPct: 0,
          },
          {
            id: 'd2',
            name: 'Aurora',
            model: 'A-7',
            status: 'idle',
            currentStop: 0,
            progressPct: 0,
          },
        ]);
      }),
      launch: jasmine.createSpy('launch').and.callFake((id: string) => {
        const list = (mockSvc.drones as any)();
        (mockSvc.drones as any).set(
          list.map((d: DroneVM) => (d.id === id ? { ...d, status: DroneStatus.Running } : d))
        );
      }),
      launchAll: jasmine.createSpy('launchAll').and.callFake(() => {
        const list = (mockSvc.drones as any)();
        (mockSvc.drones as any).set(
          list.map((d: DroneVM) => ({ ...d, status: DroneStatus.Running }))
        );
      }),
    };

    TestBed.configureTestingModule({
      imports: [DronesComponent],
      providers: [{ provide: DronesService, useValue: mockSvc }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DronesComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls loadList on init and populates drones', () => {
    fixture.detectChanges();
    expect(mockSvc.loadList).toHaveBeenCalled();
    expect((mockSvc.drones as any)().length).toBeGreaterThan(0);
  });

  it('openModal / closeModal set selectedDroneId', () => {
    component.openModal('d1');
    expect(component.selectedDroneId()).toBe('d1');
    component.closeModal();
    expect(component.selectedDroneId()).toBeNull();
  });

  it('launch calls service.launch', () => {
    component.launch('d1');
    expect(mockSvc.launch).toHaveBeenCalledWith('d1');
  });

  it('launchAll calls service.launchAll', () => {
    component.launchAll();
    expect(mockSvc.launchAll).toHaveBeenCalled();
  });

  it('leaderboard is empty until drones finish and orders by finishedAt', () => {
    fixture.detectChanges();
    expect(component.leaderboard().length).toBe(0);

    const finished: DroneVM[] = [
      {
        id: 'd1',
        name: 'Falcon',
        status: DroneStatus.Finished,
        model: 'DJI Mini 4 Pro',
        photo: 'images/d1.png',
        currentStop: 10,
        progressPct: 100,
        finishedAt: 2000,
        startedAt: 0,
      },
      {
        id: 'd2',
        name: 'Aurora',
        model: 'DJI Neo Standard',
        photo: 'images/d2.png',
        status: DroneStatus.Finished,
        currentStop: 10,
        progressPct: 100,
        finishedAt: 3000,
        startedAt: 0,
      },
    ];
    (mockSvc.drones as any).set(finished);

    const lb = component.leaderboard();
    expect(lb.length).toBe(2);
    expect(lb[0].id).toBe('d1');
    expect(lb[0].rank).toBe(1);
    expect(lb[1].id).toBe('d2');
    expect(lb[1].rank).toBe(2);
  });

  it('winnerId is set when all drones finish', () => {
    fixture.detectChanges();
    (mockSvc.drones as any).set([
      {
        id: 'd1',
        name: 'Winner',
        status: 'finished',
        currentStop: 10,
        progressPct: 100,
        finishedAt: 1000,
        startedAt: 0,
      },
    ]);
    fixture.detectChanges();
    expect(component.winnerId()).toBe('d1');
  });
});
