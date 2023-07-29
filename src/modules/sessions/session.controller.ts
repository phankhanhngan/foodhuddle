import {
  Body,
  Post,
  Controller,
  Get,
  Param,
  InternalServerErrorException,
  Res,
  UseGuards,
  UseInterceptors,
  Inject,
  UploadedFiles,
  ParseFilePipe,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateSession, SessionStatus } from './dtos/create-session.dto';
import { AwsService } from '../aws/aws.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import MaxFileSize from '../../helpers/validate-images-size';
import AcceptImageType from 'src/helpers/validate-images-type';
import { ImageResize } from 'src/helpers/resize-images';

@Controller('session')
export class SessionController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly sessionService: SessionService,
    private readonly awsService: AwsService,
    private readonly imageResize: ImageResize,
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

  @UseGuards(JwtAuthGuard)
  @Get('/host-payment-infor')
  async getHostPaymentInfor(@Res() res: Response) {
    try {
      const hostId = Object(res.req.user).id;

      const sessionByHostId =
        await this.sessionService.getLatestSessionByHostId(hostId);

      const hostPaymentInfor = sessionByHostId
        ? sessionByHostId.host_payment_info
        : '';

      const qr_images = sessionByHostId ? sessionByHostId.qr_images : '';

      return res.status(200).json({
        hostPaymentInfor: hostPaymentInfor,
        qr_images: qr_images,
      });
    } catch (error) {
      this.logger.error('HAS AN ERROR AT GETTING HOST PAYMENT INFORMATION');
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('qr_images'))
  async createNewSessionToday(
    @Body() dto: CreateSession,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSize({
            maxSize: 5,
          }),
          new AcceptImageType({
            fileType: ['image/jpeg', 'image/png'],
          }),
        ],
        fileIsRequired: false,
      }),
    )
    files: Array<Express.Multer.File>,
    @Res() res: Response,
  ) {
    try {
      const urlImages: Promise<string>[] = files.map(async (img) => {
        const resizedImage = await this.imageResize.resizeImage(img.buffer);

        const imageUrl = await this.awsService.uploadImage(
          resizedImage,
          img.originalname,
        );

        return imageUrl;
      });

      const listUrlImages = await Promise.all(urlImages);

      const qrImagesUrl = JSON.stringify(Object.assign({}, listUrlImages));

      const hostId = Object(res.req.user).id;
      dto.host = hostId;
      dto.status = SessionStatus.OPEN;
      dto.qr_images = qrImagesUrl;

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
}
