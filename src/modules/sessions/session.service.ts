import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, wrap } from '@mikro-orm/core';
import { Session } from 'src/entities/session.entity';
import { FoodOrder } from 'src/entities';
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
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: EntityRepository<FoodOrder>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
  ) {}

  async getNumberOfJoiner(sessionId: number) {
    const sessionsBySessionId = await this.foodOrderRepository.find(
      {
        session: sessionId,
      },

      { populate: ['session'] },
    );

    const listUserJoinBySession = sessionsBySessionId.map((v) => {
      const user = {
        id: v.user.id,
      };
      return user;
    });

    const check = [];
    const listJoinerPerSession = listUserJoinBySession.filter((v) => {
      if (!check.includes(v.id)) {
        check.push(v.id);
        return v;
      }
    });

    return listJoinerPerSession.length;
  }

  async getAllSessions() {
    try {
      const allSessions = await this.sessionRepository.findAll({
        fields: ['id', 'title', 'host', 'status', 'created_at'],
      });

      const listSessionsReturn = allSessions.map(async (v) => {
        const numberOfJoiner = await this.getNumberOfJoiner(v.id);
        return {
          id: v.id,
          title: v.title,
          host: v.host.email,
          status: v.status,
          number_of_joiners: numberOfJoiner,
          created_at: v.created_at,
        };
      });

      return Promise.all(listSessionsReturn);
    } catch (error) {
      this.logger.error('Calling getAllSessions()', error, SessionService.name);
      throw error;
    }
  }

  async getAllSessionHostedByUserId(userId: number) {
    try {
      const sessionHostedByUserId = await this.sessionRepository.find({
        host: userId,
      });

      const sessionHostedByUserIdReturn = sessionHostedByUserId.map(
        async (v) => {
          const numberOfJoiner = await this.getNumberOfJoiner(v.id);
          return {
            id: v.id,
            title: v.title,
            host: v.host.email,
            status: v.status,
            number_of_joiners: numberOfJoiner,
            created_at: v.created_at,
          };
        },
      );

      return Promise.all(sessionHostedByUserIdReturn);
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionHostedByUserId()');
      throw error;
    }
  }

  async getAllSessionsJoinedByUserId(userId: number) {
    try {
      const sessionJoinedByUserId = await this.foodOrderRepository.find(
        {
          user: userId,
        },

        { populate: ['session'] },
      );

      const sessionJoinedByUserIdTodayFormated = sessionJoinedByUserId.map(
        async (v) => {
          const numberOfJoiner = await this.getNumberOfJoiner(v.session.id);
          const session = {
            id: v.session.id,
            title: v.session.title,
            host: v.session.host.email,
            status: v.session.status,
            number_of_joiners: numberOfJoiner,
            created_at: v.session.created_at,
          };
          return session;
        },
      );

      const check = [];
      const result = (
        await Promise.all(sessionJoinedByUserIdTodayFormated)
      ).filter((v) => {
        if (!check.includes(v.id)) {
          check.push(v.id);
          return v;
        }
      });

      return result;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionsJoinedByUserId()');
      throw error;
    }
  }

  async getAllSessionsToday() {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const allSessions = await this.getAllSessions();

      const listSessionsToday = allSessions.filter(
        (v) =>
          v.created_at.getDate() === currentDate &&
          v.created_at.getMonth() + 1 === currentMonth &&
          v.created_at.getFullYear() === currentYear,
      );

      return listSessionsToday;
    } catch (error) {
      this.logger.error(
        'Calling getAllSessionsToday()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  async getAllSessionHostedTodayByUserId(userId: number) {
    try {
      const sessionHostedByUserId = await this.getAllSessionHostedByUserId(
        userId,
      );

      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const sessionHostedTodayByUserId = sessionHostedByUserId.filter(
        (v) =>
          v.created_at.getDate() === currentDate &&
          v.created_at.getMonth() + 1 === currentMonth &&
          v.created_at.getFullYear() === currentYear,
      );

      return sessionHostedTodayByUserId;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionHostedTodayByUserId()');
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

  async getAllSessionsJoinedTodayByUserId(userId: number) {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const sessionJoinedByUserId = await this.getAllSessionsJoinedByUserId(
        userId,
      );

      const sessionJoinedByUserIdToday = sessionJoinedByUserId.filter(
        (v) =>
          v.created_at.getDate() === currentDate &&
          v.created_at.getMonth() + 1 === currentMonth &&
          v.created_at.getFullYear() === currentYear,
      );

      return sessionJoinedByUserIdToday;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionsJoinedTodayByUserId()');
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

  async getSession(id: number) {
    try {
      const session = await this.sessionRepository.findOne(
        { id },
        { populate: ['host'] },
      );

      if (!session) {
        throw new BadRequestException(`Can not find session with id: ${id}`);
      }

      return session;
    } catch (err) {
      this.logger.error('Calling getSession()', err, SessionService.name);
      throw err;
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
