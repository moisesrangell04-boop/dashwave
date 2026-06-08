export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface StoragePort {
  upload(file: Buffer, key: string, mimeType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
  exists(key: string): Promise<boolean>;
}
