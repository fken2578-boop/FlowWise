// Pure adapters for decimal form values. The model itself accepts SI numbers only.
function scaledNumber(value, divisor) {
  if (typeof value === "string") {
    const decimal = value.trim();
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(decimal)) return null;
    value = Number(decimal);
  }
  if (!Number.isFinite(value)) return null;
  const scaled = value / divisor;
  return scaled === 0 && value !== 0 ? null : scaled;
}

export const litresPerSecondToM3s = value => scaledNumber(value, 1000);
export const millimetresToMetres = value => scaledNumber(value, 1000);
export const percentToFraction = value => scaledNumber(value, 100);
