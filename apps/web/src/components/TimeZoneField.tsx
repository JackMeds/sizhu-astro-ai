import { useId, useMemo } from "react";
import { Globe2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { COMMON_TIME_ZONES, getBrowserTimeZone, isValidTimeZone } from "@/lib/timezone";

interface TimeZoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  labelKey?: "timezone.birth" | "timezone.divination";
}

export function TimeZoneField({ value, onChange, label, labelKey = "timezone.birth" }: TimeZoneFieldProps) {
  const { t } = useI18n();
  const listId = useId();
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const options = useMemo(
    () => Array.from(new Set([browserTimeZone, ...COMMON_TIME_ZONES])),
    [browserTimeZone]
  );
  const valid = isValidTimeZone(value);
  const resolvedLabel = label ?? t(labelKey);

  return (
    <label className="field timezone-field">
      <span><Globe2 size={14} /> {resolvedLabel}</span>
      <input
        aria-invalid={!valid}
        autoComplete="off"
        list={listId}
        placeholder={t("timezone.placeholder")}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
      />
      <datalist id={listId}>
        {options.map((timezone) => <option key={timezone} value={timezone} />)}
      </datalist>
      <small className="field-helper">
        {valid ? t("timezone.valid", { timezone: browserTimeZone }) : t("timezone.invalid")}
      </small>
    </label>
  );
}
