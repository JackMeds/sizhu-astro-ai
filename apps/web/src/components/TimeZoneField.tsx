import { useId, useMemo } from "react";
import { Globe2 } from "lucide-react";
import { COMMON_TIME_ZONES, getBrowserTimeZone, isValidTimeZone } from "@/lib/timezone";

interface TimeZoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function TimeZoneField({ value, onChange, label = "出生地时区" }: TimeZoneFieldProps) {
  const listId = useId();
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), []);
  const options = useMemo(
    () => Array.from(new Set([browserTimeZone, ...COMMON_TIME_ZONES])),
    [browserTimeZone]
  );
  const valid = isValidTimeZone(value);

  return (
    <label className="field timezone-field">
      <span><Globe2 size={14} /> {label}</span>
      <input
        aria-invalid={!valid}
        autoComplete="off"
        list={listId}
        placeholder="例如 Asia/Shanghai 或 America/Los_Angeles"
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
      />
      <datalist id={listId}>
        {options.map((timezone) => <option key={timezone} value={timezone} />)}
      </datalist>
      <small className="field-helper">
        {valid ? `使用 IANA 时区；当前浏览器为 ${browserTimeZone}` : "请输入有效的 IANA 时区名称。"}
      </small>
    </label>
  );
}
