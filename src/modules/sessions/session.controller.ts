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
  UseInterceptors 
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dto/create_session.dto';
import { AwsService } from '../aws/aws.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService,
              private readonly awsService: AwsService) { }

  @Get('/today')
  async getAllSessionsToday(
    @Res() res: Response) {

    const allSessionToday = await (this.sessionService.getAllSessionsToday());

    return res.status(HttpStatus.OK).json({
      status: "success",
      data: allSessionToday
    });
  }

  @Get('/today/host-payment-infor/:host_id')
  async getHostPaymentInfor(
    @Param('host_id') hostId: number, 
    @Res() res: Response) {

    const sessionByHostId = await (this.sessionService.getLatestSessionByHostId(hostId));

    const hostPaymentInfor = sessionByHostId.host_payment_infor;

    return res.status(HttpStatus.OK).json({
      hostPaymentInfor: hostPaymentInfor
    });

  }

  @Post('/today')
  @UseInterceptors(FileInterceptor('file'))
  async createNewSessionToday(
    @Body() dto: CreateSession, 
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response) {

    // const fileBuffer = file.buffer;
    // const originalFilename = file.originalname;

    // const fileKey = await this.awsService.uploadFileToS3(fileBuffer, originalFilename);

    const newSession = await this.sessionService.createNewSessionToday(dto);

    if (!newSession) {
      throw new InternalServerErrorException();
    }

    return res.status(HttpStatus.OK).json({
      status: 200,
      message: 'Create new session successfully !',
      newSession
    });

  }

}