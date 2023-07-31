import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/mysql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { plainToClass, plainToInstance } from 'class-transformer';
import { FoodOrder, Session, SessionStatus, User } from 'src/entities';
import { CreateFoodOrderDTO, FoodDTO, UpdateFoodOrderDTO } from './dtos/index';
import { MenuShopUtil } from 'src/utils/menu-food.util';
import { Loaded, wrap } from '@mikro-orm/core';
import { GroupedBy } from './enums/grouped-by.enum';
import { SummaryFoodOrderDTO } from './dtos/summary-food-order.dto';

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
    foodOrderList: CreateFoodOrderDTO[],
    user: User,
    session: Session,
  ): Promise<void> {
    try {
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
    session: Session,
    foodOrder: UpdateFoodOrderDTO,
  ) {
    try {
      const foodOrderEntity: Loaded<FoodOrder> =
        await this.foodOrderRepository.findOne({
          id,
          session,
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
      if (err.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(
          `This joiner already had order of '${foodOrder.foodName}'. Please increase the quantity of current order!`,
        );
      } else {
        this.logger.error(
          'Calling updateFoodOrder()',
          err,
          FoodOrderService.name,
        );
        throw err;
      }
    }
  }

  async deleteFoodOrder(id: number, session: Session) {
    try {
      const foodOrderCount: number = await this.foodOrderRepository.count({
        id,
        session,
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

  async getAllFoodOrders(sessionId: number): Promise<SummaryFoodOrderDTO[]> {
    try {
      const sessionRef = this.sessionRepository.getReference(sessionId);
      const foodOrders = await this.foodOrderRepository.find(
        {
          session: sessionRef,
        },
        { orderBy: { foodName: 'asc' }, populate: ['user'] },
      );

      return plainToInstance(SummaryFoodOrderDTO, foodOrders, {
        enableCircularCheck: true,
      });
    } catch (err) {
      this.logger.error(
        'Calling getAllFoodOrders()',
        err,
        FoodOrderService.name,
      );
      throw err;
    }
  }

  formatFOGroupedBy(foodOrders: SummaryFoodOrderDTO[], groupedBy: GroupedBy) {
    let formattedFO: Array<any>;
    switch (groupedBy) {
      case GroupedBy.food:
        const foodName = [...new Set(foodOrders.map((fo) => fo.foodName))];

        formattedFO = foodName.reduce((prev, curr) => {
          const foGrouped = foodOrders
            .filter((fo) => fo.foodName === curr)
            .map(({ foodName, ...restProps }) => restProps);
          return [
            ...prev,
            {
              foodName: curr,
              orders: foGrouped,
            },
          ];
        }, []);

        break;
      case GroupedBy.user:
        const userIds = [...new Set(foodOrders.map((fo) => fo.user.googleId))];
        formattedFO = userIds.reduce((prev, curr) => {
          const foGrouped = foodOrders.filter(
            (fo) => fo.user.googleId === curr,
          );

          const currUser = foGrouped[0].user;
          return [
            ...prev,
            {
              user: currUser,
              orders: foGrouped.map(({ user: {}, ...restProps }) => restProps),
            },
          ];
        }, []);
        break;
    }
    return formattedFO;
  }

  async getSummaryFoodOrders(sessionId: number, groupedBy: GroupedBy) {
    try {
      const session = await this.sessionRepository.count({ id: sessionId });

      if (!session) {
        throw new BadRequestException(
          `Can not find session with id: ${sessionId}`,
        );
      }

      const foodOrders = await this.getAllFoodOrders(sessionId);

      if (groupedBy === GroupedBy.none) {
        return foodOrders;
      }

      return this.formatFOGroupedBy(foodOrders, groupedBy);
    } catch (err) {
      this.logger.error(
        'Calling getSummaryFoodOrders()',
        err,
        FoodOrderService.name,
      );
      throw err;
    }
  }
}
