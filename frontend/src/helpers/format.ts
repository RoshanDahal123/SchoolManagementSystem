export const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export const toCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);


export const getInitials = (email?: string | null) => {
  if (!email) return "U"
  const [local] = email.split("@")
  const parts = local.split(/[._-]/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}