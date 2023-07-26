import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';
import { CreateSession } from './dto/create_session.dto';
import { UpdateSessionStatus } from './dto/update_session_status.dto';
import { SessionStatus } from '../../constant/constantData';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
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
      console.log('HAS AN ERRO AT getAllSessionsToday()');
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
      console.log('HAS AN ERROR AT getLatestSessionByHostId()');
      throw error;
    }
  }

  async createNewSessionToday(dto: CreateSession) {
    try {
      const newSession = this.sessionRepository.create(dto);

      await this.em.persistAndFlush(newSession);

      return newSession;
    } catch (error) {
      console.log('HAS AN ERROR AT createNewSessionToday()');
      throw error;
    }
  }

  async updateSessionStatus(id: number, dto: UpdateSessionStatus) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      if (!sessionById) {
        return {
          status: 400,
          message: 'Session is not exited !',
        };
      }

      const statusSessionList = [
        'OPEN',
        'LOCKED',
        'PENDING PAYMENTS',
        'FINISHED',
      ];

      if (!statusSessionList.includes(dto.status)) {
        return {
          status: 500,
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

            updateStatusSuccess.message = 'Locked session successfully !';

            return updateStatusSuccess;
          }

          break;

        case SessionStatus.PENDING_PAYMENTS:
          if (sessionById.status === SessionStatus.LOCKED) {
            this.sessionRepository.assign(sessionById, dto);

            await this.em.persistAndFlush(sessionById);

            updateStatusSuccess.message =
              'Pending payments session successfully !';

            return updateStatusSuccess;
          }

          break;

        case SessionStatus.FINISHED:
          if (sessionById.status === SessionStatus.PENDING_PAYMENTS) {
            this.sessionRepository.assign(sessionById, dto);

            await this.em.persistAndFlush(sessionById);

            updateStatusSuccess.message = 'Finished session successfully !';

            return updateStatusSuccess;
          }
      }

      return {
        status: 500,
        message: `Current session status is ${sessionById.status}, you can not change status to ${dto.status}`,
      };
    } catch (error) {
      console.log('HAS AN ERROR AT updateSessionStatus()');
      throw error;
    }
  }

  async deleteSession(id: number) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      if (!sessionById) {
        return {
          statusCode: 400,
          message: 'Session is not exited !',
        };
      }

      if (
        sessionById.status === SessionStatus.OPEN ||
        sessionById.status === SessionStatus.LOCKED
      ) {
        await this.em.removeAndFlush(sessionById);

        return {
          statusCode: 200,
          message: 'Delete session successfully !',
        };
      }

      return {
        statusCode: 500,
        message: `Current status is ${sessionById.status}, you can not delete this session`,
      };
    } catch (error) {
      console.log('HAS AN ERROR AT deleteSession()');
      throw error;
    }
  }
}
