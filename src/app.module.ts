import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import MikroOrmConfig from './configs/mikro-orm.config';
import { AppController } from './app.controller';
import { MorganModule, MorganInterceptor } from 'nest-morgan';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { WinstonModule } from 'nest-winston';
import NestWinsternConfig from './configs/nest-winstern.config';

@Module({
  imports: [
    MorganModule,
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'] }),
    MikroOrmModule.forRootAsync({
      useFactory: () => MikroOrmConfig(),
    }),
    WinstonModule.forRootAsync({
      useFactory: () => NestWinsternConfig(),
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MorganInterceptor('combined'),
    },
  ],
})
export class AppModule {}
