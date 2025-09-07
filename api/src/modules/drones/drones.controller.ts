import {
  Controller,
  Get,
  MessageEvent,
  NotFoundException,
  Param,
  Post,
  Sse,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Observable } from "rxjs";
import { AuthGuard } from "../../core/guards/auth.guard";
import { DronesService } from "./drones.service";
import { DroneEvent } from "./models/drone.model";

@ApiTags("DronesController")
@Controller("drones")
export class DronesController {
  constructor(private readonly service: DronesService) {}

  @Get()
  @ApiOperation({
    summary: "Get all drones available for launch",
  })
  @UseGuards(AuthGuard)
  public getAll() {
    return this.service.getAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a specific drone by ID",
  })
  @UseGuards(AuthGuard)
  public getById(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Post(":id/launch")
  @ApiOperation({
    summary: "Launch a specific drone by ID",
    description:
      "Starts the race simulation for a specific drone. This endpoint is idempotent: if the drone is already running, it will not be restarted and the current state will be returned.",
  })
  @UseGuards(AuthGuard)
  public launch(@Param("id") id: string) {
    return this.service.launch(id);
  }

  @Sse(":id/stream")
  @ApiOperation({
    summary: "Stream drone race progress via SSE",
    description:
      "Subscribes to the progress of a specific drone race using Server-Sent Events (SSE). This endpoint provides a real-time stream of `DroneEvent` objects. The first event sent is the drone's current state, followed by live updates as the drone advances through the race stops.",
  })
  public stream(@Param("id") id: string): Observable<MessageEvent> {
    try {
      this.service.getById(id);
    } catch {
      throw new NotFoundException(`Drone '${id}' not found`);
    }

    return new Observable<MessageEvent>((subscriber) => {
      const off = this.service.on(id, (payload: DroneEvent) =>
        subscriber.next({ data: payload })
      );

      const drone = this.service.getById(id);
      subscriber.next({
        data: {
          stop: drone.currentStop,
          finished: drone.status === "finished",
          startedAt: drone.startedAt,
          finishedAt: drone.finishedAt,
        } satisfies DroneEvent,
      });

      return () => off();
    });
  }
}
