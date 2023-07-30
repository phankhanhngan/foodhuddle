import {
  CanActivate,
  ExecutionContext,
  Inject,
  BadRequestException,
  mixin,
} from '@nestjs/common';
import { SessionService } from 'src/modules/sessions/session.service';

export const SessionStatusGuard = (acceptedStatus: Array<string>) => {
  class SessionStatusGuardMixin implements CanActivate {
    constructor(
      @Inject(SessionService) readonly sessionService: SessionService,
    ) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest();
      const { body, params } = req;

      const sessionId = body.sessionId ? body.sessionId : params.id;
      const session = await this.sessionService.getSession(sessionId);

      if (!session) {
        throw new BadRequestException(
          `Can not find session with id: ${sessionId}`,
        );
      }

      if (!acceptedStatus.includes(session.status)) {
        throw new BadRequestException(
          `Can not perform this action because Session is in status '${session.status}'`,
        );
      }

      req.session = session;
      return true;
    }
  }

  return mixin(SessionStatusGuardMixin);
};
