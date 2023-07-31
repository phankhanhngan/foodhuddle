import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import {
  Session,
  SessionPayment,
  User,
  UserPayment,
  UserPaymentStatus,
} from 'src/entities/';
import { AWSService } from '../aws/aws.service';
import { UserPaymentDTO, SessionPaymentDTO } from './dtos';
import { UserPaymentAction } from './enums/user-payment-action.enum';
import { actionToStatusMapper } from './helpers/user-payment.helper';
import { Loaded } from '@mikro-orm/core';
import { addRemainingUserRequestPayment } from './helpers/payment-checklist.helper';

@Injectable()
export class SessionService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    @InjectRepository(SessionPayment)
    private readonly sessionPaymentRepository: EntityRepository<SessionPayment>,
    @InjectRepository(UserPayment)
    private readonly userPaymentRepository: EntityRepository<UserPayment>,
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly awsService: AWSService,
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
      this.logger.error(
        'Calling getAllSessionsToday()',
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

  async _getUserIdsWithoutRequestPayment(): Promise<number[]> {
    try {
      const conn = this.em.getConnection();

      return (
        await conn.execute(
          `(SELECT DISTINCT fo.user_id as id FROM food_order fo) 
         EXCEPT
        (SELECT DISTINCT up.user_id as id FROM user_payment up)`,
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
    userPaymentId: number,
    action: UserPaymentAction,
  ) {
    try {
      const userPayment: Loaded<UserPayment> =
        await this.userPaymentRepository.findOne({
          id: userPaymentId,
        });

      if (!userPayment) {
        throw new BadRequestException(
          `Can not find user payment request with id: ${userPaymentId}`,
        );
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
          this._getUserIdsWithoutRequestPayment(),
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
        await this._getUserIdsWithoutRequestPayment();

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
}
