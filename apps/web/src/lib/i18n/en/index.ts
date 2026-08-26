import { shell } from "./shell";
import { form } from "./form";
import { result } from "./result";
import { bazi } from "./bazi";
import { ziwei } from "./ziwei";
import { transit } from "./transit";
import { exportText } from "./exports";
import { liuren } from "./liuren";
import { agent } from "./agent";

export const dictionary = {
  ...shell,
  ...form,
  ...result,
  ...bazi,
  ...ziwei,
  ...transit,
  ...exportText,
  ...liuren,
  ...agent,
} as const;
