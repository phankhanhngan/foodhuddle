import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AwsService {
  private s3: S3;

  constructor() {
    this.s3 = new S3();
  }

  async uploadFileToS3(
    fileBuffer: Buffer,
    originalFilename: string,
  ): Promise<string> {
    const bucketName = 'your-bucket-name';

    const fileKey = uuidv4() + '-' + originalFilename;
    const params = {
      Bucket: bucketName,
      Key: fileKey,
      Body: fileBuffer,
    };

    await this.s3.putObject(params).promise();

    return fileKey;
  }
}
