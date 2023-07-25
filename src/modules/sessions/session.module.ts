import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Session } from 'src/entities/session.entity';
import { SessionService } from './session.service';
import { AwsService } from '../aws/aws.service';

@Module({
    imports: [MikroOrmModule.forFeature([Session])],
    controllers: [SessionController],
    providers: [SessionService, AwsService]
})

export class SessionModule {}