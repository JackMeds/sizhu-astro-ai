export type BrandTheme = "dark" | "light";

export const BRAND_MARK_ASSETS: Record<BrandTheme, string> = {
  dark: "/brand/mark-dark.png",
  light: "/brand/mark-light.png"
};

export function getBrandMarkSource(theme: BrandTheme) {
  return BRAND_MARK_ASSETS[theme];
}
