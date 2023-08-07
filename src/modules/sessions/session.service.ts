import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { FoodOrder } from 'src/entities';
import { Session, SessionStatus } from 'src/entities/session.entity';
import { CreateSession } from './dtos/create-session.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User } from 'src/entities/user.entity';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ShopImage } from 'src/utils/shop-image.util';
import { AWSService } from '../aws/aws.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: EntityRepository<FoodOrder>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly getShopImage: ShopImage,
    private readonly awsService: AWSService,
  ) {}

  async _getNumberOfJoiner(sessionId: number) {
    try {
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

      const currentHostId = (
        await this.sessionRepository.findOne({
          id: sessionId,
        })
      ).host.id;

      const check = [];
      const listJoinerPerSession = listUserJoinBySession.filter((v) => {
        if (currentHostId !== v.id && !check.includes(v.id)) {
          check.push(v.id);
          return v;
        }
      });

      return listJoinerPerSession.length;
    } catch (error) {
      this.logger.error(
        'Calling _getNumberOfJoiner()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  async _getAllSessions() {
    try {
      const allSessions = await this.sessionRepository.findAll({
        fields: ['id', 'title', 'host', 'shop_image', 'status', 'created_at'],
      });

      const listSessionsReturn = allSessions.map(async (v) => {
        const numberOfJoiner = await this._getNumberOfJoiner(v.id);
        return {
          id: v.id,
          title: v.title,
          host: v.host.email,
          status: v.status,
          shopImage: v.shop_image,
          createdAt: v.created_at,
          numberOfJoiners: numberOfJoiner,
        };
      });

      return Promise.all(listSessionsReturn);
    } catch (error) {
      this.logger.error('Calling getAllSessions()', error, SessionService.name);
      throw error;
    }
  }

  async _getAllSessionHostedByUserId(userId: number) {
    try {
      const sessionHostedByUserId = await this.sessionRepository.find({
        host: userId,
      });

      const sessionHostedByUserIdReturn = sessionHostedByUserId.map(
        async (v) => {
          const numberOfJoiner = await this._getNumberOfJoiner(v.id);
          return {
            id: v.id,
            title: v.title,
            host: v.host.email,
            status: v.status,
            shopImage: v.shop_image,
            numberOfJoiners: numberOfJoiner,
            createdAt: v.created_at,
          };
        },
      );

      return Promise.all(sessionHostedByUserIdReturn);
    } catch (error) {
      this.logger.error(
        'Calling _getAllSessionHostedByUserId()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  async _getAllSessionsJoinedByUserId(userId: number) {
    try {
      const sessionJoinedByUserId = await this.foodOrderRepository.find(
        {
          user: userId,
        },

        { populate: ['session'] },
      );

      const sessionJoinedByUserIdTodayFormated = sessionJoinedByUserId.map(
        async (v) => {
          const numberOfJoiner = await this._getNumberOfJoiner(v.session.id);
          const session = {
            id: v.session.id,
            title: v.session.title,
            host: v.session.host.email,
            status: v.session.status,
            shopImage: v.session.shop_image,
            numberOfJoiners: numberOfJoiner,
            createdAt: v.session.created_at,
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
      this.logger.error(
        'Calling _getAllSessionsJoinedByUserId()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  async getAllSessionsToday() {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const allSessions = await this._getAllSessions();

      const listSessionsToday = allSessions.filter(
        (v) =>
          v.createdAt.getDate() === currentDate &&
          v.createdAt.getMonth() + 1 === currentMonth &&
          v.createdAt.getFullYear() === currentYear,
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
      const sessionHostedByUserId = await this._getAllSessionHostedByUserId(
        userId,
      );

      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const sessionHostedTodayByUserId = sessionHostedByUserId.filter(
        (v) =>
          v.createdAt.getDate() === currentDate &&
          v.createdAt.getMonth() + 1 === currentMonth &&
          v.createdAt.getFullYear() === currentYear,
      );

      return sessionHostedTodayByUserId;
    } catch (error) {
      this.logger.error(
        'Calling getAllSessionHostedTodayByUserId()',
        error,
        SessionService.name,
      );
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
      this.logger.error(
        'Calling getLatestSessionByHostId()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }

  async getAllSessionsJoinedTodayByUserId(userId: number) {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const sessionJoinedByUserId = await this._getAllSessionsJoinedByUserId(
        userId,
      );

      const sessionJoinedByUserIdToday = sessionJoinedByUserId.filter(
        (v) =>
          v.createdAt.getDate() === currentDate &&
          v.createdAt.getMonth() + 1 === currentMonth &&
          v.createdAt.getFullYear() === currentYear,
      );

      return sessionJoinedByUserIdToday;
    } catch (error) {
      this.logger.error(
        'Calling getAllSessionsJoinedTodayByUserId()',
        error,
        SessionService.name,
      );
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

  async createNewSessionToday(
    newSessionInfo: CreateSession,
    user: User,
    files: Array<Express.Multer.File> | Express.Multer.File,
  ) {
    try {
      const urlImages: string[] = await this.awsService.bulkPutObject(
        `session`,
        files,
      );

      const qrImagesUrl = JSON.stringify(urlImages);

      const session = plainToClass(Session, newSessionInfo);
      session.host = user;
      session.status = SessionStatus.OPEN;
      session.qr_images = qrImagesUrl;

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
      this.logger.error(
        'Calling createNewSessionToday()',
        error,
        SessionService.name,
      );
      throw error;
    }
  }
}
