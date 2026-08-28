import { getBrandMarkSource } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";

interface BrandMarkProps {
  className?: string;
  decorative?: boolean;
}

/** Theme-aware seal mark using the supplied white and red source artwork. */
export function BrandMark({ className = "", decorative = false }: BrandMarkProps) {
  const { isEnglish } = useI18n();
  const classes = ["brand-mark", className].filter(Boolean).join(" ");

  return (
    <span
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : isEnglish ? "MingXu seal mark" : "命序印章标志"}
      className={classes}
      role={decorative ? undefined : "img"}
    >
      <img aria-hidden="true" alt="" className="brand-mark-image brand-mark-image-dark" src={getBrandMarkSource("dark")} />
      <img aria-hidden="true" alt="" className="brand-mark-image brand-mark-image-light" src={getBrandMarkSource("light")} />
    </span>
  );
}
