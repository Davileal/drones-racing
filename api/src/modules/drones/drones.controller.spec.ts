import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { firstValueFrom } from "rxjs";
import { DronesController } from "./drones.controller";
import { Drone, DronesService } from "./drones.service";

describe("DronesController", () => {
  let controller: DronesController;
  let svc: Partial<Record<keyof DronesService, jest.Mock>> & {
    on?: jest.Mock;
  };

  const mockDrone: Drone = {
    id: "d1",
    name: "Falcon",
    model: "DJI Mini 4 Pro",
    status: "idle",
    currentStop: 1,
  };

  beforeEach(async () => {
    svc = {
      getAll: jest.fn().mockReturnValue([mockDrone]),
      getById: jest.fn().mockReturnValue(mockDrone),
      launch: jest.fn().mockReturnValue({ ...mockDrone, status: "running" }),
      on: jest.fn().mockImplementation((_id: string, cb: (p: any) => void) => {
        return () => {};
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DronesController],
      providers: [
        {
          provide: DronesService,
          useValue: svc,
        },
        JwtService,
        ConfigService,
      ],
    }).compile();

    controller = module.get<DronesController>(DronesController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list() should return service list", () => {
    const res = controller.getAll();
    expect(svc.getAll).toHaveBeenCalled();
    expect(res).toEqual([mockDrone]);
  });

  it("get(id) should return a drone", () => {
    const res = controller.getById("d1");
    expect(svc.getById).toHaveBeenCalledWith("d1");
    expect(res).toEqual(mockDrone);
  });

  it("launch(id) should call service.launch and return updated drone", () => {
    const res = controller.launch("d1");
    expect(svc.launch).toHaveBeenCalledWith("d1");
    expect(res).toEqual({ ...mockDrone, status: "running" });
  });

  it("stream(id) should emit initial state", async () => {
    const droneForStream: Drone = {
      ...mockDrone,
      currentStop: 2,
      status: "idle",
      startedAt: undefined,
      finishedAt: undefined,
    };
    (svc.getById as jest.Mock).mockReturnValue(droneForStream);

    const first = await firstValueFrom(controller.stream("d1"));
    expect(first).toHaveProperty("data");
    expect(first.data).toMatchObject({
      stop: droneForStream.currentStop,
      finished: false,
      startedAt: undefined,
      finishedAt: undefined,
    });
    expect(svc.on).toHaveBeenCalledWith("d1", expect.any(Function));
  });

});
