import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { SessionService } from 'src/modules/sessions/session.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { body, params, user } = context.switchToHttp().getRequest();

    const sessionId = body.sessionId ?? params.id;
    const session = await this.sessionService.getSession(sessionId);

    if (!session) {
      throw new BadRequestException(
        `Can not find session with id: ${sessionId}`,
      );
    }

    return session.host.id === user.id;
  }
}
