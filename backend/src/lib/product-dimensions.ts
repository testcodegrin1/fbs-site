export function baseDimensions(sizes: { width: number; height: number }[] | null | undefined, width: number, height: number) {
  const first = sizes?.[0];
  return first ? { width: Number(first.width), height: Number(first.height) } : { width, height };
}

/** Calculate a custom width while preserving the signed base difference. */
export function customDimensions(baseWidth: number, baseHeight: number, height: number) {
  if (!Number.isFinite(baseWidth) || baseWidth <= 0 || !Number.isFinite(baseHeight) || baseHeight <= 0) {
    throw new Error("The product's base dimensions are invalid.");
  }
  const heightHundredths = Math.round(height * 100);
  if (!Number.isFinite(height) || height <= 0 ||
      Math.abs(height * 100 - heightHundredths) > 1e-7 ||
      !Number.isSafeInteger(heightHundredths)) {
    throw new Error("Enter a positive height with at most two decimal places.");
  }
  const widthHundredths = heightHundredths + Math.round(baseWidth * 100) - Math.round(baseHeight * 100);
  if (!Number.isSafeInteger(widthHundredths) || widthHundredths <= 0) {
    throw new Error("Enter a height that produces a positive width.");
  }
  return { width: widthHundredths / 100, height: heightHundredths / 100 };
}
