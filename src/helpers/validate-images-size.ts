import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export default class MaxFileSize extends FileValidator<{ maxSize: number }> {
  constructor(options: { maxSize: number }) {
    super(options);
  }

  isValid<TFile extends IFile = any>(file?: TFile): boolean | Promise<boolean> {
    const in_mb = file.size / 1000000;
    return in_mb <= this.validationOptions.maxSize;
  }
  buildErrorMessage(): string {
    return `File uploaded is too big. Max size is (${this.validationOptions.maxSize} MB)`;
  }
}
