import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';


@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: EntityRepository<Session>,
        private readonly em: EntityManager
    ) { }

    async getAllSessionsToday(): Promise<Session[]> {
        return this.sessionRepository.findAll();
    }

    async getSessionsByUserID(id: number): Promise<Session[]> {
        return this.sessionRepository.find({hostId: id});
    }
}