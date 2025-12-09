import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './entities/auth.entity';
import { Repository } from 'typeorm';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/user/entities/user.entity';
import { v7 as uuidv7 } from 'uuid';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly emailService: EmailService,
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
}
