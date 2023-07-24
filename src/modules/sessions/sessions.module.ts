import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';


@Module({
    imports: [MikroOrmModule.forFeature([Session])],
    controllers: [SessionController],
    providers: [SessionService]
})

export class SessionModule {}