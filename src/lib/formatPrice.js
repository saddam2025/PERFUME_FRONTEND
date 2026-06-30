export function formatPrice(amount, locale, currencyLabel) {
  const numberFormatted = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  if (locale === "ar") {
    return `${numberFormatted} ${currencyLabel}`;
  }
  return `${currencyLabel} ${numberFormatted}`;
}
