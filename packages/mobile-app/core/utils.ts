//  "utils.ts"
//  metropolitan app
//  Created by Ahmet on 28.06.2025.

// Currency formatting utility
export const formatPrice = (
  price: string | number,
  currency?: string
): string => {
  const numericPrice = typeof price === "string" ? parseFloat(price) : price;
  const formattedPrice = numericPrice.toFixed(2);

  if (!currency) {
    return formattedPrice;
  }

  // Currency symbol mapping
  const currencySymbols: { [key: string]: string } = {
    PLN: "zł",
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency;
  return `${formattedPrice} ${symbol}`;
};

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    PLN: "zł",
    TRY: "₺",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  return currencySymbols[currency.toUpperCase()] || currency;
};
