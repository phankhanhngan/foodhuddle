import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository, Loaded } from '@mikro-orm/core';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import {
  Session,
  FoodOrder,
  SessionPayment,
  User,
  UserPayment,
  UserPaymentStatus,
} from 'src/entities/';
import { AWSService } from '../aws/aws.service';
import {
  UserPaymentDTO,
  SessionPaymentDTO,
  CreateSession,
  UpdateSessionStatus,
  EditSession,
} from './dtos';
import { UserPaymentAction } from './enums/user-payment-action.enum';
import {
  actionToStatusMapper,
  addRemainingUserRequestPayment,
} from './helpers';
import { SessionStatus } from 'src/entities/session.entity';
import { ShopInfo } from 'src/utils/shop-info.util';

@Injectable()
export class SessionService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: EntityRepository<FoodOrder>,
    @InjectRepository(SessionPayment)
    private readonly sessionPaymentRepository: EntityRepository<SessionPayment>,
    @InjectRepository(UserPayment)
    private readonly userPaymentRepository: EntityRepository<UserPayment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly getShopInfo: ShopInfo,
    private readonly awsService: AWSService,
  ) {}

  async _getNumberOfJoiner(sessionId: number) {
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
      this.logger.error('HAS AN ERRO AT getAllSessionHostedByUserId()');
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

  async getLatestSessionByHostId(hostId: number) {
    try {
      const latestSessionByHostId = this.sessionRepository.findOne(
        { host: hostId },
        { orderBy: { id: 'DESC' } },
      );

      return latestSessionByHostId;
    } catch (error) {
      this.logger.error('HAS AN ERROR AT getLatestSessionByHostId()');
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
      this.logger.error('HAS AN ERRO AT getAllSessionHostedTodayByUserId()');
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

  async updateSessionStatus(
    id: number,
    dto: UpdateSessionStatus,
    hostId: number,
  ) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      if (!sessionById) {
        return {
          status: 400,
          message: `Can not find this session !`,
        };
      }
      const hostIdSession = sessionById.host.id;

      if (hostId !== hostIdSession) {
        return {
          status: 400,
          message: `Only host can change session's status to ${dto.status}`,
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
            const checkSessionPaymentBySessionId =
              await this.sessionPaymentRepository.findOne({ session: id });

            if (checkSessionPaymentBySessionId) {
              this.sessionRepository.assign(sessionById, dto);

              await this.em.persistAndFlush(sessionById);

              updateStatusSuccess.message =
                'Pending payments session successfully!';

              return updateStatusSuccess;
            } else {
              return {
                status: 400,
                message: `You have to submit session payment detail before splitting payment`,
              };
            }
          }

          break;

        case SessionStatus.FINISHED:
          if (sessionById.status === SessionStatus.PENDING_PAYMENTS) {
            const checkUserPaymentApproveAll =
              await this.userPaymentRepository.find({
                session: id,
                status: {
                  $in: [UserPaymentStatus.PENDING, UserPaymentStatus.REJECTED],
                },
              });

            const numberOfJoinersOfSession = await this._getNumberOfJoiner(id);

            const numberOfJoinersRequestPayment =
              await this.userPaymentRepository.count({
                session: id,
              });

            if (
              numberOfJoinersRequestPayment === numberOfJoinersOfSession &&
              !checkUserPaymentApproveAll[0]
            ) {
              this.sessionRepository.assign(sessionById, dto);

              await this.em.persistAndFlush(sessionById);

              updateStatusSuccess.message = 'Finished session successfully!';

              return updateStatusSuccess;
            } else {
              return {
                status: 400,
                message: `There are some user payments which are not approved`,
              };
            }
          }
      }

      return {
        status: 400,
        message: `Current session status is ${sessionById.status}, you can not change status to ${dto.status}`,
      };
    } catch (error) {
      this.logger.error('HAS AN ERROR AT updateSessionStatus()');
      throw error;
    }
  }

  async createNewSessionToday(
    newSessionInfo: CreateSession,
    user: User,
    files: Array<Express.Multer.File> | Express.Multer.File,
  ) {
    try {
      const urlImages: string[] = await this.awsService.bulkPutObject(
        `QRImages`,
        files,
      );

      const qrImagesUrl = JSON.stringify(urlImages);

      const session = plainToClass(Session, newSessionInfo);
      session.host = user;
      session.status = SessionStatus.OPEN;
      session.qr_images = qrImagesUrl;

      const getShopInfo = await this.getShopInfo.getShopInfo(session.shop_link);

      if (getShopInfo.status === 200) {
        session.shop_image = getShopInfo.photo.value;
        session.shop_name = getShopInfo.shopName;
        this.em.persist(session);

        await this.em.flush();

        return {
          status: 200,
          message: 'Create new session successfully !',
          id: session.id,
        };
      } else {
        return {
          status: getShopInfo.status,
          message: getShopInfo.message,
          id: null,
        };
      }
    } catch (error) {
      this.logger.error('HAS AN ERROR AT createNewSessionToday()');
    }
  }
  async getAllSessionsHistory(statusFilter: Array<string>) {
    try {
      const allSessions = await this._getAllSessions();
      const result =
        statusFilter[0] === undefined
          ? allSessions
          : allSessions.filter((v) => {
              if (statusFilter.includes(v.status)) {
                return v;
              }
            });

      return result;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionsHistory()');
      throw error;
    }
  }

  async deleteSession(id: number, hostId: number) {
    try {
      const sessionById = await this.sessionRepository.findOne({ id: id });

      if (sessionById === null) {
        return {
          status: 400,
          message: 'Session does not exist!',
        };
      }

      const hostIdSession = sessionById.host.id;

      if (hostId !== hostIdSession) {
        return {
          status: 400,
          message: `Only host can delete session!`,
        };
      }

      if (
        sessionById.status === SessionStatus.OPEN ||
        sessionById.status === SessionStatus.LOCKED
      ) {
        if (sessionById.qr_images[0] !== undefined) {
          await this.awsService.bulkDeleteObject(
            JSON.parse(sessionById.qr_images),
          );
        }

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
    }
  }

  async editSessionInfo(
    id: number,
    editSessionTransform: EditSession,
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

      const sessionEdit = plainToClass(Session, editSessionTransform);

      if (sessionEdit.shop_link !== sessionById.shop_link) {
        return {
          status: 400,
          message: 'You can not change the shop link !',
        };
      }

      if (sessionById.qr_images[0] !== undefined) {
        await this.awsService.bulkDeleteObject(
          JSON.parse(sessionById.qr_images),
        );
      }

      const urlImages: string[] = await this.awsService.bulkPutObject(
        `session`,
        files,
      );

      const qrImagesUrl = JSON.stringify(urlImages);

      sessionEdit.host = user;
      sessionEdit.qr_images = qrImagesUrl;

      const newSessionInfor = this.em.assign(sessionById, sessionEdit);

      await this.em.flush();

      return {
        status: 200,
        message: 'Edit session information sucessfully !',
        data: newSessionInfor,
      };
    } catch (error) {
      this.logger.error('HAS AN ERROR AT editSessionInfo()');
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

  async getSessionPayment(sessionId: number): Promise<SessionPayment> {
    try {
      const sessionRef: Session =
        this.sessionRepository.getReference(sessionId);

      return await this.sessionPaymentRepository.findOne({
        session: sessionRef,
      });
    } catch (err) {
      this.logger.error(
        'Calling getSessionPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async submitSessionPayment(
    session: Session,
    receiptScreenshot: Array<Express.Multer.File> | Express.Multer.File,
    sessionPayment: SessionPaymentDTO,
  ): Promise<void> {
    try {
      const existedSessionPayment: Loaded<SessionPayment> =
        await this.sessionPaymentRepository.findOne({
          session,
        });

      if (existedSessionPayment) {
        await this.awsService.bulkDeleteObject(
          JSON.parse(existedSessionPayment.receiptScreenshot),
        );
        this.em.remove(existedSessionPayment);
      }

      const filePathArray: string[] = await this.awsService.bulkPutObject(
        `${session.id}/sessionpayment`,
        receiptScreenshot,
      );

      const sessionPaymentEntity = plainToClass(SessionPayment, sessionPayment);
      sessionPaymentEntity.session = session;
      sessionPaymentEntity.receiptScreenshot = JSON.stringify(filePathArray);

      await this.em.persistAndFlush(sessionPaymentEntity);
    } catch (err) {
      this.logger.error(
        'Calling submitSessionPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async submitUserPayment(
    userPayment: UserPaymentDTO,
    session: Session,
    evidence: Array<Express.Multer.File> | Express.Multer.File,
    user: User,
  ) {
    try {
      const conn = this.em.getConnection();

      const joinedUserIds: Array<number> = (
        await conn.execute(
          `SELECT DISTINCT user_id AS id FROM food_order fo WHERE fo.session_id  = ${session.id}`,
        )
      ).map((res) => res.id);

      if (!joinedUserIds.includes(user.id)) {
        throw new BadRequestException(`You didn't have orders in this session`);
      }

      const existedUserPayment: Loaded<UserPayment> =
        await this.userPaymentRepository.findOne({
          session,
          user,
        });

      if (existedUserPayment) {
        await this.awsService.bulkDeleteObject(
          JSON.parse(existedUserPayment.evidence),
        );
        this.em.remove(existedUserPayment);
      }

      const filePathArray: string[] = await this.awsService.bulkPutObject(
        `${session.id}/userpayment/${user.id}`,
        evidence,
      );

      const userPaymentEntity = plainToClass(UserPayment, userPayment);
      userPaymentEntity.session = session;
      userPaymentEntity.user = user;
      userPaymentEntity.evidence = JSON.stringify(filePathArray);

      await this.em.persistAndFlush(userPaymentEntity);
    } catch (err) {
      this.logger.error(
        'Calling submitUserPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async getUserPayment(session: Session, user: User) {
    try {
      return await this.userPaymentRepository.findOne(
        { session, user },
        { populate: ['user'] },
      );
    } catch (err) {
      this.logger.error('Calling getUserPayment()', err, SessionService.name);
      throw err;
    }
  }

  async getAllUserPayments(session: Session): Promise<UserPayment[]> {
    try {
      return await this.userPaymentRepository.find(
        { session },
        { populate: ['user'], orderBy: { status: 'asc' } },
      );
    } catch (err) {
      this.logger.error(
        'Calling getAllUserPayments()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async _getUserIdsWithoutRequestPayment(session: Session): Promise<number[]> {
    try {
      const conn = this.em.getConnection();

      return (
        await conn.execute(
          `SELECT fo_uid.id FROM 
          (SELECT DISTINCT fo.user_id as id FROM food_order fo WHERE fo.session_id = ${session.id}) AS fo_uid
          LEFT JOIN 
          (SELECT DISTINCT up.user_id as id FROM user_payment up WHERE up.session_id = ${session.id}) AS up_uid
          ON fo_uid.id = up_uid.id
          WHERE up_uid.id IS NULL AND fo_uid.id != ${session.host.id}`,
        )
      ).map((userId) => userId.id);
    } catch (err) {
      this.logger.error(
        'Calling _getUsersWithoutPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async changeUserPaymentStatus(
    userId: number,
    session: Session,
    action: UserPaymentAction,
  ) {
    try {
      const userPayment: Loaded<UserPayment> =
        await this.userPaymentRepository.findOne({
          user: userId,
          session,
        });

      if (!userPayment) {
        throw new BadRequestException(`Can not find user payment request`);
      }

      userPayment.status = actionToStatusMapper(action);
      userPayment.updated_at = new Date();
      this.em.persistAndFlush(userPayment);
    } catch (err) {
      this.logger.error(
        'Calling changeUserPaymentStatus()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async approveAllUserPayment(session: Session) {
    try {
      const [userIdsWithoutRequestPayment, existedUserPayment] =
        await Promise.all([
          this._getUserIdsWithoutRequestPayment(session),
          this.userPaymentRepository.find({
            session,
          }),
        ]);

      userIdsWithoutRequestPayment.forEach((id) => {
        const userPayment = this.userPaymentRepository.create({
          status: UserPaymentStatus.APPROVED,
          user: this.userRepository.getReference(id),
          session,
        });
        this.em.persist(userPayment);
      });

      existedUserPayment.forEach((up) => {
        up.status = UserPaymentStatus.APPROVED;
        this.em.persist;
      });

      await this.em.flush();
    } catch (err) {
      this.logger.error(
        'Calling approveAllUserPayment()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async getPaymentChecklist(session: Session) {
    try {
      const existedSessionPayments = plainToInstance(
        UserPaymentDTO,
        await this.getAllUserPayments(session),
        { enableCircularCheck: true },
      );
      const userIdsWithoutRequestPayment =
        await this._getUserIdsWithoutRequestPayment(session);

      if (userIdsWithoutRequestPayment.length > 0) {
        const users: Loaded<User>[] = await this.userRepository.find({
          id: userIdsWithoutRequestPayment,
        });
        const remainingUserRequestPayments =
          addRemainingUserRequestPayment(users);

        return existedSessionPayments.concat(remainingUserRequestPayments);
      }

      return existedSessionPayments;
    } catch (err) {
      this.logger.error(
        'Calling changeUserPaymentStatus()',
        err,
        SessionService.name,
      );
      throw err;
    }
  }

  async getAllSessionHostedHistoryByUserId(
    userId: number,
    statusFilter: Array<string>,
  ) {
    try {
      const sessionHostedByUserId = await this._getAllSessionHostedByUserId(
        userId,
      );

      const result =
        statusFilter[0] === undefined
          ? sessionHostedByUserId
          : sessionHostedByUserId.filter((v) => {
              if (statusFilter.includes(v.status)) {
                return v;
              }
            });

      return result;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionHostedHistoryByUserId()');
      throw error;
    }
  }

  async getAllSessionsJoinedHistoryByUserId(
    userId: number,
    statusFilter: Array<string>,
  ) {
    try {
      const sessionJoinedByUserId = await this._getAllSessionsJoinedByUserId(
        userId,
      );

      const result =
        statusFilter[0] === undefined
          ? sessionJoinedByUserId
          : sessionJoinedByUserId.filter((v) => {
              if (statusFilter.includes(v.status)) {
                return v;
              }
            });

      return result;
    } catch (error) {
      this.logger.error('HAS AN ERRO AT getAllSessionsJoinedHistoryByUserId()');
    }
  }
}
