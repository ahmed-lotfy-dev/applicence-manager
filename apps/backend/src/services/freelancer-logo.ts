import { randomUUID } from "node:crypto";
import { getFreelancerProfile, setFreelancerLogo } from "./freelancer-profile";
import type { ImageProcessor } from "./images/image-processor";
import { SharpImageProcessor } from "./images/sharp-image-processor";
import type { ObjectStorage } from "./storage/object-storage";
import { R2ObjectStorage } from "./storage/r2-object-storage";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function validateUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("LOGO_MUST_BE_IMAGE");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("LOGO_TOO_LARGE");
  }
}

export class FreelancerLogoService {
  constructor(
    private readonly storage: ObjectStorage,
    private readonly imageProcessor: ImageProcessor,
  ) {}

  async uploadAndSet(userId: string, file: File) {
    validateUpload(file);
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const processed = await this.imageProcessor.process({
      source: originalBuffer,
      maxWidth: 900,
      quality: 82,
    });

    const existing = await getFreelancerProfile(userId);
    const nextKey = `freelancer/${userId}/logo-${Date.now()}-${randomUUID().slice(0, 8)}.${processed.extension}`;
    const uploaded = await this.storage.uploadObject({
      key: nextKey,
      body: processed.buffer,
      contentType: processed.contentType,
    });

    if (existing?.logoObjectKey) {
      await this.storage.deleteObject(existing.logoObjectKey).catch(() => undefined);
    }

    const profile = await setFreelancerLogo(userId, {
      logoUrl: uploaded.publicUrl,
      logoObjectKey: uploaded.key,
    });

    return {
      profile,
      logoUrl: uploaded.publicUrl,
      logoObjectKey: uploaded.key,
    };
  }
}

export function createFreelancerLogoService() {
  return new FreelancerLogoService(new R2ObjectStorage(), new SharpImageProcessor());
}
