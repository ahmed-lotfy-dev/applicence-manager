import type { ImageProcessor, ProcessImageInput, ProcessedImage } from "./image-processor";

export class SharpImageProcessor implements ImageProcessor {
  async process(input: ProcessImageInput): Promise<ProcessedImage> {
    const sharp = await loadSharp();
    const buffer = await sharp(input.source)
      .rotate()
      .resize({
        width: input.maxWidth || 900,
        withoutEnlargement: true,
        fit: "inside",
      })
      .png()
      .toBuffer();

    return {
      buffer,
      contentType: "image/png",
      extension: "png",
    };
  }
}

async function loadSharp() {
  try {
    const module = await import("sharp");
    return module.default;
  } catch (error) {
    throw new Error(
      'Image processing is unavailable because the "sharp" runtime could not be loaded on this server.',
      { cause: error },
    );
  }
}
