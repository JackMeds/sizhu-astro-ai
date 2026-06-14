import { Iztrolabe } from "react-iztro";
import type { AstroProfile } from "@sizhu/core";
import "react-iztro/lib/Iztrolabe/Iztrolabe.css";
import "react-iztro/lib/Izpalace/Izpalace.css";
import "react-iztro/lib/IzpalaceCenter/IzpalaceCenter.css";
import "react-iztro/lib/theme/default.css";

interface ZiweiPlateProps {
  profile: AstroProfile;
}

function getBirthday(profile: AstroProfile) {
  return new Date(profile.input.birthDateTime).toISOString().slice(0, 10);
}

function getBirthTimeIndex(profile: AstroProfile) {
  const hour = new Date(profile.input.birthDateTime).getHours();
  return Math.floor((hour + 1) / 2) % 12;
}

export function ZiweiPlate({ profile }: ZiweiPlateProps) {
  return (
    <section className="panel ziwei-plate" aria-label="紫微斗数命盘">
      <div className="plate-title">
        <div>
          <p className="eyeline">Zi Wei Dou Shu</p>
          <h2>紫微斗数十二宫</h2>
        </div>
        <div className="plate-meta">
          <span>react-iztro · iztro</span>
          <strong>标准宫位盘</strong>
        </div>
      </div>

      <div className="ziwei-frame">
        <Iztrolabe
          birthday={getBirthday(profile)}
          birthTime={getBirthTimeIndex(profile)}
          birthdayType={profile.input.calendar}
          gender={profile.input.gender}
          horoscopeDate={new Date()}
          centerPalaceAlign
        />
      </div>
    </section>
  );
}
