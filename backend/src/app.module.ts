import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'sqlite',
    database: 'database.sqlite',
    autoLoadEntities: true,
    synchronize: true,
  }), EmailModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
