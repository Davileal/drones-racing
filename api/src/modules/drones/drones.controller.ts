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
import { Observable } from "rxjs";
import { AuthGuard } from "../../core/guards/auth.guard";
import { DroneEvent, DronesService } from "./drones.service";

@Controller("drones")
export class DronesController {
  constructor(private readonly service: DronesService) {}

  @Get("race/winner")
  @UseGuards(AuthGuard)
  public getWinner() {
    return this.service.getWinner();
  }

  @Get()
  @UseGuards(AuthGuard)
  public getAll() {
    return this.service.getAll();
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  public getById(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @Post(":id/launch")
  @UseGuards(AuthGuard)
  public launch(@Param("id") id: string) {
    return this.service.launch(id);
  }

  @Sse(":id/stream")
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
