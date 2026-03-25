import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ensureR2Config } from "../../lib/env";
import type { ObjectStorage, UploadObjectInput } from "./object-storage";

export class R2ObjectStorage implements ObjectStorage {
  private readonly config = ensureR2Config();
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
  }

  async uploadObject(input: UploadObjectInput): Promise<{ key: string; publicUrl: string }> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: input.cacheControl || "public, max-age=31536000, immutable",
        }),
      );
    } catch (error) {
      const maybe = error as {
        name?: string;
        message?: string;
        $metadata?: { httpStatusCode?: number; requestId?: string };
      };
      const detailParts = [
        maybe.name ? `name=${maybe.name}` : null,
        maybe.message ? `message=${maybe.message}` : null,
        maybe.$metadata?.httpStatusCode
          ? `status=${maybe.$metadata.httpStatusCode}`
          : null,
        maybe.$metadata?.requestId ? `requestId=${maybe.$metadata.requestId}` : null,
      ].filter(Boolean);
      throw new Error(
        detailParts.length > 0
          ? `R2 upload failed (${detailParts.join(", ")})`
          : "R2 upload failed",
      );
    }

    const base = this.config.publicBaseUrl.replace(/\/+$/, "");
    return { key: input.key, publicUrl: `${base}/${input.key}` };
  }

  async getObject(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );

    const body = response.Body;
    if (!body) {
      throw new Error("R2 object body missing");
    }

    if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
      const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      return Buffer.from(bytes);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }
}
