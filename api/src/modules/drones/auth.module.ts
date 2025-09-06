import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "src/core/guards/auth.guard";
import { AuthController } from "../auth/auth.controller";

@Module({
  controllers: [AuthController],
  imports: [
    JwtModule.register({
      secret: "rafter-home-secret",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  providers: [AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
