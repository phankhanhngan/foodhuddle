import {
  Get,
  Controller,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async auth() {}

  @Get('/google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    try {
      const token = await this.authService.logIn(req.user);

      return res.status(HttpStatus.OK).json({
        status: 'Success',
        message: 'Login successfully',
        token,
        profile: req.user,
      });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException();
    }
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    try {
      return res.status(HttpStatus.OK).json({
        status: 'Success',
        message: 'Logout successfully',
      });
    } catch (err) {}
  }
}
