import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(price: string | number, currencyCode?: string, currencySymbol?: string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // If currency settings are provided, use them
  if (currencyCode && currencySymbol) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(numPrice);
    } catch (error) {
      // Fallback to symbol if currency code is not recognized
      return `${currencySymbol}${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
  
  // Default to VND
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
  }).format(numPrice);
}

export function calculateTotal(items: { unit_price: string; quantity: number }[]): number {
  return items.reduce((sum, item) => {
    return sum + parseFloat(item.unit_price) * item.quantity;
  }, 0);
}

