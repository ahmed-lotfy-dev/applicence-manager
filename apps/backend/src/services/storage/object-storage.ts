export interface UploadObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}

export interface ObjectStorage {
  uploadObject(input: UploadObjectInput): Promise<{ key: string; publicUrl: string }>;
  deleteObject(key: string): Promise<void>;
}
