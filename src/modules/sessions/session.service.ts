import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository  } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';
import { CreateSession } from './dto/create_session.dto';

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepository: EntityRepository<Session>,
        private readonly em: EntityManager
    ) { }

    async getAllSessionsToday() {

        const today = new Date();
        const currentDate = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        const allSessions = this.sessionRepository.findAll({ fields: ['id', 'title', 'host', 'status', 'created_at'] })

        const listSessionsToday = (await allSessions).filter((v) =>
            (v.created_at.getDate() === currentDate) &&
            ((v.created_at.getMonth() + 1) === currentMonth) &&
            (v.created_at.getFullYear() === currentYear)
        );

        const listSessionsReturn = (await listSessionsToday).map((v) =>{
            return {
                id: v.id,
                title: v.title,
                host: v.host.email,
                status: v.status,
                created_at: v.created_at,
                number_of_joiners: 0
            };
        });

        return listSessionsReturn;
    }

    async getLatestSessionByHostId(hostId: number){
        return this.sessionRepository.findOne({ host_id: hostId }, { orderBy: { id: 'DESC' } });
    }

    async createNewSessionToday(dto: CreateSession) {
        
        try {
            const newSession = this.sessionRepository.create(dto);

            await this.em.persistAndFlush(newSession);

            return newSession;

        } catch (error) {
            console.log("HAS AN ERROR AT createNewSessionToday()");
            throw error;
        }

    }
}