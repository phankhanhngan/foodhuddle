import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  HttpStatus,
  InternalServerErrorException,
  UploadedFile,
  Res,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dto/create_session.dto';
import { AwsService } from '../aws/aws.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService,
    private readonly awsService: AwsService) { }

  @Get('/get-all-sessions-today')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsToday(
    @Res() res: Response) {

    try {

      const allSessionToday = await (this.sessionService.getAllSessionsToday());

      return res.status(HttpStatus.OK).json({
        status: "success",
        data: allSessionToday
      });

    } catch (error) {
      console.log('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/host-payment-infor')
  async getHostPaymentInfor(
    @Res() res: Response) {

    try {
      const hostId = Object(res.req.user).id;

      const sessionByHostId = await (this.sessionService.getLatestSessionByHostId(hostId));

      const hostPaymentInfor = sessionByHostId ? sessionByHostId.host_payment_info : '';

      return res.status(HttpStatus.OK).json({
        hostPaymentInfor: hostPaymentInfor
      });

    } catch (error) {
      console.log('HAS AN ERROR AT GETTING HOST PAYMENT INFORMATION');
      throw error;
    }

  }

  @Post('/create-new-session')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createNewSessionToday(
    @Body() dto: CreateSession,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response) {

    try {
      // const fileBuffer = file.buffer;
      // const originalFilename = file.originalname;

      // const fileKey = await this.awsService.uploadFileToS3(fileBuffer, originalFilename);

      const hostId = Object(res.req.user).id;

      dto.host = hostId;

      const newSession = await this.sessionService.createNewSessionToday(dto);

      if (!newSession) {
        throw new InternalServerErrorException();
      }

      return res.status(HttpStatus.OK).json({
        status: 200,
        message: 'Create new session successfully !',
        id: newSession.id
      });

    } catch (error) {
      console.log('HAS AN ERROR WHEN CREATING NEW SESSION TODAY');
      throw error;
    }
  }

}