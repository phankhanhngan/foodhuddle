import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';
import { SessionStatus } from '../../constant/constantData';
import { CreateSession } from './dtos/create-session.dto';
import { UpdateSessionStatus } from './dtos/update-session_status.dto';
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

  async getLatestSessionByHostId(hostId: number) {
    try {
      const latestSessionByHostId = this.sessionRepository.findOne(
        { host: hostId },
        { orderBy: { id: 'DESC' } },
      );

      return latestSessionByHostId;
    } catch (error) {
      this.logger.error('HAS AN ERROR AT getLatestSessionByHostId()');
      throw error;
    }
  }

  async getSessionById(id: number) {
    try {
      const sessionById = this.sessionRepository.findOne({ id: id });

      return sessionById;
    } catch (error) {
      this.logger.error('HAS AN ERROR AT getSessionById()');
      throw error;
    }
  }

  async createNewSessionToday(dto: CreateSession) {
    try {
      const newSession = this.sessionRepository.create(dto);

      await this.em.persistAndFlush(newSession);

      return newSession;
    } catch (error) {
      this.logger.error('HAS AN ERROR AT createNewSessionToday()');
      throw error;
    }
  }

  async updateSessionStatus(id: number, dto: UpdateSessionStatus) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      const statusSessionList = [
        'OPEN',
        'LOCKED',
        'PENDING PAYMENTS',
        'FINISHED',
      ];

      if (!statusSessionList.includes(dto.status)) {
        return {
          status: 400,
          message: `The status session is invalid !`,
        };
      }

      const updateStatusSuccess = {
        status: 200,
        message: '',
        statusSession: dto.status,
      };

      switch (dto.status) {
        case SessionStatus.LOCKED:
          if (sessionById.status === SessionStatus.OPEN) {
            this.sessionRepository.assign(sessionById, dto);

            await this.em.persistAndFlush(sessionById);

            updateStatusSuccess.message = 'Locked session successfully!';

            return updateStatusSuccess;
          }

          break;

        case SessionStatus.PENDING_PAYMENTS:
          if (sessionById.status === SessionStatus.LOCKED) {
            this.sessionRepository.assign(sessionById, dto);

            await this.em.persistAndFlush(sessionById);

            updateStatusSuccess.message =
              'Pending payments session successfully!';

            return updateStatusSuccess;
          }

          break;

        case SessionStatus.FINISHED:
          if (sessionById.status === SessionStatus.PENDING_PAYMENTS) {
            this.sessionRepository.assign(sessionById, dto);

            await this.em.persistAndFlush(sessionById);

            updateStatusSuccess.message = 'Finished session successfully!';

            return updateStatusSuccess;
          }
      }

      return {
        status: 500,
        message: `Current session status is ${sessionById.status}, you can not change status to ${dto.status}`,
      };
    } catch (error) {
      this.logger.error('HAS AN ERROR AT updateSessionStatus()');
      throw error;
    }
  }

  async deleteSession(id: number) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      if (
        sessionById.status === SessionStatus.OPEN ||
        sessionById.status === SessionStatus.LOCKED
      ) {
        await this.em.removeAndFlush(sessionById);

        return {
          statusCode: 200,
          message: 'Delete session successfully!',
        };
      }

      return {
        statusCode: 400,
        message: `Current status is ${sessionById.status}, you can not delete this session`,
      };
    } catch (error) {
      this.logger.error('HAS AN ERROR AT deleteSession()');
      throw error;
    }
  }
}
