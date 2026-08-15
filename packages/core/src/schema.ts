import { z } from "zod";

export const astroInputSchema = z.object({
  name: z.string().min(1).default("未命名"),
  gender: z.enum(["male", "female"]).default("male"),
  birthDateTime: z.string().min(1),
  calendar: z.enum(["solar", "lunar"]).default("solar"),
  timezone: z.string().min(1).default("Asia/Shanghai"),
  location: z
    .object({
      name: z.string().optional(),
      longitude: z.number().optional(),
      latitude: z.number().optional()
    })
    .optional(),
  trueSolarTime: z.enum(["none", "longitude", "apparent"]).default("none"),
  sect: z.union([z.literal(1), z.literal(2)]).default(1)
});

export type AstroInputSchema = z.infer<typeof astroInputSchema>;
