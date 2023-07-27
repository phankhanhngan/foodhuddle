import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { plainToClass } from 'class-transformer';
import { FoodOrder, Session, SessionStatus, User } from 'src/entities';
import { FoodOrderDTO } from './dtos/food-order.dto';

@Injectable()
export class FoodOrderService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: EntityRepository<FoodOrder>,
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
  ) {}

  async changeFoodOrders(
    foodOrderList: FoodOrderDTO[],
    sessionId: number,
    user: User,
  ) {
    try {
      const session = await this.sessionRepository.findOne({ id: sessionId });
      if (!session) {
        throw new BadRequestException(
          `Can not find session with id: ${sessionId}`,
        );
      }

      if (session.status !== SessionStatus.OPEN) {
        throw new BadRequestException(`This session is not OPEN for ordering`);
      }

      const userFoodOrdersBySession = await this.foodOrderRepository.find({
        user: user,
        session: session,
      });

      this.em.remove(userFoodOrdersBySession);

      foodOrderList.forEach((foodOrder) => {
        const fd = plainToClass(FoodOrder, foodOrder);
        fd.user = user;
        fd.session = session;
        fd.actualPrice = fd.originPrice;
        this.em.persist(fd);
      });

      await this.em.flush();
    } catch (err) {
      console.log('HAS AN ERROR AT SERVICE CHANGE FOOD ORDERS ', err);
      throw err;
    }
  }

  async getFoodOrdersByUser(
    user: User,
    sessionId: number,
  ): Promise<FoodOrder[]> {
    try {
      const session = await this.sessionRepository.findOne({ id: sessionId });
      if (!session) {
        throw new BadRequestException(
          `Can not find session with id: ${sessionId}`,
        );
      }
      return await this.foodOrderRepository.find({
        user,
        session,
      });
    } catch (err) {
      console.log('HAS AN ERROR AT SERVICE GET FOOD ORDERS BY USER', err);
      throw err;
    }
  }
}
