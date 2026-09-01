export const getFileExtension = (fileName: string) => {
  const parts = fileName.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const isImageFile = (fileName: string) => ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(getFileExtension(fileName).toLowerCase());
