import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  UploadedFile,
  Res,
  UseGuards,
  UseInterceptors,
  Delete,
  Put,
  Inject,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSession } from './dtos/create-session.dto';
import { AwsService } from '../aws/aws.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSessionStatus } from './dtos/update-session_status.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Controller('session')
export class SessionController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly sessionService: SessionService,
    private readonly awsService: AwsService,
  ) {}

  @Get('/today')
  @UseGuards(JwtAuthGuard)
  async getAllSessionsToday(@Res() res: Response) {
    try {
      const allSessionToday = await this.sessionService.getAllSessionsToday();

      return res.status(200).json({
        statusCode: 200,
        data: allSessionToday,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR AT GETTING ALL SESSIONS TODAY');
      throw error;
    }
  }

  @Get('/host-payment-infor')
  async getHostPaymentInfor(@Res() res: Response) {
    try {
      const hostId = Object(res.req.user).id;

      const sessionByHostId =
        await this.sessionService.getLatestSessionByHostId(hostId);

      const hostPaymentInfor = sessionByHostId
        ? sessionByHostId.host_payment_info
        : '';

      return res.status(200).json({
        hostPaymentInfor: hostPaymentInfor,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR AT GETTING HOST PAYMENT INFORMATION');
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createNewSessionToday(
    @Body() dto: CreateSession,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
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

      return res.status(200).json({
        statusCode: 200,
        message: 'Create new session successfully !',
        id: newSession.id,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR WHEN CREATING NEW SESSION TODAY');
      throw error;
    }
  }

  @Put('/:id')
  @UseGuards(JwtAuthGuard)
  async updateSessionStatus(
    @Body() dto: UpdateSessionStatus,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    try {
      const resultUpdating = await this.sessionService.updateSessionStatus(
        id,
        dto,
      );

      return res.status(resultUpdating.status).json(resultUpdating);
    } catch (error) {
      console.log('HAS AN ERROR AT UPDATING SESSION STATUS');
      throw error;
    }
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSession(@Param('id') id: number, @Res() res: Response) {
    try {
      const resultDeleting = await this.sessionService.deleteSession(id);

      return res.status(resultDeleting.statusCode).json(resultDeleting);
    } catch (error) {
      console.log('HAS AN ERROR WHEN DELETING SESSION !');
      throw error;
    }
  }
}
