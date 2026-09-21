export const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const isImageFile = (fileName: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(getFileExtension(fileName).toLowerCase());

/** Human-readable size, e.g. 1536 -> "1.5 KB". Used by upload lists and attachment chips. */
export const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);

  // Whole numbers for bytes, one decimal beyond that — "1.5 MB" reads better than "1.53 MB".
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
};

export const isPdfFile = (fileName: string) => getFileExtension(fileName).toLowerCase() === 'pdf';
