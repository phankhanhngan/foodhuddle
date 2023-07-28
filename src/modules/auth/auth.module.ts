import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EntityRepository } from '@mikro-orm/mysql';
import { OAuth2Client } from './google_client/google-client.config';
import { WinstonModule } from 'nest-winston';

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
