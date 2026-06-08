import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { StoragePort, UploadResult } from '../../application/ports/infrastructure/storage.port';

@Injectable()
export class LocalStorageService implements StoragePort {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    const fileName = `${uuid()}-${key}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file);

    const stats = await fs.promises.stat(filePath);

    this.logger.log(`File uploaded: ${fileName}`);

    return {
      url: `/uploads/${fileName}`,
      key: fileName,
      size: stats.size,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      this.logger.log(`File deleted: ${key}`);
    }
  }

  async getUrl(key: string): Promise<string> {
    if (fs.existsSync(path.join(this.uploadDir, key))) {
      return `/uploads/${key}`;
    }
    throw new Error('File not found');
  }

  async exists(key: string): Promise<boolean> {
    return fs.existsSync(path.join(this.uploadDir, key));
  }
}
