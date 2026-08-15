#!/usr/bin/env python3
import argparse
import json
from kinliuren import kinliuren


def build_result(solar_term: str, lunar_month: str, day_ganzhi: str, hour_ganzhi: str):
    return kinliuren.Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)


def validate_readme_fixture(result: dict) -> None:
    assert result.get("節氣") == "驚蟄", result
    assert result.get("日期") == "己未日甲午時", result
    assert "三傳" in result and "四課" in result and "天地盤" in result and "神煞" in result, result
    assert result["三傳"]["初傳"][0] == "巳", result["三傳"]
    assert result["三傳"]["中傳"][0] == "戌", result["三傳"]
    assert result["三傳"]["末傳"][0] == "卯", result["三傳"]
    assert result["四課"]["一課"][0] == "子己", result["四課"]
    assert len(result["天地盤"]["天盤"]) == 12, result["天地盤"]
    assert len(result["天地盤"]["地盤"]) == 12, result["天地盤"]
    assert len(result["天地盤"]["天將"]) == 12, result["天地盤"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Pinned kinliuren reference oracle")
    parser.add_argument("--solar-term", default="驚蟄")
    parser.add_argument("--lunar-month", default="二")
    parser.add_argument("--day-ganzhi", default="己未")
    parser.add_argument("--hour-ganzhi", default="甲午")
    parser.add_argument("--validate-readme-fixture", action="store_true")
    args = parser.parse_args()

    result = build_result(args.solar_term, args.lunar_month, args.day_ganzhi, args.hour_ganzhi)
    if args.validate_readme_fixture:
        validate_readme_fixture(result)

    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
