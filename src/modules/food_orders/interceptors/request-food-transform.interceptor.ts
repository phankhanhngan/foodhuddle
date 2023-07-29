import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CreateFoodOrderDTO } from '../dtos/create-food-order.dto';

@Injectable()
export class RequestFoodTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const body = context.switchToHttp().getRequest().body;

    const { sessionId, foodOrderList } = body;

    const formattedFoodOrderList: CreateFoodOrderDTO[] = foodOrderList?.map(
      (food: CreateFoodOrderDTO) => ({
        ...food,
        sessionId,
      }),
    );

    body.foodOrderList = formattedFoodOrderList;
    return next.handle();
  }
}
