import {
  Controller,
  Res,
  HttpStatus,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { IUserAuthen } from './interfaces';
import { OAuth2Client } from './google_client/google-client.config';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
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
      console.log(err);
      throw err;
    }
  }
}
