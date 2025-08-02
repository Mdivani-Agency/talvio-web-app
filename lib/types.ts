import { z } from "zod";
import { accountSchema, profileSchema } from "./schema/account.schema";

export type Profile = z.infer<typeof profileSchema>;
export type Account = z.infer<typeof accountSchema>;
