import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { Session, SessionStatus } from 'src/entities/session.entity';
import { CreateSession } from './dtos/create-session.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { User } from 'src/entities/user.entity';
import { plainToClass, plainToInstance } from 'class-transformer';
import { EditSession } from './dtos/edit-session.dto';
import { ShopImage } from 'src/utils/shop-image.util';
import { AWSService } from '../aws/aws.service';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly em: EntityManager,
    private readonly getShopImage: ShopImage,
    private readonly awsService: AWSService,
  ) {}

  async getAllSessionsToday() {
    try {
      const today = new Date();
      const currentDate = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();

      const allSessions = this.sessionRepository.findAll({
        fields: ['id', 'title', 'host', 'shop_image', 'status', 'created_at'],
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
          shopImage: v.shop_image,
          createdAt: v.created_at,
          numberOfJoiners: 0,
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

  async createNewSessionToday(
    newSession: CreateSession,
    user: User,
    files: Array<Express.Multer.File> | Express.Multer.File,
  ) {
    try {
      const urlImages: string[] = await this.awsService.bulkPutObject(
        `session`,
        files,
      );

      const qrImagesUrl = JSON.stringify(urlImages);

      const session = plainToClass(Session, newSession);
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
      this.logger.error('HAS AN ERROR AT createNewSessionToday()');
      throw error;
    }
  }

  async editSessionInfo(
    id: number,
    editSessionInfo: EditSession,
    user: User,
    files: Array<Express.Multer.File> | Express.Multer.File,
  ) {
    try {
      const sessionById = await this.sessionRepository.findOne(
        { id: id },
        { populate: ['host'] },
      );

      if (!sessionById) {
        return {
          status: 400,
          message: 'The session does not exist !',
        };
      }

      if (user.id !== sessionById.host.id) {
        return {
          status: 400,
          message: 'Only host can edit session information !',
        };
      }

      const sessionEdit = plainToClass(Session, editSessionInfo);

      if (sessionEdit.shop_link !== sessionById.shop_link) {
        return {
          status: 400,
          message: 'You can not change the shop link !',
        };
      }

      await this.awsService.bulkDeleteObject(JSON.parse(sessionById.qr_images));

      const urlImages: string[] = await this.awsService.bulkPutObject(
        `session`,
        files,
      );

      const qrImagesUrl = JSON.stringify(urlImages);

      sessionEdit.host = user;
      sessionById.qr_images = JSON.parse(qrImagesUrl);

      const newSessionInfor = this.em.assign(sessionById, sessionEdit);

      await this.em.flush();

      return {
        status: 200,
        message: 'Edit session information sucessfully !',
        data: {
          id: newSessionInfor.id,
          created_at: newSessionInfor.created_at,
          updated_at: newSessionInfor.updated_at,
          host: newSessionInfor.host,
          title: newSessionInfor.title,
          description: newSessionInfor.description,
          shopLink: newSessionInfor.shop_link,
          hostPaymentInfo: newSessionInfor.host_payment_info,
          qrImages: newSessionInfor.qr_images,
          shopImage: newSessionInfor.shop_image,
          status: newSessionInfor.status,
        },
      };
    } catch (error) {
      this.logger.error('HAS AN ERROR AT editSessionInfo()');
      throw error;
    }
  }
}
