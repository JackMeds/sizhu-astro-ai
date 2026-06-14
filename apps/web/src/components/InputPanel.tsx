import { useEffect, useRef, type FormEvent } from "react";
import { CalendarDays, Compass, MapPin, Sparkles } from "lucide-react";
import { Button } from "./Button";

export interface FormState {
  name: string;
  gender: "male" | "female";
  birthDateTime: string;
  calendar: "solar" | "lunar";
  timezone: string;
  locationName: string;
  longitude: string;
  trueSolarTime: "none" | "longitude";
  sect: 1 | 2;
}

interface InputPanelProps {
  form: FormState;
  error?: string;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
}

const timePeriods = [
  { label: "子", range: "23:00-00:59", value: "23:00" },
  { label: "丑", range: "01:00-02:59", value: "01:00" },
  { label: "寅", range: "03:00-04:59", value: "03:00" },
  { label: "卯", range: "05:00-06:59", value: "05:00" },
  { label: "辰", range: "07:00-08:59", value: "07:00" },
  { label: "巳", range: "09:00-10:59", value: "09:00" },
  { label: "午", range: "11:00-12:59", value: "11:00" },
  { label: "未", range: "13:00-14:59", value: "13:00" },
  { label: "申", range: "15:00-16:59", value: "15:00" },
  { label: "酉", range: "17:00-18:59", value: "17:00" },
  { label: "戌", range: "19:00-20:59", value: "19:00" },
  { label: "亥", range: "21:00-22:59", value: "21:00" }
];

const years = Array.from({ length: 141 }, (_, index) => 1900 + index);
const months = Array.from({ length: 12 }, (_, index) => index + 1);
const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);

const locations = [
  { name: "北京市 东城区", longitude: "116.42" },
  { name: "北京市 海淀区", longitude: "116.30" },
  { name: "北京市 朝阳区", longitude: "116.49" },
  { name: "上海市 黄浦区", longitude: "121.49" },
  { name: "上海市 浦东新区", longitude: "121.54" },
  { name: "天津市 和平区", longitude: "117.20" },
  { name: "重庆市 渝中区", longitude: "106.57" },
  { name: "广州市 越秀区", longitude: "113.27" },
  { name: "广州市 天河区", longitude: "113.36" },
  { name: "深圳市 福田区", longitude: "114.05" },
  { name: "深圳市 南山区", longitude: "113.93" },
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

function WheelColumn({
  label,
  options,
  renderOption = String,
  value,
  onChange
}: {
  label: string;
  options: number[];
  renderOption?: (value: number) => string;
  value: number;
  onChange: (value: number) => void;
}) {
  const selectedIndex = Math.max(0, options.indexOf(value));
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const active = activeRef.current;
    const list = listRef.current;
    if (!active || !list) return;
    list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
  }, [value]);

  function step(delta: number) {
    const nextIndex = Math.min(options.length - 1, Math.max(0, selectedIndex + delta));
    onChange(options[nextIndex]);
  }

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      step(event.deltaY > 0 ? 1 : -1);
    };

    column.addEventListener("wheel", handleWheel, { passive: false });
    return () => column.removeEventListener("wheel", handleWheel);
  }, [options, selectedIndex]);

  return (
    <div className="wheel-column" ref={columnRef}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} aria-label={label}>
        {options.map((option) => (
          <option value={option} key={option}>{renderOption(option)}</option>
        ))}
      </select>
      <div className="wheel-list" role="listbox" aria-label={`${label}滚轮`} ref={listRef}>
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
    </div>
  );
}

export function InputPanel({ error, form, onChange, onSubmit }: InputPanelProps) {
  const selectedDate = dateParts(form.birthDateTime);
  const selectedTime = timePart(form.birthDateTime);
  const selectedHour = Number(selectedTime.slice(0, 2)) || 0;
  const selectedMinute = Number(selectedTime.slice(3, 5)) || 0;
  const dayOptions = Array.from({ length: daysInMonth(selectedDate.year, selectedDate.month) }, (_, index) => index + 1);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    onChange({ ...form, [key]: value });
  }

  function patchDateTime(nextDate: string, nextTime: string) {
    patch("birthDateTime", nextDate ? `${nextDate}T${nextTime}` : "");
  }

  function patchDatePart(part: "year" | "month" | "day", nextValue: number) {
    const next = { ...selectedDate, [part]: nextValue };
    const safeDay = Math.min(next.day, daysInMonth(next.year, next.month));
    patchDateTime(`${next.year}-${pad2(next.month)}-${pad2(safeDay)}`, selectedTime || "00:00");
  }

  function patchTimePart(part: "hour" | "minute", nextValue: number) {
    const nextHour = part === "hour" ? nextValue : selectedHour;
    const nextMinute = part === "minute" ? nextValue : selectedMinute;
    patchDateTime(datePart(form.birthDateTime) || `${selectedDate.year}-${pad2(selectedDate.month)}-${pad2(selectedDate.day)}`, `${pad2(nextHour)}:${pad2(nextMinute)}`);
  }

  function selectLocation(name: string) {
    const location = locations.find((item) => item.name === name);
    onChange({
      ...form,
      locationName: name,
      longitude: location?.longitude ?? form.longitude
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="panel input-panel" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <p className="eyeline">Birth Data</p>
          <h2>排盘输入</h2>
        </div>
        <Compass className="text-[#d8a94e]" size={22} />
      </div>

      <label className="field">
        <span>姓名 / 标签</span>
        <input placeholder="例如：自己、家人、客户 A" value={form.name} onChange={(event) => patch("name", event.target.value)} />
      </label>

      <div className="field-label-row">
        <span>性别</span>
        <small>乾造=男命，坤造=女命</small>
      </div>
      <div className="segmented" aria-label="性别">
        <button type="button" className={form.gender === "male" ? "active" : ""} onClick={() => patch("gender", "male")}>
          男
          <small>乾造</small>
        </button>
        <button type="button" className={form.gender === "female" ? "active" : ""} onClick={() => patch("gender", "female")}>
          女
          <small>坤造</small>
        </button>
      </div>

      <label className="field">
        <span>出生日期</span>
        <input required type="date" value={datePart(form.birthDateTime)} onChange={(event) => patchDateTime(event.target.value, timePart(form.birthDateTime))} />
      </label>

      <div className="wheel-picker date-wheel" aria-label="出生年月日滚轮">
        <WheelColumn label="年" options={years} value={selectedDate.year} onChange={(value) => patchDatePart("year", value)} renderOption={(value) => `${value}年`} />
        <WheelColumn label="月" options={months} value={selectedDate.month} onChange={(value) => patchDatePart("month", value)} renderOption={(value) => `${value}月`} />
        <WheelColumn label="日" options={dayOptions} value={selectedDate.day} onChange={(value) => patchDatePart("day", value)} renderOption={(value) => `${value}日`} />
      </div>

      <div className="field-label-row">
        <span>出生时间</span>
        <small>滚轮、下拉和手动日期可同时使用</small>
      </div>
      <div className="wheel-picker time-wheel" aria-label="出生时间滚轮">
        <WheelColumn label="时" options={hours} value={selectedHour} onChange={(value) => patchTimePart("hour", value)} renderOption={(value) => `${pad2(value)}点`} />
        <WheelColumn label="分" options={minutes} value={selectedMinute} onChange={(value) => patchTimePart("minute", value)} renderOption={(value) => `${pad2(value)}分`} />
      </div>

      <details className="time-period-details">
        <summary>按十二时辰快速选择</summary>
        <div className="time-period-grid" aria-label="按时辰快速选择">
          {timePeriods.map((period) => (
            <button
              className={timePart(form.birthDateTime) === period.value ? "active" : ""}
              key={period.label}
              onClick={() => patchDateTime(datePart(form.birthDateTime) || `${selectedDate.year}-${pad2(selectedDate.month)}-${pad2(selectedDate.day)}`, period.value)}
              type="button"
            >
              <strong>{period.label}</strong>
              <span>{period.range}</span>
            </button>
          ))}
        </div>
      </details>

      <label className="field">
        <span>出生日期类型</span>
        <select value={form.calendar} onChange={(event) => patch("calendar", event.target.value as FormState["calendar"])}>
          <option value="solar">阳历 / 公历</option>
          <option value="lunar">农历 / 阴历</option>
        </select>
      </label>

      <details className="advanced-options">
        <summary>高级设置</summary>
        <label className="field">
          <span>起运算法</span>
          <select value={form.sect} onChange={(event) => patch("sect", Number(event.target.value) as 1 | 2)}>
            <option value={1}>标准算法</option>
            <option value={2}>精确分钟折算</option>
          </select>
        </label>
        <p>不同算法会影响起运岁数和交运日期；不确定时保持标准算法。</p>
      </details>

      <div className="field-label-row">
        <span>时间口径</span>
        <small>标准时默认使用北京时间 UTC+8</small>
      </div>
      <div className="segmented" aria-label="时间口径">
        <button type="button" className={form.trueSolarTime === "none" ? "active" : ""} onClick={() => patch("trueSolarTime", "none")}>
          标准时
          <small>北京时间</small>
        </button>
        <button
          type="button"
          className={form.trueSolarTime === "longitude" ? "active" : ""}
          onClick={() => patch("trueSolarTime", "longitude")}
        >
          真太阳时
          <small>按出生地经度</small>
        </button>
      </div>

      {form.trueSolarTime === "longitude" ? (
        <div className="solar-location">
          <label className="field">
            <span>出生地</span>
            <input list="birthplace-options" placeholder="搜索省市区县，如：成都市 锦江区" value={form.locationName} onChange={(event) => selectLocation(event.target.value)} />
            <datalist id="birthplace-options">
              {locations.map((location) => (
                <option value={location.name} key={location.name} />
              ))}
            </datalist>
          </label>
          <label className="field">
            <span>经度</span>
            <input inputMode="decimal" placeholder="例如 104.08" value={form.longitude} onChange={(event) => patch("longitude", event.target.value)} />
          </label>
          <div className="input-note compact">
            <MapPin size={15} />
            当前先按经度记录真太阳时参数；找不到区县时可手动填经度。
          </div>
        </div>
      ) : null}

      <Button type="submit" variant="primary" className="mt-1 w-full">
        <Sparkles size={17} />
        生成命盘
      </Button>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="input-note">
        <CalendarDays size={16} />
        信息只保存在本机浏览器，可从历史记录恢复。
      </div>
    </form>
  );
}
