export async function compressDataUrl(
  dataUrl: string,
  options?: { maxSize?: number; quality?: number }
): Promise<string> {
  const { maxSize = 1600, quality = 0.72 } = options || {};
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down preserving aspect ratio
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unsupported'));
      ctx.drawImage(img, 0, 0, width, height);

      // Prefer JPEG
      const mime = 'image/jpeg';
      const out = canvas.toDataURL(mime, quality);
      resolve(out);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}
