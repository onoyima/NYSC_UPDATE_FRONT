import { PDFDocument } from 'pdf-lib';

/**
 * Compresses an image or PDF file to fit within targetSizeBytes.
 * - Images: uses Canvas API to reduce quality/dimensions
 * - PDFs: uses pdf-lib to re-save with object streams (removes bloat)
 * Returns the compressed file. If already under limit, returns original.
 */
export async function compressFileIfNeeded(
  file: File,
  targetSizeBytes: number
): Promise<File> {
  if (file.size <= targetSizeBytes) {
    return file;
  }

  if (file.type.startsWith('image/')) {
    return compressImage(file, targetSizeBytes);
  }

  if (file.type === 'application/pdf') {
    return compressPDF(file, targetSizeBytes);
  }

  return file;
}

async function compressImage(file: File, targetSizeBytes: number): Promise<File> {
  const img = await loadImage(file);
  let { width, height } = img;

  if (width > 1920 || height > 1920) {
    const scale = Math.min(1920 / width, 1920 / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

  while (blob.size > targetSizeBytes && quality > 0.1) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, 'image/jpeg', Math.max(quality, 0.1));
  }

  while (blob.size > targetSizeBytes && width > 200 && height > 200) {
    width = Math.round(width * 0.8);
    height = Math.round(height * 0.8);
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.1);
  }

  if (blob.size >= file.size) {
    return file;
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

async function compressPDF(file: File, targetSizeBytes: number): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });

    if (compressedBlob.size >= file.size) {
      return file;
    }

    return new File([compressedBlob], file.name, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob || new Blob()),
      mimeType,
      quality
    );
  });
}
