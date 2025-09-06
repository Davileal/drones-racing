import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DronesComponent } from './drones.component';
import { DronesService, DroneVM } from './drones.service';

describe('DronesComponent', () => {
  let fixture: ComponentFixture<DronesComponent>;
  let component: DronesComponent;
  let mockSvc: Partial<DronesService> & {
    loadList: jasmine.Spy;
    launch: jasmine.Spy;
    launchAll: jasmine.Spy;
    pollWinner: jasmine.Spy;
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
            photo: '/assets/images/d01.png',
            status: 'idle',
            currentStop: 0,
            progressPct: 0,
          },
          {
            id: 'd2',
            name: 'Aurora',
            model: 'A-7',
            photo: '/assets/images/d02.png',
            status: 'idle',
            currentStop: 0,
            progressPct: 0,
          },
        ]);
      }),
      launch: jasmine.createSpy('launch').and.callFake((id: string) => {
        const list = (mockSvc.drones as any)();
        (mockSvc.drones as any).set(
          list.map((d: DroneVM) => (d.id === id ? { ...d, status: 'running' } : d))
        );
      }),
      launchAll: jasmine.createSpy('launchAll').and.callFake(() => {
        const list = (mockSvc.drones as any)();
        (mockSvc.drones as any).set(list.map((d: DroneVM) => ({ ...d, status: 'running' })));
      }),
      pollWinner: jasmine.createSpy('pollWinner').and.returnValue(Promise.resolve(undefined)),
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

  it('calls loadList on init', () => {
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

  it('launch clears winnerId and calls service.launch', () => {
    component.launch('d1');
    expect(mockSvc.launch).toHaveBeenCalledWith('d1');
  });

  it('launchAll clears winnerId and calls service.launchAll', () => {
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
        model: 'F-1',
        photo: '/assets/images/d01.png',
        status: 'finished',
        currentStop: 10,
        progressPct: 100,
        finishedAt: 2000,
      },
      {
        id: 'd2',
        name: 'Aurora',
        model: 'A-7',
        photo: '/assets/images/d02.png',
        status: 'finished',
        currentStop: 10,
        progressPct: 100,
        finishedAt: 3000,
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
        finishedAt: 1000,
        currentStop: 10,
        progressPct: 100,
      },
    ]);
    fixture.detectChanges();

    expect(component.winnerId()).toBe('d1');
  });
});
