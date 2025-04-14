import { z } from "zod";

export const SearchQuerySchema = z.object({
  q: z.string().min(1).transform(val => 
    // Remove any dangerous characters but keep dots and numbers
    val.replace(/[^\w\s.-]/g, '')
  ),
  types: z.array(z.enum(["projects", "files", "comments"]))
    .default(["projects", "files", "comments"])
});