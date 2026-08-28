import { useEffect, useRef, type FormEvent } from "react";
import { CalendarDays, Clock3, Compass, MapPin, Settings2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getBrowserTimeZone } from "@/lib/timezone";
import { Button } from "./Button";
import { TimeZoneField } from "./TimeZoneField";

export interface FormState {
  name: string;
  gender: "male" | "female";
  birthDateTime: string;
  calendar: "solar" | "lunar";
  timezone: string;
  locationName: string;
  longitude: string;
  trueSolarTime: "none" | "longitude" | "apparent";
  sect: 1 | 2;
}

interface InputPanelProps {
  form: FormState;
  error?: string;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
}

const timePeriods = [
  { label: "子", range: "23:00–00:59", value: "23:00" },
  { label: "丑", range: "01:00–02:59", value: "01:00" },
  { label: "寅", range: "03:00–04:59", value: "03:00" },
  { label: "卯", range: "05:00–06:59", value: "05:00" },
  { label: "辰", range: "07:00–08:59", value: "07:00" },
  { label: "巳", range: "09:00–10:59", value: "09:00" },
  { label: "午", range: "11:00–12:59", value: "11:00" },
  { label: "未", range: "13:00–14:59", value: "13:00" },
  { label: "申", range: "15:00–16:59", value: "15:00" },
  { label: "酉", range: "17:00–18:59", value: "17:00" },
  { label: "戌", range: "19:00–20:59", value: "19:00" },
  { label: "亥", range: "21:00–22:59", value: "21:00" }
];

const years = Array.from({ length: 201 }, (_, index) => 1900 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

const locations = [
  { name: "北京市 东城区", longitude: "116.42" },
  { name: "上海市 黄浦区", longitude: "121.49" },
  { name: "天津市 和平区", longitude: "117.20" },
  { name: "重庆市 渝中区", longitude: "106.57" },
  { name: "广州市 越秀区", longitude: "113.27" },
  { name: "深圳市 福田区", longitude: "114.05" },
  { name: "杭州市 西湖区", longitude: "120.13" },
  { name: "南京市 玄武区", longitude: "118.80" },
  { name: "成都市 锦江区", longitude: "104.08" },
  { name: "武汉市 武昌区", longitude: "114.32" },
  { name: "西安市 碑林区", longitude: "108.94" },
  { name: "长沙市 岳麓区", longitude: "112.93" },
  { name: "郑州市 金水区", longitude: "113.66" },
  { name: "沈阳市 和平区", longitude: "123.42" },
  { name: "哈尔滨市 道里区", longitude: "126.62" },
  { name: "昆明市 五华区", longitude: "102.71" },
  { name: "乌鲁木齐市 天山区", longitude: "87.63" },
  { name: "拉萨市 城关区", longitude: "91.14" },
  { name: "香港 中西区", longitude: "114.15" },
  { name: "澳门 花地玛堂区", longitude: "113.55" },
  { name: "台北市 中正区", longitude: "121.52" }
];

function datePart(value: string) {
  return value.split("T")[0] ?? "";
}

function timePart(value: string) {
  return value.split("T")[1]?.slice(0, 5) ?? "";
}

function pad2(value: number | string) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function dateParts(value: string) {
  const [year = "", month = "", day = ""] = datePart(value).split("-");
  return {
    year: Number(year) || new Date().getFullYear(),
    month: Number(month) || 1,
    day: Number(day) || 1
  };
}

interface WheelColumnProps {
  label: string;
  options: number[];
  renderOption?: (value: number) => string;
  value: number;
  onChange: (value: number) => void;
}

function WheelColumn({ label, options, renderOption = String, value, onChange }: WheelColumnProps) {
  const selectedIndex = Math.max(0, options.indexOf(value));
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeRef.current && listRef.current) {
      listRef.current.scrollTop = activeRef.current.offsetTop
        - listRef.current.clientHeight / 2
        + activeRef.current.clientHeight / 2;
    }
  }, [value]);

  return (
    <div className="wheel-column">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label}>
        {options.map((option) => <option value={option} key={option}>{renderOption(option)}</option>)}
      </select>
      <div className="wheel-list" role="listbox" aria-label={label} ref={listRef}>
        {options.map((option) => (
          <button
            aria-selected={option === value}
            className={option === value ? "active" : ""}
            key={option}
            onClick={() => onChange(option)}
            ref={option === value ? activeRef : undefined}
            type="button"
          >
            {renderOption(option)}
          </button>
        ))}
      </div>
      <div className="wheel-stepper">
        <button type="button" onClick={() => onChange(options[Math.max(0, selectedIndex - 1)])}>−</button>
        <button type="button" onClick={() => onChange(options[Math.min(options.length - 1, selectedIndex + 1)])}>＋</button>
      </div>
    </div>
  );
}

export function InputPanel({ error, form, onChange, onSubmit }: InputPanelProps) {
  const { t, isEnglish } = useI18n();
  const initializedTimeZone = useRef(false);
  const selectedDate = dateParts(form.birthDateTime);
  const selectedTime = timePart(form.birthDateTime);
  const selectedHour = Number(selectedTime.slice(0, 2)) || 0;
  const selectedMinute = Number(selectedTime.slice(3, 5)) || 0;
  const dayOptions = Array.from({ length: daysInMonth(selectedDate.year, selectedDate.month) }, (_, index) => index + 1);

  useEffect(() => {
    if (initializedTimeZone.current) return;
    initializedTimeZone.current = true;
    const detectedTimeZone = getBrowserTimeZone();
    if (!form.birthDateTime && form.timezone === "Asia/Shanghai" && detectedTimeZone !== form.timezone) {
      onChange({ ...form, timezone: detectedTimeZone });
    }
  }, [form, onChange]);

  function patch<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    onChange({ ...form, [key]: value });
  }

  function patchDateTime(date: string, time: string) {
    patch("birthDateTime", date ? `${date}T${time || "00:00"}` : "");
  }

  function patchDatePart(part: "year" | "month" | "day", value: number) {
    const next = { ...selectedDate, [part]: value };
    patchDateTime(
      `${next.year}-${pad2(next.month)}-${pad2(Math.min(next.day, daysInMonth(next.year, next.month)))}`,
      selectedTime || "00:00"
    );
  }

  function patchTimePart(part: "hour" | "minute", value: number) {
    patchDateTime(
      datePart(form.birthDateTime) || `${selectedDate.year}-${pad2(selectedDate.month)}-${pad2(selectedDate.day)}`,
      `${pad2(part === "hour" ? value : selectedHour)}:${pad2(part === "minute" ? value : selectedMinute)}`
    );
  }

  function selectLocation(name: string) {
    const location = locations.find((item) => item.name === name);
    onChange({ ...form, locationName: name, longitude: location?.longitude ?? form.longitude });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  const currentTimeMode = form.trueSolarTime === "none"
    ? t("form.time.current.standard")
    : form.trueSolarTime === "longitude"
      ? t("form.time.current.mean")
      : t("form.time.current.apparent");

  return (
    <form className="panel input-panel input-panel-v2" noValidate onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <p className="eyeline">{t("form.kicker")}</p>
          <h2>{t("form.title")}</h2>
          <span className="panel-subtitle">{t("form.subtitle")}</span>
        </div>
        <Compass className="input-heading-icon" size={22} />
      </div>

      <label className="field">
        <span>{t("form.name.label")} <small className="field-optional">{t("form.optional")}</small></span>
        <input placeholder={t("form.name.placeholder")} value={form.name} onChange={(event) => patch("name", event.target.value)} />
      </label>

      <div className="compact-field-grid">
        <div>
          <div className="field-label-row"><span>{t("form.gender")}</span><small>{t("form.gender.help")}</small></div>
          <div className="segmented two-up" aria-label={t("form.gender")}>
            <button type="button" className={form.gender === "male" ? "active" : ""} onClick={() => patch("gender", "male")}><strong>{t("form.gender.male")}</strong><small>{t("form.gender.qian")}</small></button>
            <button type="button" className={form.gender === "female" ? "active" : ""} onClick={() => patch("gender", "female")}><strong>{t("form.gender.female")}</strong><small>{t("form.gender.kun")}</small></button>
          </div>
        </div>
        <label className="field">
          <span>{t("form.calendar")}</span>
          <select value={form.calendar} onChange={(event) => patch("calendar", event.target.value as FormState["calendar"])}>
            <option value="solar">{t("form.calendar.solar")}</option>
            <option value="lunar">{t("form.calendar.lunar")}</option>
          </select>
        </label>
      </div>

      <div className="date-time-grid">
        <label className="field">
          <span><CalendarDays size={14} /> {t("form.date")}</span>
          <input required type="date" value={datePart(form.birthDateTime)} onChange={(event) => patchDateTime(event.target.value, selectedTime || "00:00")} />
        </label>
        <label className="field">
          <span><Clock3 size={14} /> {t("form.time")}</span>
          <input required type="time" step="60" value={selectedTime} onChange={(event) => patchDateTime(datePart(form.birthDateTime), event.target.value)} />
          <small className="field-helper">{t("form.time.help")}</small>
        </label>
      </div>

      <TimeZoneField value={form.timezone} onChange={(timezone) => patch("timezone", timezone)} />

      <details className="precision-picker">
        <summary><span><Settings2 size={15} /> {t("form.precision")}</span><small>{t("form.optional")}</small></summary>
        <div className="precision-content">
          <div className="wheel-picker date-wheel">
            <WheelColumn label={t("form.year")} options={years} value={selectedDate.year} onChange={(value) => patchDatePart("year", value)} renderOption={(value) => isEnglish ? String(value) : `${value}年`} />
            <WheelColumn label={t("form.month")} options={months} value={selectedDate.month} onChange={(value) => patchDatePart("month", value)} renderOption={(value) => isEnglish ? String(value) : `${value}月`} />
            <WheelColumn label={t("form.day")} options={dayOptions} value={selectedDate.day} onChange={(value) => patchDatePart("day", value)} renderOption={(value) => isEnglish ? String(value) : `${value}日`} />
          </div>
          <div className="wheel-picker time-wheel">
            <WheelColumn label={t("form.hour")} options={hours} value={selectedHour} onChange={(value) => patchTimePart("hour", value)} renderOption={(value) => isEnglish ? pad2(value) : `${pad2(value)}点`} />
            <WheelColumn label={t("form.minute")} options={minutes} value={selectedMinute} onChange={(value) => patchTimePart("minute", value)} renderOption={(value) => isEnglish ? pad2(value) : `${pad2(value)}分`} />
          </div>
          <div className="time-period-grid">
            {timePeriods.map((period) => (
              <button
                className={selectedTime === period.value ? "active" : ""}
                key={period.label}
                onClick={() => patchDateTime(
                  datePart(form.birthDateTime) || `${selectedDate.year}-${pad2(selectedDate.month)}-${pad2(selectedDate.day)}`,
                  period.value
                )}
                type="button"
              >
                <strong>{period.label}</strong><span>{period.range}</span>
              </button>
            ))}
          </div>
        </div>
      </details>

      <details className="advanced-options time-settings-v3" open={form.trueSolarTime !== "none"}>
        <summary><span>{t("form.advancedTime")}</span><small>{currentTimeMode}</small></summary>
        <div className="advanced-inner">
          <p className="advanced-explainer">{t("form.time.explainer")}</p>
          <div className="time-method-grid" aria-label={t("form.advancedTime")}>
            <button type="button" className={form.trueSolarTime === "none" ? "active" : ""} onClick={() => patch("trueSolarTime", "none")}><strong>{t("form.time.standard")}</strong><small>{t("form.time.standard.help")}</small></button>
            <button type="button" className={form.trueSolarTime === "longitude" ? "active" : ""} onClick={() => patch("trueSolarTime", "longitude")}><strong>{t("form.time.mean")}</strong><small>{t("form.time.mean.help")}</small></button>
            <button type="button" className={form.trueSolarTime === "apparent" ? "active" : ""} onClick={() => patch("trueSolarTime", "apparent")}><strong>{t("form.time.apparent")}</strong><small>{t("form.time.apparent.help")}</small></button>
          </div>
          {form.trueSolarTime !== "none" ? (
            <div className="solar-location">
              <label className="field">
                <span>{t("form.location")}</span>
                <input list="birthplace-options" placeholder={t("form.location.placeholder")} value={form.locationName} onChange={(event) => selectLocation(event.target.value)} />
                <datalist id="birthplace-options">{locations.map((location) => <option value={location.name} key={location.name} />)}</datalist>
              </label>
              <label className="field">
                <span>{t("form.longitude")}</span>
                <input inputMode="decimal" placeholder={t("form.longitude.placeholder")} value={form.longitude} onChange={(event) => patch("longitude", event.target.value)} />
              </label>
              <div className="input-note compact"><MapPin size={15} />{t("form.longitude.note")}</div>
            </div>
          ) : null}
        </div>
      </details>

      <details className="advanced-options">
        <summary><span>{t("form.professional")}</span><small>{t("form.professional.help")}</small></summary>
        <div className="advanced-inner">
          <label className="field">
            <span>{t("form.sect")}</span>
            <select value={form.sect} onChange={(event) => patch("sect", Number(event.target.value) as 1 | 2)}>
              <option value={1}>Sect 1 · 子初 / 23:00 boundary</option>
              <option value={2}>Sect 2 · 子正 / 00:00 boundary</option>
            </select>
          </label>
          <p>{t("form.sect.help")}</p>
        </div>
      </details>

      <Button type="submit" variant="primary" className="generate-chart-button"><Sparkles size={17} />{t("form.submit")}</Button>
      {error ? <p aria-live="polite" className="form-error" role="alert">{error}</p> : null}
      <div className="input-note"><CalendarDays size={16} />{t("form.localNote")}</div>
    </form>
  );
}
