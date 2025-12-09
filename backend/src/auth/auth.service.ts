import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email;

    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existing = await this.authRepository.findOne({
      where: { user: { email }, active: true },
      relations: ['user'],
    });

    if (existing) {
      throw new BadRequestException('This user already solicited a login.');
    }

    let user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const magicToken = crypto.randomBytes(32).toString('hex');
    const auth = this.authRepository.create({
      id: uuidv7(),
      magic_token: magicToken,
      active: true,
      user,
    });

    await this.authRepository.save(auth);

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${frontend}/auth/verify?token=${encodeURIComponent(magicToken)}&id=${auth.id}`;

    const html = `<p>Olá,</p><p>Clique no link abaixo para acessar sua conta:</p><p><a href="${link}">${link}</a></p>`;

    await this.emailService.sendMail(email, 'Seu link de login', html);

    return {
      message: 'Magic link sent to email',
    };
  }

  async verifyToken(id: string, token: string) {
    const auth = await this.authRepository.findOne({
      where: { id, magic_token: token, active: true },
      relations: ['user'],
    });

    if (!auth) {
      throw new BadRequestException('Invalid or expired token');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: auth.user.id,
        email: auth.user.email,
      },
      {
        expiresIn: '15m',
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: auth.user.id,
      },
      {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      },
    );

    auth.active = false;
    await this.authRepository.save(auth);

    try {
      (auth.user as any).refresh_token = refreshToken;
      await this.userRepository.save(auth.user);
    } catch (err) {
      this.logger.error('Failed to save refresh token to user', err);
    }

    return {
      message: 'Login successful',
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, refresh_token: refreshToken },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
        },
        {
          expiresIn: '15m',
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        },
      );

      const newRefreshToken = this.jwtService.sign(
        {
          sub: user.id,
        },
        {
          expiresIn: '7d',
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      user.refresh_token = newRefreshToken;
      await this.userRepository.save(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
