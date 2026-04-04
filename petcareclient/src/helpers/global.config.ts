import { z } from "zod";

const globalConfigSchema = z.object({
  apiUrl: z.string("API_URL is missing"),
});

type GlobalConfig = z.infer<typeof globalConfigSchema>;

export const globalConfig: GlobalConfig = globalConfigSchema.parse({
  apiUrl: import.meta.env.API_URL,
});
