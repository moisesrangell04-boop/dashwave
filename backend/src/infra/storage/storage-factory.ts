import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { StoragePort } from '../../application/ports/infrastructure/storage.port';

export function createStorageService(configService: ConfigService): StoragePort {
  const provider = configService.get<string>('storage.provider') || 'local';

  switch (provider) {
    case 's3':
      return new S3StorageService(configService);
    case 'local':
    default:
      return new LocalStorageService(configService);
  }
}
