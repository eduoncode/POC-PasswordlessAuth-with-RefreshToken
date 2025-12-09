import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UnauthorizedException,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-token/:id/:token')
  async verifyToken(
    @Param('id') id: string,
    @Param('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, accessToken, ...result } =
      await this.authService.verifyToken(id, token);

    res.cookie('jwt.refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { ...result, accessToken };
  }

  @Post('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const rf = req.cookies['jwt.refreshToken'];

    if (!rf) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const { accessToken, refreshToken } =
      await this.authService.refreshTokens(rf);

    res.cookie('jwt.refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken };
  }

  @ApiBearerAuth('Bearer')
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req: any) {
    const userId = req.user.userId;

    return this.authService.getProfile(userId);
  }
}
