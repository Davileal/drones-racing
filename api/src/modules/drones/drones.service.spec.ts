import { DronesService } from "./drones.service";

describe("DronesService", () => {
  let svc: DronesService;

  beforeEach(() => {
    svc = new DronesService();
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
    (Math.random as jest.MockedFunction<typeof Math.random>).mockRestore();
  });

  it("getAll() should return 4 drones", () => {
    const all = svc.getAll();
    expect(all).toHaveLength(4);
    expect(all.map((d) => d.id).sort()).toEqual(["d1", "d2", "d3", "d4"]);
  });

  it("getById(id) should return a drone by id", () => {
    const d = svc.getById("d1");
    expect(d).toBeDefined();
    expect(d.id).toBe("d1");
    expect(d.status).toBe("idle");
  });

  it("launch(id) should start the drone, emit initial event and finish after time", () => {
    const events: any[] = [];
    svc.on("d1", (p) => events.push(p));

    const d = svc.launch("d1");
    expect(d).toBeDefined();
    expect(d.status).toBe("running");
    expect(d.startedAt).toBeDefined();
    expect(d.totalMs).toBeDefined();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]).toMatchObject({ stop: 1, finished: false });

    const totalMs = d.totalMs ?? 0;
    jest.advanceTimersByTime(totalMs + 2000);
    jest.runOnlyPendingTimers();

    const final = svc.getById("d1");
    expect(final.status).toBe("finished");
    expect(final.finishedAt).toBeDefined();
    expect(events[events.length - 1]).toMatchObject({
      finished: true,
      stop: 10,
    });
  });

  it("launch on already running drone should be no-op", () => {
    const first = svc.launch("d1");
    expect(first.status).toBe("running");
    const second = svc.launch("d1");
    expect(second).toStrictEqual(first);
  });

  it("getWinner() should return winnerId when all finished", () => {
    // mark all drones finished with different durations
    const d1 = svc.getById("d1");
    const d2 = svc.getById("d2");
    const d3 = svc.getById("d3");
    const d4 = svc.getById("d4");

    d1.status = "finished";
    d1.startedAt = 0;
    d1.finishedAt = 5000; // duration 5s

    d2.status = "finished";
    d2.startedAt = 0;
    d2.finishedAt = 3000; // duration 3s -> winner

    d3.status = "finished";
    d3.startedAt = 0;
    d3.finishedAt = 8000;

    d4.status = "finished";
    d4.startedAt = 0;
    d4.finishedAt = 10000;

    const res = svc.getWinner();
    expect(res).toHaveProperty("winnerId", "d2");
  });
});
