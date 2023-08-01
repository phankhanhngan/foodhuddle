import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsService {
  private s3: AWS.S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    });
  }

  async uploadImage(
    fileBuffer: Buffer,
    originalFilename: string,
  ): Promise<string> {
    const bucketName = this.configService.get('AWS_BUCKET');
    const key = `${uuidv4()}-${originalFilename}`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
    };

    try {
      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      throw new Error('Failed to upload the image to S3.');
    }
  }
}
