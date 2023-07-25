import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository  } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: EntityRepository<Session>,
        private readonly em: EntityManager
    ) { }

    async getAllSessionsToday(): Promise<Session[]> {

        const today = new Date();
        const currentDate = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const allSessions = this.sessionRepository.findAll({ fields: ['id', 'title', 'host_id', 'status', 'created_at'] })

        const listSessionsToday = (await allSessions).filter((v) =>
            (v.created_at.getDate() === currentDate) &&
            ((v.created_at.getMonth() + 1) === currentMonth) &&
            (v.created_at.getFullYear() === currentYear)
        );

        return listSessionsToday;
    }

}