export const formatDate = (value: string | Date, locale = 'en-US') =>
  new Date(value).toLocaleDateString(locale);

export const formatDateTime = (value: string | Date, locale = 'en-US') =>
  new Date(value).toLocaleString(locale);
