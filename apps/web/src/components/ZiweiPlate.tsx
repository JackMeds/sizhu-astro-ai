import { Iztrolabe } from "react-iztro";
import type { AstroProfile } from "@sizhu/core";
import "react-iztro/lib/Iztrolabe/Iztrolabe.css";
import "react-iztro/lib/Izpalace/Izpalace.css";
import "react-iztro/lib/IzpalaceCenter/IzpalaceCenter.css";
import "react-iztro/lib/theme/default.css";

interface ZiweiPlateProps { profile: AstroProfile; }

export function ZiweiPlate({ profile }: ZiweiPlateProps) {
  const calculation = profile.ziwei.calculation;
  if (!calculation) {
    return <section className="panel ziwei-plate"><div className="plate-title"><div><p className="eyeline">Zi Wei Dou Shu</p><h2>紫微斗数十二宫</h2></div></div><p>紫微排盘暂不可用，请查看计算警告。</p></section>;
  }
  return (
    <section className="panel ziwei-plate" aria-label="紫微斗数命盘">
      <div className="plate-title">
        <div><p className="eyeline">Zi Wei Dou Shu</p><h2>紫微斗数十二宫</h2></div>
        <div className="plate-meta"><span>iztro · 与八字共用时间口径</span><strong>{calculation.solarDate} · {calculation.shichen}时</strong></div>
      </div>
      <div className="ziwei-frame">
        <Iztrolabe birthday={calculation.solarDate} birthTime={calculation.timeIndex} birthdayType="solar" gender={profile.input.gender} horoscopeDate={new Date()} centerPalaceAlign />
      </div>
    </section>
  );
}
