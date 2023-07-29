// image-resize.service.ts
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageResize {
  async resizeImage(fileBuffer: Buffer): Promise<Buffer> {
    try {
      const resizedImageBuffer = await sharp(fileBuffer)
        .resize(800, 600)
        .toBuffer();

      return resizedImageBuffer;
    } catch (error) {
      throw new Error('Failed to resize the image.');
    }
  }
}
