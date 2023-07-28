import {
  Controller,
  Res,
  HttpStatus,
  Post,
  Body,
  BadRequestException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { OAuth2Client } from './google_client/google-client.config';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { IUserAuthen } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly oauth2Client: OAuth2Client,
  ) {}

  @Post('/google/callback')
  async googleAuthCallback(@Body() body, @Res() res: Response) {
    try {
      const { accessToken } = body;

      if (!accessToken) {
        throw new BadRequestException('Access Token can not be null');
      }

      const { id, email, name, picture } = await this.oauth2Client.getInfo(
        accessToken,
      );
      const user: IUserAuthen = {
        googleId: id,
        email,
        name,
        photo: picture,
      };
      const token = await this.authService.logIn(user);
      return res.status(HttpStatus.OK).json({
        status: 'Success',
        message: 'Login successfully',
        accessToken: token,
        expiresIn: parseInt(
          this.configService.get<string>('TOKEN_EXPIRE_TIME'),
        ),
        profile: user,
      });
    } catch (err) {
      this.logger.error(
        'Calling googleAuthCallback()',
        err,
        AuthController.name,
      );
      throw new InternalServerErrorException();
    }
  }
}
