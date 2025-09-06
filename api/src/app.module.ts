import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { DronesModule } from "./modules/drones/drones.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DronesModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
