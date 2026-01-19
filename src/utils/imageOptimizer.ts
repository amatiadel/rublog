/**
 * Image optimization utilities for blog images
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  quality?: number;
}

/**
 * Generate optimized image attributes
 */
export function getOptimizedImageProps(
  src: string,
  alt: string,
  options: ImageOptimizationOptions = {}
) {
  const { width, height, format = 'webp', quality = 80 } = options;

  return {
    src,
    alt,
    width,
    height,
    format,
    quality,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(src: string, widths: number[] = [640, 768, 1024, 1280]) {
  return widths.map(w => `${src}?w=${w} ${w}w`).join(', ');
}
