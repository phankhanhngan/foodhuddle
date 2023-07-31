import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';
import { FoodOrderDTO } from '../dtos/food-order.dto';
import { FoodOrder } from 'src/entities';

@Injectable()
export class ResponseFoodTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((foodOrderList: FoodOrder[]) => {
        const { sessionId } = context.switchToHttp().getRequest().query;
        const formattedFoodOrderList = foodOrderList.map((foodOrder) => {
          foodOrder.options = JSON.parse(foodOrder?.options);
          return plainToInstance(FoodOrderDTO, foodOrder, {
            enableCircularCheck: true,
          });
        });

        return {
          status: 'success',
          message: 'Get food orders successfully',
          data: {
            sessionId,
            foodOrderList: formattedFoodOrderList,
          },
        };
      }),
    );
  }
}
