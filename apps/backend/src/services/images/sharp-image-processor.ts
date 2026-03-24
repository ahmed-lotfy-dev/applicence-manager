import sharp from "sharp";
import type { ImageProcessor, ProcessImageInput, ProcessedImage } from "./image-processor";

export class SharpImageProcessor implements ImageProcessor {
  async process(input: ProcessImageInput): Promise<ProcessedImage> {
    const buffer = await sharp(input.source)
      .rotate()
      .resize({
        width: input.maxWidth || 900,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({
        quality: input.quality || 82,
        effort: 4,
      })
      .toBuffer();

    return {
      buffer,
      contentType: "image/webp",
      extension: "webp",
    };
  }
}
