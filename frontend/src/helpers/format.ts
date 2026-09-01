export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const toCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
