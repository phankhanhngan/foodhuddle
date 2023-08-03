import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export default class AcceptImageType extends FileValidator<{
  fileType: Array<string>;
}> {
  constructor(options: { fileType: Array<string> }) {
    super(options);
  }

  isValid<TFile extends IFile = any>(file?: TFile): boolean | Promise<boolean> {
    return this.validationOptions.fileType.includes(file.mimetype);
  }
  buildErrorMessage(): string {
    return `Only accept image type .jpg, .png, .jpeg`;
  }
}
