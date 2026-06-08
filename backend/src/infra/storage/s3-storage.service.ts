import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuid } from 'uuid';
import { StoragePort, UploadResult } from '../../application/ports/infrastructure/storage.port';

@Injectable()
export class S3StorageService implements StoragePort {
  private readonly logger = new Logger(S3StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.bucket') || 'wave-crm-uploads';
    this.region = this.configService.get<string>('storage.region') || 'us-east-1';
    this.publicUrl = this.configService.get<string>('storage.publicUrl') || '';

    const endpoint = this.configService.get<string>('storage.endpoint');
    const accessKeyId = this.configService.get<string>('storage.accessKeyId');
    const secretAccessKey = this.configService.get<string>('storage.secretAccessKey');

    this.client = new S3Client({
      region: this.region,
      ...(endpoint && { endpoint }),
      ...(accessKeyId && secretAccessKey && {
        credentials: { accessKeyId, secretAccessKey },
      }),
      ...(endpoint && { forcePathStyle: true }),
    });
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult> {
    const fileKey = `${uuid()}-${key}`;

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: fileKey,
        Body: file,
        ContentType: mimeType,
      },
    });

    await upload.done();

    const url = this.publicUrl
      ? `${this.publicUrl}/${fileKey}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;

    this.logger.log(`File uploaded to S3: ${fileKey}`);

    return {
      url,
      key: fileKey,
      size: file.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
    this.logger.log(`File deleted from S3: ${key}`);
  }

  async getUrl(key: string): Promise<string> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);

    return this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }
}
