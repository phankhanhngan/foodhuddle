import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass } from 'class-transformer';
import { FoodOrder, Session, SessionStatus, User } from 'src/entities';
import { FoodDTO, FoodOrderDTO, UpdateFoodOrderDTO } from './dtos/index';
import { MenuShopUtil } from 'src/utils/menu-food.util';
import { Loaded, wrap } from '@mikro-orm/core';

@Injectable()
export class FoodOrderService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(FoodOrder)
    private readonly foodOrderRepository: EntityRepository<FoodOrder>,
    @InjectRepository(Session)
    private readonly sessionRepository: EntityRepository<Session>,
    private readonly foodMenuUtil: MenuShopUtil,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async changeFoodOrders(
    foodOrderList: FoodOrderDTO[],
    sessionId: number,
    user: User,
  ): Promise<void> {
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
      this.logger.error(
        'Calling changeFoodOrders()',
        err,
        FoodOrderService.name,
      );
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
      this.logger.error(
        'Calling getFoodOrdersByUser()',
        err,
        FoodOrderService.name,
      );
      throw err;
    }
  }

  async getFoodMenu(sessionId: number): Promise<FoodDTO[]> {
    try {
      const shopLink: Loaded<Session, 'shop_link'> =
        await this.sessionRepository.findOne(
          { id: sessionId },
          { fields: ['shop_link'] },
        );

      const foodMenu = await this.foodMenuUtil.getMenuFood(shopLink.shop_link);
      return foodMenu;
    } catch (err) {
      this.logger.error('Calling getFoodMenu()', err, FoodOrderService.name);
      throw err;
    }
  }

  async updateFoodOrder(
    id: number,
    sessionId: number,
    foodOrder: UpdateFoodOrderDTO,
  ) {
    try {
      const foodOrderEntity: Loaded<FoodOrder> =
        await this.foodOrderRepository.findOne({
          id,
          session: this.sessionRepository.getReference(sessionId),
        });
      if (!foodOrderEntity) {
        throw new BadRequestException(`Can not find food order with id: ${id}`);
      }
      wrap(foodOrderEntity).assign(
        {
          ...foodOrder,
          options: JSON.stringify(foodOrder.options),
        },
        { updateByPrimaryKey: false },
      );

      await this.em.persistAndFlush(foodOrderEntity);
    } catch (err) {
      this.logger.error(
        'Calling updateFoodOrder()',
        err,
        FoodOrderService.name,
      );
      throw err;
    }
  }

  async deleteFoodOrder(id: number, sessionId: number) {
    try {
      const foodOrderCount: number = await this.foodOrderRepository.count({
        id,
        session: this.sessionRepository.getReference(sessionId),
      });
      if (!foodOrderCount) {
        throw new BadRequestException(`Can not find food order with id: ${id}`);
      }

      await this.em.removeAndFlush(this.foodOrderRepository.getReference(id));
    } catch (err) {
      this.logger.error(
        'Calling deleteFoodOrder()',
        err,
        FoodOrderService.name,
      );
      throw err;
    }
  }
}
