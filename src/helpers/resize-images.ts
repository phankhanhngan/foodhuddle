// image-resize.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageResize {
  async resizeImage(
    fileBuffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    try {
      const resizedImageBuffer = await sharp(fileBuffer)
        .resize(width, height)
        .toBuffer();

      return resizedImageBuffer;
    } catch (error) {
      throw new Error('Failed to resize the image.');
    }
  }
}
