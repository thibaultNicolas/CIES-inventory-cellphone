import imageCompression from "browser-image-compression";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Max size: 1MB
  maxWidthOrHeight: 1920, // Max resolution: 1920px
  useWebWorker: true, // Use a web worker to avoid blocking the main thread
  // Default to WebP: better compression and supports transparency.
  // (JPEG drops alpha → white background on cutout logos/images.)
  fileType: "image/webp",
};

/**
 * Client-side image compression before upload.
 * @param file - Image file to compress
 * @param options - Optional compression overrides
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // If the file is already small enough, return it as-is (optionally resized).
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= (options.maxSizeMB || DEFAULT_OPTIONS.maxSizeMB!)) {
    // Even if size is fine, we may still want to resize if too large.
    const shouldResize = options.maxWidthOrHeight || DEFAULT_OPTIONS.maxWidthOrHeight;
    if (shouldResize) {
      try {
        const compressed = await imageCompression(file, {
          ...DEFAULT_OPTIONS,
          ...options,
        });
        return compressed;
      } catch (error) {
        console.warn("Image compression failed, falling back to original file:", error);
        return file;
      }
    }
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      ...DEFAULT_OPTIONS,
      ...options,
    });

    return compressedFile;
  } catch (error) {
    console.error("Image compression error:", error);
    // On error, return the original file rather than blocking upload.
    return file;
  }
}

/**
 * Compress an image with options optimized for device photos
 * (higher quality for product pictures).
 */
export async function compressDevicePhoto(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 2, // Slightly larger budget for product photos
    maxWidthOrHeight: 2048, // Higher resolution for details
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}
