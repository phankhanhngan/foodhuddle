import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Session, SessionStatus } from 'src/entities/session.entity';
import { CreateSession } from './dtos/create-session.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User } from 'src/entities/user.entity';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ShopImage } from 'src/utils/shop-image.util';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly getShopImage: ShopImage,
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

  async createNewSessionToday(newSession: CreateSession, user: User) {
    try {
      const session = plainToClass(Session, newSession);
      session.host = user;
      session.status = SessionStatus.OPEN;
      const getShopImage = await this.getShopImage.getShopImage(
        session.shop_link,
      );

      if (getShopImage.status === 200) {
        session.shop_image = getShopImage.photo.value;

        this.em.persist(session);

        await this.em.flush();

        return {
          status: 200,
          message: 'Create new session successfully !',
          id: session.id,
        };
      } else {
        return {
          status: getShopImage.status,
          message: getShopImage.message,
          id: null,
        };
      }
    } catch (error) {
      this.logger.error('HAS AN ERROR AT createNewSessionToday()');
      throw error;
    }
  }
}
