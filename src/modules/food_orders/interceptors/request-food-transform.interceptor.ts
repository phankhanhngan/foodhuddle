import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FoodOrderDTO } from '../dtos/food-order.dto';

@Injectable()
export class RequestFoodTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const body = context.switchToHttp().getRequest().body;

    const { sessionId, foodOrderList } = body;

    const formattedFoodOrderList: FoodOrderDTO[] = foodOrderList?.map(
      (food: FoodOrderDTO) => ({
        ...food,
        sessionId,
      }),
    );

    body.foodOrderList = formattedFoodOrderList;
    return next.handle();
  }
}
