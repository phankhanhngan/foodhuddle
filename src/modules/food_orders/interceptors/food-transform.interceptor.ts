import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FoodOrderDTO } from '../dtos/food-order.dto';

@Injectable()
export class FoodTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const body = context.switchToHttp().getRequest().body;

    const { sessionId, foodList } = body;

    const formattedFoodList: FoodOrderDTO[] = foodList?.map(
      (food: FoodOrderDTO) => ({
        ...food,
        sessionId,
      }),
    );

    body.foodList = formattedFoodList;
    return next.handle();
  }
}
