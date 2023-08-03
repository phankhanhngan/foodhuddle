import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EntityRepository } from '@mikro-orm/mysql';
import { OAuth2Client } from './google_client/google-client.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('PRIVATE_KEY'),
        signOptions: {
          expiresIn: configService.get<number>('TOKEN_EXPIRE_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
    WinstonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EntityRepository, OAuth2Client],
})
export class AuthModule {}
