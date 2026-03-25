export interface ProcessImageInput {
  source: Buffer;
  maxWidth?: number;
  quality?: number;
}

export interface ProcessedImage {
  buffer: Buffer;
  contentType: "image/png";
  extension: "png";
}

export interface ImageProcessor {
  process(input: ProcessImageInput): Promise<ProcessedImage>;
}
