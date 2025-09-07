import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { SignInDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@ApiTags("AuthController")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: "Example of authentication just for demonstration purposes (credentials: rafterhome/rafterhome123)",
  })
  @Post("signIn")
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
