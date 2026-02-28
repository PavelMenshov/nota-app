import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private s3: S3Client | null = null;
  private bucket: string;
  private useS3: boolean;
  private localUploadsDir: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY');
    const secretKey = this.configService.get<string>('S3_SECRET_KEY');
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'nota-files';

    this.useS3 = !!(endpoint && accessKey && secretKey);
    this.localUploadsDir = path.join(process.cwd(), 'uploads');

    if (this.useS3) {
      this.s3 = new S3Client({
        endpoint,
        region: this.configService.get<string>('S3_REGION') || 'us-east-1',
        credentials: {
          accessKeyId: accessKey!,
          secretAccessKey: secretKey!,
        },
        forcePathStyle: true, // Required for MinIO
      });
      this.logger.log(`S3/MinIO storage configured (endpoint: ${endpoint})`);
      this.ensureBucketExists().catch((err) => this.logger.warn(`Bucket check failed: ${err instanceof Error ? err.message : err}`));
    } else {
      if (!fs.existsSync(this.localUploadsDir)) {
        fs.mkdirSync(this.localUploadsDir, { recursive: true });
      }
      this.logger.log('Using local file storage (set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY for S3/MinIO)');
    }
  }

  private async ensureBucketExists(): Promise<void> {
    if (!this.s3) return;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'name' in err ? (err as { name?: string }).name : '';
      const status = err && typeof err === 'object' && '$metadata' in err ? (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode : 0;
      if (code === 'NotFound' || code === 'NoSuchBucket' || status === 404) {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created.`);
      } else {
        throw err;
      }
    }
  }

  async upload(
    file: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; url: string }> {
    const ext = path.extname(originalName);
    const key = `${uuidv4()}${ext}`;

    if (this.useS3 && this.s3) {
      await this.ensureBucketExists();
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
        }),
      );
      return { key, url: `/api/sources/files/${key}` };
    }

    // Fallback: local disk
    const filePath = path.join(this.localUploadsDir, key);
    fs.writeFileSync(filePath, file);
    return { key, url: `/api/sources/files/${key}` };
  }

  async uploadFromPath(
    sourcePath: string,
    originalName: string,
    mimeType: string,
  ): Promise<{ key: string; url: string }> {
    const ext = path.extname(originalName);
    const key = `${uuidv4()}${ext}`;

    if (this.useS3 && this.s3) {
      await this.ensureBucketExists();
      const fileBuffer = await fs.promises.readFile(sourcePath);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      );
      // Clean up temp file after successful upload
      try { fs.unlinkSync(sourcePath); } catch { /* ignore cleanup errors */ }
      return { key, url: `/api/sources/files/${key}` };
    }

    // Fallback: rename/move the file instead of reading into memory
    const destPath = path.join(this.localUploadsDir, key);
    fs.renameSync(sourcePath, destPath);
    return { key, url: `/api/sources/files/${key}` };
  }

  async getFileStream(key: string): Promise<{ stream: NodeJS.ReadableStream | null; localPath: string | null }> {
    if (this.useS3 && this.s3) {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return { stream: response.Body as NodeJS.ReadableStream, localPath: null };
    }

    const localPath = path.join(this.localUploadsDir, path.basename(key));
    if (fs.existsSync(localPath)) {
      return { stream: null, localPath };
    }
    return { stream: null, localPath: null };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.useS3 && this.s3) {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn },
      );
    }
    // Fallback: return local URL
    return `/api/sources/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    if (this.useS3 && this.s3) {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return;
    }

    const localPath = path.join(this.localUploadsDir, path.basename(key));
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
}
