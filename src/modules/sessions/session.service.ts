import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
  ) {}

  async getAllSessionsToday() {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const allSessions = this.sessionRepository.findAll({
        fields: ['id', 'title', 'host', 'status', 'created_at'],
      });

      const listSessionsToday = (await allSessions).filter(
        (v) =>
          v.created_at.getDate() === currentDate &&
          v.created_at.getMonth() + 1 === currentMonth &&
          v.created_at.getFullYear() === currentYear,
      );

      const listSessionsReturn = listSessionsToday.map((v) => {
        return {
          id: v.id,
          title: v.title,
          host: v.host.email,
          status: v.status,
          created_at: v.created_at,
          number_of_joiners: 0,
        };
      });

      return listSessionsReturn;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionsToday()');
      throw error;
    }
  }
}
