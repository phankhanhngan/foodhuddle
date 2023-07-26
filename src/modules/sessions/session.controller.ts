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
  UseInterceptors,
  Delete,
  Put
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dto/create_session.dto';
import { AwsService } from '../aws/aws.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSessionStatus } from './dto/update_session_status.dto';

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
        statusCode: 200,
        data: allSessionToday
      });

    } catch (error) {
      console.log('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
      throw error;
    }
  }

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
        statusCode: 200,
        message: 'Create new session successfully !',
        id: newSession.id
      });

    } catch (error) {
      console.log('HAS AN ERROR WHEN CREATING NEW SESSION TODAY');
      throw error;
    }
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  async updateSessionStatus(
    @Body() dto: UpdateSessionStatus,
    @Param('id') id: number,
    @Res() res: Response) {

    try {

      const resultUpdating = await this.sessionService.updateSessionStatus(id, dto);

      if (resultUpdating) {
        return res.status(HttpStatus.OK).json({
          statusCode: 200,
          message: `${dto.status} session successfully !`,
        });
      }

      return res.status(HttpStatus.FAILED_DEPENDENCY).json({
        statusCode: 400,
        message: `HAS AN ERROR WHEN MARKING ${dto.status} SESSION !`,
      });

    }
    catch (error) {
      console.log('HAS AN ERROR AT UPDATING SESSION STATUS');
      throw error;
    }
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @Param('id') id: number,
    @Res() res: Response) {

    try {

      const resultDeleting = await this.sessionService.deleteSession(id);

      if (resultDeleting.statusCode === 200) {
        return res.status(HttpStatus.OK).json(
          resultDeleting
        );
      }

      return res.status(HttpStatus.FAILED_DEPENDENCY).json(
        resultDeleting
      );

    } catch (error) {
      console.log('HAS AN ERROR WHEN DELETING SESSION !');
      throw error;
    }

  }

}

