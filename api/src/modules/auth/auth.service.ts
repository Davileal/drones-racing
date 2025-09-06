import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signIn(
    username: string,
    pass: string
  ): Promise<{ access_token: string }> {
    if (username !== "rafterhome" || pass !== "rafterhome123") { // For demo purposes only
      throw new UnauthorizedException();
    }
    const payload = { sub: username, username: username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
